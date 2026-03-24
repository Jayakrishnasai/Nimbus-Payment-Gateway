'use strict';

const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../config/database');
const Decimal = require('decimal.js');
const CartService = require('./cart.service');
const logger = require('../utils/logger');
const AuditService = require('./audit.service');

class OrderService {
    /**
     * Create a new order from the user's cart.
     */
    static async createOrder(userId, { shippingAddress, billingAddress, notes, idempotencyKey }, req = null) {
        // Check idempotency
        if (idempotencyKey) {
            const existing = await query(
                'SELECT id, order_number, status, total FROM orders WHERE idempotency_key = $1',
                [idempotencyKey]
            );
            if (existing.rows.length > 0) {
                return existing.rows[0];
            }
        }

        const client = await getClient();

        try {
            await client.query('BEGIN');
            // Use READ COMMITTED to avoid spurious serialization failures; explicitly locking via FOR UPDATE where necessary
            await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

            // Get cart items
            const cartResult = await client.query(
                `SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url, i.quantity AS stock
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE ci.user_id = $1`,
                [userId]
            );

            if (cartResult.rows.length === 0) {
                throw Object.assign(new Error('Cart is empty'), { statusCode: 400 });
            }

            // Validate stock
            for (const item of cartResult.rows) {
                if (item.stock < item.quantity) {
                    throw Object.assign(
                        new Error(`Insufficient stock for ${item.name}`),
                        { statusCode: 400 }
                    );
                }
            }

            // Calculate totals using exact precision math
            const subtotal = cartResult.rows.reduce((sum, r) => sum.plus(new Decimal(r.price).times(r.quantity)), new Decimal(0));
            const tax = subtotal.times(0.18).toDecimalPlaces(2, Decimal.ROUND_HALF_UP); // 18% GST
            const shippingCost = new Decimal(subtotal.gte(999) ? 0 : 99);
            const total = subtotal.plus(tax).plus(shippingCost).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

            const orderNumber = `NC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (user_id, order_number, status, subtotal, tax, shipping_cost, total,
                             shipping_address, billing_address, notes, idempotency_key, expires_at)
         VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '5 minutes')
         RETURNING id, order_number, status, subtotal, tax, shipping_cost, total, created_at`,
                [userId, orderNumber, subtotal.toNumber(), tax.toNumber(), shippingCost.toNumber(), total.toNumber(),
                    JSON.stringify(shippingAddress || {}), JSON.stringify(billingAddress || {}),
                    notes || null, idempotencyKey || null]
            );

            const order = orderResult.rows[0];

            // Create order items & reserve inventory
            for (const item of cartResult.rows) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [order.id, item.product_id, item.name, item.image_url, item.quantity,
                    item.price, new Decimal(item.price).times(item.quantity).toNumber()]
                );

