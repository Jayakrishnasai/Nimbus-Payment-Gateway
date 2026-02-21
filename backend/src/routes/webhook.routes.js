'use strict';

const { Router } = require('express');
const PaymentService = require('../services/payment.service');
const logger = require('../utils/logger');

const router = Router();

// ── Allowed bank webhook IPs (configure per your bank's documentation) ──
const ALLOWED_WEBHOOK_IPS = (process.env.BANK_WEBHOOK_ALLOWED_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean);

// POST /api/webhooks/bank — Bank payment confirmation webhook
// Uses raw body for HMAC signature verification
router.post('/bank', async (req, res) => {
    try {
        const sourceIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

        // IP whitelist check (skip in development)
        if (process.env.NODE_ENV === 'production' && ALLOWED_WEBHOOK_IPS.length > 0) {
            if (!ALLOWED_WEBHOOK_IPS.includes(sourceIp)) {
                logger.warn('Webhook from unauthorized IP', { sourceIp });
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        const signature = req.headers['x-bank-signature'] || req.headers['x-webhook-signature'];
        if (!signature) {
            logger.warn('Webhook missing signature header', { sourceIp });
            return res.status(400).json({ error: 'Missing signature' });
        }

        const rawBody = typeof req.body === 'string' ? req.body : req.body.toString('utf8');
        const result = await PaymentService.handleBankWebhook(rawBody, signature, sourceIp);

        res.status(200).json({ status: 'ok', result: result.status });
    } catch (error) {
        logger.error('Webhook processing error', { error: error.message });
        if (error.statusCode === 400) {
            return res.status(400).json({ error: error.message });
        }
        // Return 200 to prevent bank from retrying on application errors
        res.status(200).json({ status: 'error', message: error.message });
    }
});

// POST /api/webhooks/simulate — Simulated bank webhook (development/demo only)
if (process.env.NODE_ENV !== 'production') {
    router.post('/simulate', async (req, res) => {
        try {
            const { transaction_ref, amount, utr, sender_vpa } = req.body;

            if (!transaction_ref || !amount) {
                return res.status(400).json({ error: 'transaction_ref and amount are required' });
            }

            const payload = {
                utr: utr || `UTR${Date.now()}`,
                amount: parseFloat(amount),
                sender_vpa: sender_vpa || 'user@upi',
                transaction_ref,
                timestamp: new Date().toISOString(),
            };

            const rawBody = JSON.stringify(payload);
            const signature = require('crypto')
                .createHmac('sha256', process.env.BANK_WEBHOOK_SECRET || 'dev-webhook-secret')
                .update(rawBody)
                .digest('hex');

            const result = await PaymentService.handleBankWebhook(rawBody, signature, '127.0.0.1');

            res.json({ status: 'simulated', result: result.status, payload });
        } catch (error) {
            logger.error('Webhook simulation error', { error: error.message });
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    });
}

module.exports = router;
