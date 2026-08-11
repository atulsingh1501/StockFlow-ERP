import React from 'react';
import type { Customer, CustomerForm, CustomerDetail, NoteItem } from '../types';
import { money } from '../api';

type Props = {
  customers: Customer[];
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  customerPage: number;
  customerTotalPages: number;
  setCustomerPage: (fn: (p: number) => number) => void;
  customerForm: CustomerForm;
  setCustomerForm: (fn: (f: CustomerForm) => CustomerForm) => void;
  editingCustomerId: string;
  setEditingCustomerId: (id: string) => void;
  isSaving: boolean;
  selectedCustomer: CustomerDetail | null;
  setSelectedCustomer: (c: CustomerDetail | null) => void;
  noteText: string;
  setNoteText: (v: string) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onAddNote: () => void;
  emptyForm: CustomerForm;
};

function parseNotes(notes: string | null): NoteItem[] {
  if (!notes) return [];
  return notes.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const [time, ...rest] = line.split(' | ');
    return { time: time || 'Note', text: rest.length ? rest.join(' | ') : line };
  });
}

function StatusBadge({ status }: { status: string }) {
  const cls = status.toLowerCase();
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

export function CustomersPage({
  customers, customerSearch, setCustomerSearch, customerPage, customerTotalPages,
  setCustomerPage, customerForm, setCustomerForm, editingCustomerId, setEditingCustomerId,
  isSaving, selectedCustomer, setSelectedCustomer, noteText, setNoteText,
  onSave, onDelete, onOpenDetail, onAddNote, emptyForm
}: Props) {
  const set = (k: keyof CustomerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCustomerForm(f => ({ ...f, [k]: e.target.value }));

  if (selectedCustomer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{selectedCustomer.name}</h2>
            <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>{selectedCustomer.business_name} · {selectedCustomer.mobile_number}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>← Back</button>
            <button className="btn btn-primary" onClick={() => {
              setEditingCustomerId(selectedCustomer.id);
              setCustomerForm({ name: selectedCustomer.name, mobileNumber: selectedCustomer.mobile_number, email: selectedCustomer.email || '', businessName: selectedCustomer.business_name, gstNumber: selectedCustomer.gst_number || '', customerType: selectedCustomer.customer_type, address: selectedCustomer.address, status: selectedCustomer.status, followUpDate: selectedCustomer.follow_up_date || '', notes: selectedCustomer.notes || '' });
              setSelectedCustomer(null);
            }}>Edit Customer</button>
          </div>
        </div>

        <div className="grid-two">
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Address & Follow-ups</h3>
            <div style={{ fontSize: 14, color: '#374151' }}>{selectedCustomer.address}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Add follow-up note</label>
              <textarea className="form-control" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write a note…" />
              <button className="btn btn-primary" onClick={onAddNote}>Save Note</button>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Note History</p>
              {parseNotes(selectedCustomer.notes).map((n, i) => (
                <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #F3F4F6', marginBottom: 6 }}>
                  <strong style={{ fontSize: 11, color: '#2563EB', display: 'block', marginBottom: 2 }}>{n.time}</strong>
                  <span style={{ fontSize: 13, color: '#374151' }}>{n.text}</span>
                </div>
              ))}
              {!parseNotes(selectedCustomer.notes).length && <p style={{ fontSize: 13, color: '#9CA3AF' }}>No notes yet.</p>}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-card-head">
              <div>
                <p className="table-card-title">Recent Challans</p>
                <p className="table-card-sub">{selectedCustomer.challans.length} records</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Number</th><th>Status</th><th>Qty</th><th>Date</th></tr></thead>
                <tbody>
                  {selectedCustomer.challans.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.challan_number}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{c.total_quantity}</td>
                      <td style={{ color: '#6B7280' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!selectedCustomer.challans.length && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF' }}>No challans yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="grid-two">
        {/* Form */}
        <form className="card card-pad" onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{editingCustomerId ? 'Edit Customer' : 'Add Customer'}</h3>
            {editingCustomerId && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditingCustomerId(''); setCustomerForm(() => emptyForm); }}>Cancel</button>}
          </div>
          <div className="form-group">
            <label>Search</label>
            <input className="form-control" value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setCustomerPage(() => 1); }} placeholder="Name, business, mobile…" />
          </div>
          <div className="form-grid">
            <div className="form-group"><label>Customer Name *</label><input className="form-control" required value={customerForm.name} onChange={set('name')} /></div>
            <div className="form-group"><label>Mobile *</label><input className="form-control" required value={customerForm.mobileNumber} onChange={set('mobileNumber')} /></div>
            <div className="form-group"><label>Email</label><input className="form-control" value={customerForm.email} onChange={set('email')} /></div>
            <div className="form-group"><label>Business Name *</label><input className="form-control" required value={customerForm.businessName} onChange={set('businessName')} /></div>
            <div className="form-group"><label>GST Number</label><input className="form-control" value={customerForm.gstNumber} onChange={set('gstNumber')} /></div>
            <div className="form-group"><label>Type</label>
              <select className="form-control" value={customerForm.customerType} onChange={set('customerType')}>
                <option>Retail</option><option>Wholesale</option><option>Distributor</option>
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select className="form-control" value={customerForm.status} onChange={set('status')}>
                <option>Lead</option><option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div className="form-group"><label>Follow-up Date</label><input className="form-control" type="date" value={customerForm.followUpDate} onChange={set('followUpDate')} /></div>
          </div>
          <div className="form-group"><label>Address *</label><input className="form-control" required value={customerForm.address} onChange={set('address')} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-control" value={customerForm.notes} onChange={set('notes')} /></div>
          <button className="btn btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editingCustomerId ? 'Update Customer' : 'Save Customer'}</button>
        </form>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="table-card-head">
            <div>
              <p className="table-card-title">Customer List</p>
              <p className="table-card-sub">{customers.length} records on this page</p>
            </div>
          </div>
          <div className="table-wrap" style={{ flex: 1 }}>
            <table>
              <thead><tr><th>Name</th><th>Business</th><th>Mobile</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => onOpenDetail(c.id)}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td style={{ color: '#6B7280' }}>{c.business_name}</td>
                    <td style={{ color: '#6B7280' }}>{c.mobile_number}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditingCustomerId(c.id); setCustomerForm(() => ({ name: c.name, mobileNumber: c.mobile_number, email: c.email||'', businessName: c.business_name, gstNumber: c.gst_number||'', customerType: c.customer_type, address: c.address, status: c.status, followUpDate: c.follow_up_date||'', notes: c.notes||'' })); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!customers.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>No customers found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="pagination-info">Page {customerPage} of {customerTotalPages}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={customerPage <= 1} onClick={() => setCustomerPage(p => Math.max(p-1,1))}>‹</button>
              <button className="page-btn active">{customerPage}</button>
              <button className="page-btn" disabled={customerPage >= customerTotalPages} onClick={() => setCustomerPage(p => Math.min(p+1,customerTotalPages))}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
