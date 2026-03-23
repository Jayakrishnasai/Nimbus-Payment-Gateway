'use strict';
require('dotenv').config();
const { query } = require('./src/config/database');

async function check() {
    try {
        console.log('Checking featured products...');
        const featuredCount = await query('SELECT COUNT(*) FROM products WHERE featured = TRUE');
        console.log('Featured product count:', featuredCount.rows[0].count);

        if (featuredCount.rows[0].count === '0') {
            console.log('Marking some products as featured...');
            await query('UPDATE products SET featured = TRUE WHERE id IN (SELECT id FROM products LIMIT 5)');
            console.log('Updated 5 products to be featured.');
        }

        const invCheck = await query('SELECT COUNT(*) FROM inventory');
        console.log('Inventory count:', invCheck.rows[0].count);
        
        if (invCheck.rows[0].count === '0') {
            console.log('Seeding inventory...');
            await query('INSERT INTO inventory (product_id, quantity) SELECT id, 10 FROM products');
            console.log('Seeded inventory for all products.');
        }

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        process.exit();
    }
}

check();
