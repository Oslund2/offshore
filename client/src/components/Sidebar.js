import React from 'react';

const BU_ICONS = {
  cyber: '🛡',
  news: '📰',
  data: '📊',
  product: '🎯',
  development: '⚙',
  business: '💼',
};

export default function Sidebar({ businessUnits, activeView, activeUnitId, onNavigate, isDemo }) {
  return (
    <aside className="w-64 bg-gwoe-card border-r border-gwoe-border flex flex-col">
      <div className="p-5 border-b border-gwoe-border">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-white tracking-tight">GWOE</h1>
          {isDemo && <span className="text-xs bg-gwoe-amber/20 text-gwoe-amber border border-gwoe-amber/30 px-1.5 py-0.5 rounded">DEMO</span>}
        </div>
        <p className="text-xs text-gwoe-muted mt-0.5">Workforce Optimization Engine</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center gap-2.5 ${
            activeView === 'dashboard'
              ? 'bg-gwoe-accent/10 text-gwoe-accent-glow border border-gwoe-accent/20'
              : 'text-gwoe-muted hover:text-gwoe-text hover:bg-gwoe-bg'
          }`}
        >
          <span className="text-base">◈</span>
          Global Dashboard
        </button>

        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-medium text-gwoe-muted uppercase tracking-wider">Business Units</p>
        </div>

        {businessUnits.map((unit) => (
          <button
            key={unit.id}
            onClick={() => onNavigate('unit', unit.id)}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center gap-2.5 ${
              activeView === 'unit' && activeUnitId === unit.id
                ? 'bg-gwoe-accent/10 text-gwoe-accent-glow border border-gwoe-accent/20'
                : 'text-gwoe-muted hover:text-gwoe-text hover:bg-gwoe-bg'
            }`}
          >
            <span className="text-base">{BU_ICONS[unit.id] || '◇'}</span>
            {unit.name}
          </button>
        ))}

        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-medium text-gwoe-muted uppercase tracking-wider">Reports</p>
        </div>

        <button
          onClick={() => onNavigate('calculator')}
          className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center gap-2.5 ${
            activeView === 'calculator'
              ? 'bg-gwoe-accent/10 text-gwoe-accent-glow border border-gwoe-accent/20'
              : 'text-gwoe-muted hover:text-gwoe-text hover:bg-gwoe-bg'
          }`}
        >
          <span className="text-base">💰</span>
          Savings Calculator
        </button>

        <button
          onClick={() => onNavigate('executive')}
          className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center gap-2.5 ${
            activeView === 'executive'
              ? 'bg-gwoe-accent/10 text-gwoe-accent-glow border border-gwoe-accent/20'
              : 'text-gwoe-muted hover:text-gwoe-text hover:bg-gwoe-bg'
          }`}
        >
          <span className="text-base">📋</span>
          C-Suite Summary
        </button>
      </nav>

      <div className="p-4 border-t border-gwoe-border">
        <p className="text-xs text-gwoe-muted">{isDemo ? 'Demo Mode — Data resets on refresh' : 'v1.0 — AI-Enhanced'}</p>
      </div>
    </aside>
  );
}
