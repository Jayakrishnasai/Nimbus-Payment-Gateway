'use strict';

const { Router } = require('express');
const { z } = require('zod');
const CartService = require('../services/cart.service');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = Router();
router.use(authenticate);

const addItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).default(1),
});

const updateItemSchema = z.object({
    quantity: z.number().int().min(0),
});

// GET /api/cart
router.get('/', async (req, res, next) => {
    try {
        const cart = await CartService.getCart(req.user.id);
        res.json(cart);
    } catch (error) {
        next(error);
    }
});

// POST /api/cart/items
router.post('/items', validate({ body: addItemSchema }), async (req, res, next) => {
    try {
        const cart = await CartService.addItem(req.user.id, req.body.productId, req.body.quantity);
        res.status(201).json(cart);
    } catch (error) {
        next(error);
    }
});

// PUT /api/cart/items/:productId
router.put('/items/:productId', validate({ body: updateItemSchema }), async (req, res, next) => {
    try {
        const cart = await CartService.updateItem(req.user.id, req.params.productId, req.body.quantity);
        res.json(cart);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', async (req, res, next) => {
    try {
        const cart = await CartService.removeItem(req.user.id, req.params.productId);
        res.json(cart);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/cart
router.delete('/', async (req, res, next) => {
    try {
        const cart = await CartService.clearCart(req.user.id);
        res.json(cart);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
