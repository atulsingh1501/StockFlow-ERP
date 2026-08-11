import React, { useState, useEffect, useRef } from 'react';
import { request } from '../api';
import type { Customer, Product, ListResponse } from '../types';

type HeaderProps = {
  title: string;
  userName: string;
  userRole: string;
  branch?: string;
  onNavigate?: (tab: string, id: string) => void;
};

export function Header({ title, userName, userRole, branch = 'Main Branch', onNavigate }: HeaderProps) {
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ customers: Customer[], products: Product[] }>({ customers: [], products: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ customers: [], products: [] });
      setIsOpen(false);
      return;
    }
    const token = localStorage.getItem('fundsroom_token');
    if (!token) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [cRes, pRes] = await Promise.all([
          request<ListResponse<Customer>>(token, `/customers?search=${encodeURIComponent(query)}&limit=3`),
          request<ListResponse<Product>>(token, `/products?search=${encodeURIComponent(query)}&limit=3`)
        ]);
        setResults({ customers: cRes.items || [], products: pRes.items || [] });
        setIsOpen(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header className="topbar">
      <div style={{ fontWeight: 600, fontSize: 15, color: '#374151', whiteSpace: 'nowrap' }}>
        {title}
      </div>

      {/* Global Search */}
      <div className="topbar-search" ref={ref} style={{ position: 'relative', overflow: 'visible' }}>
        <span className="topbar-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input 
          placeholder="Search products, customers…" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
        />

        {isOpen && (
          <div style={{ 
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, 
            background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', 
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100,
            maxHeight: 400, overflowY: 'auto' 
          }}>
            {isLoading && <div style={{ padding: 12, fontSize: 13, color: '#6B7280', textAlign: 'center' }}>Searching...</div>}
            
            {!isLoading && results.customers.length === 0 && results.products.length === 0 && (
              <div style={{ padding: 12, fontSize: 13, color: '#6B7280', textAlign: 'center' }}>No results found</div>
            )}

            {!isLoading && results.customers.length > 0 && (
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers</div>
                {results.customers.map(c => (
                  <div key={c.id} style={{ padding: '8px', cursor: 'pointer', borderRadius: 6, display: 'flex', flexDirection: 'column' }} 
                       className="search-item"
                       onClick={() => { setIsOpen(false); setQuery(''); onNavigate?.('customers', c.id); }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{c.business_name} · {c.mobile_number}</span>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && results.products.length > 0 && (
              <div style={{ padding: 8, borderTop: results.customers.length > 0 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</div>
                {results.products.map(p => (
                  <div key={p.id} style={{ padding: '8px', cursor: 'pointer', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
                       className="search-item"
                       onClick={() => { setIsOpen(false); setQuery(''); onNavigate?.('products', p.id); }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{p.name}</span>
                      <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{p.sku}</span>
                    </div>
                    <span className={`stock-badge ${p.current_stock > p.min_stock_alert_quantity ? 'ok' : 'critical'}`} style={{ fontSize: 11 }}>{p.current_stock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <button className="branch-selector">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {branch}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div className="icon-btn" title="Notifications">
          <div className="notif-dot"/><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div className="user-avatar" title={`${userName} · ${userRole}`}>{initials}</div>
      </div>
    </header>
  );
}
