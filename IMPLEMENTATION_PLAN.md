# NimbusCart — Enterprise E-Commerce Platform Implementation Plan

Build a production-grade, cloud-native e-commerce platform with dynamic UPI QR payment, Kubernetes deployment, Terraform IaC, CI/CD, and full observability.

> [!IMPORTANT]
> **UPI Merchant VPA**: The payment integration requires a valid UPI Virtual Payment Address (VPA). Set `UPI_MERCHANT_VPA` in your `.env` file.

> [!IMPORTANT]
> **AWS Account**: Terraform provisioning requires an active AWS account with appropriate IAM permissions. The plan creates infrastructure that will incur costs (EKS, RDS Multi-AZ, ElastiCache, NAT Gateway, ALB).

> [!WARNING]
> **Scope**: This is a massive project. All deliverables are working code files, but the Terraform/K8s/CI-CD portions are infrastructure configs — they cannot be tested locally without AWS. The frontend + backend + database schema are fully functional for local development.

---

## Proposed Changes

### 1. Project Foundation & Folder Structure

#### [NEW] `package.json`
Root workspace package.json for the monorepo.

The full project tree:
```
E_Com/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/             # DB, Redis, env config
│   │   ├── middleware/         # Auth, rate-limit, validation, error handler
│   │   ├── models/             # DB repository layer
│   │   ├── routes/             # Express route handlers
│   │   ├── services/           # Business logic (auth, cart, order, payment, product)
│   │   ├── utils/              # Logger, helpers
│   │   └── websocket/          # Socket.IO server
│   ├── migrations/             # SQL migration files
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── server.js
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # Auth, Cart context
│   │   ├── services/           # API client (Axios)
│   │   ├── assets/             # Static assets
│   │   └── styles/             # Global CSS
│   ├── public/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── terraform/                  # AWS IaC
│   ├── main.tf
│   ├── vpc.tf
│   ├── eks.tf
│   ├── rds.tf
│   ├── redis.tf
│   ├── alb.tf
│   ├── iam.tf
│   ├── security.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── providers.tf
├── kubernetes/                 # K8s manifests
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── pdb.yaml
│   └── network-policy.yaml
├── .github/workflows/          # CI/CD
│   └── deploy.yml
├── monitoring/                 # Observability
│   ├── prometheus.yml
│   ├── grafana-dashboard.json
│   └── alerting-rules.yml
├── load-testing/               # Performance
│   └── k6-test.js
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── deployment-guide.md
│   ├── security.md
│   └── api-reference.md
├── .env.example
├── docker-compose.yml          # Local dev stack
└── README.md
```

---

### 2. Database Schema

#### [NEW] `backend/migrations/001_initial_schema.sql`
Full production schema with 10 tables: `users`, `products`, `inventory`, `cart_items`, `orders`, `order_items`, `payments`, `bank_transactions`, `payment_logs`, `audit_logs`. UUID PKs, foreign keys, indexes, timestamps, soft-delete.

---

### 3. Backend API

#### [NEW] `backend/server.js`
Express app entry point with graceful shutdown, Socket.IO, cron jobs, and all middleware.

#### [NEW] Config files
- `src/config/database.js` — PostgreSQL pool with Supabase `DATABASE_URL` support + local fallback
- `src/config/redis.js` — Redis client with auth
- `src/config/env.js` — Centralized environment validation (Zod)

#### [NEW] Middleware
- `auth.js` — JWT verification
- `rateLimiter.js` — Express-rate-limit (100 req/min/IP)
- `validate.js` — Zod schema validation
- `errorHandler.js` — Global error handling with structured JSON
- `security.js` — Helmet, CORS, CSRF

#### [NEW] Services & Routes
- **Auth**: register, login, JWT token management
- **Product**: list, get, search, CRUD (admin)
- **Cart**: add/remove/update items (Redis-cached)
- **Order**: create order, list orders, order details
- **Payment**: Native UPI QR (NPCI deep links), bank webhook with HMAC SHA256, manual reconciliation, cron-based expiry
- **WebSocket**: Socket.IO for real-time payment status

