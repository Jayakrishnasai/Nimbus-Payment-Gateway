'use strict';

const { query } = require('../config/database');

class AnalyticsService {
    /**
     * Get system-wide metrics for Admin.
     */
    static async getAdminMetrics() {
        // 1. User Stats
        const users = await query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            WHERE deleted_at IS NULL 
            GROUP BY role
        `);

        // 2. Revenue & Orders (Last 30 days)
        const business = await query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(AVG(total), 0) as aov
            FROM orders 
            WHERE created_at > NOW() - INTERVAL '30 days' AND status != 'cancelled'
        `);

        // 3. Performance Metrics
        const performance = await query(`
            SELECT 
                COALESCE(AVG(response_time_ms), 0) as avg_latency,
                CASE WHEN COUNT(*) > 0 
                    THEN COUNT(*) FILTER (WHERE status_code >= 400) * 100 / COUNT(*) 
                    ELSE 0 
                END as error_rate,
                COUNT(*) / 30 as req_per_day
            FROM system_metrics
            WHERE created_at > NOW() - INTERVAL '30 days'
        `);

        // 4. Funnel
        const funnel = await query(`
            SELECT 
                (SELECT COUNT(*) FROM events WHERE event_type = 'PRODUCT_VIEW') as views,
                (SELECT COUNT(*) FROM orders) as purchases
        `);

        return {
            users: users.rows,
            business: business.rows[0],
            performance: performance.rows[0],
            conversion_rate: funnel.rows[0].views > 0 
                ? (funnel.rows[0].purchases * 100 / funnel.rows[0].views).toFixed(2) 
                : 0
        };
    }

    /**
     * Get vendor-specific metrics.
     */
    static async getVendorMetrics(vendorId) {
        // 1. Own Products & Stock
        const products = await query(`
            SELECT COUNT(p.id) as total_products, COALESCE(SUM(i.quantity), 0) as total_stock
            FROM products p
            LEFT JOIN inventory i ON i.product_id = p.id
            WHERE p.vendor_id = $1 AND p.deleted_at IS NULL
        `, [vendorId]);

        // 2. Sales & Revenue for their products
        const sales = await query(`
            SELECT 
                COUNT(DISTINCT oi.order_id) as total_orders,
                COALESCE(SUM(oi.unit_price * oi.quantity), 0) as revenue
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN orders o ON o.id = oi.order_id
            WHERE p.vendor_id = $1 AND o.status != 'cancelled'
        `, [vendorId]);

        return {
            products: products.rows[0],
            sales: sales.rows[0]
        };
    }

    /**
     * Track a business event manually.
     */
    static async logEvent(eventType, userId, entityId, entityType, metadata = {}) {
        await query(
            `INSERT INTO events (event_type, user_id, entity_id, entity_type, metadata)
             VALUES ($1, $2, $3, $4, $5)`,
            [eventType, userId, entityId, entityType, JSON.stringify(metadata)]
        );
    }
}

module.exports = AnalyticsService;
