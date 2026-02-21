'use strict';

const logger = require('../utils/logger');

/**
 * 404 handler for unmatched routes.
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};

/**
 * Global error handler middleware.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    logger.error('Request error', {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        error: err.message,
        stack: isProduction ? undefined : err.stack,
        requestId: req.headers['x-request-id'],
    });

    res.status(statusCode).json({
        error: statusCode >= 500 ? 'Internal Server Error' : err.message,
        ...(isProduction ? {} : { stack: err.stack }),
        timestamp: new Date().toISOString(),
    });
};

module.exports = { notFoundHandler, errorHandler };
