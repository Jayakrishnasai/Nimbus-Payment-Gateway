'use strict';

const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware to check if the user has a specific permission.
 * Supports granular permission check and scope validation.
 * 
 * @param {string} requiredPermission - The permission string (e.g., 'product:delete')
 * @returns {Function} Express middleware
 */
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // SUPER_ADMIN bypass
            if (req.user.role === 'SUPER_ADMIN') {
                return next();
            }

            // Check if permission exists in user's permissions list
            const hasPermission = req.user.permissions.includes(requiredPermission);

            if (!hasPermission) {
                logger.warn('Permission denied', { 
                    userId: req.user.id, 
                    permission: requiredPermission,
                    userRole: req.user.role 
                });
                return res.status(403).json({ 
                    error: 'Insufficient permissions',
                    required: requiredPermission
                });
            }

            next();
        } catch (error) {
            logger.error('RBAC middleware error', { error: error.message });
            return res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

/**
 * Middleware to enforce tenant isolation.
 * Ensures the resource belongs to the user's tenant or the user is a SUPER_ADMIN.
 */
const enforceTenant = (req, res, next) => {
    if (req.user.role === 'SUPER_ADMIN') {
        return next();
    }

    if (!req.user.tenant_id) {
        return res.status(403).json({ error: 'Tenant context missing' });
    }

    // Tenant logic depends on the resource being accessed. 
    // This is often handled in the service layer, but can be pre-checked here if tenant_id is in the URL.
    next();
};

module.exports = { checkPermission, enforceTenant };
