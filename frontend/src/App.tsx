import { useEffect, useMemo, useState } from 'react';

type Role = 'admin' | 'sales' | 'warehouse' | 'accounts';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Customer = {
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

type Product = {
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

type Challan = {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  total_quantity: number;
  created_by_name: string;
  created_at: string;
};

type StockMovement = {
  id: string;
  product_name: string;
  sku: string;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason: string;
  created_by_name: string;
  created_at: string;
};

type CustomerForm = {
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

type ProductForm = {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minStockAlertQuantity: string;
  locationWarehouse: string;
};

type ChallanItemForm = {
  productId: string;
  quantity: string;
};

type ApiResult<T> = {
  item?: T;
  items?: T[];
  token?: string;
  user?: User;
  message?: string;
  ok?: boolean;
};

type ListResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type CustomerDetail = Customer & {
  challans: Array<{
    id: string;
    challan_number: string;
    status: 'draft' | 'confirmed' | 'cancelled';
    total_quantity: number;
    created_at: string;
  }>;
};

type NoteItem = {
  time: string;
  text: string;
};

type CustomerDetailResponse = {
  item: Customer;
  challans: CustomerDetail['challans'];
};

type Tab = 'customers' | 'products' | 'challans' | 'stock';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const PAGE_SIZE = 6;
const emptyCustomerForm: CustomerForm = {
  name: '',
  mobileNumber: '',
  email: '',
  businessName: '',
  gstNumber: '',
  customerType: 'Retail',
  address: '',
  status: 'Lead',
  followUpDate: '',
  notes: ''
};
const emptyProductForm: ProductForm = {
  name: '',
  sku: '',
  category: '',
  unitPrice: '',
  currentStock: '0',
  minStockAlertQuantity: '0',
  locationWarehouse: ''
};

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });
  const data = (await response.json().catch(() => ({}))) as ApiResult<T>;
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data as T;
}

