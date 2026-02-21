'use strict';

const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        logger.warn(`Redis retry attempt ${times}, delay ${delay}ms`);
        return delay;
    },
    lazyConnect: false,
});

redis.on('connect', () => {
    logger.info('Redis connected');
});

redis.on('error', (err) => {
    logger.error('Redis error', { error: err.message });
});

redis.on('close', () => {
    logger.warn('Redis connection closed');
});

module.exports = redis;