---

### 4. Frontend (React + Vite + TailwindCSS)

#### [NEW] React App
- **Pages**: Home, ProductList, ProductDetail (Three.js 3D viewer), Cart, Checkout, PaymentStatus, Login, Register
- **Components**: Navbar, ProductCard, CartItem, QRDisplay (animated), CountdownTimer, SkeletonLoader, Toast, SuccessAnimation, FailureAnimation
- **Context**: AuthContext, CartContext
- **Hooks**: useAuth, useCart, useWebSocket
- **Services**: api.js (Axios instance with interceptors)

---

### 5. Terraform (AWS Infrastructure)

#### [NEW] 11 Terraform files
Complete IaC: VPC with public/private subnets, EKS cluster, RDS PostgreSQL Multi-AZ with read replica, ElastiCache Redis, ALB with ACM SSL, IAM with IRSA, security groups, KMS, S3 log bucket. Remote state backend config (S3 + DynamoDB).

---

### 6. Kubernetes Manifests

#### [NEW] 11 YAML files
Namespace `payment-ecom`, deployments (frontend/backend), ClusterIP services, ALB Ingress, HPA (CPU>70%, backend 3-10, frontend 2-5), ConfigMaps, Secrets, liveness/readiness probes, PodDisruptionBudget, NetworkPolicy, RollingUpdate (maxUnavailable:0, maxSurge:1).

---

### 7. CI/CD (GitHub Actions)

#### [NEW] `ci-cd.yml`
Complete pipeline: test → Docker build → tag with SHA → push to ECR → kubectl rolling deploy → Slack notification. OIDC auth for AWS.

---

### 8. Containerization

#### [NEW] Dockerfiles
Multi-stage builds for both frontend (nginx-alpine) and backend (node-alpine). Non-root user, healthcheck, optimized `.dockerignore`. Target < 200MB.

#### [NEW] `docker-compose.yml`
Local development stack: backend, frontend, PostgreSQL, Redis.

---

### 9. Monitoring & Observability

#### [NEW] Monitoring configs
- `prometheus.yml` — Scrape configs for backend metrics
- `grafana-dashboard.json` — Dashboard with payment success rate, latency, CPU, memory, DB connections, Redis memory
- `alerting-rules.yml` — Alerts for payment failures, pod crashes, high latency, DB CPU

---

### 10. Load Testing

#### [NEW] `k6-test.js`
Scenarios: 1000 concurrent users, 500 checkouts/min, spike test.

---

### 11. Documentation

#### [NEW] 5 doc files
- `README.md` — Project overview, setup, architecture
- `docs/architecture.md` — System architecture with diagrams
- `docs/deployment-guide.md` — Step-by-step AWS deployment
- `docs/security.md` — Security hardening documentation
- `docs/api-reference.md` — Full API endpoint reference

---

## Verification Plan

### Automated Tests
1. **Backend starts without error**: `cd backend && npm install && node server.js` — verify server starts and healthcheck responds
2. **Frontend builds**: `cd frontend && npm install && npm run build` — verify Vite build succeeds
3. **Docker Compose**: `docker-compose up --build` — verify all 4 services start (requires Docker)
4. **Terraform validate**: `cd terraform && terraform init && terraform validate` — verify HCL syntax
5. **Kubernetes validate**: `kubectl apply --dry-run=client -f kubernetes/` — verify YAML syntax

### Manual Verification
1. **Browser test**: Start the frontend dev server, navigate to `http://localhost:5173`, verify the UI renders with all pages
2. **API test**: Use the browser or curl to hit `http://localhost:3000/health` and verify JSON response
3. **Visual review**: Check that the UI has modern design with animations, 3D product viewer, responsive layout

> [!NOTE]
> Full payment flow testing requires a UPI merchant VPA and bank webhook integration. AWS infrastructure testing requires an AWS account. These are documented in the deployment guide.