function money(value: string | number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('fundsroom_token') || '');
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(Boolean(token));
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [notice, setNotice] = useState('');
  const [login, setLogin] = useState({ email: 'admin@fundsroom.com', password: 'Admin@123' });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm);
  const [editingCustomerId, setEditingCustomerId] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [selectedCustomerLoading, setSelectedCustomerLoading] = useState(false);
  const [noteText, setNoteText] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [restockDrafts, setRestockDrafts] = useState<Record<string, string>>({});

  const [challans, setChallans] = useState<Challan[]>([]);
  const [challanPage, setChallanPage] = useState(1);
  const [challanTotalPages, setChallanTotalPages] = useState(1);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementPage, setMovementPage] = useState(1);
  const [movementTotalPages, setMovementTotalPages] = useState(1);
  const [challanForm, setChallanForm] = useState({ customerId: '', status: 'draft', items: [] as ChallanItemForm[] });
  const [draftItem, setDraftItem] = useState<ChallanItemForm>({ productId: '', quantity: '1' });

  const roleTabs = useMemo<Tab[]>(() => {
    if (!user) return [];
    if (user.role === 'sales') return ['customers', 'challans'] as const;
    if (user.role === 'warehouse') return ['products', 'stock'] as const;
    if (user.role === 'accounts') return ['customers', 'stock'] as const;
    return ['customers', 'products', 'challans', 'stock'] as const;
  }, [user]);

  const dashboardStats = [
    { label: 'Customers', value: customers.length, tone: 'customers' },
    { label: 'Products', value: products.length, tone: 'products' },
    { label: 'Challans', value: challans.length, tone: 'challans' },
    { label: 'Stock Logs', value: movements.length, tone: 'stock' }
  ];

  const roleMessage =
    user?.role === 'sales'
      ? 'Create challans and manage customer follow-ups.'
      : user?.role === 'warehouse'
        ? 'Maintain products, stock levels, and movement history.'
        : user?.role === 'accounts'
          ? 'Review customers and stock logs for reconciliation.'
          : 'Full access to customers, products, challans, and stock logs.';

  const activeSectionTitle =
    activeTab === 'customers'
      ? 'Customer CRM'
      : activeTab === 'products'
        ? 'Product Inventory'
        : activeTab === 'challans'
          ? 'Sales Challans'
          : 'Stock Movement Log';

  const activeSectionDescription =
    activeTab === 'customers'
      ? 'Search customers, update their details, and keep follow-up notes in one place.'
      : activeTab === 'products'
        ? 'Add products, manage stock, and watch low-stock alerts at a glance.'
        : activeTab === 'challans'
          ? 'Build draft or confirmed challans with multiple products and auto stock checks.'
          : 'Track IN / OUT inventory movements with reason, user, and timestamp.';

  const demoUsers = [
    { role: 'Admin', id: 'admin@fundsroom.com', password: 'Admin@123' },
    { role: 'Sales', id: 'sales@fundsroom.com', password: 'Sales@123' },
    { role: 'Warehouse', id: 'warehouse@fundsroom.com', password: 'Warehouse@123' },
    { role: 'Accounts', id: 'accounts@fundsroom.com', password: 'Accounts@123' }
  ];

  async function copyDemoCredentials(id: string, password: string) {
    const text = `ID: ${id}\nPassword: ${password}`;
    await navigator.clipboard.writeText(text);
    setNotice('Demo credentials copied to clipboard');
  }

  async function loadCustomerDetail(currentToken: string, id: string) {
    setSelectedCustomerLoading(true);
    try {
      const data = await request<CustomerDetailResponse>(currentToken, `/customers/${id}`);
      setSelectedCustomer(data.item ? { ...data.item, challans: data.challans || [] } : null);
    } finally {
      setSelectedCustomerLoading(false);
    }
  }

  async function loadMe(currentToken: string) {
    const data = await request<{ user: User }>(currentToken, '/auth/me');
    setUser(data.user || null);
    setActiveTab(data.user?.role === 'warehouse' ? 'products' : 'customers');
  }

  async function loadCustomers(currentToken: string, search = customerSearch, page = customerPage) {
    const data = await request<ListResponse<Customer>>(currentToken, `/customers?search=${encodeURIComponent(search)}&page=${page}&limit=${PAGE_SIZE}`);
    setCustomers(data.items || []);
    setCustomerPage(data.page || page);
    setCustomerTotalPages(data.totalPages || 1);
  }

  async function loadProducts(currentToken: string, search = productSearch, page = productPage) {
    const data = await request<ListResponse<Product>>(currentToken, `/products?search=${encodeURIComponent(search)}&page=${page}&limit=${PAGE_SIZE}`);
    setProducts(data.items || []);
    setProductPage(data.page || page);
    setProductTotalPages(data.totalPages || 1);
  }

  async function loadChallans(currentToken: string, page = challanPage) {
    const data = await request<ListResponse<Challan>>(currentToken, `/challans?page=${page}&limit=${PAGE_SIZE}`);
    setChallans(data.items || []);
    setChallanPage(data.page || page);
    setChallanTotalPages(data.totalPages || 1);
  }

  async function loadMovements(currentToken: string, page = movementPage) {
    const data = await request<ListResponse<StockMovement>>(currentToken, `/stock/movements?page=${page}&limit=${PAGE_SIZE}`);
    setMovements(data.items || []);
    setMovementPage(data.page || page);
    setMovementTotalPages(data.totalPages || 1);
  }

  async function refreshAfterMutation(currentToken: string) {
    if (user?.role === 'sales' || user?.role === 'admin' || user?.role === 'accounts') {
      await loadCustomers(currentToken, customerSearch, customerPage);
    }
    if (user?.role === 'warehouse' || user?.role === 'admin' || user?.role === 'sales') {
      await loadProducts(currentToken, productSearch, productPage);
    }
    if (user?.role === 'sales' || user?.role === 'admin') {
      await loadChallans(currentToken, challanPage);
      await loadMovements(currentToken).catch(() => undefined);
    }
    if (user?.role === 'warehouse' || user?.role === 'accounts' || user?.role === 'admin') {
      await loadMovements(currentToken, movementPage).catch(() => undefined);
    }
  }

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }
    loadMe(token)
      .then(() => setBooting(false))
      .catch(() => {
        localStorage.removeItem('fundsroom_token');
        setToken('');
        setUser(null);
        setBooting(false);
      });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    loadCustomers(token, customerSearch, customerPage).catch((error) => setNotice(error.message));
    loadProducts(token, productSearch, productPage).catch(() => undefined);
    loadChallans(token, challanPage).catch(() => undefined);
    loadMovements(token, movementPage).catch(() => undefined);
  }, [token, user, customerPage, productPage, challanPage, movementPage]);

  useEffect(() => {
    if (!token || !user || activeTab !== 'customers') return;
    setCustomerPage(1);
    loadCustomers(token, customerSearch, 1).catch((error) => setNotice(error.message));
  }, [token, user, customerSearch, activeTab]);

  useEffect(() => {
    if (!token || !user || (activeTab !== 'products' && activeTab !== 'stock')) return;
    if (activeTab === 'products') {
      setProductPage(1);
      loadProducts(token, productSearch, 1).catch((error) => setNotice(error.message));
    }
  }, [token, user, productSearch, activeTab]);

  useEffect(() => {
    if (!token || !user || activeTab !== 'challans') return;
    loadChallans(token, challanPage).catch((error) => setNotice(error.message));
  }, [token, user, activeTab, challanPage]);

  useEffect(() => {
    if (!token || !user || activeTab !== 'stock') return;
    loadMovements(token, movementPage).catch((error) => setNotice(error.message));
  }, [token, user, activeTab, movementPage]);

  const allowedTabs = roleTabs;

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setNotice('');
    try {
      const data = await request<{ token: string; user: User }>('' as string, '/auth/login', {
        method: 'POST',
        body: JSON.stringify(login)
      });
      localStorage.setItem('fundsroom_token', data.token);
      setToken(data.token);
      setUser(data.user || null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Login failed');
    }
  }

  function logout() {
    localStorage.removeItem('fundsroom_token');
    setToken('');
    setUser(null);
    setCustomers([]);
    setProducts([]);
    setChallans([]);
    setMovements([]);
    setSelectedCustomer(null);
  }

  async function saveCustomer(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setNotice('');
    try {
      const body = JSON.stringify(customerForm);
      const path = editingCustomerId ? `/customers/${editingCustomerId}` : '/customers';
      const method = editingCustomerId ? 'PUT' : 'POST';
      await request<Customer>(token, path, { method, body });
      setCustomerForm(emptyCustomerForm);
      setEditingCustomerId('');
      await loadCustomers(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCustomer(id: string) {
    setNotice('');
    try {
      await request(token, `/customers/${id}`, { method: 'DELETE' });
      await loadCustomers(token, customerSearch, customerPage);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to delete customer');
    }
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setNotice('');
    try {
      const payload = JSON.stringify(productForm);
      const path = editingProductId ? `/products/${editingProductId}` : '/products';
      const method = editingProductId ? 'PUT' : 'POST';
      await request<Product>(token, path, { method, body: payload });
      setProductForm(emptyProductForm);
      setEditingProductId('');
      await refreshAfterMutation(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    setNotice('');
    try {
      await request(token, `/products/${id}`, { method: 'DELETE' });
      await refreshAfterMutation(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to delete product');
    }
  }

  async function restockProduct(id: string, quantity: number, reason: string) {
    setNotice('');
    try {
      await request(token, '/stock/movements/in', {
        method: 'POST',
        body: JSON.stringify({ productId: id, quantity, reason })
      });
      await refreshAfterMutation(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to add stock');
    }
  }

  async function saveChallan(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setNotice('');
    try {
      await request(token, '/challans', {
        method: 'POST',
        body: JSON.stringify(challanForm)
      });
      setChallanForm({ customerId: '', status: 'draft', items: [] });
      setDraftItem({ productId: '', quantity: '1' });
      await refreshAfterMutation(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to save challan');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmChallan(id: string) {
    setNotice('');
    try {
      await request(token, `/challans/${id}/confirm`, { method: 'POST' });
      await refreshAfterMutation(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to confirm challan');
    }
  }

  async function cancelChallan(id: string) {
    setNotice('');
    try {
      await request(token, `/challans/${id}/cancel`, { method: 'POST' });
      await refreshAfterMutation(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to cancel challan');
    }
  }

  function openCustomerDetail(id: string) {
    setSelectedCustomer(null);
    void loadCustomerDetail(token, id);
  }

  async function addCustomerNote() {
    if (!selectedCustomer || !noteText.trim()) return;
    setNotice('');
    try {
      await request<Customer>(token, `/customers/${selectedCustomer.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: noteText })
      });
      setNoteText('');
      await loadCustomerDetail(token, selectedCustomer.id);
      await loadCustomers(token, customerSearch, customerPage);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to add note');
    }
  }

  function editSelectedCustomer() {
    if (!selectedCustomer) return;
    setEditingCustomerId(selectedCustomer.id);
    setCustomerForm({
      name: selectedCustomer.name,
      mobileNumber: selectedCustomer.mobile_number,
      email: selectedCustomer.email || '',
      businessName: selectedCustomer.business_name,
      gstNumber: selectedCustomer.gst_number || '',
      customerType: selectedCustomer.customer_type,
      address: selectedCustomer.address,
      status: selectedCustomer.status,
      followUpDate: selectedCustomer.follow_up_date || '',
      notes: selectedCustomer.notes || ''
    });
    setActiveTab('customers');
    setSelectedCustomer(null);
  }

  function parseNoteHistory(notes: string | null): NoteItem[] {
    if (!notes) return [];
    return notes
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [time, ...rest] = line.split(' | ');
        return {
          time: time || 'Manual note',
          text: rest.length ? rest.join(' | ') : line
        };
      });
  }

  function addItem() {
    if (!draftItem.productId || Number(draftItem.quantity) <= 0) return;
    setChallanForm((current) => ({
      ...current,
      items: [...current.items, { ...draftItem, quantity: String(Math.trunc(Number(draftItem.quantity))) }]
    }));
    setDraftItem({ productId: '', quantity: '1' });
  }

  if (booting) {
    return <div className="shell center-card">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="shell auth-shell">
        <div className="hero-card auth-hero">
          <p className="eyebrow">Fundsroom Infotech</p>
          <h1>Mini ERP + CRM Operations Portal</h1>
          <p className="hero-copy">A clean, role-based workspace for sales, warehouse, and accounts teams. Login with any role to test the full business flow.</p>
          <div className="feature-list">
            <div>JWT login with role access</div>
            <div>Customer CRM with follow-ups</div>
            <div>Inventory, stock logs, challans</div>
            <div>Modern responsive admin UI</div>
          </div>
          <div className="demo-panel">
            <div className="demo-panel-head">
              <span className="eyebrow">Demo users</span>
              <span className="demo-note">Use these credentials to test each role</span>
            </div>
            <div className="demo-grid">
              {demoUsers.map((demo) => (
                <div key={demo.role} className="demo-card">
                  <div className="demo-role">{demo.role}</div>
                  <div className="demo-row">
                    <span>ID</span>
                    <strong>{demo.id}</strong>
                  </div>
                  <div className="demo-row">
                    <span>Password</span>
                    <strong>{demo.password}</strong>
                  </div>
                  <button type="button" className="ghost demo-copy" onClick={() => copyDemoCredentials(demo.id, demo.password)}>
                    Copy credentials
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <form className="card auth-card" onSubmit={handleLogin}>
          <div>
            <p className="eyebrow">Secure access</p>
            <h2>Sign in</h2>
            <p className="section-caption">Use the built-in test credentials for your role.</p>
          </div>
          <label className="field">
            <span>Email</span>
            <input value={login.email} onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={login.password} onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))} />
          </label>
          <button type="submit">Sign in</button>
          {notice ? <p className="notice notice-soft">{notice}</p> : null}
        </form>
      </div>
    );
  }

  if (selectedCustomerLoading) {
    return <div className="shell center-card">Loading customer...</div>;
  }

  if (selectedCustomer) {
    return (
      <div className="shell dashboard-shell">
        <header className="topbar card">
          <div className="brand-block">
            <p className="eyebrow">Customer Detail</p>
            <h1>{selectedCustomer.name}</h1>
            <p className="section-caption">{selectedCustomer.business_name}</p>
          </div>
          <div className="user-strip">
            <button type="button" className="ghost" onClick={() => setSelectedCustomer(null)}>Back to list</button>
            <button type="button" onClick={editSelectedCustomer}>Edit customer</button>
          </div>
        </header>

        <section className="card detail-hero">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>{selectedCustomer.mobile_number}</h2>
            <p className="hero-copy">{selectedCustomer.email || 'No email provided'}</p>
          </div>
          <div className="detail-grid">
            <div><span>Status</span><strong>{selectedCustomer.status}</strong></div>
            <div><span>Type</span><strong>{selectedCustomer.customer_type}</strong></div>
            <div><span>GST</span><strong>{selectedCustomer.gst_number || '-'}</strong></div>
            <div><span>Follow-up</span><strong>{selectedCustomer.follow_up_date || '-'}</strong></div>
          </div>
        </section>

        <section className="workspace grid-two">
          <div className="card form-card">
            <div className="section-head">
              <h2>Address & Follow-ups</h2>
            </div>
            <div className="detail-block">
              <span>Address</span>
              <p>{selectedCustomer.address}</p>
            </div>
            <div className="detail-block">
              <span>Add follow-up note</span>
              <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Write a follow-up note" />
              <button type="button" onClick={addCustomerNote}>Save note</button>
            </div>
            <div className="detail-block">
              <span>Note history</span>
              <div className="note-list">
                {parseNoteHistory(selectedCustomer.notes).map((note, index) => (
                  <div key={`${note.time}-${index}`} className="note-item">
                    <strong>{note.time}</strong>
                    <p>{note.text}</p>
                  </div>
                ))}
                {!parseNoteHistory(selectedCustomer.notes).length ? <p>No notes added yet.</p> : null}
              </div>
            </div>
          </div>

          <div className="card table-card">
            <div className="section-head">
              <h2>Recent Challans</h2>
              <span>{selectedCustomer.challans.length} records</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Status</th>
                    <th>Total Qty</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.challans.map((challan) => (
                    <tr key={challan.id}>
                      <td>{challan.challan_number}</td>
                      <td>{challan.status}</td>
                      <td>{challan.total_quantity}</td>
                      <td>{new Date(challan.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!selectedCustomer.challans.length ? (
                    <tr>
                      <td colSpan={4}>No challans yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="shell dashboard-shell">
      <header className="topbar card">
        <div className="brand-block">
          <p className="eyebrow">Fundsroom Infotech</p>
          <h1>Operations Portal</h1>
          <p className="section-caption">Role-based workspace for day-to-day ERP and CRM operations.</p>
        </div>
        <div className="user-strip">
          <span className="user-chip">{user.name}</span>
          <span className="user-chip subtle">{user.role}</span>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="card dashboard-hero">
        <div>
          <p className="eyebrow">Current role</p>
          <h2>{user.role}</h2>
          <p className="hero-copy">{roleMessage}</p>
        </div>
        <div className="hero-actions">
          <span className="status-pill">{allowedTabs.length} modules available</span>
          <span className="status-pill subtle">Safe stock confirmation enabled</span>
        </div>
      </section>

      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className={`card stat-card ${stat.tone}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </section>

      <nav className="tabs card">
        {allowedTabs.includes('customers') ? <button type="button" className={activeTab === 'customers' ? 'active' : ''} onClick={() => setActiveTab('customers')}>Customers</button> : null}
        {allowedTabs.includes('products') ? <button type="button" className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Products</button> : null}
        {allowedTabs.includes('challans') ? <button type="button" className={activeTab === 'challans' ? 'active' : ''} onClick={() => setActiveTab('challans')}>Challans</button> : null}
        {allowedTabs.includes('stock') ? <button type="button" className={activeTab === 'stock' ? 'active' : ''} onClick={() => setActiveTab('stock')}>Stock Log</button> : null}
      </nav>

      {notice ? <div className="card notice-banner">{notice}</div> : null}

      <section className="card section-intro">
        <div>
          <h2>{activeSectionTitle}</h2>
          <p className="section-caption">{activeSectionDescription}</p>
        </div>
        <div className="section-meta">
          <span className="status-pill subtle">Search enabled</span>
          <span className="status-pill subtle">Responsive layout</span>
        </div>
      </section>

      {activeTab === 'customers' ? (
        <section className="workspace grid-two">
          <form className="card form-card" onSubmit={saveCustomer}>
            <div className="section-head">
              <h2>{editingCustomerId ? 'Edit Customer' : 'Add Customer'}</h2>
              {editingCustomerId ? <button type="button" className="ghost" onClick={() => { setEditingCustomerId(''); setCustomerForm(emptyCustomerForm); }}>Cancel</button> : null}
            </div>
            <label>Search</label>
            <input value={customerSearch} onChange={(event) => { setCustomerSearch(event.target.value); setCustomerPage(1); }} placeholder="Search name, business or mobile" />
            <div className="grid-inputs">
              <input required placeholder="Customer name" value={customerForm.name} onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))} />
              <input required placeholder="Mobile number" value={customerForm.mobileNumber} onChange={(event) => setCustomerForm((current) => ({ ...current, mobileNumber: event.target.value }))} />
              <input placeholder="Email" value={customerForm.email} onChange={(event) => setCustomerForm((current) => ({ ...current, email: event.target.value }))} />
              <input required placeholder="Business name" value={customerForm.businessName} onChange={(event) => setCustomerForm((current) => ({ ...current, businessName: event.target.value }))} />
              <input placeholder="GST number" value={customerForm.gstNumber} onChange={(event) => setCustomerForm((current) => ({ ...current, gstNumber: event.target.value }))} />
              <select value={customerForm.customerType} onChange={(event) => setCustomerForm((current) => ({ ...current, customerType: event.target.value as Customer['customer_type'] }))}>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
              <input required placeholder="Address" value={customerForm.address} onChange={(event) => setCustomerForm((current) => ({ ...current, address: event.target.value }))} />
              <select value={customerForm.status} onChange={(event) => setCustomerForm((current) => ({ ...current, status: event.target.value as Customer['status'] }))}>
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input type="date" value={customerForm.followUpDate} onChange={(event) => setCustomerForm((current) => ({ ...current, followUpDate: event.target.value }))} />
              <textarea placeholder="Notes" value={customerForm.notes} onChange={(event) => setCustomerForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>
            <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingCustomerId ? 'Update Customer' : 'Save Customer'}</button>
          </form>

          <div className="card table-card">
            <div className="section-head">
              <h2>Customer List</h2>
              <span>{customers.length} records</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Business</th>
                    <th>Mobile</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} onClick={() => openCustomerDetail(customer.id)} className="clickable-row">
                      <td>{customer.name}</td>
                      <td>{customer.business_name}</td>
                      <td>{customer.mobile_number}</td>
                      <td>{customer.status}</td>
                      <td className="actions">
                        <button type="button" className="ghost" onClick={(event) => { event.stopPropagation(); setEditingCustomerId(customer.id); setCustomerForm({ name: customer.name, mobileNumber: customer.mobile_number, email: customer.email || '', businessName: customer.business_name, gstNumber: customer.gst_number || '', customerType: customer.customer_type, address: customer.address, status: customer.status, followUpDate: customer.follow_up_date || '', notes: customer.notes || '' }); }}>Edit</button>
                        <button type="button" className="ghost" onClick={(event) => { event.stopPropagation(); openCustomerDetail(customer.id); }}>View</button>
                        <button type="button" className="danger" onClick={(event) => { event.stopPropagation(); deleteCustomer(customer.id); }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-bar">
              <button type="button" className="ghost" disabled={customerPage <= 1} onClick={() => setCustomerPage((page) => Math.max(page - 1, 1))}>Prev</button>
              <span>Page {customerPage} of {customerTotalPages}</span>
              <button type="button" className="ghost" disabled={customerPage >= customerTotalPages} onClick={() => setCustomerPage((page) => Math.min(page + 1, customerTotalPages))}>Next</button>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'products' ? (
        <section className="workspace grid-two">
          <form className="card form-card" onSubmit={saveProduct}>
            <div className="section-head">
              <h2>{editingProductId ? 'Edit Product' : 'Add Product'}</h2>
              {editingProductId ? <button type="button" className="ghost" onClick={() => { setEditingProductId(''); setProductForm(emptyProductForm); }}>Cancel</button> : null}
            </div>
            <label>Search</label>
            <input value={productSearch} onChange={(event) => { setProductSearch(event.target.value); setProductPage(1); }} placeholder="Search name, sku or category" />
            <div className="grid-inputs">
              <input required placeholder="Product name" value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} />
              <input required placeholder="SKU" value={productForm.sku} onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))} />
              <input required placeholder="Category" value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} />
              <input required type="number" step="0.01" placeholder="Unit price" value={productForm.unitPrice} onChange={(event) => setProductForm((current) => ({ ...current, unitPrice: event.target.value }))} />
              <input required type="number" placeholder="Opening stock" value={productForm.currentStock} disabled={Boolean(editingProductId)} onChange={(event) => setProductForm((current) => ({ ...current, currentStock: event.target.value }))} />
              <input required type="number" placeholder="Min stock alert" value={productForm.minStockAlertQuantity} onChange={(event) => setProductForm((current) => ({ ...current, minStockAlertQuantity: event.target.value }))} />
              <input required placeholder="Warehouse location" value={productForm.locationWarehouse} onChange={(event) => setProductForm((current) => ({ ...current, locationWarehouse: event.target.value }))} />
            </div>
            <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : editingProductId ? 'Update Product' : 'Save Product'}</button>
          </form>

          <div className="card table-card">
            <div className="section-head">
              <h2>Product List</h2>
              <span>{products.length} records</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Restock</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className={product.current_stock <= product.min_stock_alert_quantity ? 'low-stock' : ''}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{product.current_stock}</td>
                      <td>{money(product.unit_price)}</td>
                      <td className="line-item">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={restockDrafts[product.id] || ''}
                          onChange={(event) => setRestockDrafts((current) => ({ ...current, [product.id]: event.target.value }))}
                        />
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => {
                            const qty = Number(restockDrafts[product.id]);
                            if (!Number.isInteger(qty) || qty <= 0) {
                              setNotice('Enter a positive whole number to restock');
                              return;
                            }
                            void restockProduct(product.id, qty, 'Manual restock');
                            setRestockDrafts((current) => ({ ...current, [product.id]: '' }));
                          }}
                        >
                          Add stock
                        </button>
                      </td>
                      <td className="actions">
                        <button type="button" className="ghost" onClick={() => { setEditingProductId(product.id); setProductForm({ name: product.name, sku: product.sku, category: product.category, unitPrice: product.unit_price, currentStock: String(product.current_stock), minStockAlertQuantity: String(product.min_stock_alert_quantity), locationWarehouse: product.location_warehouse }); }}>Edit</button>
                        <button type="button" className="danger" onClick={() => deleteProduct(product.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-bar">
              <button type="button" className="ghost" disabled={productPage <= 1} onClick={() => setProductPage((page) => Math.max(page - 1, 1))}>Prev</button>
              <span>Page {productPage} of {productTotalPages}</span>
              <button type="button" className="ghost" disabled={productPage >= productTotalPages} onClick={() => setProductPage((page) => Math.min(page + 1, productTotalPages))}>Next</button>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'challans' ? (
        <section className="workspace grid-two">
          <form className="card form-card" onSubmit={saveChallan}>
            <div className="section-head">
              <h2>Create Challan</h2>
              <span>Stock reduces only on confirmed status</span>
            </div>
            <div className="grid-inputs">
              <select required value={challanForm.customerId} onChange={(event) => setChallanForm((current) => ({ ...current, customerId: event.target.value }))}>
                <option value="">Select customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} - {customer.business_name}</option>)}
              </select>
              <select value={challanForm.status} onChange={(event) => setChallanForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
            <div className="line-item">
              <select value={draftItem.productId} onChange={(event) => setDraftItem((current) => ({ ...current, productId: event.target.value }))}>
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.current_stock} in stock)</option>)}
              </select>
              <input type="number" min="1" value={draftItem.quantity} onChange={(event) => setDraftItem((current) => ({ ...current, quantity: event.target.value }))} />
              <button type="button" className="ghost" onClick={addItem}>Add item</button>
            </div>
            <div className="item-list">
              {challanForm.items.map((item, index) => {
                const product = products.find((entry) => entry.id === item.productId);
                return (
                  <div key={`${item.productId}-${index}`} className="item-row">
                    <span>{product?.name || 'Unknown product'}</span>
                    <span>Qty {item.quantity}</span>
                    <button type="button" className="ghost" onClick={() => setChallanForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button>
                  </div>
                );
              })}
            </div>
            <button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Challan'}</button>
          </form>

          <div className="card table-card">
            <div className="section-head">
              <h2>Challan List</h2>
              <span>{challans.length} records</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total Qty</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {challans.map((challan) => (
                    <tr key={challan.id}>
                      <td>{challan.challan_number}</td>
                      <td>{challan.customer_name}</td>
                      <td>{challan.status}</td>
                      <td>{challan.total_quantity}</td>
                      <td className="actions">
                        {challan.status === 'draft' ? (
                          <span className="action-group">
                            <button type="button" onClick={() => confirmChallan(challan.id)}>Confirm</button>
                            <button type="button" className="ghost" onClick={() => cancelChallan(challan.id)}>Cancel</button>
                          </span>
                        ) : (
                          <span className="muted">{challan.status === 'cancelled' ? 'Cancelled' : 'Locked'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-bar">
              <button type="button" className="ghost" disabled={challanPage <= 1} onClick={() => setChallanPage((page) => Math.max(page - 1, 1))}>Prev</button>
              <span>Page {challanPage} of {challanTotalPages}</span>
              <button type="button" className="ghost" disabled={challanPage >= challanTotalPages} onClick={() => setChallanPage((page) => Math.min(page + 1, challanTotalPages))}>Next</button>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'stock' ? (
        <section className="card table-card full-width">
          <div className="section-head">
            <h2>Stock Movement Log</h2>
            <span>{movements.length} events</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Change</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.product_name}</td>
                    <td>{movement.sku}</td>
                    <td>{movement.quantity_changed}</td>
                    <td>{movement.movement_type}</td>
                    <td>{movement.reason}</td>
                    <td>{movement.created_by_name}</td>
                    <td>{new Date(movement.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-bar">
            <button type="button" className="ghost" disabled={movementPage <= 1} onClick={() => setMovementPage((page) => Math.max(page - 1, 1))}>Prev</button>
            <span>Page {movementPage} of {movementTotalPages}</span>
            <button type="button" className="ghost" disabled={movementPage >= movementTotalPages} onClick={() => setMovementPage((page) => Math.min(page + 1, movementTotalPages))}>Next</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default App;