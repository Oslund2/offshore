import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function AIInsightsBadge({ role }) {
  const [insights, setInsights] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    api.getAIInsights({
      qualitative_why: role.qualitative_why,
      role_name: role.role_name,
      level: role.level,
    }).then(setInsights).catch(() => {});
  }, [role.qualitative_why, role.role_name, role.level]);

  if (!insights || !insights.hasHighQualityLossRisk) return null;

  const severityColors = {
    low: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
    medium: 'bg-amber-900/30 text-amber-400 border-amber-700/30',
    high: 'bg-orange-900/30 text-orange-400 border-orange-700/30',
    critical: 'bg-red-900/30 text-red-400 border-red-700/30',
  };

  const color = severityColors[insights.severity] || severityColors.medium;

  return (
    <div className="relative inline-block">
      <button
        className={`px-1.5 py-0.5 rounded text-xs border ${color} cursor-help`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        ⚠ {insights.severity.toUpperCase()}
      </button>

      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 w-64 card p-3 z-50 shadow-xl">
          {insights.warnings.map((w, i) => (
            <div key={i} className="text-xs text-gwoe-muted mb-1">{w.message}</div>
          ))}
          <div className="text-xs text-gwoe-muted mt-1 opacity-70">
            Keywords: {insights.matchedKeywords.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
