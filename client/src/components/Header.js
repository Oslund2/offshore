import React from 'react';

export default function Header({ activeView, activeUnitId, businessUnits, costRiskSlider, onSliderChange, isDemo, onMenuToggle }) {
  const activeUnit = businessUnits.find(u => u.id === activeUnitId);

  const getTitle = () => {
    if (activeView === 'dashboard') return 'Global Dashboard';
    if (activeView === 'calculator') return 'Savings Calculator';
    if (activeView === 'executive') return 'Executive Summary';
    if (activeView === 'manage') return 'Manage Business Units';
    if (activeUnit) return activeUnit.name;
    return 'GWOE';
  };

  const getSubtitle = () => {
    if (activeView === 'calculator') return 'US vs. Offshore Rates';
    if (activeView === 'executive') return 'C-Suite Report';
    if (activeUnit) return activeUnit.description;
    return null;
  };

  const sliderLabel = costRiskSlider < 30 ? 'Max Quality' : costRiskSlider > 70 ? 'Max Savings' : 'Balanced';
  const sliderColor = costRiskSlider < 30 ? 'text-gwoe-green' : costRiskSlider > 70 ? 'text-gwoe-amber' : 'text-gwoe-accent';

  return (
    <header className="h-auto min-h-[3.5rem] bg-gwoe-card border-b border-gwoe-border px-4 sm:px-6 py-2 sm:py-0">
      <div className="flex items-center justify-between h-full min-h-[3.5rem]">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenuToggle} className="md:hidden p-1.5 -ml-1.5 text-gwoe-muted hover:text-white flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h14M4 11h14M4 16h14" />
            </svg>
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-white truncate">{getTitle()}</h2>
            {getSubtitle() && <p className="text-xs text-gwoe-muted truncate hidden sm:block">{getSubtitle()}</p>}
          </div>
        </div>

        {/* Right: slider + mode */}
        <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
          {/* Slider — hidden on small screens, visible md+ */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-gwoe-muted">Quality</span>
            <input
              type="range"
              min="0"
              max="100"
              value={costRiskSlider}
              onChange={(e) => onSliderChange(Number(e.target.value))}
              className="w-20 sm:w-32 h-1.5 bg-gwoe-border rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs text-gwoe-muted">Savings</span>
            <span className={`text-xs font-medium ${sliderColor}`}>{sliderLabel}</span>
          </div>

          <div className="hidden sm:block h-8 w-px bg-gwoe-border"></div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDemo ? 'bg-gwoe-amber' : 'bg-gwoe-green'} animate-pulse`}></div>
            <span className="text-xs text-gwoe-muted hidden sm:inline">{isDemo ? 'Demo Mode' : 'AI Engine Active'}</span>
          </div>
        </div>
      </div>

      {/* Mobile slider row — only on small screens */}
      <div className="flex sm:hidden items-center gap-2 pb-2 pt-1">
        <span className="text-xs text-gwoe-muted">Quality</span>
        <input
          type="range"
          min="0"
          max="100"
          value={costRiskSlider}
          onChange={(e) => onSliderChange(Number(e.target.value))}
          className="flex-1 h-1.5 bg-gwoe-border rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-gwoe-muted">Savings</span>
        <span className={`text-xs font-medium ${sliderColor}`}>{sliderLabel}</span>
      </div>
    </header>
  );
}
