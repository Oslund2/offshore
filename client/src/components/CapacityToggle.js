import React from 'react';

export default function CapacityToggle({ showCapacity, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
        showCapacity
          ? 'bg-gwoe-accent/20 text-gwoe-accent border-gwoe-accent/30'
          : 'bg-gwoe-card text-gwoe-muted border-gwoe-border hover:border-gwoe-accent/30 hover:text-gwoe-accent'
      }`}
      title={showCapacity ? 'Switch back to FTE view' : 'Show all-in hours and hourly rates'}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="7" cy="7" r="6" />
        <path d="M7 3.5v3.5l2.5 1.5" />
      </svg>
      {showCapacity ? 'Capacity View' : 'Show Capacity'}
    </button>
  );
}
