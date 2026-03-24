-- ============================================
-- 006 — Finalize Database Constraints
-- ============================================

-- Ensure products have unique names to simplify idempotent seeding and search
-- Note: If you want to allow duplicate names for DIFFERENT vendors, 
-- you should skip this or use (name, vendor_id).
-- For this platform, we assume unique product names for the global catalog.
ALTER TABLE products ADD CONSTRAINT unique_product_name UNIQUE (name);

-- Ensure inventory is strictly linked per product/warehouse
-- (This already exists as an index, but making it a formal constraint helps arbiter inference)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_inventory_product_warehouse') THEN
        ALTER TABLE inventory ADD CONSTRAINT unique_inventory_product_warehouse UNIQUE (product_id, warehouse);
    END IF;
END $$;

-- Verify/Cleanup any dangling products without slugs
UPDATE products SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;
ALTER TABLE products ALTER COLUMN slug SET NOT NULL;
