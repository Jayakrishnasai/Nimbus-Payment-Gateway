'use strict';

const logger = require('../utils/logger');

/**
 * Enhanced authorization middleware supporting multi-roles and permissions.
 * @param {string[]} allowedRoles - Roles allowed to access (Legacy support).
 * @param {string} requiredPermission - Optional granular permission to check.
 */
const authorize = (allowedRoles = [], requiredPermission = null) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        const { roles, permissions } = req.user;
        const userRoles = roles.map(r => r.toUpperCase());

        // 1. SUPER_ADMIN bypass
        if (userRoles.includes('SUPER_ADMIN')) {
            return next();
        }

        // 2. Check Permission (If provided)
        if (requiredPermission && permissions.includes(requiredPermission)) {
            return next();
        }

        // 3. Check Roles (Legacy/Simple check)
        const hasRole = allowedRoles.some(role => userRoles.includes(role.toUpperCase()));
        if (hasRole && !requiredPermission) {
            return next();
        }

        // 4. Deny access
        logger.warn('Unauthorized access attempt', {
            userId: req.user.id,
            roles,
            path: req.originalUrl,
            requiredPermission,
            allowedRoles
        });

        return res.status(403).json({
            status: 'error',
            message: 'Forbidden: Insufficient permissions',
            required: requiredPermission || allowedRoles
        });
    };
};

/**
 * Middleware to check granular permission specifically.
 * Use this for modern route protection.
 */
const checkPermission = (permission) => authorize([], permission);

/**
 * Middleware to check if the user owns the resource or has elevated permissions.
 * @param {Function} getResource - Async function to fetch the resource (e.g. ProductService.getById).
 * @param {Function} getResourceId - Function to extract resource ID from request.
 */
const checkOwnership = (getResource, getResourceId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ status: 'error', message: 'Authentication required' });
            }

            const { id: userId, roles } = req.user;
            const userRoles = roles.map(r => r.toUpperCase());

            // Admin/SuperAdmin bypass ownership
            if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) {
                return next();
            }

            const resourceId = getResourceId(req);
            const resource = await getResource(resourceId);

            if (!resource) {
                return res.status(404).json({ status: 'error', message: 'Resource not found' });
            }

            // Check vendor_id or user_id
            const ownerId = resource.vendor_id || resource.user_id;

            if (ownerId !== userId) {
                logger.warn('Ownership validation failed', { userId, resourceId, ownerId });
                return res.status(403).json({ status: 'error', message: 'Forbidden: Ownership required' });
            }

            req.resource = resource;
            next();
        } catch (error) {
            logger.error('Ownership check error', { error: error.message });
            res.status(500).json({ status: 'error', message: 'Authorization error' });
        }
    };
};

module.exports = { authorize, checkPermission, checkOwnership };
