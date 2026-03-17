import React from 'react';

export default function Header({ activeView, activeUnitId, businessUnits, costRiskSlider, onSliderChange }) {
  const activeUnit = businessUnits.find(u => u.id === activeUnitId);

  const getTitle = () => {
    if (activeView === 'dashboard') return 'Global Dashboard';
    if (activeView === 'executive') return 'Executive Summary — C-Suite Report';
    if (activeUnit) return `${activeUnit.name} — ${activeUnit.description}`;
    return 'GWOE';
  };

  const sliderLabel = costRiskSlider < 30 ? 'Max Quality' : costRiskSlider > 70 ? 'Max Savings' : 'Balanced';
  const sliderColor = costRiskSlider < 30 ? 'text-gwoe-green' : costRiskSlider > 70 ? 'text-gwoe-amber' : 'text-gwoe-accent';

  return (
    <header className="h-16 bg-gwoe-card border-b border-gwoe-border flex items-center justify-between px-6">
      <div>
        <h2 className="text-base font-semibold text-white">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Cost-to-Risk Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gwoe-muted">Quality</span>
          <input
            type="range"
            min="0"
            max="100"
            value={costRiskSlider}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            className="w-32 h-1.5 bg-gwoe-border rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-gwoe-muted">Savings</span>
          <span className={`text-xs font-medium ${sliderColor}`}>{sliderLabel}</span>
        </div>

        <div className="h-8 w-px bg-gwoe-border"></div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gwoe-green animate-pulse"></div>
          <span className="text-xs text-gwoe-muted">AI Engine Active</span>
        </div>
      </div>
    </header>
  );
}
