'use strict';

const crypto = require('crypto');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../config/database');
const { emitPaymentUpdate } = require('../websocket/socket');
const logger = require('../utils/logger');

// ── UPI Configuration ──
const UPI_VPA = process.env.UPI_MERCHANT_VPA || 'merchant@upi';
const UPI_MERCHANT_NAME = process.env.UPI_MERCHANT_NAME || 'NimbusCart';

class PaymentService {
    /**
     * Generate NPCI-compliant UPI deep link.
     */
    static generateUpiLink({ vpa, name, amount, txnRef, orderId }) {
        const params = new URLSearchParams({
            pa: vpa,
            pn: name,
            am: parseFloat(amount).toFixed(2),
            cu: 'INR',
            tr: txnRef,
            tn: `Order-${orderId}`,
            mc: '5411', // MCC for grocery/general merchandise
        });
        return `upi://pay?${params.toString()}`;
    }

    /**
     * Create payment with native UPI QR code (no Razorpay).
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

        // Idempotency — return existing pending payment
        const existingPayment = await query(
            `SELECT * FROM payments WHERE order_id = $1 AND status = 'pending' AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [orderId]
        );
        if (existingPayment.rows.length > 0) {
            return existingPayment.rows[0];
        }

        // Generate unique transaction reference
        const txnRef = `NC${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const idempotencyKey = uuidv4();
        const timeoutSeconds = parseInt(process.env.PAYMENT_TIMEOUT_SECONDS, 10) || 300;
        const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

        // Generate UPI deep link
        const upiLink = PaymentService.generateUpiLink({
            vpa: UPI_VPA,
            name: UPI_MERCHANT_NAME,
            amount: order.total,
            txnRef,
            orderId: order.order_number,
        });

        // Generate QR code as base64 data URL
        const qrCodeDataUrl = await QRCode.toDataURL(upiLink, {
            width: 400,
            margin: 2,
            color: { dark: '#1a1a2e', light: '#ffffff' },
            errorCorrectionLevel: 'H',
        });

        // Store payment record
        const paymentResult = await query(
            `INSERT INTO payments (order_id, user_id, amount, currency, status,
                             upi_transaction_ref, qr_code_url, upi_deep_link,
                             idempotency_key, expires_at)
             VALUES ($1, $2, $3, 'INR', 'pending', $4, $5, $6, $7, $8)
             RETURNING *`,
            [orderId, userId, order.total, txnRef, qrCodeDataUrl, upiLink, idempotencyKey, expiresAt]
        );

        // Log payment creation
        await query(
            `INSERT INTO payment_logs (payment_id, order_id, event_type, payload, source)
             VALUES ($1, $2, 'payment.created', $3, 'system')`,
            [paymentResult.rows[0].id, orderId,
            JSON.stringify({ txnRef, amount: order.total, vpa: UPI_VPA })]
        );

        logger.info('UPI payment created', {
            paymentId: paymentResult.rows[0].id,
            orderId,
            txnRef,
            amount: order.total,
        });

        return {
            ...paymentResult.rows[0],
            merchant_vpa: UPI_VPA,
            merchant_name: UPI_MERCHANT_NAME,
        };
    }

    /**
     * Handle bank webhook (production: bank pushes UTR + amount).
     * Verifies HMAC signature, validates amount, and confirms order.
     */
    static async handleBankWebhook(rawBody, signature, sourceIp) {
        // Verify HMAC SHA256 signature
        const webhookSecret = process.env.BANK_WEBHOOK_SECRET;
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (!crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(signature, 'hex')
        )) {
            logger.warn('Invalid bank webhook signature', { sourceIp });
            throw Object.assign(new Error('Invalid webhook signature'), { statusCode: 400 });
        }

        const payload = JSON.parse(rawBody);
        const { utr, amount, sender_vpa, transaction_ref, timestamp } = payload;

        logger.info('Bank webhook received', { utr, amount, transaction_ref, sourceIp });

        // Duplicate UTR protection
        const existingTxn = await query(
            'SELECT id FROM bank_transactions WHERE utr = $1', [utr]
        );
        if (existingTxn.rows.length > 0) {
            logger.info('Duplicate UTR ignored', { utr });
            return { status: 'duplicate' };
        }

        // Find matching payment by transaction reference
        const paymentResult = await query(
            `SELECT p.*, o.total AS order_total, o.id AS order_id, o.order_number
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             WHERE p.upi_transaction_ref = $1 AND p.status = 'pending'`,
            [transaction_ref]
        );

        if (paymentResult.rows.length === 0) {
            // Store unmatched transaction for reconciliation
            await query(
                `INSERT INTO bank_transactions (utr, amount, sender_vpa, transaction_ref, status, raw_payload)
                 VALUES ($1, $2, $3, $4, 'unmatched', $5)`,
                [utr, amount, sender_vpa, transaction_ref, JSON.stringify(payload)]
            );
            logger.warn('No matching payment for webhook', { utr, transaction_ref });
            return { status: 'unmatched' };
        }

        const payment = paymentResult.rows[0];

        // Amount validation (reject if mismatch > ₹0.01)
        if (Math.abs(parseFloat(amount) - parseFloat(payment.order_total)) > 0.01) {
            logger.error('Payment amount mismatch', {
                expected: payment.order_total,
                received: amount,
                utr,
            });
            // Store as anomaly
            await query(
                `INSERT INTO bank_transactions (utr, amount, sender_vpa, transaction_ref, matched_order_id, status, raw_payload)
                 VALUES ($1, $2, $3, $4, $5, 'amount_mismatch', $6)`,
                [utr, amount, sender_vpa, transaction_ref, payment.order_id, JSON.stringify(payload)]
            );
            return { status: 'amount_mismatch' };
        }

