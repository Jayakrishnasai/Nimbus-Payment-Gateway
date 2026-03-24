'use strict';

const { query } = require('../config/database');
const logger = require('../utils/logger');

class AuditService {
    /**
     * Log an administrative or sensitive action.
     */
    static async log({ userId, action, entityType, entityId, oldValues = null, newValues = null, req = null }) {
        try {
            const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
            const userAgent = req ? req.headers['user-agent'] : null;

            await query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent]
            );

            logger.info('Audit log created', { action, entityType, entityId, userId });
        } catch (error) {
            // Don't fail the main request if auditing fails, but log the error
            logger.error('Failed to create audit log', { error: error.message, action, entityId });
        }
    }
}

module.exports = AuditService;
