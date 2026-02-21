-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NimbusCart — Production Database Schema
-- Native UPI QR Payments (No Razorpay)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    role        VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ── Products ──
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    price           DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    compare_price   DECIMAL(12,2) CHECK (compare_price >= 0),
    image_url       TEXT,
    category        VARCHAR(100),
    featured        BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_created_at ON products(created_at);

-- ── Inventory ──
CREATE TABLE inventory (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    reserved    INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (product_id)
);

-- ── Cart Items ──
CREATE TABLE cart_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ── Orders ──
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number        VARCHAR(20) NOT NULL UNIQUE,
    user_id             UUID NOT NULL REFERENCES users(id),
    status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
    subtotal            DECIMAL(12,2) NOT NULL,
    tax                 DECIMAL(12,2) DEFAULT 0,
    shipping            DECIMAL(12,2) DEFAULT 0,
    total               DECIMAL(12,2) NOT NULL,
    shipping_address    JSONB,
    billing_address     JSONB,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ── Order Items ──
CREATE TABLE order_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id),
    name        VARCHAR(255) NOT NULL,
    price       DECIMAL(12,2) NOT NULL,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    subtotal    DECIMAL(12,2) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ── Payments (Native UPI QR) ──
CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id                UUID NOT NULL REFERENCES orders(id),
    user_id                 UUID REFERENCES users(id),
    upi_transaction_ref     VARCHAR(100),
    utr_number              VARCHAR(100),
    upi_deep_link           TEXT,
    amount                  DECIMAL(12,2) NOT NULL,
    currency                VARCHAR(3) DEFAULT 'INR',
    method                  VARCHAR(50) DEFAULT 'upi',
    status                  VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','captured','failed','expired','refunded')),
    reconciliation_status   VARCHAR(30) DEFAULT NULL
                            CHECK (reconciliation_status IS NULL OR reconciliation_status IN ('awaiting','matched','unmatched','rejected')),
    qr_code_url             TEXT,
    idempotency_key         VARCHAR(255) UNIQUE,
    error_code              VARCHAR(100),
    error_description       TEXT,
    paid_at                 TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_upi_ref ON payments(upi_transaction_ref);
CREATE INDEX idx_payments_utr ON payments(utr_number);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_idempotency ON payments(idempotency_key);

-- ── Bank Transactions (UPI reconciliation) ──
CREATE TABLE bank_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utr                 VARCHAR(100) NOT NULL UNIQUE,
    amount              DECIMAL(12,2) NOT NULL,
    sender_vpa          VARCHAR(255),
    transaction_ref     VARCHAR(100),
    matched_order_id    UUID REFERENCES orders(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'unmatched'
                        CHECK (status IN ('matched','unmatched','amount_mismatch','late_payment','duplicate')),
    raw_payload         JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_txn_utr ON bank_transactions(utr);
CREATE INDEX idx_bank_txn_ref ON bank_transactions(transaction_ref);
CREATE INDEX idx_bank_txn_order ON bank_transactions(matched_order_id);
CREATE INDEX idx_bank_txn_status ON bank_transactions(status);

-- ── Payment Logs ──
CREATE TABLE payment_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id  UUID REFERENCES payments(id),
    order_id    UUID REFERENCES orders(id),
    event_type  VARCHAR(100) NOT NULL,
    payload     JSONB,
    source      VARCHAR(50) DEFAULT 'system',
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_payment ON payment_logs(payment_id);
CREATE INDEX idx_payment_logs_order ON payment_logs(order_id);
CREATE INDEX idx_payment_logs_event ON payment_logs(event_type);

-- ── Audit Logs ──
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity      VARCHAR(50),
    entity_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

-- ── Updated_at trigger function ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated   BEFORE UPDATE ON products    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_updated  BEFORE UPDATE ON inventory   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart_updated       BEFORE UPDATE ON cart_items  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated     BEFORE UPDATE ON orders      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated   BEFORE UPDATE ON payments    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed: sample products ──
INSERT INTO products (name, slug, description, price, compare_price, image_url, category, featured) VALUES
    ('Wireless Noise-Cancelling Headphones', 'wireless-nc-headphones', 'Premium ANC headphones with 40hr battery life and Hi-Res Audio support.', 12999.00, 18999.00, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 'Electronics', true),
    ('Smart Fitness Watch Pro', 'smart-fitness-watch-pro', 'Advanced health monitoring with GPS, SpO2, and 14-day battery.', 8999.00, 14999.00, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'Electronics', true),
    ('Mechanical Gaming Keyboard', 'mechanical-gaming-keyboard', 'RGB backlit mechanical keyboard with Cherry MX switches.', 6499.00, 9999.00, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600', 'Electronics', true),
    ('Ultra-Slim Laptop Stand', 'ultra-slim-laptop-stand', 'Ergonomic aluminum stand with adjustable height and angle.', 2499.00, 3999.00, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600', 'Accessories', false),
    ('Premium Leather Wallet', 'premium-leather-wallet', 'Handcrafted genuine leather wallet with RFID protection.', 1999.00, 3499.00, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600', 'Accessories', false),
    ('Portable Bluetooth Speaker', 'portable-bluetooth-speaker', 'Waterproof 360° speaker with 24hr playback and deep bass.', 4999.00, 7999.00, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600', 'Electronics', false);

-- Seed inventory
INSERT INTO inventory (product_id, stock)
    SELECT id, 100 FROM products;
