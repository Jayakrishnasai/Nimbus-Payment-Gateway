'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query, getClient } = require('../config/database');
const { emitPaymentUpdate } = require('../websocket/socket');
const logger = require('../utils/logger');

class PaymentService {
    /**
     * Create Stripe Checkout Session.
     */
    static async createPayment(orderId, userId) {
        const orderResult = await query(
            `SELECT id, order_number, total, status
             FROM orders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            throw Object.assign(new Error('Order not found'), { statusCode: 404 });
        }

        const order = orderResult.rows[0];

        if (order.status !== 'pending') {
            throw Object.assign(new Error('Order is not in pending state'), { statusCode: 400 });
        }

        // Return existing session if valid
        const existingPayment = await query(
            `SELECT * FROM payments WHERE order_id = $1 AND status = 'pending' AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [orderId]
        );
        
        let sessionId;
        if (existingPayment.rows.length > 0 && existingPayment.rows[0].stripe_session_id) {
            sessionId = existingPayment.rows[0].stripe_session_id;
            try {
                const session = await stripe.checkout.sessions.retrieve(sessionId);
                if (session.status === 'open') {
                    return { url: session.url };
                }
            } catch (err) {
                logger.warn('Failed to retrieve existing Stripe session', { sessionId });
            }
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Generate Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            client_reference_id: orderId,
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `Order ${order.order_number}`,
                        },
                        unit_amount: Math.round(order.total * 100), // convert to paise
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/payment/${order.id}?status=success`,
            cancel_url: `${process.env.FRONTEND_URL}/payment/${order.id}?status=cancel`,
            metadata: {
                orderId: order.id,
                userId: userId
            }
        });

        const timeoutSeconds = Number.parseInt(process.env.PAYMENT_TIMEOUT_SECONDS, 10) || 1800; // 30m
        const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

        // Store payment record
        const paymentResult = await query(
            `INSERT INTO payments (order_id, user_id, amount, currency, status,
                             stripe_session_id, method, expires_at)
             VALUES ($1, $2, $3, 'INR', 'pending', $4, 'stripe', $5)
             RETURNING id`,
            [orderId, userId, order.total, session.id, expiresAt]
        );

        // Log payment creation
        await query(
            `INSERT INTO payment_logs (payment_id, order_id, event_type, payload, source)
             VALUES ($1, $2, 'payment.created', $3, 'system')`,
            [paymentResult.rows[0].id, orderId, JSON.stringify({ sessionId: session.id, amount: order.total })]
        );

        logger.info('Stripe payment created', {
            paymentId: paymentResult.rows[0].id,
            orderId,
            sessionId: session.id,
        });

        return { url: session.url };
    }

    /**
     * Retry payment for a failed/expired order.
     */
    static async retryPayment(orderId, userId) {
        const orderResult = await query(
            `SELECT id, order_number, total, status
             FROM orders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            throw Object.assign(new Error('Order not found'), { statusCode: 404 });
        }

        const order = orderResult.rows[0];

        // Allow retry only for pending or cancelled (payment-failed) orders
        if (!['pending', 'cancelled'].includes(order.status)) {
            throw Object.assign(
                new Error('Order cannot be retried in its current state'),
                { statusCode: 400 }
            );
        }

        // Reset order to pending if cancelled
        if (order.status === 'cancelled') {
            await query(`UPDATE orders SET status = 'pending' WHERE id = $1`, [orderId]);
        }

        // Mark old payments as expired
        await query(
            `UPDATE payments SET status = 'expired' WHERE order_id = $1 AND status = 'pending'`,
            [orderId]
        );

