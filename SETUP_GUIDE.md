# 🔧 NimbusCart — Complete Setup & Credentials Guide

> Step-by-step instructions to obtain **every variable and credential** required for each component of the project.

---

## 📋 Table of Contents

1. [Quick Start (Local Development)](#1-quick-start-local-development)
2. [PostgreSQL Database](#2-postgresql-database)
3. [Supabase (Hosted PostgreSQL)](#3-supabase-hosted-postgresql)
4. [Redis](#4-redis)
5. [JWT Authentication](#5-jwt-authentication)
6. [UPI Payment Configuration](#6-upi-payment-configuration)
7. [Bank Webhook](#7-bank-webhook)
8. [Docker & Docker Compose](#8-docker--docker-compose)
9. [AWS Infrastructure (Terraform)](#9-aws-infrastructure-terraform)
10. [Azure Infrastructure (Terraform)](#10-azure-infrastructure-terraform)
11. [GitHub Actions CI/CD (AWS)](#11-github-actions-cicd-aws)
12. [Azure DevOps CI/CD](#12-azure-devops-cicd)
13. [Complete .env Reference](#13-complete-env-reference)

---

## 1. Quick Start (Local Development)

The fastest way to run NimbusCart locally with **zero external accounts**:

```bash
# 1. Clone the repo
git clone https://github.com/Jayakrishnasai/Nimbus-Payment-Gateway.git
cd Nimbus-Payment-Gateway

# 2. Copy environment template
cp .env.example .env

# 3. Start everything with Docker Compose (PostgreSQL + Redis + Backend + Frontend)
docker-compose up --build
```

**That's it!** Docker Compose provides PostgreSQL and Redis automatically. Default credentials are pre-configured.

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:8080         |
| Backend   | http://localhost:3000         |
| Health    | http://localhost:3000/health  |

> Skip sections 2–8 if you only need local development. Proceed to get real credentials for production.

---

## 2. PostgreSQL Database

### Option A: Docker (Automatic — No Setup Needed)

Docker Compose starts PostgreSQL 16 automatically. Default values:

| Variable       | Value             |
|---------------|-------------------|
| `DB_HOST`     | `postgres` (in Docker) / `localhost` (outside Docker) |
| `DB_PORT`     | `5432`            |
| `DB_NAME`     | `nimbuscart`      |
| `DB_USER`     | `nimbuscart_user` |
| `DB_PASSWORD` | `nimbuscart_pass` |
| `DB_SSL`      | `false`           |

### Option B: Install PostgreSQL Locally

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer → set password for `postgres` user → finish
3. Open **pgAdmin 4** or **psql** terminal

**Create database and user:**
```sql
-- Open psql as postgres user
psql -U postgres

-- Create user and database
CREATE USER nimbuscart_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE nimbuscart OWNER nimbuscart_user;
GRANT ALL PRIVILEGES ON DATABASE nimbuscart TO nimbuscart_user;

-- Connect to the database and enable UUID extension
\c nimbuscart
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run the schema
\i backend/migrations/001_initial_schema.sql
```

**Your `.env` values:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nimbuscart
DB_USER=nimbuscart_user
DB_PASSWORD=your_secure_password_here
DB_SSL=false
```

---

## 3. Supabase (Hosted PostgreSQL)

Supabase gives you a **free hosted PostgreSQL database** with built-in auth, SSL, and connection pooling.

### Step-by-Step

1. **Create account**: Go to https://supabase.com → **Start your project** → Sign up with GitHub

2. **Create new project**:
   - Click **New Project**
   - Organization: Select or create one
   - Project name: `NimbusCart`
   - Database password: **Generate a strong password** → ⚠️ **COPY AND SAVE THIS PASSWORD** (you won't see it again)
   - Region: Choose closest to your users (e.g., `South Asia (Mumbai)`)
   - Click **Create new project** → Wait ~2 minutes

3. **Get your DATABASE_URL**:
   - Go to **Project Settings** (gear icon, bottom-left)
   - Click **Database** in the sidebar
   - Scroll to **Connection string** section
   - Select **URI** tab
   - Copy the connection string

   It looks like:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

4. **Replace `[YOUR-PASSWORD]`** with the database password you saved in step 2

5. **Run the schema**:
   - Go to **SQL Editor** in the Supabase dashboard
   - Click **New query**
   - Copy the contents of `backend/migrations/001_initial_schema.sql`
   - Paste and click **Run**

### Your `.env` value:
```env
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:YourPassword123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

> When `DATABASE_URL` is set, all individual `DB_*` variables are ignored.

---

## 4. Redis

### Option A: Docker (Automatic — No Setup Needed)

Docker Compose starts Redis 7 automatically:

| Variable         | Value       |
|-----------------|-------------|
| `REDIS_HOST`    | `redis` (in Docker) / `localhost` (outside Docker) |
| `REDIS_PORT`    | `6379`      |
| `REDIS_PASSWORD`| *(empty)*   |
| `REDIS_TLS`     | `false`     |

### Option B: Install Redis Locally

**Windows (using WSL2 or Memurai):**

```bash
# WSL2 (recommended)
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli ping  # Should return: PONG
```

**Or use Memurai** (native Windows Redis): https://www.memurai.com/get-memurai

### Option C: Redis Cloud (Free Tier)

1. Go to https://redis.io/try-free/ → Sign up
2. Create a **free database** (30MB, region closest to you)
3. Note down:
   - **Public endpoint**: `redis-12345.c1.region.cloud.redislabs.com:12345`
   - **Password**: shown in the dashboard

```env
REDIS_HOST=redis-12345.c1.region.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your_redis_cloud_password
REDIS_TLS=true
```

---

## 5. JWT Authentication

JWT Secret is used to sign and verify user authentication tokens.

### How to Generate

**Option A: Online (quick)**
```bash
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }) -as [byte[]])
```

**Option B: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option C: Use a strong passphrase**
```
NimbusCart_JWT_Pr0d_$ecret_2024!Sup3rS3cure
```

### Your `.env` values:
```env
JWT_SECRET=paste_your_generated_secret_here
JWT_EXPIRES_IN=7d
```

> ⚠️ **Minimum 16 characters.** The app will refuse to start if JWT_SECRET is shorter.

---

## 6. UPI Payment Configuration

### What You Need

NimbusCart uses **native UPI QR codes** (no Razorpay/Stripe). You need a UPI Virtual Payment Address (VPA).

### How to Get Your UPI VPA

Your VPA is your UPI ID — available in any UPI app:

| UPI App     | How to find VPA                                     |
|-------------|-----------------------------------------------------|
| **Google Pay** | Profile → UPI ID (e.g., `yourname@okaxis`)      |
| **PhonePe**    | Profile → UPI IDs (e.g., `yourname@ybl`)        |
| **Paytm**      | Profile → UPI ID (e.g., `yourname@paytm`)       |
| **BHIM**       | Profile → UPI Address (e.g., `yourname@upi`)    |

### For Business (Production)

1. **Register as a merchant** with your bank
2. Get a business VPA like `nimbuscart@icici` or `nimbuscart@ybl`
3. Some banks offer merchant dashboards with webhook integration

### Your `.env` values:
```env
UPI_MERCHANT_VPA=yourname@okaxis        # Your UPI ID
UPI_MERCHANT_NAME=NimbusCart             # Name shown on payment screen
PAYMENT_TIMEOUT_SECONDS=300             # 5 minutes to complete payment
```

> For development/testing, use your personal UPI ID. For production, use a business merchant VPA.

---

## 7. Bank Webhook

The bank webhook secret is used to verify that incoming payment notifications are legitimate.

### Development (Testing)

In development mode, the `/api/webhooks/simulate` endpoint is available to test payments without a real bank. Use any secret:

```env
BANK_WEBHOOK_SECRET=dev-webhook-secret
BANK_WEBHOOK_ALLOWED_IPS=
```

### Production

1. **Contact your bank** to register for UPI webhook/callback notifications
2. Your bank will provide:
   - A **webhook secret** for HMAC-SHA256 signature verification
   - A list of **IP addresses** that will send webhook calls

```env
BANK_WEBHOOK_SECRET=your_bank_provided_hmac_secret
BANK_WEBHOOK_ALLOWED_IPS=13.234.56.78,13.234.56.79
```

---

## 8. Docker & Docker Compose

### Prerequisites

1. **Install Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. Enable **WSL 2** backend (Windows) during installation
3. After install → open Docker Desktop → wait for it to start

### Verify Installation
```bash
docker --version          # Docker version 24.x
docker-compose --version  # Docker Compose version v2.x
```

### Run the Full Stack
```bash
docker-compose up --build
```

### No credentials needed — Docker Compose uses these defaults:

| Variable            | Docker Value                |
|--------------------|-----------------------------|
| PostgreSQL User    | `nimbuscart_user`           |
| PostgreSQL Pass    | `nimbuscart_pass`           |
| PostgreSQL DB      | `nimbuscart`                |
| Redis              | No password (local only)    |
| JWT Secret         | `dev_jwt_secret_change_in_production_32chars` |
| UPI VPA            | `merchant@upi`              |
| Webhook Secret     | `dev-webhook-secret`        |

---

## 9. AWS Infrastructure (Terraform)

### Prerequisites

1. **AWS Account**: https://aws.amazon.com/free/ → **Create a Free Tier Account**
2. **Install AWS CLI**:
   ```bash
   winget install Amazon.AWSCLI
   ```
3. **Install Terraform**:
   ```bash
   winget install Hashicorp.Terraform
   ```

### Step 1: Create IAM User

1. Go to **AWS Console** → **IAM** → **Users** → **Create user**
2. User name: `nimbuscart-terraform`
3. Select **Attach policies directly** → Search and add:
   - `AmazonEKSClusterPolicy`
   - `AmazonEKS_CNI_Policy`
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `ElastiCacheFullAccess`
   - `AmazonVPCFullAccess`
   - `IAMFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonECR_FullAccess` (or `AmazonEC2ContainerRegistryFullAccess`)
4. Click **Create user**
5. Go to user → **Security credentials** → **Create access key**
   - Select **CLI** → Create → **Download .csv**

### Step 2: Configure AWS CLI
```bash
aws configure
```
Enter:
| Prompt              | Value                              |
|--------------------|------------------------------------|
| AWS Access Key ID  | *(from downloaded CSV)*            |
| AWS Secret Access Key | *(from downloaded CSV)*         |
| Default region     | `ap-south-1`                       |
| Output format      | `json`                             |

### Step 3: Create Terraform State Backend
```bash
# Create S3 bucket for state
aws s3 mb s3://nimbuscart-terraform-state --region ap-south-1

# Create DynamoDB table for state locking
aws dynamodb create-table --table-name nimbuscart-terraform-lock --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region ap-south-1
```

### Step 4: Create terraform.tfvars
```bash
cd terraform
```

Create file `terraform.tfvars`:
```hcl
project_name    = "nimbuscart"
environment     = "production"
aws_region      = "ap-south-1"
db_password     = "YourSuperSecureDBPassword123!"
domain_name     = "nimbuscart.yourdomain.com"   # Optional
```

### Step 5: Deploy
```bash
terraform init
terraform plan      # Review what will be created
terraform apply     # Type "yes" to confirm
```

### AWS Terraform Variables Reference

| Variable | Required | Default | How to Get |
|----------|----------|---------|------------|
| `project_name` | No | `nimbuscart` | Choose your project name |
| `environment` | No | `production` | `dev`, `staging`, or `production` |
| `aws_region` | No | `ap-south-1` | [AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande.html) |
| `vpc_cidr` | No | `10.0.0.0/16` | Default is fine |
| `eks_cluster_version` | No | `1.29` | [EKS versions](https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html) |
| `eks_node_instance_types` | No | `t3.medium` | [EC2 instances](https://aws.amazon.com/ec2/instance-types/) |
| `db_instance_class` | No | `db.t3.medium` | [RDS instances](https://aws.amazon.com/rds/instance-types/) |
| `db_password` | **Yes** | — | Choose a strong password (min 8 chars, mix of letters/numbers/symbols) |
| `db_username` | No | `nimbuscart_admin` | Default is fine |
| `redis_node_type` | No | `cache.t3.medium` | [ElastiCache nodes](https://aws.amazon.com/elasticache/pricing/) |
| `domain_name` | No | `nimbuscart.example.com` | Your registered domain |

### After Deployment — Get Output Values
```bash
terraform output

# You'll see:
# eks_endpoint           = "https://xxx.yl4.ap-south-1.eks.amazonaws.com"
# rds_endpoint           = "nimbuscart-pg.xxx.ap-south-1.rds.amazonaws.com"
# redis_endpoint         = "nimbuscart-redis.xxx.cache.amazonaws.com"
# ecr_backend_url        = "123456789.dkr.ecr.ap-south-1.amazonaws.com/nimbuscart-backend"
# ecr_frontend_url       = "123456789.dkr.ecr.ap-south-1.amazonaws.com/nimbuscart-frontend"
# alb_dns_name           = "nimbuscart-alb-xxx.ap-south-1.elb.amazonaws.com"
```

---

## 10. Azure Infrastructure (Terraform)

### Prerequisites

1. **Azure Account**: https://azure.microsoft.com/en-us/free/ → **Start free** (₹13,300 / $200 credits)
2. **Install Azure CLI**:
   ```bash
   winget install Microsoft.AzureCLI
   ```
3. **Install Terraform** (if not already):
   ```bash
   winget install Hashicorp.Terraform
   ```

### Step 1: Login to Azure
```bash
az login
```
A browser window opens → sign in with your Azure account.

### Step 2: Set Subscription
```bash
# List subscriptions
az account list --output table

# Set the active subscription
az account set --subscription "Your Subscription Name or ID"
```

### Step 3: Create Terraform State Backend
```bash
# Create resource group for state
az group create --name nimbuscart-tfstate-rg --location centralindia

# Create storage account
az storage account create \
  --name nimbuscarttfstate \
  --resource-group nimbuscart-tfstate-rg \
  --location centralindia \
  --sku Standard_LRS

# Create blob container
az storage container create \
  --name tfstate \
  --account-name nimbuscarttfstate
```

### Step 4: Create terraform.tfvars
```bash
cd terraform-azure
```

Create file `terraform.tfvars`:
```hcl
project           = "nimbuscart"
environment       = "production"
location          = "Central India"
db_admin_password = "YourSuperSecureAzureDBPass123!"
domain_name       = "nimbuscart.yourdomain.com"   # Optional
```

### Step 5: Deploy
```bash
terraform init
terraform plan
terraform apply     # Type "yes" to confirm
```

### Azure Terraform Variables Reference

| Variable | Required | Default | How to Get |
|----------|----------|---------|------------|
| `project` | No | `nimbuscart` | Choose your project name |
| `environment` | No | `production` | `dev`, `staging`, or `production` |
| `location` | No | `Central India` | `az account list-locations --output table` |
| `vnet_cidr` | No | `10.0.0.0/16` | Default is fine |
| `aks_node_count` | No | `3` | Starting node count |
| `aks_node_vm_size` | No | `Standard_D2s_v3` | [Azure VM sizes](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes) |
| `aks_max_node_count` | No | `10` | Max autoscale nodes |
| `db_admin_username` | No | `nimbuscart_admin` | Default is fine |
| `db_admin_password` | **Yes** | — | Choose a strong password (min 8 chars, uppercase + lowercase + number + symbol) |
| `db_sku_name` | No | `GP_Standard_D2s_v3` | [Azure PG pricing](https://azure.microsoft.com/en-us/pricing/details/postgresql/) |
| `redis_sku` | No | `Standard` | `Basic`, `Standard`, or `Premium` |
| `redis_capacity` | No | `1` | Cache size (0–6 for Standard) |
| `domain_name` | No | `""` | Your registered domain |

### After Deployment — Get Output Values
```bash
terraform output

# You'll see:
# aks_cluster_name       = "nimbuscart-aks"
# acr_login_server       = "nimbuscartacr.azurecr.io"
# postgres_fqdn          = "nimbuscart-pg.postgres.database.azure.com"
# redis_hostname         = "nimbuscart-redis.redis.cache.windows.net"
# appgw_public_ip        = "20.204.xxx.xxx"
# key_vault_uri          = "https://nimbuscart-kv.vault.azure.net/"
# kubectl_config_command = "az aks get-credentials --resource-group ..."
# acr_login_command      = "az acr login --name nimbuscartacr"
```

---

## 11. GitHub Actions CI/CD (AWS)

### Prerequisites

- AWS account with EKS deployed (Section 9)
- GitHub repository

### Step 1: Create OIDC Identity Provider in AWS

1. Go to **AWS Console** → **IAM** → **Identity providers** → **Add provider**
2. Provider type: **OpenID Connect**
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Click **Add provider**

### Step 2: Create IAM Role for GitHub Actions

1. **IAM** → **Roles** → **Create role**
2. Trusted entity: **Web identity**
3. Identity provider: `token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Add condition:
   - Key: `token.actions.githubusercontent.com:sub`
   - Condition: `StringLike`
   - Value: `repo:Jayakrishnasai/Nimbus-Payment-Gateway:*`
6. Add permissions: `AmazonEKSClusterPolicy`, `AmazonEC2ContainerRegistryFullAccess`
7. Role name: `nimbuscart-github-actions`
8. Note the **Role ARN**: `arn:aws:iam::123456789:role/nimbuscart-github-actions`

### Step 3: Add GitHub Secrets

Go to **GitHub** → your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789:role/nimbuscart-github-actions` | IAM role from step 2 |
| `AWS_REGION` | `ap-south-1` | Your AWS region |
| `ECR_REGISTRY` | `123456789.dkr.ecr.ap-south-1.amazonaws.com` | `terraform output ecr_backend_url` (strip the repo name) |
| `EKS_CLUSTER_NAME` | `nimbuscart-eks` | `terraform output eks_cluster_name` |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/xxx` | Slack → Apps → Incoming Webhooks (optional) |

---

## 12. Azure DevOps CI/CD

### Prerequisites

- Azure account with AKS deployed (Section 10)
- Azure DevOps organization

### Step 1: Create Azure DevOps Organization

1. Go to https://dev.azure.com → **Start free**
2. Sign in with your Azure account
3. Create a new organization (or use existing)
4. Create a new project: `NimbusCart`

### Step 2: Import Repository

1. In your Azure DevOps project → **Repos** → **Import**
2. Clone URL: `https://github.com/Jayakrishnasai/Nimbus-Payment-Gateway.git`
3. Click **Import**

### Step 3: Create Service Connections

Go to **Project Settings** → **Service connections** → **New service connection**:

**A. ACR Service Connection:**
1. Type: **Docker Registry**
2. Registry type: **Azure Container Registry**
3. Subscription: Select your Azure subscription
4. Container registry: `nimbuscartacr`
5. Name: `NimbusCartACR`

**B. AKS Service Connection:**
1. Type: **Azure Resource Manager**
2. Authentication: **Service principal (automatic)**
3. Subscription: Select your Azure subscription
4. Resource group: `nimbuscart-production-rg`
5. Name: `NimbusCartAKS`

### Step 4: Create Pipeline

1. Go to **Pipelines** → **New Pipeline**
2. Source: **Azure Repos Git** (or GitHub)
3. Repository: `NimbusCart`
4. Configure: **Existing Azure Pipelines YAML file**
5. Path: `/azure-pipelines.yml`
6. Click **Run**

### Step 5: Pipeline Variables (auto-configured in azure-pipelines.yml)

| Variable | Value | Where It's Set |
|----------|-------|----------------|
| `acrServiceConnection` | `NimbusCartACR` | Service connection name from Step 3A |
| `aksServiceConnection` | `NimbusCartAKS` | Service connection name from Step 3B |
| `acrLoginServer` | `nimbuscartacr.azurecr.io` | `terraform output acr_login_server` |
| `aksClusterName` | `nimbuscart-aks` | `terraform output aks_cluster_name` |
| `aksResourceGroup` | `nimbuscart-production-rg` | `terraform output resource_group_name` |

> Update these values in `azure-pipelines.yml` if your names differ.

---

## 13. Complete .env Reference

### All Variables in One Place

```env
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SERVER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NODE_ENV=development                        # development | production | test
PORT=3000                                    # Backend server port
FRONTEND_URL=http://localhost:5173           # Frontend URL (for CORS)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DATABASE — Option A: Supabase (takes priority)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE_URL=                                # Get from: Supabase → Settings → Database → URI

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DATABASE — Option B: Local/Docker (used if DATABASE_URL is empty)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DB_HOST=localhost                            # Docker: postgres | Local: localhost
DB_PORT=5432                                 # Default PostgreSQL port
DB_NAME=nimbuscart                           # Database name
DB_USER=nimbuscart_user                      # Database username
DB_PASSWORD=nimbuscart_pass                  # Database password
DB_SSL=false                                 # true for production/Supabase
DB_POOL_MIN=2                                # Min connection pool size
DB_POOL_MAX=20                               # Max connection pool size

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# REDIS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REDIS_HOST=localhost                         # Docker: redis | Local: localhost
REDIS_PORT=6379                              # Default Redis port
REDIS_PASSWORD=                              # Empty for local, required for cloud Redis
REDIS_TLS=false                              # true for Redis Cloud / Azure Redis

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AUTHENTICATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JWT_SECRET=your_generated_64char_secret      # Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN=7d                            # Token expiry (7d, 24h, 1h)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# UPI PAYMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPI_MERCHANT_VPA=yourname@okaxis             # Your UPI ID from GPay/PhonePe/Paytm
UPI_MERCHANT_NAME=NimbusCart                 # Display name on payment screen
PAYMENT_TIMEOUT_SECONDS=300                  # 5 min timeout for payment

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BANK WEBHOOK
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BANK_WEBHOOK_SECRET=dev-webhook-secret       # HMAC secret — get from your bank in production
BANK_WEBHOOK_ALLOWED_IPS=                    # Comma-separated bank IPs (empty = allow all in dev)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LOGGING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOG_LEVEL=info                               # error | warn | info | debug
```

---

## 🗺️ Which Credentials Do I Need?

| Scenario | What You Need |
|----------|---------------|
| **Just testing locally** | Nothing — `docker-compose up --build` works with defaults |
| **Local dev with Supabase** | `DATABASE_URL` from Supabase + `JWT_SECRET` |
| **Production on AWS** | AWS credentials + `db_password` + UPI VPA + JWT_SECRET |
| **Production on Azure** | Azure login + `db_admin_password` + UPI VPA + JWT_SECRET |
| **CI/CD (GitHub Actions)** | AWS OIDC role ARN + ECR registry URL + EKS cluster name |
| **CI/CD (Azure DevOps)** | ACR + AKS service connections |

---

## ⚡ Credential Generation Cheat Sheet

```bash
# Generate JWT Secret (64 bytes hex)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Database Password (strong random)
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"

# Generate Webhook Secret (HMAC key)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

<p align="center">
  <strong>🔐 Never commit real credentials to Git.</strong><br/>
  <sub>Always use <code>.env</code> files (gitignored) or cloud secret managers (Key Vault / AWS Secrets Manager).</sub>
</p>
