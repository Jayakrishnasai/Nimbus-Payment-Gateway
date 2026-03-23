-- ============================================
-- RBAC & Vendor Ownership Updates
-- ============================================

-- 1. Update USERS table
-- Add is_verified for VENDORS
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add check constraint for roles (optional but recommended)
-- Note: In PostgreSQL, we can't easily add a check constraint to an existing column without a full scan, 
-- but for a dev/production-grade system, it's essential for data integrity.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_role') THEN
        ALTER TABLE users ADD CONSTRAINT chk_user_role CHECK (role IN ('admin', 'vendor', 'customer'));
    END IF;
END $$;

-- 2. Update PRODUCTS table
-- Add vendor_id to track ownership
ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for vendor_id lookups
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);

-- 3. Row-Level Security (RLS)
-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: ADMIN can see/do everything
CREATE POLICY admin_all_products ON products
    FOR ALL
    TO PUBLIC
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = (current_setting('app.current_user_id', true)::UUID) AND users.role = 'admin'));

-- Policy: VENDORS can manage their own products
CREATE POLICY vendor_manage_own_products ON products
    FOR ALL
    TO PUBLIC
    USING (vendor_id = (current_setting('app.current_user_id', true)::UUID))
    WITH CHECK (vendor_id = (current_setting('app.current_user_id', true)::UUID));

-- Policy: EVERYONE (including CUSTOMERS) can see active products
CREATE POLICY public_view_products ON products
    FOR SELECT
    TO PUBLIC
    USING (is_active = TRUE);

-- 4. Audit Logs Enhancement
-- Ensure audit_logs is active for RBAC actions
-- (Table already exists from 001_initial_schema.sql)
