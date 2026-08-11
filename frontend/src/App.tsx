import React, { useEffect, useMemo, useState } from 'react';

import type {
  User, Customer, Product, Challan, StockMovement,
  CustomerForm, ProductForm, ChallanItemForm,
  CustomerDetail, CustomerDetailResponse, ListResponse, Tab
} from './types';
import { request, money, PAGE_SIZE, API_BASE } from './api';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { ProductsPage } from './pages/ProductsPage';
import { ChallansPage } from './pages/ChallansPage';
import { StockPage } from './pages/StockPage';
import { ReportsPage } from './pages/ReportsPage';

const emptyCustomerForm: CustomerForm = {
  name: '', mobileNumber: '', email: '', businessName: '', gstNumber: '',
  customerType: 'Retail', address: '', status: 'Lead', followUpDate: '', notes: ''
};
const emptyProductForm: ProductForm = {
  name: '', sku: '', category: '', unitPrice: '', currentStock: '0',
  minStockAlertQuantity: '0', locationWarehouse: ''
};

const DEMO_USERS = [
  { role: 'Admin',     id: 'admin@fundsroom.com',     password: 'Admin@123' },
  { role: 'Sales',     id: 'sales@fundsroom.com',     password: 'Sales@123' },
  { role: 'Warehouse', id: 'warehouse@fundsroom.com', password: 'Warehouse@123' },
  { role: 'Accounts',  id: 'accounts@fundsroom.com',  password: 'Accounts@123' }
];

