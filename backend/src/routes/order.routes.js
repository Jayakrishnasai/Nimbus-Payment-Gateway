'use strict';

const { Router } = require('express');
const { z } = require('zod');
const OrderService = require('../services/order.service');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

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
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10,
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

module.exports = router;
