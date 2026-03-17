export function formatCurrency(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export function getLevelColor(level) {
  const colors = {
    L1: 'bg-emerald-900/40 text-emerald-400',
    L2: 'bg-blue-900/40 text-blue-400',
    L3: 'bg-amber-900/40 text-amber-400',
    L4: 'bg-red-900/40 text-red-400',
  };
  return colors[level] || 'bg-gray-900/40 text-gray-400';
}

export function getRecommendationBadge(rec) {
  if (rec === 'Y') return { class: 'badge-yes', label: 'Offshore' };
  if (rec === 'P') return { class: 'badge-partial', label: 'Partial' };
  return { class: 'badge-no', label: 'Retain' };
}
