'use strict';

const { Router } = require('express');
const PaymentService = require('../services/payment.service');
const logger = require('../utils/logger');

const router = Router();

// POST /api/webhooks/stripe — Stripe payment confirmation webhook
router.post('/stripe', async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            logger.warn('Webhook missing Stripe signature header');
            return res.status(400).json({ error: 'Missing signature' });
        }

        // app.js uses express.raw() for /api/webhooks, so req.body is a Buffer
        const rawBody = req.body;
        await PaymentService.handleStripeWebhook(rawBody, signature);

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Webhook processing error', { error: error.message });
        if (error.statusCode === 400) {
            return res.status(400).json({ error: error.message });
        }
        res.status(200).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
