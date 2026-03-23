# 🔧 NimbusCart — Complete Setup & Credentials Guide

> Step-by-step instructions to obtain **every variable and credential** required for each component of the project.

---

## 📋 Table of Contents

1. [Quick Start (Local Development)](#1-quick-start-local-development)
2. [PostgreSQL Database](#2-postgresql-database)
3. [Supabase (Hosted PostgreSQL)](#3-supabase-hosted-postgresql)
4. [Redis](#4-redis)
5. [Stripe Configuration](#5-stripe-configuration)
6. [JWT Authentication](#6-jwt-authentication)
7. [UPI & Webhooks](#7-upi--webhooks)
8. [Docker & Docker Compose](#8-docker--docker-compose)
9. [Azure Infrastructure (Terraform)](#9-azure-infrastructure-terraform)
10. [Azure DevOps CI/CD](#10-azure-devops-cicd)
11. [Complete .env Reference](#11-complete-env-reference)

---

## 1. Quick Start (Local Development)

The fastest way to run NimbusCart locally:

```bash
# 1. Clone the repo
git clone https://github.com/your-username/nimbuscart.git
cd nimbuscart

# 2. Copy environment template
cp .env.example .env

# 3. Start everything with Docker Compose
docker-compose up --build
```

---

## 2. PostgreSQL Database

### Option A: Docker (Automatic)

Docker Compose starts PostgreSQL 16 automatically.

### Option B: Supabase (Hosted)

1. Go to https://supabase.com → Create project.
2. Get your **DATABASE_URL** from Settings → Database → Connection string (URI).
3. Run `backend/migrations/` files in the SQL Editor.

---

## 5. Stripe Configuration

Stripe is the primary payment gateway for NimbusCart.

### Step-by-Step

1. **Create account**: https://stripe.com
2. **Get API Keys**: Go to Developers → API Keys.
   - Copy **Secret key** (sk_test_...) to `STRIPE_SECRET_KEY`.
3. **Setup Webhook**:
   - Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
   - Copy the **Webhook signing secret** (whsec_...) to `STRIPE_WEBHOOK_SECRET`.

---

## 6. JWT Authentication

Generate a secure 64-character secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 9. Azure Infrastructure (Terraform)

### Prerequisites
- Azure CLI installed and logged in (`az login`).
- Terraform installed.

### Deploy
```bash
cd terraform-azure
terraform init
terraform plan
terraform apply
```

Refer to `terraform-azure/variables.tf` for all available configuration options.

---

## 11. Complete .env Reference

```env
# SERVER
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# STRIPE
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# DATABASE
DATABASE_URL=...

# REDIS
REDIS_HOST=localhost
REDIS_PORT=6379

# AUTH
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# UPI (Optional Fallback)
UPI_MERCHANT_VPA=merchant@upi
UPI_MERCHANT_NAME=NimbusCart
```
