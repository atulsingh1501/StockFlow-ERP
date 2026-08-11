import React from 'react';
import type { Customer, Product, Challan } from '../types';
import { money } from '../api';

type Props = {
  customers: Customer[];
  products: Product[];
  challans: Challan[];
};

export function ReportsPage({ customers, products, challans }: Props) {
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.current_stock * Number(p.unit_price)), 0);
  
  const confirmedChallans = challans.filter(c => c.status === 'confirmed');
  const totalSalesVolume = confirmedChallans.reduce((sum, c) => sum + c.total_quantity, 0);

  const topCustomers = [...customers]
    .map(c => ({
      ...c,
      salesCount: confirmedChallans.filter(ch => ch.customer_name === c.name).length
    }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="grid-two">
        <div className="card card-pad">
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Inventory Valuation Summary</h3>
          <div style={{ padding: 16, background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Total Estimated Stock Value</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#2563EB' }}>{money(totalInventoryValue)}</p>
          </div>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6B7280' }}><th>Category</th><th>Products</th><th>Stock</th></tr>
            </thead>
            <tbody>
              {Object.entries(products.reduce((acc, p) => {
                acc[p.category] = acc[p.category] || { count: 0, stock: 0 };
                acc[p.category].count += 1;
                acc[p.category].stock += p.current_stock;
                return acc;
              }, {} as Record<string, {count: number, stock: number}>)).map(([cat, data]) => (
                <tr key={cat} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px 0', fontWeight: 500 }}>{cat}</td>
                  <td style={{ padding: '8px 0' }}>{data.count}</td>
                  <td style={{ padding: '8px 0' }}>{data.stock} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card-pad">
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Sales Performance (Top Customers)</h3>
          <div style={{ padding: 16, background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>Total Dispatched Volume</p>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#16A34A' }}>{totalSalesVolume} units</p>
          </div>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6B7280' }}><th>Customer</th><th>Status</th><th>Confirmed Challans</th></tr>
            </thead>
            <tbody>
              {topCustomers.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px 0', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '8px 0' }}><span className={`status-badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>{c.salesCount}</td>
                </tr>
              ))}
              {!topCustomers.length && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>No sales data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
