'use strict';

const { Router } = require('express');
const ProductService = require('../services/product.service');
const { authenticate } = require('../middleware/auth');
const { authorize, checkOwnership } = require('../middleware/roles.middleware');
const { trackEvent } = require('../middleware/metrics.middleware');

const router = Router();

// GET /api/products
router.get('/', async (req, res, next) => {
    try {
        const { page, limit, category, search, sort, order, featured, vendorId } = req.query;
        const result = await ProductService.list({
            page: Number.parseInt(page, 10) || 1,
            limit: Number.parseInt(limit, 10) || 12,
            category, search, sort, order,
            featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
            vendorId
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/products/categories
router.get('/categories', async (req, res, next) => {
    try {
        const categories = await ProductService.getCategories();
        res.json(categories);
    } catch (error) {
        next(error);
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
    try {
        const product = await ProductService.getById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // track event (async, don't await to avoid slowing response)
        trackEvent({
            eventType: 'PRODUCT_VIEW',
            entityId: product.id,
            entityType: 'product',
            metadata: { category: product.category, price: product.price },
            req
        });

        res.json(product);
    } catch (error) {
        next(error);
    }
});

// POST /api/products (Admin & Vendor only)
router.post('/', authenticate, authorize(['admin', 'vendor']), async (req, res, next) => {
    try {
        const productData = {
            ...req.body,
            vendor_id: req.user.role === 'admin' ? (req.body.vendor_id || req.user.id) : req.user.id
        };
        const product = await ProductService.create(productData);
        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
});

// PUT /api/products/:id (Admin & Owner)
router.put('/:id', 
    authenticate, 
    authorize(['admin', 'vendor']), 
    checkOwnership((id) => ProductService.getById(id), (req) => req.params.id),
    async (req, res, next) => {
        try {
            const product = await ProductService.update(req.params.id, req.body);
            res.json(product);
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/products/:id (Admin & Owner)
router.delete('/:id', 
    authenticate, 
    authorize(['admin', 'vendor']), 
    checkOwnership((id) => ProductService.getById(id), (req) => req.params.id),
    async (req, res, next) => {
        try {
            await ProductService.delete(req.params.id);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
