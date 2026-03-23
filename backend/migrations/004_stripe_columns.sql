-- ============================================
-- Stripe Integration Columns & Webhook Logs
-- ============================================

-- 1. Add Stripe-specific columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- 2. Stripe Webhook Logs (idempotency & audit trail)
CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id     VARCHAR(255) NOT NULL UNIQUE,
    event_type          VARCHAR(100) NOT NULL,
    matched_order_id    UUID REFERENCES orders(id),
    status              VARCHAR(30) NOT NULL DEFAULT 'received',
    raw_payload         JSONB DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_stripe_log_status CHECK (
        status IN ('received', 'matched', 'unmatched', 'ignored', 'error')
    )
);

CREATE INDEX IF NOT EXISTS idx_stripe_log_event_id ON stripe_webhook_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_log_order ON stripe_webhook_logs(matched_order_id) WHERE matched_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_log_created ON stripe_webhook_logs(created_at);
