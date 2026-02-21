'use strict';

const { query } = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL = 300; // 5 minutes

class ProductService {
    /**
     * List products with pagination, filtering, and sorting.
     */
    static async list({ page = 1, limit = 12, category, search, sort = 'created_at', order = 'DESC', featured }) {
        const offset = (page - 1) * limit;
        const conditions = ['p.deleted_at IS NULL', 'p.is_active = TRUE'];
        const params = [];
        let paramIndex = 1;

        if (category) {
            conditions.push(`p.category = $${paramIndex++}`);
            params.push(category);
        }

        if (search) {
            conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (featured !== undefined) {
            conditions.push(`p.featured = $${paramIndex++}`);
            params.push(featured);
        }

        const whereClause = conditions.join(' AND ');
        const allowedSorts = ['created_at', 'price', 'name'];
        const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Count query
        const countResult = await query(
            `SELECT COUNT(*) FROM products p WHERE ${whereClause}`, params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        // Data query
        params.push(limit, offset);
        const dataResult = await query(
            `SELECT p.*, i.quantity AS stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE ${whereClause}
       ORDER BY p.${sortCol} ${sortOrder}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            params
        );

        return {
            products: dataResult.rows,
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get a single product by ID or slug.
     */
    static async getById(id) {
        // Check cache
        const cached = await redis.get(`product:${id}`);
        if (cached) return JSON.parse(cached);

        const result = await query(
            `SELECT p.*, i.quantity AS stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE (p.id::text = $1 OR p.slug = $1) AND p.deleted_at IS NULL`,
            [id]
        );

        if (result.rows.length === 0) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        const product = result.rows[0];
        await redis.setex(`product:${id}`, CACHE_TTL, JSON.stringify(product));

        return product;
    }

    /**
     * Get product categories.
     */
    static async getCategories() {
        const cached = await redis.get('product:categories');
        if (cached) return JSON.parse(cached);

        const result = await query(
            `SELECT DISTINCT category, COUNT(*) as count
       FROM products WHERE deleted_at IS NULL AND is_active = TRUE AND category IS NOT NULL
       GROUP BY category ORDER BY count DESC`
        );

        const categories = result.rows;
        await redis.setex('product:categories', CACHE_TTL, JSON.stringify(categories));
        return categories;
    }
}

module.exports = ProductService;