function App() {
  const [token, setToken]   = useState(localStorage.getItem('fundsroom_token') || '');
  const [user, setUser]     = useState<User | null>(null);
  const [booting, setBooting] = useState(Boolean(token));
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [notice, setNotice] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [login, setLogin]   = useState({ email: 'admin@fundsroom.com', password: 'Admin@123' });

  const [customers, setCustomers]             = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch]   = useState('');
  const [customerForm, setCustomerForm]       = useState<CustomerForm>(emptyCustomerForm);
  const [editingCustomerId, setEditingCustomerId] = useState('');
  const [customerPage, setCustomerPage]       = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer]  = useState<CustomerDetail | null>(null);
  const [selectedCustomerLoading, setSelectedCustomerLoading] = useState(false);
  const [noteText, setNoteText]               = useState('');

  const [products, setProducts]               = useState<Product[]>([]);
  const [productSearch, setProductSearch]     = useState('');
  const [productForm, setProductForm]         = useState<ProductForm>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState('');
  const [productPage, setProductPage]         = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [restockDrafts, setRestockDrafts]     = useState<Record<string, string>>({});

  const [challans, setChallans]               = useState<Challan[]>([]);
  const [challanPage, setChallanPage]         = useState(1);
  const [challanTotalPages, setChallanTotalPages] = useState(1);
  const [challanForm, setChallanForm]         = useState({ customerId: '', status: 'draft', items: [] as ChallanItemForm[] });
  const [draftItem, setDraftItem]             = useState<ChallanItemForm>({ productId: '', quantity: '1' });

  const [movements, setMovements]             = useState<StockMovement[]>([]);
  const [movementPage, setMovementPage]       = useState(1);
  const [movementTotalPages, setMovementTotalPages] = useState(1);

  const roleTabs = useMemo<Tab[]>(() => {
    if (!user) return [];
    if (user.role === 'sales')     return ['dashboard','customers','challans'];
    if (user.role === 'warehouse') return ['dashboard','products','stock'];
    if (user.role === 'accounts')  return ['dashboard','customers','stock'];
    return ['dashboard','customers','products','challans','stock','reports','settings'];
  }, [user]);

  // ── loaders ──────────────────────────────────────────────────
  async function loadMe(t: string) {
    const d = await request<{ user: User }>(t, '/auth/me');
    setUser(d.user || null);
    setActiveTab('dashboard');
  }
  async function loadCustomers(t: string, search = customerSearch, page = customerPage) {
    const d = await request<ListResponse<Customer>>(t, `/customers?search=${encodeURIComponent(search)}&page=${page}&limit=${PAGE_SIZE}`);
    setCustomers(d.items || []); setCustomerPage(d.page || page); setCustomerTotalPages(d.totalPages || 1);
  }
  async function loadProducts(t: string, search = productSearch, page = productPage) {
    const d = await request<ListResponse<Product>>(t, `/products?search=${encodeURIComponent(search)}&page=${page}&limit=${PAGE_SIZE}`);
    setProducts(d.items || []); setProductPage(d.page || page); setProductTotalPages(d.totalPages || 1);
  }
  async function loadChallans(t: string, page = challanPage) {
    const d = await request<ListResponse<Challan>>(t, `/challans?page=${page}&limit=${PAGE_SIZE}`);
    setChallans(d.items || []); setChallanPage(d.page || page); setChallanTotalPages(d.totalPages || 1);
  }
  async function loadMovements(t: string, page = movementPage) {
    const d = await request<ListResponse<StockMovement>>(t, `/stock/movements?page=${page}&limit=${PAGE_SIZE}`);
    setMovements(d.items || []); setMovementPage(d.page || page); setMovementTotalPages(d.totalPages || 1);
  }
  async function loadCustomerDetail(t: string, id: string) {
    setSelectedCustomerLoading(true);
    try {
      const d = await request<CustomerDetailResponse>(t, `/customers/${id}`);
      setSelectedCustomer(d.item ? { ...d.item, challans: d.challans || [] } : null);
    } finally { setSelectedCustomerLoading(false); }
  }
  async function refreshAll(t: string) {
    await loadCustomers(t, customerSearch, customerPage).catch(() => undefined);
    await loadProducts(t, productSearch, productPage).catch(() => undefined);
    await loadChallans(t, challanPage).catch(() => undefined);
    await loadMovements(t, movementPage).catch(() => undefined);
  }

  // ── effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setBooting(false); return; }
    loadMe(token).then(() => setBooting(false)).catch(() => { localStorage.removeItem('fundsroom_token'); setToken(''); setUser(null); setBooting(false); });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    loadCustomers(token, customerSearch, customerPage).catch(e => setNotice(e.message));
    loadProducts(token, productSearch, productPage).catch(() => undefined);
    loadChallans(token, challanPage).catch(() => undefined);
    loadMovements(token, movementPage).catch(() => undefined);
  }, [token, user, customerPage, productPage, challanPage, movementPage]);

  useEffect(() => {
    if (!token || !user) return;
    setCustomerPage(1); loadCustomers(token, customerSearch, 1).catch(e => setNotice(e.message));
  }, [customerSearch]);

  useEffect(() => {
    if (!token || !user) return;
    setProductPage(1); loadProducts(token, productSearch, 1).catch(e => setNotice(e.message));
  }, [productSearch]);

  // ── actions ───────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setNotice('');
    try {
      const d = await request<{ token: string; user: User }>('', '/auth/login', { method: 'POST', body: JSON.stringify(login) });
      localStorage.setItem('fundsroom_token', d.token);
      setToken(d.token); setUser(d.user || null);
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Login failed'); }
  }

  function logout() {
    localStorage.removeItem('fundsroom_token');
    setToken(''); setUser(null);
    setCustomers([]); setProducts([]); setChallans([]); setMovements([]);
    setSelectedCustomer(null);
  }

  async function saveCustomer(e: React.FormEvent) {
    e.preventDefault(); setIsSaving(true); setNotice('');
    try {
      const path = editingCustomerId ? `/customers/${editingCustomerId}` : '/customers';
      await request<Customer>(token, path, { method: editingCustomerId ? 'PUT' : 'POST', body: JSON.stringify(customerForm) });
      setCustomerForm(emptyCustomerForm); setEditingCustomerId('');
      await loadCustomers(token);
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
    finally { setIsSaving(false); }
  }

  async function deleteCustomer(id: string) {
    try { await request(token, `/customers/${id}`, { method: 'DELETE' }); await loadCustomers(token, customerSearch, customerPage); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault(); setIsSaving(true); setNotice('');
    try {
      const path = editingProductId ? `/products/${editingProductId}` : '/products';
      await request<Product>(token, path, { method: editingProductId ? 'PUT' : 'POST', body: JSON.stringify(productForm) });
      setProductForm(emptyProductForm); setEditingProductId('');
      await refreshAll(token);
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
    finally { setIsSaving(false); }
  }

  async function deleteProduct(id: string) {
    try { await request(token, `/products/${id}`, { method: 'DELETE' }); await refreshAll(token); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
  }

  async function restockProduct(id: string, qty: number, reason: string) {
    try { await request(token, '/stock/movements/in', { method: 'POST', body: JSON.stringify({ productId: id, quantity: qty, reason }) }); await refreshAll(token); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
  }

  async function saveChallan(e: React.FormEvent) {
    e.preventDefault(); setIsSaving(true); setNotice('');
    try {
      await request(token, '/challans', { method: 'POST', body: JSON.stringify(challanForm) });
      setChallanForm({ customerId: '', status: 'draft', items: [] });
      setDraftItem({ productId: '', quantity: '1' });
      await refreshAll(token);
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
    finally { setIsSaving(false); }
  }

  async function confirmChallan(id: string) {
    try { await request(token, `/challans/${id}/confirm`, { method: 'POST' }); await refreshAll(token); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
  }

  async function cancelChallan(id: string) {
    try { await request(token, `/challans/${id}/cancel`, { method: 'POST' }); await refreshAll(token); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
  }

  async function addCustomerNote() {
    if (!selectedCustomer || !noteText.trim()) return;
    try {
      await request<Customer>(token, `/customers/${selectedCustomer.id}/notes`, { method: 'POST', body: JSON.stringify({ note: noteText }) });
      setNoteText('');
      await loadCustomerDetail(token, selectedCustomer.id);
      await loadCustomers(token, customerSearch, customerPage);
    } catch (err) { setNotice(err instanceof Error ? err.message : 'Failed'); }
  }

  // ── page title map ────────────────────────────────────────────
  const PAGE_TITLES: Record<Tab, string> = {
    dashboard: 'Dashboard', customers: 'Customers', products: 'Products',
    challans: 'Sales Challans', stock: 'Stock Movements', reports: 'Reports', settings: 'Settings'
  };

  // ── Render: loading ───────────────────────────────────────────
  if (booting) return (
    <div className="main-wrapper" style={{ padding: 24 }}>
      <div style={{ height: 60, background: '#F3F4F6', borderRadius: 12, marginBottom: 24, animation: 'pulse 2s infinite' }} />
      <div className="grid-two">
        <div style={{ height: 200, background: '#F3F4F6', borderRadius: 12, animation: 'pulse 2s infinite' }} />
        <div style={{ height: 200, background: '#F3F4F6', borderRadius: 12, animation: 'pulse 2s infinite' }} />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
    </div>
  );

  // ── Render: login ─────────────────────────────────────────────
  if (!user) return (
    <div className="auth-shell">
      <div className="auth-left">
        <div>
          <div className="auth-brand-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            StockFlow ERP
          </div>
          <h1 className="auth-heading">Smart inventory,<br/>effortless operations.</h1>
          <p className="auth-sub">A role-based ERP + CRM for sales, warehouse, and accounts teams. Real-time stock, challans, and customer follow-ups.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
            {['JWT role-based login','Customer CRM','Inventory & stock logs','Sales challans'].map(f => (
              <span key={f} className="feature-pill">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {f}
              </span>
            ))}
          </div>
          <div className="demo-grid">
            {DEMO_USERS.map(u => (
              <div key={u.role} className="demo-card-item" style={{ cursor: 'pointer' }} onClick={() => {
                setLogin({ email: u.id, password: u.password });
                setNotice(''); // clear any previous errors
              }}>
                <div className="demo-role-badge">{u.role}</div>
                <div className="demo-cred">
                  <div><strong>{u.id}</strong></div>
                  <div>Password: <strong>{u.password}</strong></div>
                </div>
                <button className="copy-btn-small">Fill</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <form className="auth-card" onSubmit={handleLogin}>
          <div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Sign in</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#6B7280' }}>Use the demo credentials to explore.</p>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" required value={login.email} onChange={e => setLogin(l => ({ ...l, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" required value={login.password} onChange={e => setLogin(l => ({ ...l, password: e.target.value }))} />
          </div>
          {notice && <div className="notice-bar">{notice}</div>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14.5 }}>Sign in →</button>
        </form>
      </div>
    </div>
  );

  if (selectedCustomerLoading) return (
    <div className="loading-screen"><div className="spinner"/></div>
  );

  // ── Render: main app ──────────────────────────────────────────
  return (
    <>
      <Sidebar
        activeTab={activeTab}
        onTabChange={t => setActiveTab(t as Tab)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
        allowedTabs={roleTabs}
        onLogout={logout}
        userName={user.name}
        userRole={user.role}
      />
      <div className={`main-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Header
          title={PAGE_TITLES[activeTab]}
          userName={user.name}
          userRole={user.role}
          onNavigate={(tab, id) => {
            setActiveTab(tab as Tab);
            if (tab === 'customers') {
              setSelectedCustomer(null);
              void loadCustomerDetail(token, id);
            } else if (tab === 'products') {
              setProductSearch('');
            }
          }}
        />
        <main className="content-area">
          {notice && (
            <div className={`notice-bar${notice.includes('copied') || notice.includes('success') ? ' notice-success' : ''}`}>
              {notice}
              <button style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: 16 }} onClick={() => setNotice('')}>×</button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              user={user} customers={customers} products={products} challans={challans} movements={movements}
              onTabChange={t => setActiveTab(t as Tab)}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersPage
              customers={customers} customerSearch={customerSearch} setCustomerSearch={setCustomerSearch}
              customerPage={customerPage} customerTotalPages={customerTotalPages} setCustomerPage={setCustomerPage}
              customerForm={customerForm} setCustomerForm={setCustomerForm}
              editingCustomerId={editingCustomerId} setEditingCustomerId={setEditingCustomerId}
              isSaving={isSaving} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
              noteText={noteText} setNoteText={setNoteText}
              onSave={saveCustomer} onDelete={deleteCustomer} onOpenDetail={id => { setSelectedCustomer(null); void loadCustomerDetail(token, id); }}
              onAddNote={addCustomerNote} emptyForm={emptyCustomerForm}
            />
          )}

          {activeTab === 'products' && (
            <ProductsPage
              products={products} productSearch={productSearch} setProductSearch={setProductSearch}
              productPage={productPage} productTotalPages={productTotalPages} setProductPage={setProductPage}
              productForm={productForm} setProductForm={setProductForm}
              editingProductId={editingProductId} setEditingProductId={setEditingProductId}
              isSaving={isSaving} restockDrafts={restockDrafts} setRestockDrafts={setRestockDrafts}
              onSave={saveProduct} onDelete={deleteProduct} onRestock={restockProduct}
              setNotice={setNotice} emptyForm={emptyProductForm}
            />
          )}

          {activeTab === 'challans' && (
            <ChallansPage
              challans={challans} customers={customers} products={products}
              challanPage={challanPage} challanTotalPages={challanTotalPages} setChallanPage={setChallanPage}
              challanForm={challanForm} setChallanForm={setChallanForm}
              draftItem={draftItem} setDraftItem={setDraftItem}
              isSaving={isSaving} onSave={saveChallan} onConfirm={confirmChallan} onCancel={cancelChallan}
            />
          )}

          {activeTab === 'stock' && (
            <StockPage
              movements={movements} movementPage={movementPage}
              movementTotalPages={movementTotalPages} setMovementPage={setMovementPage}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage customers={customers} products={products} challans={challans} />
          )}

          {activeTab === 'settings' && (
            <div className="card card-pad" style={{ textAlign: 'center', padding: '60px 24px', color: '#9CA3AF' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.41 1.41M19.07 19.07a10 10 0 0 1-1.41 1.41M4.93 19.07a10 10 0 0 1-1.41-1.41M4.93 4.93a10 10 0 0 1 1.41-1.41"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
              <p style={{ fontWeight: 600, fontSize: 15, color: '#374151', margin: 0 }}>Settings</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Logged in as <strong>{user.email}</strong> · Role: <strong>{user.role}</strong></p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;