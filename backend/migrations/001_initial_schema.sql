-- ============================================
-- NimbusCart — Production Database Schema
-- PostgreSQL 16+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- USERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20)  NOT NULL DEFAULT 'customer',
    avatar_url      TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PRODUCTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)   NOT NULL,
    slug            VARCHAR(255)   NOT NULL,
    description     TEXT,
    short_desc      VARCHAR(500),
    price           NUMERIC(12,2)  NOT NULL CHECK (price >= 0),
    compare_price   NUMERIC(12,2)  CHECK (compare_price >= 0),
    category        VARCHAR(100),
    brand           VARCHAR(100),
    sku             VARCHAR(100),
    image_url       TEXT,
    images          JSONB          DEFAULT '[]'::jsonb,
    model_3d_url    TEXT,
    tags            TEXT[],
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    featured        BOOLEAN        NOT NULL DEFAULT FALSE,
    weight          NUMERIC(8,2),
    dimensions      JSONB,
    meta            JSONB          DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_products_slug ON products(slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL AND sku IS NOT NULL;
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX idx_products_created_at ON products(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INVENTORY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE inventory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity         INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved        INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    warehouse       VARCHAR(100) DEFAULT 'primary',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_inventory_product_warehouse ON inventory(product_id, warehouse);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= 10;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CART ITEMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE cart_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_cart_user_product ON cart_items(user_id, product_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ORDERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    order_number    VARCHAR(50)   NOT NULL,
    status          VARCHAR(30)   NOT NULL DEFAULT 'pending',
    subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax             NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_cost   NUMERIC(12,2) NOT NULL DEFAULT 0,
    total           NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3)    NOT NULL DEFAULT 'INR',
    shipping_address JSONB,
    billing_address  JSONB,
    notes           TEXT,
    upi_transaction_ref VARCHAR(100),
    idempotency_key VARCHAR(100),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT chk_order_status CHECK (
        status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
    )
);

CREATE UNIQUE INDEX idx_orders_number ON orders(order_number);
CREATE UNIQUE INDEX idx_orders_idempotency ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_upi_ref ON orders(upi_transaction_ref) WHERE upi_transaction_ref IS NOT NULL;
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ORDER ITEMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    product_name    VARCHAR(255)   NOT NULL,
    product_image   TEXT,
    quantity        INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2)  NOT NULL,
    total_price     NUMERIC(12,2)  NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PAYMENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID NOT NULL REFERENCES orders(id),
    user_id                 UUID NOT NULL REFERENCES users(id),
    upi_transaction_ref     VARCHAR(100),
    utr_number              VARCHAR(100),
    upi_deep_link           TEXT,
    amount                  NUMERIC(12,2) NOT NULL,
    currency                VARCHAR(3)    NOT NULL DEFAULT 'INR',
    method                  VARCHAR(30)   DEFAULT 'upi',
    status                  VARCHAR(30)   NOT NULL DEFAULT 'pending',
    reconciliation_status   VARCHAR(30)   DEFAULT NULL,
    qr_code_url             TEXT,
    idempotency_key         VARCHAR(100),
    attempts                INTEGER       NOT NULL DEFAULT 0,
    error_code              VARCHAR(100),
    error_description       TEXT,
    paid_at                 TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_payment_status CHECK (
        status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'expired')
    ),
    CONSTRAINT chk_reconciliation_status CHECK (
        reconciliation_status IS NULL OR reconciliation_status IN ('awaiting', 'matched', 'unmatched', 'rejected')
    )
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_upi_ref ON payments(upi_transaction_ref) WHERE upi_transaction_ref IS NOT NULL;
CREATE INDEX idx_payments_utr ON payments(utr_number) WHERE utr_number IS NOT NULL;
CREATE UNIQUE INDEX idx_payments_idempotency ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PAYMENT LOGS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE payment_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id      UUID REFERENCES payments(id),
    order_id        UUID REFERENCES orders(id),
    event_type      VARCHAR(100)  NOT NULL,
    payload         JSONB         NOT NULL DEFAULT '{}'::jsonb,
    source          VARCHAR(50)   NOT NULL DEFAULT 'system',
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_payment ON payment_logs(payment_id);
CREATE INDEX idx_payment_logs_order ON payment_logs(order_id);
CREATE INDEX idx_payment_logs_event ON payment_logs(event_type);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- BANK TRANSACTIONS (UPI reconciliation)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE bank_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utr                 VARCHAR(100) NOT NULL UNIQUE,
    amount              NUMERIC(12,2) NOT NULL,
    sender_vpa          VARCHAR(255),
    transaction_ref     VARCHAR(100),
    matched_order_id    UUID REFERENCES orders(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'unmatched',
    raw_payload         JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_bank_txn_status CHECK (
        status IN ('matched', 'unmatched', 'amount_mismatch', 'late_payment', 'duplicate')
    )
);

