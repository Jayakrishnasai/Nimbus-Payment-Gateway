'use strict';

const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../config/database');
const CartService = require('./cart.service');
const logger = require('../utils/logger');

class OrderService {
    /**
     * Create a new order from the user's cart.
     */
    static async createOrder(userId, { shippingAddress, billingAddress, notes, idempotencyKey }) {
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
            // Use SERIALIZABLE for payment-related transactions
            await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

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

            // Calculate totals
            const subtotal = cartResult.rows.reduce((sum, r) => sum + parseFloat(r.price) * r.quantity, 0);
            const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
            const shippingCost = subtotal >= 999 ? 0 : 99;
            const total = Math.round((subtotal + tax + shippingCost) * 100) / 100;

            const orderNumber = `NC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (user_id, order_number, status, subtotal, tax, shipping_cost, total,
                             shipping_address, billing_address, notes, idempotency_key, expires_at)
         VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '5 minutes')
         RETURNING id, order_number, status, subtotal, tax, shipping_cost, total, created_at`,
                [userId, orderNumber, subtotal, tax, shippingCost, total,
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
                    item.price, parseFloat(item.price) * item.quantity]
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

            // Clear cart cache
            const redis = require('../config/redis');
            await redis.del(`cart:${userId}`);

            logger.info('Order created', { orderId: order.id, orderNumber, total, userId });

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
                total: parseInt(countResult.rows[0].count, 10),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
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
    static async updateStatus(orderId, status) {
        const result = await query(
            `UPDATE orders SET status = $2 WHERE id = $1 RETURNING *`,
            [orderId, status]
        );

        if (result.rows.length === 0) {
            throw Object.assign(new Error('Order not found'), { statusCode: 404 });
        }

        return result.rows[0];
    }
}

module.exports = OrderService;
