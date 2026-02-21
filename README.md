<p align="center">
  <img src="https://img.shields.io/badge/NimbusCart-Enterprise-7c3aed?style=for-the-badge&labelColor=0f172a" alt="NimbusCart" />
  <img src="https://img.shields.io/badge/UPI-Native_QR-22c55e?style=for-the-badge&labelColor=0f172a" alt="UPI Native QR" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&labelColor=0f172a" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&labelColor=0f172a" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&labelColor=0f172a" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&labelColor=0f172a" alt="Redis" />
  <img src="https://img.shields.io/badge/Terraform-IaC-844FBA?style=for-the-badge&logo=terraform&labelColor=0f172a" alt="Terraform" />
  <img src="https://img.shields.io/badge/Kubernetes-EKS-326CE5?style=for-the-badge&logo=kubernetes&labelColor=0f172a" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&labelColor=0f172a" alt="Docker" />
  <img src="https://img.shields.io/badge/Supabase-Ready-3FCF8E?style=for-the-badge&logo=supabase&labelColor=0f172a" alt="Supabase" />
</p>

<h1 align="center">🛒 NimbusCart</h1>
<p align="center"><strong>Enterprise-Grade Cloud-Native E-Commerce Platform</strong></p>
<p align="center">Production-ready e-commerce with Native UPI QR payments, real-time WebSockets, Three.js 3D product viewer, and full AWS infrastructure as code</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/status-production--ready-success?style=flat-square" alt="Status" />
</p>

---

## ⚡ Key Highlights

| Feature | Description |
|---------|-------------|
| 🔐 **Native UPI QR Payments** | Gateway-independent NPCI-compliant UPI deep links — no Razorpay/Stripe needed |
| 🧊 **Three.js 3D Product Viewer** | Interactive 3D product visualization with orbit controls |
| ⚡ **Real-Time WebSockets** | Instant payment status updates via Socket.IO |
| 🏗️ **Full AWS IaC** | 11 Terraform files: VPC, EKS, RDS Multi-AZ, ElastiCache, ALB, KMS |
| 🐳 **Docker + Kubernetes** | Multi-stage Dockerfiles, HPA, PDB, NetworkPolicy, rolling deploys |
| 🔄 **CI/CD Pipeline** | GitHub Actions → ECR → EKS with OIDC authentication |
| 🛡️ **Bank-Grade Security** | HMAC webhook verification, SERIALIZABLE transactions, IP whitelisting |
| 💚 **Supabase Ready** | Drop-in `DATABASE_URL` support for hosted PostgreSQL |

---

## 🏛️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (Terraform)                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        VPC (10.0.0.0/16)                      │  │
│  │                                                                │  │
│  │   ┌─────────────┐    ┌──────────────────────────────────┐    │  │
│  │   │     ALB      │───▶│         EKS Cluster               │    │  │
│  │   │  (HTTPS/SSL) │    │  ┌──────────┐  ┌──────────────┐  │    │  │
│  │   └─────────────┘    │  │ Frontend  │  │   Backend     │  │    │  │
│  │                       │  │ React+Vite│  │ Express API   │  │    │  │
│  │                       │  │ (Nginx)   │  │ (Node.js)     │  │    │  │
│  │                       │  └──────────┘  └──────┬───────┘  │    │  │
│  │                       └──────────────────────┼───────────┘    │  │
│  │                                               │                │  │
│  │              ┌────────────────────────────────┼────────┐      │  │
│  │              │                                │        │      │  │
│  │   ┌──────────▼──────────┐    ┌────────────────▼─────┐  │      │  │
│  │   │  RDS PostgreSQL     │    │   ElastiCache Redis  │  │      │  │
│  │   │  (Multi-AZ + Read   │    │   (Multi-AZ + Auto   │  │      │  │
│  │   │   Replica)          │    │    Failover)         │  │      │  │
│  │   └─────────────────────┘    └──────────────────────┘  │      │  │
│  │                                                         │      │  │
│  └─────────────────────────────────────────────────────────┘      │  │
└────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   UPI / Bank        │
                    │   Webhook (HMAC)    │
                    │   ──────────────▶   │  Bank → Backend
                    └─────────────────────┘
