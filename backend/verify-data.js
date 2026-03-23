'use strict';
require('dotenv').config();
const { query } = require('./src/config/database');

async function verifyData() {
    try {
        console.log('--- Database Verification ---');

        // Check Orders
        const orders = await query('SELECT id, order_number, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5');
        console.log('\nLatest 5 Orders:');
        if (orders.rows.length === 0) {
            console.log('No orders found.');
        } else {
            console.table(orders.rows);
        }

        // Check Payments
        const payments = await query('SELECT id, order_id, amount, status, stripe_session_id, created_at FROM payments ORDER BY created_at DESC LIMIT 5');
        console.log('\nLatest 5 Payments:');
        if (payments.rows.length === 0) {
            console.log('No payments found.');
        } else {
            console.table(payments.rows);
        }

        // Check Products (Sum/Count)
        const products = await query('SELECT COUNT(*) as count FROM products');
        console.log(`\nTotal Products: ${products.rows[0].count}`);

        // Check Users
        const users = await query('SELECT COUNT(*) as count FROM users');
        console.log(`Total Users: ${users.rows[0].count}`);

    } catch (err) {
        console.error('\nVerification failed:', err.message);
    } finally {
        process.exit();
    }
}

verifyData();
