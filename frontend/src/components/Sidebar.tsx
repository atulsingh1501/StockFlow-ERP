import React from 'react';

type SidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  allowedTabs: string[];
  onLogout: () => void;
  userName: string;
  userRole: string;
};

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    allowed: ['admin', 'sales', 'warehouse', 'accounts']
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    allowed: ['admin', 'sales', 'accounts']
  },
  {
    id: 'products',
    label: 'Products',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    allowed: ['admin', 'warehouse', 'sales']
  },
  {
    id: 'challans',
    label: 'Sales Challans',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    allowed: ['admin', 'sales']
  },
  {
    id: 'stock',
    label: 'Stock Movements',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    allowed: ['admin', 'warehouse', 'accounts']
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    allowed: ['admin', 'accounts']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 1.41 1.41M19.07 19.07a10 10 0 0 1-1.41 1.41M4.93 19.07a10 10 0 0 1-1.41-1.41M4.93 4.93a10 10 0 0 1 1.41-1.41"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
    allowed: ['admin']
  }
];

export function Sidebar({ activeTab, onTabChange, collapsed, onToggle, allowedTabs, onLogout, userName, userRole }: SidebarProps) {
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const visibleItems = NAV_ITEMS.filter(item =>
    item.allowed.includes(userRole) || allowedTabs.includes(item.id)
  );

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">SF</div>
        <span className="sidebar-logo-text">StockFlow</span>
        <button className="sidebar-toggle" onClick={onToggle} title="Toggle sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed
              ? <polyline points="9 18 15 12 9 6"/>
              : <polyline points="15 18 9 12 15 6"/>
            }
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Main</div>}
        {visibleItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item${activeTab === item.id ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="nav-item" style={{ gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {initials}
          </div>
          <div className="nav-item-label" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{userRole}</div>
          </div>
        </div>
        <button
          className="nav-item"
          onClick={onLogout}
          style={{ marginTop: 4 }}
          title={collapsed ? 'Logout' : undefined}
        >
          <span className="nav-item-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="nav-item-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
