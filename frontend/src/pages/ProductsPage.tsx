import React from 'react';
import type { Product, ProductForm } from '../types';
import { money } from '../api';

type Props = {
  products: Product[];
  productSearch: string;
  setProductSearch: (v: string) => void;
  productPage: number;
  productTotalPages: number;
  setProductPage: (fn: (p: number) => number) => void;
  productForm: ProductForm;
  setProductForm: (fn: (f: ProductForm) => ProductForm) => void;
  editingProductId: string;
  setEditingProductId: (id: string) => void;
  isSaving: boolean;
  restockDrafts: Record<string, string>;
  setRestockDrafts: (fn: (d: Record<string, string>) => Record<string, string>) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  onRestock: (id: string, qty: number, reason: string) => void;
  setNotice: (v: string) => void;
  emptyForm: ProductForm;
};

export function ProductsPage({
  products, productSearch, setProductSearch, productPage, productTotalPages, setProductPage,
  productForm, setProductForm, editingProductId, setEditingProductId, isSaving,
  restockDrafts, setRestockDrafts, onSave, onDelete, onRestock, setNotice, emptyForm
}: Props) {
  const set = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProductForm(f => ({ ...f, [k]: e.target.value }));

  const lowStockCount = products.filter(p => p.current_stock <= p.min_stock_alert_quantity).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="grid-two">
        {/* Form */}
        <form className="card card-pad" onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{editingProductId ? 'Edit Product' : 'Add Product'}</h3>
            {editingProductId && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditingProductId(''); setProductForm(() => emptyForm); }}>Cancel</button>}
          </div>
          <div className="form-group">
            <label>Search</label>
            <input className="form-control" value={productSearch} onChange={e => { setProductSearch(e.target.value); setProductPage(() => 1); }} placeholder="Name, SKU, category…" />
          </div>
          <div className="form-grid">
            <div className="form-group"><label>Product Name *</label><input className="form-control" required value={productForm.name} onChange={set('name')} /></div>
            <div className="form-group"><label>SKU *</label><input className="form-control" required value={productForm.sku} onChange={set('sku')} /></div>
            <div className="form-group"><label>Category *</label><input className="form-control" required value={productForm.category} onChange={set('category')} /></div>
            <div className="form-group"><label>Unit Price *</label><input className="form-control" required type="number" step="0.01" value={productForm.unitPrice} onChange={set('unitPrice')} /></div>
            <div className="form-group"><label>Opening Stock</label><input className="form-control" required type="number" value={productForm.currentStock} disabled={Boolean(editingProductId)} onChange={set('currentStock')} /></div>
            <div className="form-group"><label>Min Stock Alert</label><input className="form-control" required type="number" value={productForm.minStockAlertQuantity} onChange={set('minStockAlertQuantity')} /></div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Warehouse Location *</label><input className="form-control" required value={productForm.locationWarehouse} onChange={set('locationWarehouse')} /></div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editingProductId ? 'Update Product' : 'Save Product'}</button>
        </form>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="table-card-head">
            <div>
              <p className="table-card-title">Product Inventory</p>
              <p className="table-card-sub">{products.length} products · {lowStockCount} low stock</p>
            </div>
          </div>
          <div className="table-wrap" style={{ flex: 1 }}>
            <table>
              <thead><tr><th>Name</th><th>SKU</th><th>Stock</th><th>Price</th><th>Restock</th><th></th></tr></thead>
              <tbody>
                {products.map(p => {
                  const isLow = p.current_stock <= p.min_stock_alert_quantity;
                  return (
                    <tr key={p.id} style={isLow ? { background: '#FEF2F2' } : {}}>
                      <td style={{ fontWeight: 500 }}>
                        {p.name}
                        {isLow && <span className="stock-badge critical" style={{ marginLeft: 6 }}>Low</span>}
                      </td>
                      <td style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                      <td>
                        <span className={`stock-badge ${isLow ? 'critical' : 'ok'}`}>{p.current_stock}</span>
                      </td>
                      <td>{money(p.unit_price)}</td>
                      <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="form-control"
                          type="number" min="1" placeholder="Qty"
                          style={{ width: 70, padding: '4px 8px', fontSize: 13 }}
                          value={restockDrafts[p.id] || ''}
                          onChange={e => setRestockDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                        />
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          const qty = Number(restockDrafts[p.id]);
                          if (!Number.isInteger(qty) || qty <= 0) { setNotice('Enter a positive whole number'); return; }
                          onRestock(p.id, qty, 'Manual restock');
                          setRestockDrafts(d => ({ ...d, [p.id]: '' }));
                        }}>+Add</button>
                      </td>
                      <td style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingProductId(p.id); setProductForm(() => ({ name: p.name, sku: p.sku, category: p.category, unitPrice: p.unit_price, currentStock: String(p.current_stock), minStockAlertQuantity: String(p.min_stock_alert_quantity), locationWarehouse: p.location_warehouse })); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(p.id)}>Del</button>
                      </td>
                    </tr>
                  );
                })}
                {!products.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>No products found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="pagination-info">Page {productPage} of {productTotalPages}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={productPage <= 1} onClick={() => setProductPage(p => Math.max(p-1,1))}>‹</button>
              <button className="page-btn active">{productPage}</button>
              <button className="page-btn" disabled={productPage >= productTotalPages} onClick={() => setProductPage(p => Math.min(p+1,productTotalPages))}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
