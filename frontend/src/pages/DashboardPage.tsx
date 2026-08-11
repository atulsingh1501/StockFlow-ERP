import React from 'react';
import type { User, Product, Challan, StockMovement } from '../types';
import { KpiCard } from '../components/KpiCard';
import { money } from '../api';

type Props = {
  user: User;
  products: Product[];
  challans: Challan[];
  movements: StockMovement[];
  onTabChange: (tab: string) => void;
};

export function DashboardPage({ user, products, challans, movements, onTabChange }: Props) {
  const lowStockItems = products.filter(p => p.current_stock <= p.min_stock_alert_quantity);
  const totalStockValue = products.reduce((s, p) => s + (p.current_stock * Number(p.unit_price)), 0);
  const confirmedToday = challans.filter(c => c.status === 'confirmed').length;

  // Fast movers: simulate by highest unit price × stock (demo data)
  const fastMovers = [...products].sort((a, b) => Number(b.unit_price) - Number(a.unit_price)).slice(0, 5);

  // Recent activity from movements
  const recentActivity = movements.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome banner */}
      <div className="card card-pad welcome-banner">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Good day, {user.name} · {user.role.charAt(0).toUpperCase() + user.role.slice(1)} access</p>
        </div>
        <div className="action-group">
          <button className="btn btn-primary" onClick={() => onTabChange('products')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
          <button className="btn btn-secondary" onClick={() => onTabChange('challans')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Create Challan
          </button>
          <button className="btn btn-secondary" onClick={() => onTabChange('stock')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            View Reports
          </button>
        </div>
      </div>

      {/* Reorder alert */}
      {lowStockItems.length > 0 && (
        <div className="alert-banner alert-warning">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span><strong>{lowStockItems.length} product{lowStockItems.length > 1 ? 's' : ''}</strong> below reorder level</span>
          <div className="alert-links">
            <button className="alert-link" onClick={() => onTabChange('products')}>View in Inventory</button>
            <button className="alert-link" onClick={() => onTabChange('stock')}>View in Reports</button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Sales Today"
          value={money(challans.filter(c => c.status === 'confirmed').reduce(() => 0, 0))}
          change="-11% vs yesterday"
          changeType="down"
          subLabel="Total sales for today"
          iconBg="#EFF6FF"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <KpiCard
          label="Profit Today"
          value={money(0)}
          change="-6% vs yesterday"
          changeType="down"
          subLabel="Gross profit (approx)"
          iconBg="#F0FDF4"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        />
        <KpiCard
          label="Transactions Today"
          value={String(confirmedToday)}
          change="+0% vs yesterday"
          changeType="neutral"
          subLabel="Sales today"
          iconBg="#FFF7ED"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
        <KpiCard
          label="Total Stock Value"
          value={money(totalStockValue)}
          subLabel="Current inventory value"
          iconBg="#F5F3FF"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />
      </div>

      {/* Low stock + Fast movers */}
      <div className="grid-two">
        {/* Low Stock Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-card-head">
            <div>
              <p className="table-card-title">Items to Reorder</p>
              <p className="table-card-sub">Products below reorder level</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onTabChange('products')}>View all</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Available</th><th>Reorder Level</th></tr></thead>
              <tbody>
                {lowStockItems.slice(0, 6).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td><span className="stock-badge critical">{p.current_stock}</span></td>
                    <td style={{ color: '#6B7280' }}>{p.min_stock_alert_quantity}</td>
                  </tr>
                ))}
                {!lowStockItems.length && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>All stock levels are healthy ✓</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fast Moving Items */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-card-head">
            <div>
              <p className="table-card-title">Fast-Moving Items</p>
              <p className="table-card-sub">Top items by quantity sold recently</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Price</th><th>Stock</th></tr></thead>
              <tbody>
                {fastMovers.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: '#374151' }}>{money(p.unit_price)}</td>
                    <td><span className={`stock-badge ${p.current_stock > p.min_stock_alert_quantity ? 'ok' : 'critical'}`}>{p.current_stock}</span></td>
                  </tr>
                ))}
                {!products.length && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>No products yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card card-pad">
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Recent Activity</h3>
        {recentActivity.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 14 }}>No recent stock movements.</p>}
        {recentActivity.map(m => (
          <div className="activity-item" key={m.id}>
            <div className={`activity-dot ${m.movement_type.toLowerCase()}`} />
            <div>
              <div className="activity-text">
                <strong>{m.product_name}</strong> — {m.movement_type === 'IN' ? `+${m.quantity_changed} added` : m.movement_type === 'OUT' ? `-${m.quantity_changed} dispatched` : `${m.quantity_changed} adjusted`}
                {m.reason ? ` · ${m.reason}` : ''}
              </div>
              <div className="activity-time">by {m.created_by_name} · {new Date(m.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
