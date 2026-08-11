create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'sales', 'warehouse', 'accounts')),
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile_number text not null,
  email text,
  business_name text not null,
  gst_number text,
  customer_type text not null check (customer_type in ('Retail', 'Wholesale', 'Distributor')),
  address text not null,
  status text not null check (status in ('Lead', 'Active', 'Inactive')),
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category text not null,
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  current_stock integer not null default 0 check (current_stock >= 0),
  min_stock_alert_quantity integer not null default 0 check (min_stock_alert_quantity >= 0),
  location_warehouse text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  quantity_changed integer not null check (quantity_changed <> 0),
  movement_type text not null check (movement_type in ('IN', 'OUT', 'ADJUSTMENT')),
  reason text not null,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table if not exists challans (
  id uuid primary key default gen_random_uuid(),
  challan_number text not null unique,
  customer_id uuid not null references customers(id),
  status text not null check (status in ('draft', 'confirmed', 'cancelled')),
  total_quantity integer not null default 0,
  created_by uuid not null references users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists challan_items (
  id uuid primary key default gen_random_uuid(),
  challan_id uuid not null references challans(id) on delete cascade,
  product_id uuid not null references products(id),
  product_snapshot jsonb not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_search on customers using btree (name);
create index if not exists idx_products_search on products using btree (name);
create index if not exists idx_challans_customer_id on challans(customer_id);
create index if not exists idx_stock_movements_product_id on stock_movements(product_id);
