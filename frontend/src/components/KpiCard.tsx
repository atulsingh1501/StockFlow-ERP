import React from 'react';

type KpiCardProps = {
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  subLabel?: string;
  iconColor?: string;
  iconBg?: string;
  icon?: React.ReactNode;
};

function InfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

export function KpiCard({ label, value, change, changeType = 'neutral', subLabel, iconBg = '#EFF6FF', icon }: KpiCardProps) {
  const changeIcon = changeType === 'up'
    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
    : changeType === 'down'
    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    : null;

  return (
    <div className="card kpi-card">
      {icon && (
        <div className="kpi-icon" style={{ background: iconBg }}>
          {icon}
        </div>
      )}
      <div className="kpi-label">
        {label}
        <InfoIcon />
      </div>
      <div className="kpi-value">{value}</div>
      {change && (
        <div className={`kpi-change ${changeType}`}>
          {changeIcon}
          {change}
        </div>
      )}
      {subLabel && <div className="kpi-sub">{subLabel}</div>}
    </div>
  );
}