        // Check if payment has expired
        if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
            await query(
                `INSERT INTO bank_transactions (utr, amount, sender_vpa, transaction_ref, matched_order_id, status, raw_payload)
                 VALUES ($1, $2, $3, $4, $5, 'late_payment', $6)`,
                [utr, amount, sender_vpa, transaction_ref, payment.order_id, JSON.stringify(payload)]
            );
            logger.warn('Late payment received', { utr, orderId: payment.order_id });
            return { status: 'late_payment' };
        }

        // ── Confirm payment (SERIALIZABLE transaction) ──
        const client = await getClient();
        try {
            await client.query('BEGIN');
            await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

            // Lock the payment row
            const locked = await client.query(
                'SELECT id FROM payments WHERE id = $1 AND status = $2 FOR UPDATE',
                [payment.id, 'pending']
            );
            if (locked.rows.length === 0) {
                await client.query('ROLLBACK');
                return { status: 'already_processed' };
            }

            // Update payment
            await client.query(
                `UPDATE payments SET
                   status = 'captured',
                   utr_number = $2,
                   method = 'upi',
                   paid_at = NOW()
                 WHERE id = $1`,
                [payment.id, utr]
            );

            // Update order
            await client.query(
                `UPDATE orders SET status = 'confirmed' WHERE id = $1`,
                [payment.order_id]
            );

            // Release reserved inventory
            await client.query(
                `UPDATE inventory SET reserved = reserved - oi.quantity
                 FROM order_items oi
                 WHERE inventory.product_id = oi.product_id AND oi.order_id = $1`,
                [payment.order_id]
            );

            // Store bank transaction
            await client.query(
                `INSERT INTO bank_transactions (utr, amount, sender_vpa, transaction_ref, matched_order_id, status, raw_payload)
                 VALUES ($1, $2, $3, $4, $5, 'matched', $6)`,
                [utr, amount, sender_vpa, transaction_ref, payment.order_id, JSON.stringify(payload)]
            );

            // Log
            await client.query(
                `INSERT INTO payment_logs (payment_id, order_id, event_type, payload, source, ip_address)
                 VALUES ($1, $2, 'payment.captured', $3, 'bank_webhook', $4)`,
                [payment.id, payment.order_id,
                JSON.stringify({ utr, amount, sender_vpa, transaction_ref }),
                    sourceIp]
            );

            await client.query('COMMIT');

            // Emit real-time update
            emitPaymentUpdate(payment.order_id, {
                status: 'success',
                orderId: payment.order_id,
                utr,
                amount: parseFloat(amount),
            });

            logger.info('Payment confirmed via bank webhook', {
                paymentId: payment.id,
                orderId: payment.order_id,
                utr,
                amount,
            });

            return { status: 'success' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Manual payment confirmation — user clicks "I Have Paid".
     * Marks payment as awaiting_reconciliation for backend verification.
     */
    static async confirmManual(orderId, userId, utrNumber) {
        const paymentResult = await query(
            `SELECT p.*, o.total AS order_total
             FROM payments p JOIN orders o ON o.id = p.order_id
             WHERE p.order_id = $1 AND p.user_id = $2 AND p.status = 'pending'
             ORDER BY p.created_at DESC LIMIT 1`,
            [orderId, userId]
        );

        if (paymentResult.rows.length === 0) {
            throw Object.assign(new Error('No pending payment found'), { statusCode: 404 });
        }

        // Duplicate UTR check
        if (utrNumber) {
            const dupCheck = await query(
                'SELECT id FROM bank_transactions WHERE utr = $1', [utrNumber]
            );
            if (dupCheck.rows.length > 0) {
                throw Object.assign(new Error('This UTR has already been used'), { statusCode: 409 });
            }
        }

        await query(
            `UPDATE payments SET
               reconciliation_status = 'awaiting',
               utr_number = $2,
               method = 'upi'
             WHERE id = $1`,
            [paymentResult.rows[0].id, utrNumber || null]
        );

        await query(
            `INSERT INTO payment_logs (payment_id, order_id, event_type, payload, source)
             VALUES ($1, $2, 'payment.manual_confirm', $3, 'user')`,
            [paymentResult.rows[0].id, orderId,
            JSON.stringify({ utrNumber, userId })]
        );

        logger.info('Manual payment confirmation received', {
            paymentId: paymentResult.rows[0].id,
            orderId,
            utrNumber,
        });

        return { status: 'awaiting_reconciliation', message: 'We will verify your payment shortly.' };
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
                // Cancel the order
                await client.query(
                    `UPDATE orders SET status = 'cancelled' WHERE id = $1 AND status = 'pending'`,
                    [row.order_id]
                );

                // Release reserved inventory
                await client.query(
                    `UPDATE inventory SET reserved = GREATEST(0, reserved - oi.quantity)
                     FROM order_items oi
                     WHERE inventory.product_id = oi.product_id AND oi.order_id = $1`,
                    [row.order_id]
                );

                // Log
                await client.query(
                    `INSERT INTO payment_logs (payment_id, order_id, event_type, payload, source)
                     VALUES ($1, $2, 'payment.expired', '{}', 'cron')`,
                    [row.id, row.order_id]
                );

                // Notify frontend
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
        return {
            ...payment,
            merchant_vpa: UPI_VPA,
            merchant_name: UPI_MERCHANT_NAME,
        };
    }
}

module.exports = PaymentService;
