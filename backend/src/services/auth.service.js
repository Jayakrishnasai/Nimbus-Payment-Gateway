'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

class AuthService {
    /**
     * Register a new user.
     */
    static async register({ email, password, firstName, lastName, phone }) {
        // Check if user exists
        const existing = await query(
            'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
            [email.toLowerCase()]
        );

        if (existing.rows.length > 0) {
            const error = new Error('Email already registered');
            error.statusCode = 409;
            throw error;
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, phone, role, created_at`,
            [email.toLowerCase(), passwordHash, firstName, lastName, phone || null]
        );

        const user = result.rows[0];
        const token = AuthService.generateToken(user);

        logger.info('User registered', { userId: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
            },
            token,
        };
    }

    /**
     * Login a user.
     */
    static async login({ email, password }) {
        const result = await query(
            `SELECT id, email, password_hash, first_name, last_name, role, is_active
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const user = result.rows[0];

        if (!user.is_active) {
            const error = new Error('Account is deactivated');
            error.statusCode = 403;
            throw error;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        // Update last login
        await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        const token = AuthService.generateToken(user);

        logger.info('User logged in', { userId: user.id });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
            },
            token,
        };
    }

    /**
     * Get user profile.
     */
    static async getProfile(userId) {
        const result = await query(
            `SELECT id, email, first_name, last_name, phone, role, avatar_url, created_at
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
            [userId]
        );

        if (result.rows.length === 0) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const u = result.rows[0];
        return {
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            phone: u.phone,
            role: u.role,
            avatarUrl: u.avatar_url,
            createdAt: u.created_at,
        };
    }

    /**
     * Generate JWT token.
     */
    static generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }
}

module.exports = AuthService;
