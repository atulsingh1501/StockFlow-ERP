import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Challan, Customer, Product, ChallanItemForm } from '../types';

type Props = {
  challans: Challan[];
  customers: Customer[];
  products: Product[];
  challanPage: number;
  challanTotalPages: number;
  setChallanPage: (fn: (p: number) => number) => void;
  challanForm: { customerId: string; status: string; items: ChallanItemForm[] };
  setChallanForm: (fn: (f: { customerId: string; status: string; items: ChallanItemForm[] }) => typeof f) => void;
  draftItem: ChallanItemForm;
  setDraftItem: (fn: (d: ChallanItemForm) => ChallanItemForm) => void;
  isSaving: boolean;
  onSave: (e: React.FormEvent) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>;
}

export function ChallansPage({
  challans, customers, products, challanPage, challanTotalPages, setChallanPage,
  challanForm, setChallanForm, draftItem, setDraftItem, isSaving, onSave, onConfirm, onCancel
}: Props) {
  const addItem = () => {
    if (!draftItem.productId || Number(draftItem.quantity) <= 0) return;
    setChallanForm(f => ({ ...f, items: [...f.items, { ...draftItem, quantity: String(Math.trunc(Number(draftItem.quantity))) }] }));
    setDraftItem(() => ({ productId: '', quantity: '1' }));
  };

  const exportPDF = (c: Challan) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue primary color
    doc.text('Sales Challan', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text(`Challan No: ${c.challan_number}`, 14, 34);
    doc.text(`Date: ${new Date(c.created_at).toLocaleDateString()}`, 14, 40);
    doc.text(`Status: ${c.status.toUpperCase()}`, 14, 46);
    
    doc.text(`Billed To:`, 120, 34);
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(c.customer_name, 120, 41);

    autoTable(doc, {
      startY: 55,
      head: [['Item Description', 'Quantity']],
      body: [
        ['Total Products Dispatched', c.total_quantity]
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    doc.save(`Challan_${c.challan_number}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="grid-two">
        {/* Create Challan Form */}
        <form className="card card-pad" onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Create Challan</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>Stock reduces only on confirmed status</p>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer *</label>
              <select className="form-control" required value={challanForm.customerId} onChange={e => setChallanForm(f => ({ ...f, customerId: e.target.value }))}>
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.business_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={challanForm.status} onChange={e => setChallanForm(f => ({ ...f, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          {/* Add line item */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Product</label>
              <select className="form-control" value={draftItem.productId} onChange={e => setDraftItem(d => ({ ...d, productId: e.target.value }))}>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.current_stock} in stock)</option>)}
              </select>
            </div>
            <div className="form-group" style={{ width: 80 }}>
              <label>Qty</label>
              <input className="form-control" type="number" min="1" value={draftItem.quantity} onChange={e => setDraftItem(d => ({ ...d, quantity: e.target.value }))} />
            </div>
            <button type="button" className="btn btn-secondary" onClick={addItem}>+ Add</button>
          </div>

          {/* Items list */}
          {challanForm.items.length > 0 && (
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {challanForm.items.map((item, i) => {
                const prod = products.find(p => p.id === item.productId);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{prod?.name || 'Unknown'}</span>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Qty {item.quantity}</span>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setChallanForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}>✕</button>
                  </div>
                );
              })}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Challan'}</button>
        </form>

        {/* Challan List */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="table-card-head">
            <div>
              <p className="table-card-title">Challan List</p>
              <p className="table-card-sub">{challans.length} records on this page</p>
            </div>
          </div>
          <div className="table-wrap" style={{ flex: 1 }}>
            <table>
              <thead><tr><th>Number</th><th>Customer</th><th>Status</th><th>Qty</th><th>Actions</th></tr></thead>
              <tbody>
                {challans.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: 12 }}>{c.challan_number}</td>
                    <td>{c.customer_name}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>{c.total_quantity}</td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      {c.status === 'draft' ? (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => onConfirm(c.id)}>Confirm</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => onCancel(c.id)}>Cancel</button>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{c.status === 'cancelled' ? 'Cancelled' : 'Locked'}</span>
                      )}
                      <button className="btn btn-secondary btn-sm" title="Download PDF" onClick={() => exportPDF(c)}>
                        ↓ PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {!challans.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>No challans found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="pagination-info">Page {challanPage} of {challanTotalPages}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={challanPage <= 1} onClick={() => setChallanPage(p => Math.max(p-1,1))}>‹</button>
              <button className="page-btn active">{challanPage}</button>
              <button className="page-btn" disabled={challanPage >= challanTotalPages} onClick={() => setChallanPage(p => Math.min(p+1,challanTotalPages))}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
