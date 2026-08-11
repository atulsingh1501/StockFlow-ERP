# StockFlow ERP Architecture

## High-Level Overview
StockFlow ERP is a monolithic full-stack application composed of:
1. **Frontend:** React SPA built with Vite and Tailwind CSS.
2. **Backend:** Node.js Express REST API.
3. **Database:** PostgreSQL.

## Component Architecture
- **Frontend**
  - Uses role-based routing (Admin, Sales, Warehouse, Accounts).
  - Main components: `Sidebar`, `Header`, `KpiCard`.
  - Pages: `DashboardPage`, `CustomersPage`, `ProductsPage`, `ChallansPage`, `StockPage`, `ReportsPage`.
  - State Management: React Hooks (`useState`, `useEffect`).

- **Backend**
  - **Controllers/Routes:** Handling incoming HTTP requests.
  - **Middleware:** `jwtAuth`, `requireRole`, `validateBody`.
  - **Database Layer:** `pg` (node-postgres) with raw SQL queries to ensure performance and direct control over transactions.

## Design Patterns
- **Service Layer Pattern:** Business logic (like stock deduction and movement logging) is isolated from route handlers.
- **Transaction Management:** Critical operations (e.g., confirming a challan) are wrapped in SQL transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) with row-level locking (`FOR UPDATE`) to prevent race conditions during concurrent stock modifications.
