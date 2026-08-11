import React from 'react';
import type { StockMovement } from '../types';

type Props = {
  movements: StockMovement[];
  movementPage: number;
  movementTotalPages: number;
  setMovementPage: (fn: (p: number) => number) => void;
};

export function StockPage({ movements, movementPage, movementTotalPages, setMovementPage }: Props) {
  function typeBadge(type: string) {
    const map: Record<string, string> = { IN: '#F0FDF4', OUT: '#FEF2F2', ADJUSTMENT: '#FFF7ED' };
    const col: Record<string, string> = { IN: '#16A34A', OUT: '#DC2626', ADJUSTMENT: '#EA580C' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: map[type] || '#F3F4F6', color: col[type] || '#374151' }}>
        {type}
      </span>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="table-card-head">
        <div>
          <p className="table-card-title">Stock Movement Log</p>
          <p className="table-card-sub">{movements.length} events on this page</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Change</th><th>Type</th><th>Reason</th><th>By</th><th>Date</th></tr>
          </thead>
          <tbody>
            {movements.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: 500 }}>{m.product_name}</td>
                <td style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: 12 }}>{m.sku}</td>
                <td style={{ fontWeight: 600, color: m.movement_type === 'IN' ? '#16A34A' : m.movement_type === 'OUT' ? '#DC2626' : '#EA580C' }}>
                  {m.movement_type === 'IN' ? '+' : m.movement_type === 'OUT' ? '-' : '±'}{m.quantity_changed}
                </td>
                <td>{typeBadge(m.movement_type)}</td>
                <td style={{ color: '#6B7280' }}>{m.reason}</td>
                <td style={{ color: '#6B7280' }}>{m.created_by_name}</td>
                <td style={{ color: '#6B7280', fontSize: 12 }}>{new Date(m.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!movements.length && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>No stock movements yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="pagination-info">Page {movementPage} of {movementTotalPages}</span>
        <div className="pagination-btns">
          <button className="page-btn" disabled={movementPage <= 1} onClick={() => setMovementPage(p => Math.max(p-1,1))}>‹</button>
          <button className="page-btn active">{movementPage}</button>
          <button className="page-btn" disabled={movementPage >= movementTotalPages} onClick={() => setMovementPage(p => Math.min(p+1,movementTotalPages))}>›</button>
        </div>
      </div>
    </div>
  );
}
