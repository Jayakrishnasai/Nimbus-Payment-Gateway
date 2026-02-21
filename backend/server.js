'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initWebSocket } = require('./src/websocket/socket');
const { pool } = require('./src/config/database');
const redis = require('./src/config/redis');
const { initCronJobs } = require('./src/services/cron.service');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

// ── Create HTTP server ──
const server = http.createServer(app);

// ── Initialize WebSocket ──
initWebSocket(server);

// ── Initialize Cron Jobs ──
initCronJobs();

// ── Graceful shutdown ──
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            await pool.end();
            logger.info('PostgreSQL pool closed');
        } catch (err) {
            logger.error('Error closing PostgreSQL pool', { error: err.message });
        }

        try {
            await redis.quit();
            logger.info('Redis connection closed');
        } catch (err) {
            logger.error('Error closing Redis', { error: err.message });
        }

        logger.info('Graceful shutdown complete');
        process.exit(0);
    });

    // Force shutdown after 30s
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

// ── Start server ──
server.listen(PORT, () => {
    logger.info(`NimbusCart API running on port ${PORT}`, {
        env: process.env.NODE_ENV || 'development',
        port: PORT,
    });
});

module.exports = server;
