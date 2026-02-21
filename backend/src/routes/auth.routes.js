'use strict';

const { Router } = require('express');
const { z } = require('zod');
const AuthService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = Router();

// ── Validation Schemas ──
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// POST /api/auth/register
router.post('/register', validate({ body: registerSchema }), async (req, res, next) => {
    try {
        const result = await AuthService.register(req.body);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
    try {
        const result = await AuthService.login(req.body);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const profile = await AuthService.getProfile(req.user.id);
        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
