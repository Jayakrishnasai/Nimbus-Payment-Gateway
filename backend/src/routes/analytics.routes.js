'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles.middleware');
const AnalyticsService = require('../services/analytics.service');

const router = Router();

/**
 * GET /api/analytics/admin
 * Multi-role metrics for administrators.
 */
router.get('/admin', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const metrics = await AnalyticsService.getAdminMetrics();
        res.json(metrics);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/vendor
 * Scoped metrics for vendors.
 */
router.get('/vendor', authenticate, authorize(['vendor']), async (req, res, next) => {
    try {
        const metrics = await AnalyticsService.getVendorMetrics(req.user.id);
        res.json(metrics);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