```

---

## 📁 Project Structure

```
E_Com/
├── backend/                          # Node.js Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js           # PostgreSQL pool (Supabase + local)
│   │   │   ├── redis.js              # Redis client
│   │   │   └── env.js                # Zod env validation
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT authentication
│   │   │   ├── validate.js           # Zod schema validation
│   │   │   └── errorHandler.js       # Structured error handling
│   │   ├── routes/
│   │   │   ├── auth.routes.js        # Register / Login / Profile
│   │   │   ├── product.routes.js     # Product CRUD + Search
│   │   │   ├── cart.routes.js        # Cart management
│   │   │   ├── order.routes.js       # Order lifecycle
│   │   │   ├── payment.routes.js     # UPI QR payment + confirm
│   │   │   └── webhook.routes.js     # Bank webhook (HMAC)
│   │   ├── services/
│   │   │   ├── auth.service.js       # JWT + bcrypt
│   │   │   ├── product.service.js    # Product queries
│   │   │   ├── cart.service.js       # Redis-cached cart
│   │   │   ├── order.service.js      # Order creation + inventory
│   │   │   ├── payment.service.js    # Native UPI QR engine
│   │   │   └── cron.service.js       # Payment expiry + cleanup
│   │   ├── utils/logger.js           # Winston logging
│   │   ├── websocket/socket.js       # Socket.IO real-time
│   │   └── app.js                    # Express app config
│   ├── migrations/
│   │   └── 001_initial_schema.sql    # Full database schema
│   ├── database/schema.sql           # Reference schema
│   ├── Dockerfile                    # Multi-stage build
│   ├── package.json
│   └── server.js                     # Entry point
│
├── frontend/                          # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Animated navigation
│   │   │   └── ProductCard.jsx       # Product card with hover effects
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Landing page with hero section
│   │   │   ├── Products.jsx          # Product grid + filters
│   │   │   ├── ProductDetail.jsx     # Three.js 3D viewer
│   │   │   ├── Cart.jsx              # Shopping cart
│   │   │   ├── Checkout.jsx          # Checkout form
│   │   │   ├── PaymentStatus.jsx     # UPI QR + countdown + manual confirm
│   │   │   ├── Orders.jsx            # Order history
│   │   │   ├── Login.jsx             # Login page
│   │   │   └── Register.jsx          # Registration page
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Auth state management
│   │   │   └── CartContext.jsx       # Cart state management
│   │   ├── services/api.js           # Axios with interceptors
│   │   └── App.jsx                   # Router + layout
│   ├── Dockerfile                    # Nginx multi-stage build
│   ├── nginx.conf                    # SPA routing + security headers
│   └── package.json
│
├── terraform/                         # AWS Infrastructure as Code
│   ├── providers.tf                  # AWS provider + remote state
│   ├── variables.tf                  # Input variables
│   ├── vpc.tf                        # VPC + subnets + NAT
│   ├── eks.tf                        # EKS cluster + node groups
│   ├── rds.tf                        # PostgreSQL Multi-AZ + read replica
│   ├── redis.tf                      # ElastiCache Redis cluster
│   ├── alb.tf                        # ALB + HTTPS + ACM cert
│   ├── security.tf                   # Security groups + KMS + S3
│   ├── iam.tf                        # IAM roles + IRSA
│   ├── main.tf                       # ECR repositories
│   └── outputs.tf                    # Infrastructure outputs
│
├── kubernetes/                        # K8s Manifests
│   ├── deployment.yaml               # Backend (3) + Frontend (2) pods
│   ├── hpa.yaml                      # HPA + PodDisruptionBudget
│   └── ingress.yaml                  # ALB Ingress + ConfigMap + Secrets + NetworkPolicy
│
├── .github/workflows/
│   └── ci-cd.yml                     # GitHub Actions CI/CD pipeline
│
├── docker-compose.yml                # Local dev stack
├── .env.example                      # Environment template
├── SUPABASE_SETUP.md                 # Supabase connection guide
├── WALKTHROUGH.md                    # UPI migration walkthrough
├── IMPLEMENTATION_PLAN.md            # Full implementation plan
└── README.md                         # ← You are here
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Docker** & Docker Compose (for local PostgreSQL + Redis)
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/your-username/nimbuscart.git
cd nimbuscart

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Option A: Supabase (recommended for testing)
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres

