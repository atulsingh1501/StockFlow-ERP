# StockFlow ERP — Mini ERP + CRM Operations Portal

A full-stack ERP/CRM application built for the **Fundsroom Infotech Full Stack Developer Case Study**.

---

## 🌐 Live Demo

- **Frontend:** https://stock-flow-erp-tau.vercel.app/
- **Backend API:** https://stockflow-erp-backend.onrender.com/

> ⚠️ **IMPORTANT NOTE FOR REVIEWERS:** 
> The backend is hosted on Render's free tier, which goes to "sleep" after 15 minutes of inactivity. **When you click "Sign in" for the very first time, it may take 45–50 seconds for the backend to wake up.** Please click "Sign in" once and wait a moment. Once the server is awake, all subsequent clicks and API requests will be lightning fast!

---

## 📌 Project Overview

StockFlow ERP is a lightweight ERP + CRM system for a wholesale/distribution business. It manages customers, products, inventory, sales challans, invoices, and follow-up activities for internal teams such as Sales, Warehouse, and Accounts.

The goal of this project is to demonstrate:

- Full-stack development
- REST API design
- Database modeling
- Authentication & authorization
- Inventory business logic
- Modern, responsive SaaS-style UI (Tailwind CSS v4)
- Deployment and environment management

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod Validation

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** PostgreSQL (Render/Supabase compatible)

---

## ✨ Features

### 🔐 Authentication & Roles
- JWT-based login
- Role-based access control
- Admin, Sales, Warehouse, Accounts

### 👥 Customer CRM
- Add customer
- Edit customer
- Search customers
- Customer detail view
- Follow-up notes
- Lead / Active / Inactive status

### 📦 Product & Inventory
- Add/Edit products
- SKU & category management
- Stock tracking
- Minimum stock alerts
- Stock movement log (IN / OUT)

### 🧾 Sales Challan
- Select customer
- Add multiple products
- Automatic challan number generation
- Draft / Confirmed / Cancelled states
- Stock reduction on confirmation
- Prevent negative stock

### 📊 Dashboard
- Business summary cards
- Recent activity
- Low stock indicators
- Sales overview

---

## 🏗️ Architecture

### Frontend
- `src/pages` → route pages
- `src/components` → reusable UI components
- `src/services` → API layer
- `src/context` → authentication state

### Backend
- `src/routes` → API routes
- `src/controllers` → request handlers
- `src/services` → business logic
- `src/middleware` → auth & validation
- `prisma/schema.prisma` → database schema

---

## 🔗 API Base URL

`https://stockflow-erp-backend.onrender.com/api`

### Example Endpoints

#### Auth
- `POST /auth/login`

#### Customers
- `GET /customers`
- `POST /customers`
- `PUT /customers/:id`

#### Products
- `GET /products`
- `POST /products`

#### Challans
- `GET /challans`
- `POST /challans`
- `PATCH /challans/:id/confirm`

---

## 🧪 Test Credentials

### Admin
- **Email:** `admin@stockflow.com`
- **Password:** `Admin@123`

### Sales
- **Email:** `sales@stockflow.com`
- **Password:** `Sales@123`

### Warehouse
- **Email:** `warehouse@stockflow.com`
- **Password:** `Warehouse@123`

### Accounts
- **Email:** `accounts@stockflow.com`
- **Password:** `Accounts@123`

> Replace these with your actual seeded credentials.

---

## 🚀 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/atulsingh1501/StockFlow-ERP.git
cd StockFlow-ERP
```

---

## ⚙️ Backend Setup

### Install dependencies

```bash
cd backend
npm install
```

### Configure environment variables

Create a `.env` file in `backend/`.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/stockflow
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### Seed sample data

```bash
npm run seed
```

### Start backend

```bash
npm run dev
```

Backend runs on **http://localhost:5000**

---

## 💻 Frontend Setup

### Install dependencies

```bash
cd ../frontend
npm install
```

### Configure environment variables

Create a `.env` file in `frontend/`.

```env
VITE_API_URL=http://localhost:5000/api
```

### Start frontend

```bash
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## 🧠 Business Logic Implemented

### Stock Validation
- Cannot confirm challan if stock is insufficient.
- Negative inventory is blocked.

### Challan Snapshot
- Product name
- SKU
- Unit price
- Quantity
- Total

### Inventory Audit
Every stock change creates a movement log with:
- Product
- Quantity
- Type (IN/OUT)
- Reason
- User
- Timestamp

---

# ☁️ Deployment

## Frontend (Vercel)

```bash
npm run build
```

Set:

```env
VITE_API_URL=https://stockflow-erp-backend.onrender.com/api
```

## Backend (Render)

Set environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `NODE_ENV=production`

Run:

```bash
npx prisma migrate deploy
npm start
```

---

## 🔑 Environment Variables

### Backend

| Variable | Description |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | JWT signing secret |
| PORT | Server port |
| CORS_ORIGIN | Allowed frontend origin |

### Frontend

| Variable | Description |
|---|---|
| VITE_API_URL | Backend API URL |

---

## 📝 Assumptions

