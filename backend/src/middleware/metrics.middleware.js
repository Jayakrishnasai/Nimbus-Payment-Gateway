'use strict';

const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware to capture system performance metrics.
 */
const trackMetrics = (req, res, next) => {
    const start = process.hrtime();

    // Listen for the finish event to record metrics
    res.on('finish', async () => {
        const diff = process.hrtime(start);
        const responseTimeMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);

        const metricsData = {
            path: req.baseUrl + req.path,
            method: req.method,
            status_code: res.statusCode,
            response_time_ms: responseTimeMs,
            user_id: req.user ? req.user.id : null
        };

        try {
            await query(
                `INSERT INTO system_metrics (path, method, status_code, response_time_ms, user_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [metricsData.path, metricsData.method, metricsData.status_code, metricsData.response_time_ms, metricsData.user_id]
            );
        } catch (err) {
            logger.error('Failed to record system metrics', { error: err.message });
        }
    });

    next();
};

/**
 * Utility to log business events to the database.
 */
const trackEvent = async ({ eventType, userId, sessionId, entityId, entityType, metadata, req }) => {
    const eventData = {
        event_type: eventType,
        user_id: userId || req?.user?.id || null,
        session_id: sessionId || req?.sessionID || null,
        entity_id: entityId,
        entity_type: entityType,
        metadata: metadata || {},
        ip_address: req ? req.ip : null,
        user_agent: req ? req.get('User-Agent') : null
    };

    try {
        await query(
            `INSERT INTO events (event_type, user_id, session_id, entity_id, entity_type, metadata, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                eventData.event_type,
                eventData.user_id,
                eventData.session_id,
                eventData.entity_id,
                eventData.entity_type,
                JSON.stringify(eventData.metadata),
                eventData.ip_address,
                eventData.user_agent
            ]
        );
    } catch (err) {
        logger.error('Failed to record business event', { eventType, error: err.message });
    }
};

module.exports = { trackMetrics, trackEvent };
