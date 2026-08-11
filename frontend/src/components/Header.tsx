import React from 'react';

type HeaderProps = {
  title: string;
  userName: string;
  userRole: string;
  branch?: string;
};

export function Header({ title, userName, userRole, branch = 'Main Branch' }: HeaderProps) {
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="topbar">
      {/* Left: Page title */}
      <div style={{ fontWeight: 600, fontSize: 15, color: '#374151', whiteSpace: 'nowrap' }}>
        {title}
      </div>

      {/* Search */}
      <div className="topbar-search">
        <span className="topbar-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input placeholder="Search products, customers, challans…" />
      </div>

      {/* Right actions */}
      <div className="topbar-right">
        {/* Branch selector */}
        <button className="branch-selector">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {branch}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Notifications */}
        <div className="icon-btn" title="Notifications">
          <div className="notif-dot"/>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        {/* User avatar */}
        <div
          className="user-avatar"
          title={`${userName} · ${userRole}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
