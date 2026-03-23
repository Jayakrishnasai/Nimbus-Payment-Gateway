'use strict';

const logger = require('../utils/logger');

/**
 * Middleware to restrict access based on user roles.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route.
 */
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn('Unauthorized access attempt', {
                userId: req.user.id,
                role: req.user.role,
                path: req.originalUrl,
                requiredRoles: allowedRoles
            });

            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: You do not have permission to perform this action'
            });
        }

        next();
    };
};

/**
 * Middleware to check if the user owns the resource or is an admin.
 * Assumes the resource has a vendor_id or user_id field.
 * @param {Object} options - Configuration for ownership check.
 * @param {Function} getResourceId - Function to extract resource ID from request.
 * @param {Function} getResource - Async function to fetch the resource.
 */
const checkOwnership = (getResource, getResourceId) => {
    return async (req, res, next) => {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Admins can bypass ownership checks
        if (userRole === 'admin') {
            return next();
        }

        try {
            const resourceId = getResourceId(req);
            const resource = await getResource(resourceId);

            if (!resource) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Resource not found'
                });
            }

            // Check vendor_id or user_id for ownership
            const ownerId = resource.vendor_id || resource.user_id;

            if (ownerId !== userId) {
                logger.warn('Ownership validation failed', {
                    userId,
                    resourceId,
                    ownerId
                });

                return res.status(403).json({
                    status: 'error',
                    message: 'Forbidden: You do not own this resource'
                });
            }

            // Attach resource to request for later use
            req.resource = resource;
            next();
        } catch (error) {
            logger.error('Ownership check error', { error: error.message });
            res.status(500).json({
                status: 'error',
                message: 'Internal server error during authorization'
            });
        }
    };
};

module.exports = { authorize, checkOwnership };
