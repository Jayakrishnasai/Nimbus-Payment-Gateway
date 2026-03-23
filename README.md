<p align="center">
  <img src="https://img.shields.io/badge/NimbusCart-Enterprise-7c3aed?style=for-the-badge&labelColor=0f172a" alt="NimbusCart" />
  <img src="https://img.shields.io/badge/Stripe-Ready-635bff?style=for-the-badge&logo=stripe&labelColor=0f172a" alt="Stripe Ready" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&labelColor=0f172a" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&labelColor=0f172a" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&labelColor=0f172a" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Terraform-IaC-844FBA?style=for-the-badge&logo=terraform&labelColor=0f172a" alt="Terraform" />
  <img src="https://img.shields.io/badge/Kubernetes-AKS-326CE5?style=for-the-badge&logo=kubernetes&labelColor=0f172a" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Azure-Cloud-0078D4?style=for-the-badge&logo=microsoftazure&labelColor=0f172a" alt="Azure" />
  <img src="https://img.shields.io/badge/Supabase-Ready-3FCF8E?style=for-the-badge&logo=supabase&labelColor=0f172a" alt="Supabase" />
</p>

<h1 align="center">🛒 NimbusCart</h1>
<p align="center"><strong>Enterprise-Grade Cloud-Native E-Commerce Platform</strong></p>
<p align="center">A robust, production-ready e-commerce solution featuring Stripe Checkout, real-time WebSockets, Three.js 3D product viewer, and full Azure infrastructure as code.</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/status-production--ready-success?style=flat-square" alt="Status" />
</p>

---

## ⚡ Key Highlights

| Feature | Description |
|---------|-------------|
| 💳 **Advanced Payments** | Full Stripe Checkout integration + Native UPI QR payment fallback |
| 🛡️ **Enterprise RBAC** | Fine-grained Role-Based Access Control (Admin, Vendor, Customer) |
| 📊 **Real-Time Analytics** | Dedicated analytics dashboards for admins and vendors |
| 🧊 **Three.js 3D Viewer** | Interactive 3D product visualization with orbit controls |
| 🏗️ **Azure Cloud IaC** | Full infrastructure via Terraform: VNet, AKS, Azure PG, Redis, App Gateway |
| 🐳 **Cloud Native** | Multi-stage Dockerfiles, Kubernetes HPA, PDB, and NetworkPolicies |
| 🔄 **Azure DevOps CI/CD** | Automated pipeline from code push to AKS deployment |
| 🛡️ **Secure by Design** | HMAC webhook verification, SERIALIZABLE transactions, IP whitelisting |

---

## 🏛️ Architecture (Azure Cloud)

