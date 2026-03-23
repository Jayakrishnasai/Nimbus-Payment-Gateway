/* cspell:ignore cust */
import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3000/api';

const DEFAULT_SECRET = process.env.TEST_PASSWORD;
if (!DEFAULT_SECRET) {
    console.error('CRITICAL: TEST_PASSWORD environment variable is not defined.');
    process.exit(1);
}

const users = {
    admin: { email: 'admin@nimbus.com', password: DEFAULT_SECRET },
    vendor1: { email: 'vendor1@nimbus.com', password: DEFAULT_SECRET },
    vendor2: { email: 'vendor2@nimbus.com', password: DEFAULT_SECRET },
    customer: { email: 'customer@nimbus.com', password: DEFAULT_SECRET }
};

async function login(name, email, password) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.status !== 200) {
            console.error(`Login failed for ${name} (${email}): Status ${res.status}`, data);
            return null;
        }
        return data.token;
    } catch (err) {
        console.error(`Login error for ${name} (${email}):`, err.message);
        return null;
    }
}

async function testPublicAccess() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        console.log(`✅ [PUBLIC] Fetch products: Success (${data.products.length} found)`);
    } catch (err) {
        console.error('❌ [PUBLIC] Fetch products: Failed', err.message);
    }
}

async function testCustomerRestrictions(custToken) {
    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${custToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'Hack Product', price: 0 })
        });
        if (res.status === 403) {
            console.log(`✅ [CUSTOMER] Create product: Success (Got 403 Forbidden)`);
        } else {
            console.log(`❌ [CUSTOMER] Create product: Failed (Expected 403, got ${res.status})`);
        }
    } catch (err) {
        console.error('❌ [CUSTOMER] Create product: Unexpected error', err.message);
    }
}

async function testVendorCreation(v1Token) {
    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${v1Token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Vendor 1 Product',
                price: 99.99,
                category: 'Electronics',
                description: 'Owned by Vendor 1'
            })
        });
        const data = await res.json();
        if (res.status === 201) {
            console.log(`✅ [VENDOR 1] Create product: Success (ID: ${data.id})`);
            return data.id;
        } else {
            console.log(`❌ [VENDOR 1] Create product: Failed (Got ${res.status})`, data);
            return null;
        }
    } catch (err) {
        console.error('❌ [VENDOR 1] Create product: Unexpected error', err.message);
        return null;
    }
}

async function testVendorIsolation(v1ProductId, v1Token, v2Token) {
    try {
        const res = await fetch(`${API_URL}/products/${v1ProductId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${v2Token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'Hacked by V2' })
        });
        if (res.status === 403) {
            console.log(`✅ [VENDOR 2] Update V1 Product: Success (Got 403 Forbidden)`);
        } else {
            console.log(`❌ [VENDOR 2] Update V1 Product: Failed (Expected 403, got ${res.status})`);
        }
    } catch (err) {
        console.error('❌ [VENDOR 2] Update V1 Product: Unexpected error', err.message);
    }

    try {
        const res = await fetch(`${API_URL}/products/${v1ProductId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${v1Token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'Updated Vendor 1 Product' })
        });
        if (res.status === 200) {
            console.log('✅ [VENDOR 1] Update own product: Success');
        } else {
            console.log(`❌ [VENDOR 1] Update own product: Failed (Got ${res.status})`);
        }
    } catch (err) {
        console.error('❌ [VENDOR 1] Update own product: Unexpected error', err.message);
    }
}

async function testAdminDeletion(v1ProductId, adminToken) {
    try {
        const res = await fetch(`${API_URL}/products/${v1ProductId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.status === 204) {
            console.log('✅ [ADMIN] Delete V1 product: Success');
        } else {
            console.log(`❌ [ADMIN] Delete V1 product: Failed (Got ${res.status})`);
        }
    } catch (err) {
        console.error('❌ [ADMIN] Delete V1 product: Unexpected error', err.message);
    }
}

// ── Entry Point (Top-level await) ──
console.log('--- RBAC Verification Test (ESM + Top-level Await) ---');

try {
    const adminToken = await login('Admin', users.admin.email, users.admin.password);
    const v1Token = await login('Vendor 1', users.vendor1.email, users.vendor1.password);
    const v2Token = await login('Vendor 2', users.vendor2.email, users.vendor2.password);
    const custToken = await login('Customer', users.customer.email, users.customer.password);

    if (!adminToken || !v1Token || !v2Token || !custToken) {
        console.error('Failed to get all tokens. Aborting.');
        process.exit(1);
    }

    await testPublicAccess();
    await testCustomerRestrictions(custToken);
    
    const v1ProductId = await testVendorCreation(v1Token);
    if (v1ProductId) {
        await testVendorIsolation(v1ProductId, v1Token, v2Token);
        await testAdminDeletion(v1ProductId, adminToken);
    }

    console.log('--- Verification Complete ---');
    process.exit(0);
} catch (err) {
    console.error('Fatal Verification Error:', err.message);
    process.exit(1);
}