CREATE INDEX idx_bank_txn_utr ON bank_transactions(utr);
CREATE INDEX idx_bank_txn_ref ON bank_transactions(transaction_ref);
CREATE INDEX idx_bank_txn_order ON bank_transactions(matched_order_id) WHERE matched_order_id IS NOT NULL;
CREATE INDEX idx_bank_txn_status ON bank_transactions(status);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- AUDIT LOGS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(100)  NOT NULL,
    entity_type     VARCHAR(50)   NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- UPDATED_AT TRIGGER FUNCTION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SEED DATA (Development Only)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO products (name, slug, description, short_desc, price, compare_price, category, brand, sku, image_url, model_3d_url, featured, tags)
VALUES
    ('Wireless Noise-Cancelling Headphones', 'wireless-nc-headphones',
     'Premium over-ear headphones with active noise cancellation, 40-hour battery life, and Hi-Res Audio support.',
     'ANC headphones with 40hr battery', 12999.00, 17999.00, 'Electronics', 'SoundWave', 'SW-WH-001',
     'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
     NULL, TRUE, ARRAY['headphones', 'wireless', 'anc', 'premium']),

    ('Smart Fitness Watch Pro', 'smart-fitness-watch-pro',
     'Advanced fitness tracker with AMOLED display, GPS, heart rate monitor, SpO2, and 14-day battery.',
     'Pro fitness watch with GPS & SpO2', 8999.00, 12999.00, 'Wearables', 'FitTech', 'FT-SW-002',
     'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
     NULL, TRUE, ARRAY['watch', 'fitness', 'smart', 'gps']),

    ('Ultra-Slim Laptop Stand', 'ultra-slim-laptop-stand',
     'Ergonomic aluminum laptop stand with adjustable height, foldable design, compatible with 10-17 inch laptops.',
     'Foldable aluminum laptop stand', 2499.00, 3999.00, 'Accessories', 'DeskPro', 'DP-LS-003',
     'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
     NULL, FALSE, ARRAY['stand', 'laptop', 'ergonomic', 'aluminum']),

    ('Mechanical Gaming Keyboard', 'mechanical-gaming-keyboard',
     'RGB backlit mechanical keyboard with Cherry MX switches, macro keys, and aircraft-grade aluminum body.',
     'Cherry MX mechanical keyboard', 6999.00, 9999.00, 'Gaming', 'KeyForce', 'KF-KB-004',
     'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
     NULL, TRUE, ARRAY['keyboard', 'mechanical', 'gaming', 'rgb']),

    ('Portable Bluetooth Speaker', 'portable-bluetooth-speaker',
     'Waterproof Bluetooth 5.3 speaker with 360° sound, 24-hour playtime, and built-in power bank.',
     'Waterproof speaker with 24hr battery', 4999.00, 6999.00, 'Electronics', 'SoundWave', 'SW-BS-005',
     'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
     NULL, FALSE, ARRAY['speaker', 'bluetooth', 'waterproof', 'portable']),

    ('USB-C Hub 9-in-1', 'usb-c-hub-9in1',
     'Premium USB-C hub with HDMI 4K, 3x USB 3.0, SD/TF reader, PD 100W charging, Ethernet.',
     '9-in-1 USB-C hub with 4K HDMI', 3499.00, 4999.00, 'Accessories', 'TechLink', 'TL-HB-006',
     'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600',
     NULL, FALSE, ARRAY['hub', 'usb-c', 'hdmi', 'adapter']);

-- Seed inventory
INSERT INTO inventory (product_id, quantity, low_stock_threshold) 
SELECT id, 100, 10 FROM products;
