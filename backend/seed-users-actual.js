require('dotenv').config();
const { pool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function seedUsers() {
    try {
        console.log('Seeding users...');
        
        // Default passwords
        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
        const hashedCustomerPassword = await bcrypt.hash('user123', 10);

        // Insert Admin
        await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO NOTHING`,
            ['admin@nimbuscart.com', hashedAdminPassword, 'Admin', 'User', 'admin', true]
        );

        // Insert Customer
        await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (email) DO NOTHING`,
            ['user@example.com', hashedCustomerPassword, 'John', 'Doe', 'customer', true]
        );

        console.log('User seeding complete.');
        console.log('---------------------------');
        console.log('Admin: admin@nimbuscart.com / admin123');
        console.log('Customer: user@example.com / user123');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding users:', err);
        process.exit(1);
    }
}

seedUsers();