                // Reserve inventory
                await client.query(
                    `UPDATE inventory SET quantity = quantity - $2, reserved = reserved + $2
           WHERE product_id = $1 AND quantity >= $2`,
                    [item.product_id, item.quantity]
                );
            }

            // Clear cart
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

            await client.query('COMMIT');

            await AuditService.log({
                userId,
                action: 'ORDER_CREATE',
                entityType: 'order',
                entityId: order.id,
                newValues: order,
                req
            });

            logger.info('Order created', { orderId: order.id, orderNumber, total: total.toNumber(), userId });

            return order;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get orders for a user.
     */
    static async getUserOrders(userId, { page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;

        const countResult = await query(
            'SELECT COUNT(*) FROM orders WHERE user_id = $1 AND deleted_at IS NULL',
            [userId]
        );

        const result = await query(
            `SELECT id, order_number, status, total, currency, created_at
       FROM orders WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        return {
            orders: result.rows,
            pagination: {
                page, limit,
                total: Number.parseInt(countResult.rows[0].count, 10),
                totalPages: Math.ceil(Number.parseInt(countResult.rows[0].count, 10) / limit),
            },
        };
    }

    /**
     * Get order details by ID.
     */
    static async getOrderById(orderId, userId) {
        const orderResult = await query(
            `SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            throw Object.assign(new Error('Order not found'), { statusCode: 404 });
        }

        const itemsResult = await query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [orderId]
        );

        const paymentResult = await query(
            'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
            [orderId]
        );

        return {
            ...orderResult.rows[0],
            items: itemsResult.rows,
            payment: paymentResult.rows[0] || null,
        };
    }

    /**
     * Update order status.
     */
    static async updateStatus(orderId, newStatus, userId = null, userRole = null, req = null) {
        // Validate status transition
        const VALID_TRANSITIONS = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['processing', 'cancelled'],
            processing: ['shipped', 'cancelled'],
            shipped: ['delivered'],
            delivered: ['refunded'],
            cancelled: [],
            refunded: [],
        };

        const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
            throw Object.assign(new Error('Order not found'), { statusCode: 404 });
        }

        const order = orderResult.rows[0];
        const currentStatus = order.status;

        if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
            throw Object.assign(
                new Error(`Cannot transition from '${currentStatus}' to '${newStatus}'`),
                { statusCode: 400 }
            );
        }

        // Vendors can only update orders that contain their products
        if (userRole === 'vendor' && userId) {
            const vendorCheck = await query(
                `SELECT 1 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = $1 AND p.vendor_id = $2 LIMIT 1`,
                [orderId, userId]
            );
            if (vendorCheck.rows.length === 0) {
                throw Object.assign(new Error('You do not have access to this order'), { statusCode: 403 });
            }
        }

        const result = await query(
            `UPDATE orders SET status = $2 WHERE id = $1 RETURNING *`,
            [orderId, newStatus]
        );

        const newOrder = result.rows[0];

        await AuditService.log({
            userId,
            action: 'ORDER_STATUS_UPDATE',
            entityType: 'order',
            entityId: orderId,
            oldValues: { status: order.status },
            newValues: { status: newStatus },
            req
        });

        logger.info('Order status updated', { orderId, from: currentStatus, to: newStatus });
        return newOrder;
    }

    /**
     * Get all orders (admin only).
     */
    static async getAllOrders({ page = 1, limit = 20, status } = {}) {
        const offset = (page - 1) * limit;
        const conditions = ['o.deleted_at IS NULL'];
        const params = [];
        let paramIndex = 1;

        if (status) {
            conditions.push(`o.status = $${paramIndex++}`);
            params.push(status);
        }

        const whereClause = conditions.join(' AND ');

        const countResult = await query(
            `SELECT COUNT(*) FROM orders o WHERE ${whereClause}`, params
        );

        const result = await query(
            `SELECT o.*, u.email, u.first_name, u.last_name
             FROM orders o
             JOIN users u ON u.id = o.user_id
             WHERE ${whereClause}
             ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
            [...params, limit, offset]
        );

        return {
            orders: result.rows,
            pagination: {
                page, limit,
                total: Number.parseInt(countResult.rows[0].count, 10),
                totalPages: Math.ceil(Number.parseInt(countResult.rows[0].count, 10) / limit),
            },
        };
    }

    /**
     * Get orders containing a vendor's products.
     */
    static async getVendorOrders(vendorId, { page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;

        const countResult = await query(
            `SELECT COUNT(DISTINCT o.id)
             FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             JOIN products p ON p.id = oi.product_id
             WHERE p.vendor_id = $1 AND o.deleted_at IS NULL`,
            [vendorId]
        );

        const result = await query(
            `SELECT DISTINCT o.*, u.email, u.first_name, u.last_name
             FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             JOIN products p ON p.id = oi.product_id
             JOIN users u ON u.id = o.user_id
             WHERE p.vendor_id = $1 AND o.deleted_at IS NULL
             ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`,
            [vendorId, limit, offset]
        );

        return {
            orders: result.rows,
            pagination: {
                page, limit,
                total: Number.parseInt(countResult.rows[0].count, 10),
                totalPages: Math.ceil(Number.parseInt(countResult.rows[0].count, 10) / limit),
            },
        };
    }
}

module.exports = OrderService;