# Option B: Local Docker PostgreSQL (leave DATABASE_URL empty)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nimbuscart
DB_USER=nimbuscart_user
DB_PASSWORD=changeme

# UPI Payment
UPI_MERCHANT_VPA=yourstore@upi
UPI_MERCHANT_NAME=NimbusCart

# JWT
JWT_SECRET=your-secret-minimum-16-characters
```

### 3. Start Services

**Option A — Docker Compose (full stack)**
```bash
docker-compose up --build
```

**Option B — Manual (with Supabase)**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 4. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health Check | http://localhost:3000/health |

---

## 💳 Payment Flow — Native UPI QR

NimbusCart uses **gateway-independent UPI payments** directly through NPCI-compliant deep links. No Razorpay, no Stripe — just native UPI.

```
User clicks "Pay" → Backend generates UPI deep link → QR Code displayed
    ↓
User scans QR with any UPI app (GPay, PhonePe, Paytm, BHIM)
    ↓
Bank sends webhook with UTR → HMAC verification → SERIALIZABLE transaction
    ↓
Order confirmed → WebSocket pushes real-time update → Success animation
```

### Payment Security

| Layer | Implementation |
|-------|----------------|
| **Webhook Auth** | HMAC-SHA256 signature verification |
| **IP Whitelist** | Bank webhook IP restriction (production) |
| **Transaction Isolation** | PostgreSQL SERIALIZABLE for atomicity |
| **Duplicate Prevention** | Unique UTR constraint + idempotency keys |
| **Payment Expiry** | Cron-based auto-expiry of unpaid orders |
| **Reconciliation** | Manual "I Have Paid" fallback with UTR matching |

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login & get JWT token |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Invalidate token |
| `GET`  | `/api/auth/profile` | Get current user profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products (paginated, searchable) |
| `GET` | `/api/products/:id` | Get product details |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cart` | Get user's cart |
| `POST` | `/api/cart` | Add item to cart |
| `PUT` | `/api/cart/:itemId` | Update cart item quantity |
| `DELETE` | `/api/cart/:itemId` | Remove item from cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders` | List user's orders |
| `GET` | `/api/orders/:id` | Get order details |

### Payments (Native UPI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/:orderId` | Generate UPI QR code |
| `GET` | `/api/payments/:orderId/status` | Check payment status |
| `POST` | `/api/payments/:orderId/confirm` | Manual "I Have Paid" |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/bank` | Bank payment confirmation (HMAC) |
| `POST` | `/api/webhooks/simulate` | Simulate payment (dev only) |

---

## 🗄️ Database Schema

10 tables with full referential integrity:

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

| Table | Description |
|-------|-------------|
| `users` | User accounts with bcrypt passwords |
| `products` | Product catalog with slugs and categories |
| `inventory` | Stock tracking with reservation |
| `cart_items` | Redis-backed shopping cart |
| `orders` | Order lifecycle management |
| `order_items` | Order line items |
| `payments` | UPI payment records (txn ref, UTR, reconciliation) |
| `bank_transactions` | Bank UTR matching for reconciliation |
| `payment_logs` | Payment event audit trail |
| `audit_logs` | System-wide audit logging |

---

## ☁️ Infrastructure (Terraform)

Deploy the full stack to AWS with a single `terraform apply`:

| Resource | Configuration |
|----------|---------------|
| **VPC** | 10.0.0.0/16, 3 public + 3 private subnets, NAT Gateway |
| **EKS** | Managed node groups, Cluster Autoscaler, IRSA |
| **RDS** | PostgreSQL 16, Multi-AZ, read replica, KMS encryption |
| **ElastiCache** | Redis 7, Multi-AZ, auto-failover, encryption in-transit |
| **ALB** | HTTPS listener, ACM certificate, HTTP→HTTPS redirect |
| **IAM** | IRSA for pod-level AWS access, least-privilege policies |
| **Security** | Security groups, KMS keys, S3 access logs |
| **ECR** | Container registries with immutable tags + lifecycle |

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## 🐳 Docker

### Multi-Stage Builds
- **Backend**: `node:18-alpine` → optimized production image (~150MB)
- **Frontend**: `node:18-alpine` build → `nginx:alpine` serve (~30MB)

### Local Development
```bash
docker-compose up --build

