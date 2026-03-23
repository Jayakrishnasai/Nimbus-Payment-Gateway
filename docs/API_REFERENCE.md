# 🔌 NimbusCart API Reference

## Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login & get JWT token |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Invalidate token |
| `GET`  | `/api/auth/profile` | Get current user profile |

## Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products (paginated, searchable) |
| `GET` | `/api/products/:id` | Get product details |

## Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cart` | Get user's cart |
| `POST` | `/api/cart` | Add item to cart |
| `PUT` | `/api/cart/:itemId` | Update cart item quantity |
| `DELETE` | `/api/cart/:itemId` | Remove item from cart |

## Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders` | List user's orders |
| `GET` | `/api/orders/:id` | Get order details |

## Payments (Stripe & Native UPI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/:orderId` | Create Stripe checkout session |
| `GET` | `/api/payments/:orderId/status` | Check payment status |
| `POST` | `/api/payments/:orderId/confirm` | Manual "I Have Paid" (UPI) |

## Analytics (RBAC Protected)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/analytics/admin` | Global platform metrics | Admin |
| `GET` | `/api/analytics/vendor` | Scoped vendor metrics | Vendor |

## Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/stripe` | Stripe payment confirmation (HMAC) |
| `POST` | `/api/webhooks/bank` | Bank payment confirmation (UPI) |