```
┌────────────────────────────────────────────────────────────────────┐
│                       Azure Cloud (Terraform)                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      VNet (10.0.0.0/16)                       │  │
│  │                                                                │  │
│  │   ┌─────────────┐    ┌──────────────────────────────────┐    │  │
│  │   │  App Gateway │───▶│         AKS Cluster               │    │  │
│  │   │  v2 (WAF)    │    │  ┌──────────┐  ┌──────────────┐  │    │  │
│  │   └─────────────┘    │  │ Frontend  │  │   Backend     │  │    │  │
│  │                       │  │ React+Vite│  │ Express API   │  │    │  │
│  │                       │  │ (Nginx)   │  │ (Node.js)     │  │    │  │
│  │                       │  └──────────┘  └──────┬───────┘  │    │  │
│  │                       └──────────────────────┼───────────┘    │  │
│  │                                               │                │  │
│  │   ┌───────────────┐  ┌────────────────────────┼────────┐      │  │
│  │   │  Key Vault    │  │                        │        │      │  │
│  │   │  (Secrets +   │  │  ┌─────────────────────▼─────┐  │      │  │
│  │   │   CSI Driver) │  │  │  Azure PG Flexible        │  │      │  │
│  │   └───────────────┘  │  │  (Zone-Redundant HA)      │  │      │  │
│  │                       │  └──────────────────────────┘  │      │  │
│  │   ┌───────────────┐  │  ┌──────────────────────────┐  │      │  │
│  │   │  ACR          │  │  │  Azure Cache for Redis   │  │      │  │
│  │   │  (Container   │  │  │  (Private Endpoint +     │  │      │  │
│  │   │   Registry)   │  │  │   TLS Only)              │  │      │  │
│  │   └───────────────┘  │  └──────────────────────────┘  │      │  │
│  │                       │                                │      │  │
│  │   ┌───────────────┐  └────────────────────────────────┘      │  │
│  │   │ Log Analytics │    Monitoring + Diagnostics               │  │
│  │   └───────────────┘                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
NimbusCart/
├── backend/                          # Node.js Express API
│   ├── src/
│   │   ├── config/                   # DB, Redis, and env validation
│   │   ├── middleware/               # Auth, RBAC, and error handlers
│   │   ├── routes/                   # API routes (Auth, Products, Orders, Analytics)
│   │   ├── services/                 # Business logic (Stripe, UPI, RBAC)
│   │   └── websocket/                # Socket.IO for real-time updates
│   ├── migrations/                   # SQL schemas (RBAC, Analytics, Stripe)
│   └── Dockerfile                    # Multi-stage Node image
│
├── frontend/                         # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/               # 3D Viewer, Navbar, Product cards
│   │   ├── pages/                    # Home, Checkout, Dashboard
│   │   └── context/                  # Auth and Cart state
│   ├── nginx.conf                    # Production Nginx config
│   └── Dockerfile                    # Optimized Nginx build
│
├── terraform-azure/                  # Infrastructure as Code
│   ├── aks.tf                        # Managed Kubernetes cluster
│   ├── database.tf                   # PostgreSQL Flexible Server
│   ├── redis.tf                      # Azure Cache for Redis
│   └── appgateway.tf                 # Application Gateway v2 (WAF)
│
├── kubernetes/                       # K8s Manifests
│   ├── deployment.yaml               # Scalable pods
│   ├── hpa.yaml                      # Horizontal Pod Autoscaling
│   └── ingress.yaml                  # Path-based routing
│
├── .github/workflows/                # GitHub Actions
├── azure-pipelines.yml               # Azure DevOps CI/CD
└── docs/                             # Technical Documentation
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/nimbuscart.git
cd nimbuscart
npm run install:all
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Stripe and Database credentials:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database (Supabase or Local)
DATABASE_URL=postgresql://postgres.xxxx@aws-0-region.pooler.supabase.com:6543/postgres

# UPI Configuration (Optional Fallback)
UPI_MERCHANT_VPA=yourstore@upi
```

### 3. Start Development Stack

```bash
# Option A: Full stack via Docker
docker-compose up --build

# Option B: Manual Backend + Frontend
npm run dev:backend
npm run dev:frontend
```

---

## 💳 Payment Ecosystem

NimbusCart provides a professional payment experience with **Stripe Checkout** as the primary gateway, supporting credit cards and modern digital wallets.

- **Stripe Integration:** Secure session creation, automatic redirection, and robust webhook handling.
- **Native UPI Fallback:** Gateway-independent UPI QR generation for regional payment preferences.
- **Real-Time Updates:** WebSockets push payment status instantly from backend to frontend.

---

## 🛡️ Enterprise Security & RBAC

NimbusCart implements a strict **Role-Based Access Control** system to manage platform operations:

- **Customers:** Access to storefront, cart, and personal order history.
- **Vendors:** Access to vendor-specific analytics, product management, and scoped sales data.
- **Admins:** Global platform oversight, system-wide analytics, and full user management.

Security is further hardened via:
- **JWT Auth:** Stateless session management with secure refresh tokens.
- **HMAC Verification:** Ensuring all payment webhooks originate from trusted sources.
- **Database Isolation:** SERIALIZABLE transaction levels for critical financial operations.

---

## 📊 Documentation

| Document | Description |
|----------|-------------|
| [API Reference](./docs/API_REFERENCE.md) | Full endpoint documentation including RBAC requirements |
| [Database Schema](./docs/DATABASE_SCHEMA.md) | Detailed table structures and ER diagrams |
| [Setup Guide](./SETUP_GUIDE.md) | Step-by-step credentials and deployment walkthrough |
| [Supabase Setup](./SUPABASE_SETUP.md) | Connecting to hosted PostgreSQL |

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
  <strong>Built with ❤️ for modern enterprise e-commerce</strong><br/>
  <sub>NimbusCart — Azure Native. Stripe Integrated. Enterprise Ready.</sub>
</p>