# Services:
# PostgreSQL  → localhost:5432
# Redis       → localhost:6379
# Backend API → localhost:3000
# Frontend    → localhost:8080
```

---

## ⎈ Kubernetes

| Resource | Details |
|----------|---------|
| **Backend** | 3 replicas, HPA (3→10 at 70% CPU), rolling update |
| **Frontend** | 2 replicas, HPA (2→5 at 70% CPU), rolling update |
| **Ingress** | AWS ALB with path-based routing, HTTPS |
| **PDB** | Min 1 available for backend, min 1 for frontend |
| **NetworkPolicy** | Backend accessible only from frontend + ingress |

---

## 🔄 CI/CD Pipeline

```
Push to main → Lint + Test → Docker Build → Push to ECR → Deploy to EKS → Slack Notify
```

- **Authentication**: AWS OIDC (no stored credentials)
- **Testing**: PostgreSQL + Redis services for integration tests
- **Deploy**: `kubectl set image` with rollout status verification
- **Notifications**: Slack webhook on success/failure

---

## 🔐 Security

| Category | Implementation |
|----------|----------------|
| **Transport** | HTTPS/TLS via ALB + ACM, HSTS preload |
| **Authentication** | JWT with bcrypt password hashing |
| **API Protection** | Rate limiting (100 req/min), Helmet headers, CORS |
| **Data** | KMS encryption at rest, SSL in transit |
| **Payments** | HMAC-SHA256 webhooks, SERIALIZABLE isolation, idempotency |
| **Infrastructure** | Security groups, IRSA, non-root Docker containers |
| **Secrets** | K8s Secrets (recommend external-secrets-operator in prod) |

---

## 🧰 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, TailwindCSS, Framer Motion, Three.js, Lucide Icons, Socket.IO Client |
| **Backend** | Node.js, Express 4, Socket.IO, Winston, Zod, node-cron |
| **Database** | PostgreSQL 16 (Supabase / RDS), Redis 7 |
| **Payments** | Native UPI QR (NPCI deep links), qrcode, crypto |
| **Infrastructure** | Terraform, AWS (EKS, RDS, ElastiCache, ALB, ECR, KMS) |
| **Containers** | Docker, Kubernetes, HPA, PDB, NetworkPolicy |
| **CI/CD** | GitHub Actions, OIDC, ECR, kubectl |
| **Security** | Helmet, bcryptjs, JWT, HMAC-SHA256, rate-limit |

---

## 📄 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | No* | — | Supabase connection string |
| `DB_HOST` | No* | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | No | `nimbuscart` | Database name |
| `DB_USER` | No | `nimbuscart_user` | Database user |
| `DB_PASSWORD` | Yes | — | Database password |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `JWT_SECRET` | Yes | — | JWT signing secret (min 16 chars) |
| `UPI_MERCHANT_VPA` | No | `merchant@upi` | Your UPI VPA |
| `UPI_MERCHANT_NAME` | No | `NimbusCart` | Merchant display name |
| `BANK_WEBHOOK_SECRET` | Yes | — | HMAC secret for bank webhooks |
| `PAYMENT_TIMEOUT_SECONDS` | No | `300` | Payment expiry in seconds |

> *Either `DATABASE_URL` or individual `DB_*` variables must be set.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Supabase database connection guide |
| [WALKTHROUGH.md](./WALKTHROUGH.md) | UPI QR migration walkthrough |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Full implementation plan |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ for modern e-commerce</strong><br/>
  <sub>NimbusCart — Enterprise-grade. Cloud-native. Payment-ready.</sub>
</p>