- Single warehouse for MVP.
- No payment gateway integration.
- Invoice PDF export is not implemented.
- Image upload is not implemented.
- Email/SMS reminders are not implemented.

---

## ⚠️ Known Limitations

- Basic analytics only.
- No real-time updates.
- No pagination on some lists.
- Mobile UI can be further improved.
- Refresh token flow not implemented.

---

## 📬 Postman / API Documentation

- `postman_collection.json`

---

## 📸 Screenshots

### Login
_Add screenshot_

### Dashboard
_Add screenshot_

### Customer CRM
_Add screenshot_

### Inventory
_Add screenshot_

### Sales Challan
_Add screenshot_

---

## ✅ Evaluation Checklist

- [x] JWT authentication
- [x] Role-based access
- [x] Customer CRM
- [x] Product & inventory management
- [x] Stock movement log
- [x] Sales challan flow
- [x] Stock validation
- [x] REST APIs
- [x] Responsive frontend
- [x] Live deployment
- [x] Environment variables
- [x] README documentation
- [x] PDF export for challans
- [x] GitHub Actions CI/CD
- [x] Global search with live API recommendations
- [x] Sequential challan numbering (CH-YYYY-NNNNN)
- [x] Stock movement log with pagination
- [x] Role-based access (Admin / Sales / Warehouse / Accounts)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Client (Browser)                       │
│         React + TypeScript + Tailwind CSS v4              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Dashboard │ │Customers │ │Products  │ │ Challans  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────┐ ┌──────────┐                              │
│  │  Stock   │ │ Reports  │                              │
│  └──────────┘ └──────────┘                              │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS / REST API (JWT Bearer)
┌────────────────────────▼─────────────────────────────────┐
│                 Backend (Node.js + Express)               │
│  ┌────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────┐ │
│  │ /auth  │ │/customers│ │/products  │ │  /challans  │ │
│  └────────┘ └──────────┘ └───────────┘ └─────────────┘ │
│  ┌───────────────────────────────────────────────────┐   │
│  │         Middleware: jwtAuth, requireRole, validate │   │
│  └───────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────┘
                         │ SQL (pg)
┌────────────────────────▼─────────────────────────────────┐
│                    PostgreSQL Database                    │
│   users │ customers │ products │ challans                 │
│   challan_items │ stock_movements                        │
└──────────────────────────────────────────────────────────┘
```

**Deployment:**
- Frontend → **Vercel** (https://stock-flow-erp-tau.vercel.app/)
- Backend → **Render** (https://stockflow-erp-backend.onrender.com/)
- CI/CD → **GitHub Actions** (`.github/workflows/ci.yml`)

---

## 📋 Business Rules

| Rule | Implementation |
|---|---|
| Stock only deducted on **confirmed** challan | `challanRoutes.ts` — status guard |
| **Negative stock** is prevented | Row-level lock `FOR UPDATE` + quantity check before deduct |
| Product data **snapshotted** at time of sale | `product_snapshot JSONB` column in `challan_items` |
| Challan numbers are **sequential per year** | `CH-YYYY-NNNNN` format, auto-incremented in DB |
| Notes are **append-only** timestamps | `POST /customers/:id/notes` prepends timestamp |
| Role-based **access control** | `requireRole()` middleware on every protected route |

---

## 📁 Repository Structure

```
StockFlow-ERP/
├── .github/workflows/ci.yml     # GitHub Actions CI pipeline
├── backend/
│   ├── src/
│   │   ├── index.ts             # Express app entry point
│   │   ├── db.ts                # PostgreSQL pool
│   │   ├── stockMovementLogic.ts# Shared stock deduction logic
│   │   ├── middleware/          # jwtAuth, requireRole, validate
│   │   └── routes/              # authRoutes, customerRoutes, etc.
│   └── scripts/
│       └── seed-demo-data.mjs   # Populates DB with demo data
├── database/
│   └── schema.sql               # Full PostgreSQL schema
├── docs/
│   ├── architecture.md          # Architecture deep-dive
│   └── api-endpoints.md         # Full API reference
└── frontend/
    ├── src/
    │   ├── App.tsx              # Root component & state
    │   ├── api.ts               # All fetch helpers
    │   ├── types.ts             # TypeScript interfaces
    │   ├── components/          # Sidebar, Header, KpiCard
    │   └── pages/               # One file per module
    └── vite.config.ts
```

---

## ⚠️ Known Limitations & Assumptions

- **Images/Uploads:** Product images (AWS S3) were not implemented as it was marked as an optional bonus, and free tiers for S3 require a credit card for AWS.
- **Reporting:** Advanced historical reports (e.g., month-over-month sales graphs) are not fully implemented; only summary KPIs and current valuations are provided on the Reports page.
- **Assumptions:** It is assumed that multiple warehouse locations exist, but stock is tracked globally per product for simplicity in this MVP.
- **Currency:** All financial figures are assumed to be in INR (₹).

---

## 👨‍💻 Author

**Atul Singh**
- GitHub: https://github.com/atulsingh1501

---

## 📄 License

This project is submitted as part of the **Fundsroom Infotech Full Stack Developer Case Study** and is intended for evaluation purposes only.
