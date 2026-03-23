# 🗄️ Database Schema

NimbusCart uses a highly optimized PostgreSQL schema with 10+ core tables, featuring UUID PKs, full referential integrity, and soft-delete capabilities.

## Core Entity Relationship

```
┌──────────┐     ┌──────────────┐     ┌────────────┐
│  users   │────▶│   orders     │────▶│order_items  │
└──────────┘     └──────┬───────┘     └────────────┘
     │                  │
     │           ┌──────▼───────┐     ┌────────────────┐
     │           │  payments    │     │bank_transactions│
     │           └──────────────┘     └────────────────┘
     │
     ├──▶ cart_items ──▶ products ──▶ inventory
     │
     └──▶ audit_logs        payment_logs
```

## Table Reference

| Table | Description | Key Features |
|-------|-------------|--------------|
| `users` | User accounts | RBAC (Admin/Vendor/Customer), bcrypt |
| `products` | Product catalog | Three.js URL, slug, categories |
| `inventory` | Stock tracking | Quantity vs Reserved, low-stock alerts |
| `cart_items` | Shopping cart | Linked to Redis for performance |
| `orders` | Order lifecycle | Pending → Confirmed → Shipped |
| `order_items` | Order line items | Snapshot pricing at purchase time |
| `payments` | Payment records | Stripe session ID, UPI ref, status |
| `bank_transactions` | UPI reconciliation | UTR matching for manual payments |
| `payment_logs` | Payment audit trail | Event tracking (created, captured) |
| `audit_logs` | System-wide audit | Entity changes, IP tracking |
| `stripe_webhook_logs` | Stripe event tracking | Event ID, type, status, raw payload |
