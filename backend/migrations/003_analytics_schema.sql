-- ============================================
-- Analytics & Metrics Schema
-- ============================================

-- 1. Events Table (For Business Analytics)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- e.g., 'PRODUCT_VIEW', 'CART_ADD', 'ORDER_PLACE'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    entity_id UUID, -- e.g., product_id or order_id
    entity_type VARCHAR(50), -- e.g., 'product', 'order'
    metadata JSONB, -- Contextual data (price, category, etc.)
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id, entity_type);

-- 2. System Metrics Table (For Performance Monitoring)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_path ON system_metrics(path);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON system_metrics(created_at);

-- 3. Audit Logs Enhancement (Ensure standard structure)
-- (Table already exists, but we ensure it supports metadata)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='metadata') THEN
        ALTER TABLE audit_logs ADD COLUMN metadata JSONB;
    END IF;
END $$;
