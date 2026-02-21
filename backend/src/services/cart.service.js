'use strict';

const { query } = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const CART_TTL = 86400; // 24 hours

class CartService {
    /**
     * Get user's cart from Redis (with DB fallback).
     */
    static async getCart(userId) {
        // Try Redis cache
        const cached = await redis.get(`cart:${userId}`);
        if (cached) return JSON.parse(cached);

        // Fallback to DB
        const result = await query(
            `SELECT ci.id, ci.product_id, ci.quantity,
              p.name, p.slug, p.price, p.image_url,
              i.quantity AS stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
            [userId]
        );

        const cart = {
            items: result.rows.map(row => ({
                id: row.id,
                productId: row.product_id,
                name: row.name,
                slug: row.slug,
                price: parseFloat(row.price),
                imageUrl: row.image_url,
                quantity: row.quantity,
                stock: row.stock,
                subtotal: parseFloat(row.price) * row.quantity,
            })),
            total: result.rows.reduce((sum, r) => sum + parseFloat(r.price) * r.quantity, 0),
            itemCount: result.rows.reduce((sum, r) => sum + r.quantity, 0),
        };

        await redis.setex(`cart:${userId}`, CART_TTL, JSON.stringify(cart));
        return cart;
    }

    /**
     * Add or update item in cart.
     */
    static async addItem(userId, productId, quantity = 1) {
        // Check product exists and has stock
        const product = await query(
            `SELECT p.id, p.price, i.quantity AS stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.id = $1 AND p.deleted_at IS NULL AND p.is_active = TRUE`,
            [productId]
        );

        if (product.rows.length === 0) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        if (product.rows[0].stock < quantity) {
            const error = new Error('Insufficient stock');
            error.statusCode = 400;
            throw error;
        }

        // Upsert cart item
        await query(
            `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = NOW()`,
            [userId, productId, quantity]
        );

        // Invalidate cache
        await redis.del(`cart:${userId}`);
        logger.info('Cart item added', { userId, productId, quantity });

        return CartService.getCart(userId);
    }

    /**
     * Update item quantity.
     */
    static async updateItem(userId, productId, quantity) {
        if (quantity <= 0) {
            return CartService.removeItem(userId, productId);
        }

        await query(
            `UPDATE cart_items SET quantity = $3, updated_at = NOW()
       WHERE user_id = $1 AND product_id = $2`,
            [userId, productId, quantity]
        );

        await redis.del(`cart:${userId}`);
        return CartService.getCart(userId);
    }

    /**
     * Remove item from cart.
     */
    static async removeItem(userId, productId) {
        await query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        await redis.del(`cart:${userId}`);
        return CartService.getCart(userId);
    }

    /**
     * Clear entire cart.
     */
    static async clearCart(userId) {
        await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        await redis.del(`cart:${userId}`);
        return { items: [], total: 0, itemCount: 0 };
    }
}

module.exports = CartService;
