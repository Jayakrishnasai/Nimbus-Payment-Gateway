'use strict';

const { Router } = require('express');
const ProductService = require('../services/product.service');

const router = Router();

// GET /api/products
router.get('/', async (req, res, next) => {
    try {
        const { page, limit, category, search, sort, order, featured } = req.query;
        const result = await ProductService.list({
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 12,
            category, search, sort, order,
            featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
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
        res.json(product);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
