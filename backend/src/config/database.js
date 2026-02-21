'use strict';

const { Pool } = require('pg');
const logger = require('../utils/logger');

// ── Build connection config ──
// Supabase provides a DATABASE_URL; fall back to individual DB_* vars for local dev.
function buildPoolConfig() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
        // Supabase / hosted PostgreSQL via connection string
        const isSupabase = databaseUrl.includes('supabase');
        return {
            connectionString: databaseUrl,
            min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
            max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: { rejectUnauthorized: false }, // Required for Supabase & most hosted PG
            // Supabase connection pooler (port 6543) uses transaction mode
            ...(isSupabase && {
                statement_timeout: 30000,
                query_timeout: 30000,
            }),
        };
    }

    // Local / Docker PostgreSQL via individual env vars
    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME || 'nimbuscart',
        user: process.env.DB_USER || 'nimbuscart_user',
        password: process.env.DB_PASSWORD || '',
        min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
        max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
}

const pool = new Pool(buildPoolConfig());

pool.on('connect', () => {
    logger.debug('New PostgreSQL client connected');
});

pool.on('error', (err) => {
    logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/**
 * Execute a query with optional parameters.
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Query executed', { text: text.substring(0, 80), duration, rows: result.rowCount });
        return result;
    } catch (error) {
        logger.error('Query error', { text: text.substring(0, 80), error: error.message });
        throw error;
    }
};

/**
 * Get a client from the pool for transactions.
 */
const getClient = async () => {
    const client = await pool.connect();
    return client;
};

module.exports = { pool, query, getClient };
