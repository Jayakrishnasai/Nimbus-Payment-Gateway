import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import bcrypt from 'bcryptjs';

const require = createRequire(import.meta.url);
const { pool } = require('./src/config/database');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const defaultPassword = process.env.SEED_USER_PASSWORD || 'ChangeMe123!';

const rbacUsers = [
    { email: 'admin@nimbus.com', firstName: 'Admin', lastName: 'User', role: 'admin', isVerified: true },
    { email: 'vendor1@nimbus.com', firstName: 'Electro', lastName: 'Vendor', role: 'vendor', isVerified: true },
    { email: 'vendor2@nimbus.com', firstName: 'Fashion', lastName: 'Vendor', role: 'vendor', isVerified: true },
    { email: 'customer@nimbus.com', firstName: 'John', lastName: 'Customer', role: 'customer', isVerified: true },
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('--- Production Seed: RBAC Users & Mappings ---');
        await client.query('BEGIN');

        const hash = await bcrypt.hash(defaultPassword, 10);

        for (const u of rbacUsers) {
            console.log(`Processing ${u.email}...`);
            
            // 1. Upsert User
            const userRes = await client.query(
                `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (email) WHERE deleted_at IS NULL DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    role = EXCLUDED.role,
                    email_verified = EXCLUDED.email_verified,
                    updated_at = NOW()
                 RETURNING id`,
                [u.email, hash, u.firstName, u.lastName, u.role, u.isVerified]
            );

            const userId = userRes.rows[0].id;
            const roleName = u.role.toUpperCase();

            // 2. Lookup corresponding RBAC Role
            const roleLookup = await client.query("SELECT id FROM roles WHERE name = $1", [roleName]);
            
            if (roleLookup.rows.length > 0) {
                const roleId = roleLookup.rows[0].id;
                
                // 3. Clear existing role mappings to ensure clean sync
                await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
                
                // 4. Link User to RBAC Role
                await client.query(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    [userId, roleId]
                );
                console.log(`  Synced: ${u.email} -> [${roleName}]`);
            } else {
                console.warn(`  Warning: Role [${roleName}] not found in roles table!`);
            }
        }

        // 5. Global cleanup: Ensure standard vendor assignments for existing products
        const vendor1 = await client.query("SELECT id FROM users WHERE email = 'vendor1@nimbus.com'");
        if (vendor1.rows.length > 0) {
            await client.query("UPDATE products SET vendor_id = $1 WHERE vendor_id IS NULL", [vendor1.rows[0].id]);
        }

        await client.query('COMMIT');
        console.log('\n--- RBAC Seeding completed successfully ---');
        console.log(`Default Password: ${defaultPassword}`);
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n!!! RBAC Seeding failed (Transaction Rolled Back) !!!');
        console.error(err);
        process.exit(1);
    } finally {
        client.release();
    }
}

seed();
