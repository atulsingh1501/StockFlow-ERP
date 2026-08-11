# API Endpoints

## Auth
- `POST /api/auth/login` - Authenticate user and return JWT.
- `GET /api/auth/me` - Get current authenticated user details.

## Customers
- `GET /api/customers` - List customers (supports `?search=` and pagination).
- `POST /api/customers` - Create a new customer.
- `GET /api/customers/:id` - Get specific customer details (including challans).
- `PUT /api/customers/:id` - Update a customer.
- `DELETE /api/customers/:id` - Delete a customer.
- `POST /api/customers/:id/notes` - Add a follow-up note to a customer.

## Products
- `GET /api/products` - List products (supports `?search=` and pagination).
- `POST /api/products` - Create a new product.
- `PUT /api/products/:id` - Update a product.
- `DELETE /api/products/:id` - Delete a product.

## Challans
- `GET /api/challans` - List challans with pagination.
- `GET /api/challans/:id` - Get specific challan details (with line items).
- `POST /api/challans` - Create a new challan (Draft or Confirmed).
- `POST /api/challans/:id/confirm` - Confirm a draft challan (deducts stock).
- `POST /api/challans/:id/cancel` - Cancel a draft challan.

## Stock Movements
- `GET /api/stock/movements` - Get paginated stock movement history.
- `POST /api/stock/movements/in` - Register an incoming stock movement (restock).
- `POST /api/stock/movements/out` - Register an outgoing stock movement.
