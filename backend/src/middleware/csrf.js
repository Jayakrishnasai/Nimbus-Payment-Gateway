'use strict';

const logger = require('../utils/logger');

/**
 * Double-submit cookie CSRF middleware
 * Verifies that the X-XSRF-TOKEN header matches the XSRF-TOKEN cookie.
 */
const csrfProtection = (req, res, next) => {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip CSRF in development (optional, but easier for testing)
    if (process.env.NODE_ENV === 'development') {
        return next();
    }

    // Skip CSRF for webhooks and login (no cookies yet/required)
    if (req.originalUrl.startsWith('/api/webhooks') || req.originalUrl === '/api/auth/login') {
        return next();
    }

    const cookieToken = req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-xsrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        logger.warn('CSRF token mismatch or missing', {
            path: req.originalUrl,
            ip: req.ip,
        });
        return res.status(403).json({ error: 'CSRF token validation failed' });
    }

    next();
};

module.exports = { csrfProtection };
