/* cspell:ignore ILIKE */
'use strict';

const { query } = require('../config/database');
const logger = require('../utils/logger');

class ProductService {
    /**
     * List products with pagination, filtering, and sorting.
     */
    /**
     * Build WHERE clause conditions and parameters for product filtering.
     */
    static _buildFilterConditions(filters) {
        const conditions = ['p.deleted_at IS NULL', 'p.is_active = TRUE'];
        const params = [];
        let paramIndex = 1;

        if (filters.category) {
            conditions.push(`p.category = $${paramIndex++}`);
            params.push(filters.category);
        }

        if (filters.search) {
            conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        if (filters.featured !== undefined) {
            conditions.push(`p.featured = $${paramIndex++}`);
            params.push(filters.featured);
        }

        if (filters.vendorId) {
            conditions.push(`p.vendor_id = $${paramIndex++}`);
            params.push(filters.vendorId);
        }

        return { whereClause: conditions.join(' AND '), params, paramIndex };
    }

    /**
     * List products with pagination, filtering, and sorting.
     */
    static async list({ page = 1, limit = 12, category, search, sort = 'created_at', order = 'DESC', featured, vendorId }) {
        const offset = (page - 1) * limit;
        const { whereClause, params, paramIndex } = this._buildFilterConditions({ category, search, featured, vendorId });
        
        let pIndex = paramIndex;
        const allowedSorts = ['created_at', 'price', 'name'];
        const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Count query
        const countResult = await query(
            `SELECT COUNT(*) FROM products p WHERE ${whereClause}`, params
        );
        const total = Number.parseInt(countResult.rows[0].count, 10);

        // Data query
        const dataResult = await query(
            `SELECT p.*, i.quantity AS stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE ${whereClause}
       ORDER BY p.${sortCol} ${sortOrder}
       LIMIT $${pIndex++} OFFSET $${pIndex++} `,
            [...params, limit, offset]
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
        const result = await query(
            `SELECT p.*, i.quantity AS stock
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE (p.id::text = $1 OR p.slug = $1) AND p.deleted_at IS NULL`,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }

    /**
     * Create a new product.
     */
    static async create(data) {
        const slug = data.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
        
        const result = await query(
            `INSERT INTO products (name, slug, description, price, category, image_url, vendor_id, is_active, featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, name, slug, price, category, image_url, vendor_id, created_at`,
            [data.name, slug, data.description, data.price, data.category, data.image_url, data.vendor_id, data.is_active || true, data.featured || false]
        );

        const product = result.rows[0];

        // Initialize inventory
        if (data.stock !== undefined) {
            await query(
                `INSERT INTO inventory (product_id, quantity) VALUES ($1, $2)`,
                [product.id, data.stock]
            );
        }

        logger.info('Product created', { productId: product.id, vendorId: data.vendor_id });
        return { ...product, stock: data.stock };
    }

    /**
     * Update an existing product.
     */
    static async update(id, data) {
        const fields = [];
        const params = [id];
        let paramIndex = 2;

        const updatableFields = ['name', 'description', 'price', 'category', 'image_url', 'is_active', 'featured'];
        
        for (const field of updatableFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${paramIndex++}`);
                params.push(data[field]);
            }
        }

        if (fields.length === 0 && data.stock === undefined) {
            return this.getById(id);
        }

        if (fields.length > 0) {
            await query(
                `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1`,
                params
            );
        }

        if (data.stock !== undefined) {
            await query(
                `UPDATE inventory SET quantity = $2, updated_at = NOW() WHERE product_id = $1`,
                [id, data.stock]
            );
        }

        logger.info('Product updated', { productId: id });
        return this.getById(id);
    }

    /**
     * Soft delete a product.
     */
    static async delete(id) {
        await query(
            `UPDATE products SET deleted_at = NOW(), is_active = FALSE WHERE id = $1`,
            [id]
        );
        logger.info('Product deleted', { productId: id });
        return true;
    }

    /**
     * Get product categories.
     */
    static async getCategories() {
        const result = await query(
            `SELECT DISTINCT category, COUNT(*) as count
       FROM products WHERE deleted_at IS NULL AND is_active = TRUE AND category IS NOT NULL
       GROUP BY category ORDER BY count DESC`
        );

        return result.rows;
    }
}

module.exports = ProductService;
