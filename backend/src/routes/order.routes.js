'use strict';

const { Router } = require('express');
const { z } = require('zod');
const OrderService = require('../services/order.service');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles.middleware');
const { validate } = require('../middleware/validate');
const { trackEvent } = require('../middleware/metrics.middleware');

const router = Router();
router.use(authenticate);

const createOrderSchema = z.object({
    shippingAddress: z.object({
        name: z.string(),
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string().default('IN'),
    }).optional(),
    billingAddress: z.object({
        name: z.string(),
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string().default('IN'),
    }).optional(),
    notes: z.string().optional(),
    idempotencyKey: z.string().optional(),
});

// POST /api/orders
router.post('/', validate({ body: createOrderSchema }), async (req, res, next) => {
    try {
        const order = await OrderService.createOrder(req.user.id, req.body);
        
        // track event
        trackEvent({
            eventType: 'ORDER_PLACE',
            entityId: order.id,
            entityType: 'order',
            metadata: { totalAmount: order.total_amount, itemCount: order.items?.length },
            req
        });

        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
});

// GET /api/orders
router.get('/', async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await OrderService.getUserOrders(req.user.id, {
            page: Number.parseInt(page, 10) || 1,
            limit: Number.parseInt(limit, 10) || 10,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/orders/admin/all (Admin only)
router.get('/admin/all', authorize(['admin']), async (req, res, next) => {
    try {
        const { page, limit, status } = req.query;
        const result = await OrderService.getAllOrders({
            page: Number.parseInt(page, 10) || 1,
            limit: Number.parseInt(limit, 10) || 20,
            status: status || undefined,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/orders/vendor/my (Vendor only)
router.get('/vendor/my', authorize(['vendor']), async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await OrderService.getVendorOrders(req.user.id, {
            page: Number.parseInt(page, 10) || 1,
            limit: Number.parseInt(limit, 10) || 20,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
    try {
        const order = await OrderService.getOrderById(req.params.id, req.user.id);
        res.json(order);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/orders/:id/status (Admin & Vendor)
router.patch('/:id/status', authorize(['admin', 'vendor']), async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        const order = await OrderService.updateStatus(
            req.params.id, status, req.user.id, req.user.role
        );
        res.json(order);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
