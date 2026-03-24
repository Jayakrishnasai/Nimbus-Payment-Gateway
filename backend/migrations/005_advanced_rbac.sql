-- ============================================
-- 005_advanced_rbac.sql
-- Production-Ready RBAC & Multi-Tenancy
-- ============================================

-- 1. Create TENANTS table for multi-tenant support
CREATE TABLE IF NOT EXISTS tenants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    domain      VARCHAR(255) UNIQUE,
    settings    JSONB DEFAULT '{}'::jsonb,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add tenant_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- 2. Create ROLES table
CREATE TABLE IF NOT EXISTS roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    hierarchy_level INTEGER NOT NULL DEFAULT 0, -- Higher = more powerful
    is_system       BOOLEAN DEFAULT FALSE,     -- System roles cannot be deleted
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create PERMISSIONS table (Granular Actions)
CREATE TABLE IF NOT EXISTS permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'product:create'
    description     TEXT,
    resource        VARCHAR(50), -- e.g., 'product'
    action          VARCHAR(50), -- e.g., 'create'
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Junction Table: ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id         UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. Junction Table: USER_ROLES (Many-to-Many support)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Indexes for performance
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- 6. Initial Seed Data (Production Defaults)
INSERT INTO roles (name, description, hierarchy_level, is_system) VALUES
('SUPER_ADMIN', 'Full system access across all tenants', 100, TRUE),
('ADMIN', 'Full access within a tenant', 90, TRUE),
('VENDOR', 'Merchant access to managed products/orders', 70, TRUE),
('CUSTOMER', 'End-user access to shop/view orders', 10, TRUE),
('SUPPORT_AGENT', 'Customer support access', 50, TRUE),
('DELIVERY_AGENT', 'Order fulfillment access', 40, TRUE),
('INVENTORY_MANAGER', 'Product and stock management', 60, TRUE),
('FINANCE_MANAGER', 'Payment and refund management', 80, TRUE),
('MARKETING_MANAGER', 'Coupon and campaign management', 50, TRUE),
('MODERATOR', 'Content and review moderation', 50, TRUE),
('ANALYST', 'Read-only access to system metrics', 30, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Seed Basic Permissions
INSERT INTO permissions (name, resource, action) VALUES
('product:create', 'product', 'create'),
('product:update', 'product', 'update'),
('product:delete', 'product', 'delete'),
('product:approve', 'product', 'approve'),
('product:view_all', 'product', 'view_all'),
('order:create', 'order', 'create'),
('order:view_own', 'order', 'view_own'),
('order:view_all', 'order', 'view_all'),
('order:update_status', 'order', 'update_status'),
('order:cancel', 'order', 'cancel'),
('order:refund', 'order', 'refund'),
('payment:view', 'payment', 'view'),
('payment:refund', 'payment', 'refund'),
('payment:verify', 'payment', 'verify'),
('payout:release', 'payout', 'release'),
('user:create', 'user', 'create'),
('user:update', 'user', 'update'),
('user:delete', 'user', 'delete'),
('user:assign_role', 'user', 'assign_role'),
('user:impersonate', 'user', 'impersonate'),
('coupon:create', 'marketing', 'coupon_create'),
('coupon:apply', 'marketing', 'coupon_apply'),
('campaign:manage', 'marketing', 'campaign_manage'),
('analytics:view', 'analytics', 'view'),
('analytics:export', 'analytics', 'export'),
('fraud:flag_user', 'advanced', 'fraud_flag'),
('bulk:upload_products', 'advanced', 'bulk_upload'),
('config:update_system', 'advanced', 'system_config')
ON CONFLICT (name) DO NOTHING;

-- Map permissions to SUPER_ADMIN (everything)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Map permissions to ADMIN (All standard business permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'ADMIN' AND p.name IN (
    'product:create', 'product:update', 'product:delete', 'product:approve', 'product:view_all',
    'order:view_all', 'order:update_status', 'order:cancel', 'order:refund',
    'payment:view', 'payment:refund', 'payment:verify',
    'analytics:view', 'analytics:export',
    'user:create', 'user:update', 'user:delete', 'user:assign_role'
)
ON CONFLICT DO NOTHING;

-- Map permissions to VENDOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'VENDOR' AND p.name IN (
    'product:create', 'product:update', 'product:delete', 
    'order:view_own', 'order:update_status', 'order:cancel',
    'coupon:apply'
)
ON CONFLICT DO NOTHING;

-- Map permissions to CUSTOMER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'CUSTOMER' AND p.name IN (
    'order:create', 'order:view_own', 'order:cancel', 'coupon:apply'
)
ON CONFLICT DO NOTHING;

-- 7. Port existing users to the new user_roles junction table
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u
JOIN roles r ON UPPER(u.role) = r.name
ON CONFLICT DO NOTHING;
