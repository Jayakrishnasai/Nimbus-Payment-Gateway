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
            console.error(`Login failed for ${name}:`, data);
            return null;
        }
        return data.token;
    } catch (err) {
        console.error(`Login error for ${name}:`, err.message);
        return null;
    }
}

async function apiCall(method, path, token, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });
    
    if (res.status === 204) return { status: 204 };
    const data = await res.json();
    return { status: res.status, data };
}

// ── Entry Point (Top-level await) ──
console.log('--- Metrics & Analytics Verification Test (ESM) ---');

try {
    const adminToken = await login('Admin', users.admin.email, users.admin.password);
    const v1Token = await login('Vendor 1', users.vendor1.email, users.vendor1.password);
    const custToken = await login('Customer', users.customer.email, users.customer.password);

    if (!adminToken || !v1Token || !custToken) {
        console.error('Failed to get all tokens. Aborting.');
        process.exit(1);
    }

    console.log('Tokens acquired. Generating events...');

    // A. Customer actions
    const products = await apiCall('GET', '/products', custToken);
    const productId = products.data.products[0].id;
    console.log(`- Customer viewing product ${productId}`);
    await apiCall('GET', `/products/${productId}`, custToken);

    console.log('- Customer adding to cart');
    await apiCall('POST', '/cart/items', custToken, { productId, quantity: 1 });

    console.log('- Customer placing order');
    await apiCall('POST', '/orders', custToken, {
        shippingAddress: { name: 'Test User', line1: '123 Test St', city: 'Test City', state: 'TS', postalCode: '123456', country: 'IN' }
    });

    console.log('Events generated. Verifying Analytics API...');

    // B. Admin metrics
    console.log('\n[ADMIN] Fetching system analytics...');
    const adminMetrics = await apiCall('GET', '/analytics/admin', adminToken);
    if (adminMetrics.status === 200) {
        console.log('✅ Admin Analytics Success:');
        console.log(`   - Total Users: ${adminMetrics.data.users.length}`);
        console.log(`   - Performance Latency: ${adminMetrics.data.performance.avg_latency}ms`);
        console.log(`   - Conversion Rate: ${adminMetrics.data.conversion_rate}%`);
    } else {
        console.error('❌ Admin Analytics Failed:', adminMetrics.data);
    }

    // C. Vendor metrics
    console.log('\n[VENDOR 1] Fetching vendor analytics...');
    const v1Metrics = await apiCall('GET', '/analytics/vendor', v1Token);
    if (v1Metrics.status === 200) {
        console.log('✅ Vendor Analytics Success:');
        console.log(`   - Total Products: ${v1Metrics.data.products.total_products}`);
        console.log(`   - Total Sales: ${v1Metrics.data.sales.total_orders}`);
    } else {
        console.error('❌ Vendor Analytics Failed:', v1Metrics.data);
    }

    // D. RBAC Isolation
    console.log('\n[VENDOR 1] Attempting to access Admin Analytics (should fail)...');
    const failAdminCorrect = await apiCall('GET', '/analytics/admin', v1Token);
    if (failAdminCorrect.status === 403) {
        console.log('✅ RBAC Isolation Success: Vendor blocked from Admin analytics');
    } else {
        console.error('❌ RBAC Isolation Failure: Vendor accessed Admin analytics!');
    }

    console.log('\n--- Verification Complete ---');
    process.exit(0);
} catch (err) {
    console.error('Fatal Analytics Error:', err.message);
    process.exit(1);
}
