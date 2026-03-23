'use strict';

const { Router } = require('express');
const PaymentService = require('../services/payment.service');
const { authenticate } = require('../middleware/auth');

const router = Router();

// POST /api/payments/:orderId — Create Stripe Checkout Session
router.post('/:orderId', authenticate, async (req, res, next) => {
    try {
        const session = await PaymentService.createPayment(req.params.orderId, req.user.id);
        res.status(201).json(session); // Returns { url: session.url }
    } catch (error) {
        next(error);
    }
});

// GET /api/payments/:orderId/verify — Verify payment status after redirect
router.get('/:orderId/verify', authenticate, async (req, res, next) => {
    try {
        const status = await PaymentService.getPaymentStatus(req.params.orderId, req.user.id);
        res.json(status);
    } catch (error) {
        next(error);
    }
});

// POST /api/payments/:orderId/retry — Retry a failed/expired payment
router.post('/:orderId/retry', authenticate, async (req, res, next) => {
    try {
        const session = await PaymentService.retryPayment(req.params.orderId, req.user.id);
        res.status(201).json(session);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
