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
       RETURNING id, email, first_name, last_name, phone, created_at`,
            [email.toLowerCase(), passwordHash, firstName, lastName, phone || null]
        );

        const user = result.rows[0];

        // Assign default CUSTOMER role
        const roleResult = await query("SELECT id FROM roles WHERE name = 'CUSTOMER'");
        if (roleResult.rows.length > 0) {
            await query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [user.id, roleResult.rows[0].id]);
        }

        const authData = await AuthService.getAuthDetails(user.id);
        const token = AuthService.generateToken({ ...user, ...authData });

        logger.info('User registered', { userId: user.id, email: user.email });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                roles: authData.roles,
                permissions: authData.permissions,
                tenantId: authData.tenantId
            },
            token,
        };
    }

    /**
     * Login a user.
     */
    static async login({ email, password }) {
        const result = await query(
            `SELECT id, email, password_hash, first_name, last_name, is_active, tenant_id
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

        const authData = await AuthService.getAuthDetails(user.id);
        const token = AuthService.generateToken({ ...user, ...authData });

        logger.info('User logged in', { userId: user.id });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                roles: authData.roles,
                permissions: authData.permissions,
                tenantId: authData.tenantId
            },
            token,
        };
    }

    /**
     * Get user profile.
     */
    static async getProfile(userId) {
        const result = await query(
            `SELECT id, email, first_name, last_name, phone, avatar_url, tenant_id, created_at
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
            [userId]
        );

        if (result.rows.length === 0) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const u = result.rows[0];
        const authData = await AuthService.getAuthDetails(userId);

        return {
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            phone: u.phone,
            roles: authData.roles,
            permissions: authData.permissions,
            tenantId: u.tenant_id,
            avatarUrl: u.avatar_url,
            createdAt: u.created_at,
        };
    }

    /**
     * Helper to fetch consolidated roles and permissions.
     */
    static async getAuthDetails(userId) {
        const rolesRes = await query(
            `SELECT r.name FROM roles r 
             JOIN user_roles ur ON r.id = ur.role_id 
             WHERE ur.user_id = $1`,
            [userId]
        );

        const permsRes = await query(
            `SELECT DISTINCT p.name FROM permissions p
             JOIN role_permissions rp ON p.id = rp.permission_id
             JOIN user_roles ur ON rp.role_id = ur.role_id
             WHERE ur.user_id = $1`,
            [userId]
        );

        const userRes = await query('SELECT tenant_id, role FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];

        let roles = rolesRes.rows.map(r => r.name);
        let permissions = permsRes.rows.map(p => p.name);

        // Fallback for legacy users who haven't been migrated to user_roles table yet
        if (roles.length === 0 && user?.role) {
            const legacyRole = user.role.toUpperCase();
            roles = [legacyRole];
            
            // Basic hardcoded mapping for the 4 core legacy roles during transition
            if (legacyRole === 'ADMIN') permissions = ['product:create', 'product:update', 'product:delete', 'order:view_all', 'analytics:view'];
            else if (legacyRole === 'VENDOR') permissions = ['product:create', 'product:update', 'product:delete', 'order:view_own'];
            else if (legacyRole === 'CUSTOMER') permissions = ['order:view_own', 'order:create'];
        }

        return {
            roles,
            permissions,
            tenantId: user?.tenant_id
        };
    }

    /**
     * Generate JWT token.
     */
    static generateToken(user) {
        return jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                roles: user.roles, 
                permissions: user.permissions,
                tenantId: user.tenantId 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
    }
}

module.exports = AuthService;
