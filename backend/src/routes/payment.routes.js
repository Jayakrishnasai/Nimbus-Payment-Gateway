'use strict';

const { Router } = require('express');
const PaymentService = require('../services/payment.service');
const { authenticate } = require('../middleware/auth');

const router = Router();

// POST /api/payments/:orderId — Create UPI payment & get QR
router.post('/:orderId', authenticate, async (req, res, next) => {
    try {
        const payment = await PaymentService.createPayment(req.params.orderId, req.user.id);
        res.status(201).json(payment);
    } catch (error) {
        next(error);
    }
});

// GET /api/payments/:orderId/status — Check payment status
router.get('/:orderId/status', authenticate, async (req, res, next) => {
    try {
        const status = await PaymentService.getPaymentStatus(req.params.orderId, req.user.id);
        res.json(status);
    } catch (error) {
        next(error);
    }
});

// POST /api/payments/:orderId/confirm — Manual "I Have Paid" confirmation
router.post('/:orderId/confirm', authenticate, async (req, res, next) => {
    try {
        const { utrNumber } = req.body;
        const result = await PaymentService.confirmManual(req.params.orderId, req.user.id, utrNumber);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
