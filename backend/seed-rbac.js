require('dotenv').config({ path: './backend/.env' });
const { pool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function seedRBAC() {
    try {
        console.log('Seeding RBAC users...');
        const salt = 12;

        const users = [
            {
                email: 'admin@nimbus.com',
                password: 'password123',
                firstName: 'System',
                lastName: 'Admin',
                role: 'admin',
                isVerified: true
            },
            {
                email: 'vendor1@nimbus.com',
                password: 'password123',
                firstName: 'Tech',
                lastName: 'Vendor',
                role: 'vendor',
                isVerified: true
            },
            {
                email: 'vendor2@nimbus.com',
                password: 'password123',
                firstName: 'Fashion',
                lastName: 'Vendor',
                role: 'vendor',
                isVerified: true
            },
            {
                email: 'customer@nimbus.com',
                password: 'password123',
                firstName: 'Happy',
                lastName: 'Customer',
                role: 'customer',
                isVerified: true
            }
        ];

        for (const u of users) {
            const hash = await bcrypt.hash(u.password, salt);
            console.log(`Processing ${u.role}: ${u.email}...`);
            
            const existing = await pool.query("SELECT id FROM users WHERE email = $1", [u.email]);
            
            if (existing.rows.length > 0) {
                await pool.query(
                    `UPDATE users SET role = $2, is_verified = $3, password_hash = $4, first_name = $5, last_name = $6, deleted_at = NULL
                     WHERE email = $1`,
                    [u.email, u.role, u.isVerified, hash, u.firstName, u.lastName]
                );
            } else {
                await pool.query(
                    `INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [u.email, hash, u.firstName, u.lastName, u.role, u.isVerified]
                );
            }
        }

        // Link existing products to vendor1
        console.log('Linking existing products to vendor1...');
        const vendorResult = await pool.query("SELECT id FROM users WHERE email = 'vendor1@nimbus.com'");
        const vendorId = vendorResult.rows[0].id;

        await pool.query("UPDATE products SET vendor_id = $1 WHERE vendor_id IS NULL", [vendorId]);

        console.log('RBAC Seeding complete.');
        console.log('---------------------------');
        console.log('Admin: admin@nimbus.com / password123');
        console.log('Vendor 1: vendor1@nimbus.com / password123');
        console.log('Vendor 2: vendor2@nimbus.com / password123 (Owns no products yet)');
        console.log('Customer: customer@nimbus.com / password123');
        
        process.exit(0);
    } catch (err) {
        console.error('Error seeding RBAC:', err);
        process.exit(1);
    }
}

seedRBAC();
