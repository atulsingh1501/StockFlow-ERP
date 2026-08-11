export type Role = 'admin' | 'sales' | 'warehouse' | 'accounts';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Customer = {
  id: string;
  name: string;
  mobile_number: string;
  email: string | null;
  business_name: string;
  gst_number: string | null;
  customer_type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string | null;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: string;
  current_stock: number;
  min_stock_alert_quantity: number;
  location_warehouse: string;
  active: boolean;
};

export type Challan = {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  total_quantity: number;
  created_by_name: string;
  created_at: string;
};

export type StockMovement = {
  id: string;
  product_name: string;
  sku: string;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason: string;
  created_by_name: string;
  created_at: string;
};

export type CustomerForm = {
  name: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  gstNumber: string;
  customerType: Customer['customer_type'];
  address: string;
  status: Customer['status'];
  followUpDate: string;
  notes: string;
};

export type ProductForm = {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minStockAlertQuantity: string;
  locationWarehouse: string;
};

export type ChallanItemForm = {
  productId: string;
  quantity: string;
};

export type ApiResult<T> = {
  item?: T;
  items?: T[];
  token?: string;
  user?: User;
  message?: string;
  ok?: boolean;
};

export type ListResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomerDetail = Customer & {
  challans: Array<{
    id: string;
    challan_number: string;
    status: 'draft' | 'confirmed' | 'cancelled';
    total_quantity: number;
    created_at: string;
  }>;
};

export type CustomerDetailResponse = {
  item: Customer;
  challans: CustomerDetail['challans'];
};

export type NoteItem = { time: string; text: string };

export type Tab = 'dashboard' | 'customers' | 'products' | 'challans' | 'stock' | 'reports' | 'settings';