        // Create a new payment session
        return PaymentService.createPayment(orderId, userId);
    }

    /**
     * Handle Stripe Webhooks
     */
    static async handleStripeWebhook(rawBody, signature) {
        let event;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } catch (err) {
            logger.warn('Invalid Stripe webhook signature', { error: err.message });
            throw Object.assign(new Error(`Webhook Error: ${err.message}`), { statusCode: 400 });
        }

        logger.info('Stripe webhook received', { type: event.type, id: event.id });

        // Duplicate Event Protection
        const existingTxn = await query(
            'SELECT id FROM stripe_webhook_logs WHERE stripe_event_id = $1', [event.id]
        );
        if (existingTxn.rows.length > 0) {
            logger.info('Duplicate Stripe event ignored', { eventId: event.id });
            return { status: 'duplicate' };
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderId = session.client_reference_id;
            const paymentIntentId = session.payment_intent;

            if (!orderId) {
                // Log unmatched
                await query(
                    `INSERT INTO stripe_webhook_logs (stripe_event_id, event_type, status, raw_payload)
                     VALUES ($1, $2, 'unmatched', $3)`,
                    [event.id, event.type, JSON.stringify(session)]
                );
                return { status: 'unmatched' };
            }

            return await PaymentService.confirmPayment(
                orderId, session.id, paymentIntentId, 'stripe_webhook', event.id, session
            );
        } else {
            // Log unhandled events
            await query(
                `INSERT INTO stripe_webhook_logs (stripe_event_id, event_type, status, raw_payload)
                 VALUES ($1, $2, 'ignored', $3)`,
                [event.id, event.type, JSON.stringify(event.data.object)]
            );
            return { status: 'ignored' };
        }
    }

    /**
     * Internal helper to confirm a payment and update system state.
     * Can be called by webhook or manual fallback.
     */
    static async confirmPayment(orderId, sessionId, paymentIntentId, source, eventId = null, rawPayload = {}) {
        const client = await getClient();
        try {
            await client.query('BEGIN');
            await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

            // Select payment for update to prevent race conditions
            const paymentResult = await client.query(
                `SELECT id, order_id FROM payments WHERE stripe_session_id = $1 AND status = 'pending' FOR UPDATE`,
                [sessionId]
            );

            if (paymentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return { status: 'already_processed' };
            }

            const payment = paymentResult.rows[0];

            // 1. Update payment record
            await client.query(
                `UPDATE payments SET
                   status = 'captured',
                   stripe_payment_intent_id = $2,
                   paid_at = NOW()
                 WHERE id = $1`,
                [payment.id, paymentIntentId]
            );

            // 2. Update order status
            await client.query(
                `UPDATE orders SET status = 'confirmed' WHERE id = $1`,
                [orderId]
            );

            // 3. Release reserved inventory (convert reserved to sold is handled by reducing reserved, 
            // since stock was already reduced during order creation in this specific architecture)
            await client.query(
                `UPDATE inventory SET reserved = GREATEST(0, reserved - oi.quantity)
                 FROM order_items oi
                 WHERE inventory.product_id = oi.product_id AND oi.order_id = $1`,
                [orderId]
            );

            // 4. Log the event if we have an ID (webhook case)
            if (eventId) {
                await client.query(
                    `INSERT INTO stripe_webhook_logs (stripe_event_id, event_type, matched_order_id, status, raw_payload)
                     VALUES ($1, $2, $3, 'matched', $4)`,
                     [eventId, 'checkout.session.completed', orderId, JSON.stringify(rawPayload)]
                );
            }

            // 5. Audit log
            await client.query(
                `INSERT INTO payment_logs (payment_id, order_id, event_type, payload, source)
                 VALUES ($1, $2, 'payment.captured', $3, $4)`,
                [payment.id, orderId, JSON.stringify({ paymentIntentId, sessionId }), source]
            );

            await client.query('COMMIT');

            // 6. Notify client via WebSocket
            emitPaymentUpdate(orderId, {
                status: 'success',
                orderId,
                paymentIntentId
            });

            logger.info('Payment confirmed', { paymentId: payment.id, orderId, source });
            return { status: 'success' };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Failed to confirm payment', { orderId, sessionId, error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Expire unpaid payments (called by cron).
     */
    static async expirePayments() {
        const client = await getClient();
        try {
            await client.query('BEGIN');

            const expired = await client.query(
                `UPDATE payments SET status = 'expired'
                 WHERE status = 'pending' AND expires_at < NOW()
                 RETURNING id, order_id`
            );

            for (const row of expired.rows) {
                await client.query(
                    `UPDATE orders SET status = 'cancelled' WHERE id = $1 AND status = 'pending'`,
                    [row.order_id]
                );

                await client.query(
                    `UPDATE inventory SET reserved = GREATEST(0, reserved - oi.quantity)
                     FROM order_items oi
                     WHERE inventory.product_id = oi.product_id AND oi.order_id = $1`,
                    [row.order_id]
                );

                await client.query(
                    `INSERT INTO payment_logs (payment_id, order_id, event_type, payload, source)
                     VALUES ($1, $2, 'payment.expired', '{}', 'cron')`,
                    [row.id, row.order_id]
                );

                emitPaymentUpdate(row.order_id, {
                    status: 'expired',
                    orderId: row.order_id,
                });
            }

            await client.query('COMMIT');

            if (expired.rows.length > 0) {
                logger.info(`Expired ${expired.rows.length} payments`);
            }

            return { expired: expired.rows.length };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get payment status by order ID.
     */
    static async getPaymentStatus(orderId, userId) {
        const result = await query(
            `SELECT p.*, o.order_number, o.status AS order_status
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE p.order_id = $1 AND p.user_id = $2
             ORDER BY p.created_at DESC LIMIT 1`,
            [orderId, userId]
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
        }

        const payment = result.rows[0];

        // Manual Sync Fallback: If DB says pending but we have a Stripe session, poll Stripe
        if (payment.status === 'pending' && payment.stripe_session_id) {
            try {
                logger.debug('Polling Stripe for payment status sync', { orderId, sessionId: payment.stripe_session_id });
                const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);

                if (session.payment_status === 'paid' && session.status === 'complete') {
                    logger.info('Payment confirmed via manual sync fallback', { orderId, sessionId: session.id });
                    await PaymentService.confirmPayment(
                        orderId, session.id, session.payment_intent, 'manual_sync', null, session
                    );
                    
                    // Re-fetch the updated status
                    const updatedResult = await query(
                        `SELECT p.*, o.order_number, o.status AS order_status
                         FROM payments p
                         JOIN orders o ON o.id = p.order_id
                         WHERE p.id = $1`,
                        [payment.id]
                    );
                    return updatedResult.rows[0];
                }
            } catch (error) {
                logger.warn('Failed to poll Stripe for manual sync', { orderId, error: error.message });
            }
        }

        return payment;
    }
}

module.exports = PaymentService;
