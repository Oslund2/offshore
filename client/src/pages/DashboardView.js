import React from 'react';
import { formatCurrency } from '../utils/format';
import { getSliderAdjustedRecommendation } from '../utils/sliderLogic';

// Pure display component — receives allRoles from App.js, no independent data fetching
export default function DashboardView({ allRoles, businessUnits, onNavigate, costRiskSlider }) {
  if (!businessUnits || businessUnits.length === 0) return <p className="text-gwoe-muted">Loading dashboard...</p>;

  // Recompute everything with slider adjustments
  const adjustedRoles = (allRoles || []).map(r => ({
    ...r,
    adjustedRec: getSliderAdjustedRecommendation(r.recommendation, r.level, r.qualitative_why, costRiskSlider),
  }));

  const totalFTE = adjustedRoles.reduce((s, r) => s + r.current_fte, 0);
  const totalSpend = adjustedRoles.reduce((s, r) => s + r.estimated_spend, 0);
  const activeRoles = adjustedRoles.filter(r => r.current_fte > 0 || r.estimated_spend > 0);
  const totalRoles = activeRoles.length;

  const offshoreFTE = adjustedRoles.filter(r => r.adjustedRec === 'Y').reduce((s, r) => s + r.current_fte, 0);
  const offshoreSpend = adjustedRoles.filter(r => r.adjustedRec === 'Y').reduce((s, r) => s + r.estimated_spend, 0);
  const partialFTE = adjustedRoles.filter(r => r.adjustedRec === 'P').reduce((s, r) => s + r.current_fte, 0);
  const retainFTE = adjustedRoles.filter(r => r.adjustedRec === 'N').reduce((s, r) => s + r.current_fte, 0);

  const savingsEstimate = Math.round(offshoreSpend * 0.55);
  const offshorePercent = totalFTE > 0 ? Math.round((offshoreFTE / totalFTE) * 100) : 0;
  const partialPercent = totalFTE > 0 ? Math.round((partialFTE / totalFTE) * 100) : 0;
  const retainPercent = totalFTE > 0 ? Math.round((retainFTE / totalFTE) * 100) : 0;
  const qualityScore = totalFTE > 0 ? Math.round(100 - (retainFTE / totalFTE) * 40 - (partialFTE / totalFTE) * 20) : 0;

  // Group by unit — start from businessUnits so all units appear even with 0 roles
  const unitMap = {};
  for (const bu of businessUnits) {
    unitMap[bu.id] = { id: bu.id, name: bu.name, total_roles: 0, total_fte: 0, total_spend: 0, offshore_fte: 0, offshore_spend: 0 };
  }
  for (const r of adjustedRoles) {
    if (!unitMap[r.unitId]) unitMap[r.unitId] = { id: r.unitId, name: r.unitName, total_roles: 0, total_fte: 0, total_spend: 0, offshore_fte: 0, offshore_spend: 0 };
    if (r.current_fte > 0 || r.estimated_spend > 0) unitMap[r.unitId].total_roles++;
    unitMap[r.unitId].total_fte += r.current_fte;
    unitMap[r.unitId].total_spend += r.estimated_spend;
    if (r.adjustedRec === 'Y') { unitMap[r.unitId].offshore_fte += r.current_fte; unitMap[r.unitId].offshore_spend += r.estimated_spend; }
  }
  const byUnit = Object.values(unitMap).sort((a, b) => a.name.localeCompare(b.name));

  // Group by level
  const levelMap = {};
  for (const r of adjustedRoles) {
    if (!levelMap[r.level]) levelMap[r.level] = { level: r.level, total_fte: 0, offshore_count: 0, retain_count: 0 };
    levelMap[r.level].total_fte += r.current_fte;
    if (r.adjustedRec === 'Y') levelMap[r.level].offshore_count++;
    if (r.adjustedRec === 'N') levelMap[r.level].retain_count++;
  }
  const byLevel = Object.values(levelMap).sort((a, b) => a.level.localeCompare(b.level));

  const sliderIsNeutral = costRiskSlider >= 40 && costRiskSlider <= 60;

  return (
    <div className="space-y-6">
      {/* Slider impact banner */}
      {!sliderIsNeutral && (
        <div className={`rounded-md px-4 py-2.5 text-xs flex items-center gap-2 ${
          costRiskSlider > 60
            ? 'bg-gwoe-amber/10 border border-gwoe-amber/30 text-gwoe-amber'
            : 'bg-gwoe-green/10 border border-gwoe-green/30 text-gwoe-green'
        }`}>
          <span>{costRiskSlider > 60 ? '⚡' : '🛡'}</span>
          <span>
            <strong>Slider Active ({costRiskSlider > 60 ? 'Max Savings' : 'Max Quality'} — {costRiskSlider}%):</strong>{' '}
            All numbers below reflect AI-adjusted recommendations. Move slider to center (50%) for baseline.
          </span>
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">Total Workforce</p>
          <p className="text-3xl font-bold text-white mt-2">{totalFTE}</p>
          <p className="text-xs text-gwoe-muted mt-1">FTE across {byUnit.length} units</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">Annual Spend</p>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalSpend)}</p>
          <p className="text-xs text-gwoe-muted mt-1">{totalRoles} evaluated roles</p>
        </div>
        <div className="card p-5 glow-border">
          <p className="text-xs text-gwoe-green uppercase tracking-wider">Potential FTE Savings</p>
          <p className="text-3xl font-bold text-gwoe-green mt-2">{offshoreFTE}</p>
          <p className="text-xs text-gwoe-muted mt-1">{offshorePercent}% of workforce</p>
        </div>
        <div className="card p-5 glow-border">
          <p className="text-xs text-gwoe-green uppercase tracking-wider">Est. Cost Reduction</p>
          <p className="text-3xl font-bold text-gwoe-green mt-2">{formatCurrency(savingsEstimate)}</p>
          <p className="text-xs text-gwoe-muted mt-1">55% offshore savings model</p>
        </div>
      </div>

      {/* AI Sentiment & Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider mb-3">AI Sentiment Score</p>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gwoe-border"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  className={qualityScore > 60 ? 'text-gwoe-amber' : 'text-gwoe-green'}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={`${qualityScore}, 100`}
                  style={{ transition: 'stroke-dasharray 0.3s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                {qualityScore}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {qualityScore > 70 ? 'Aggressive' : qualityScore > 40 ? 'Moderate' : 'Conservative'}
              </p>
              <p className="text-xs text-gwoe-muted mt-0.5">
                Higher = more offshoring risk
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider mb-3">Recommendation Split</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gwoe-green">Offshore ({offshoreFTE} FTE)</span>
                <span className="text-gwoe-muted">{offshorePercent}%</span>
              </div>
              <div className="h-2 bg-gwoe-bg rounded-full overflow-hidden">
                <div className="h-full bg-gwoe-green rounded-full transition-all duration-300" style={{ width: `${offshorePercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gwoe-amber">Partial ({partialFTE} FTE)</span>
                <span className="text-gwoe-muted">{partialPercent}%</span>
              </div>
              <div className="h-2 bg-gwoe-bg rounded-full overflow-hidden">
                <div className="h-full bg-gwoe-amber rounded-full transition-all duration-300" style={{ width: `${partialPercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gwoe-red">Retain ({retainFTE} FTE)</span>
                <span className="text-gwoe-muted">{retainPercent}%</span>
              </div>
              <div className="h-2 bg-gwoe-bg rounded-full overflow-hidden">
                <div className="h-full bg-gwoe-red rounded-full transition-all duration-300" style={{ width: `${retainPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider mb-3">By Level</p>
          <div className="space-y-2">
            {byLevel.map(l => (
              <div key={l.level} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gwoe-accent">{l.level}</span>
                <span className="text-gwoe-muted">{l.total_fte} FTE</span>
                <span className="text-gwoe-green">{l.offshore_count} offshore</span>
                <span className="text-gwoe-red">{l.retain_count} retain</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Business Unit Breakdown */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gwoe-border">
          <h3 className="text-sm font-semibold text-white">Business Unit Breakdown</h3>
        </div>
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gwoe-border text-gwoe-muted text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-3 font-medium">Unit</th>
                <th className="text-right py-3 px-3 font-medium">Total Roles</th>
                <th className="text-right py-3 px-3 font-medium">Total FTE</th>
                <th className="text-right py-3 px-3 font-medium">Total Spend</th>
                <th className="text-right py-3 px-3 font-medium">Offshore FTE</th>
                <th className="text-right py-3 px-3 font-medium">Offshore Spend</th>
                <th className="text-right py-3 px-3 font-medium">Est. Savings</th>
                <th className="text-center py-3 px-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {byUnit.map(u => (
                <tr key={u.id} className="border-b border-gwoe-border/50 hover:bg-gwoe-bg/50">
                  <td className="py-3 px-3 font-medium text-white">{u.name}</td>
                  <td className="py-3 px-3 text-right font-mono">{u.total_roles}</td>
                  <td className="py-3 px-3 text-right font-mono">{u.total_fte}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatCurrency(u.total_spend)}</td>
                  <td className="py-3 px-3 text-right font-mono text-gwoe-green">{u.offshore_fte}</td>
                  <td className="py-3 px-3 text-right font-mono text-gwoe-green">{formatCurrency(u.offshore_spend)}</td>
                  <td className="py-3 px-3 text-right font-mono text-gwoe-green">{formatCurrency(Math.round(u.offshore_spend * 0.55))}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onNavigate('unit', u.id)}
                      className="px-3 py-1 text-xs bg-gwoe-accent/20 text-gwoe-accent rounded hover:bg-gwoe-accent/30"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gwoe-accent/30 font-semibold">
                <td className="py-3 px-3 text-white">TOTAL</td>
                <td className="py-3 px-3 text-right font-mono text-white">{totalRoles}</td>
                <td className="py-3 px-3 text-right font-mono text-white">{totalFTE}</td>
                <td className="py-3 px-3 text-right font-mono text-white">{formatCurrency(totalSpend)}</td>
                <td className="py-3 px-3 text-right font-mono text-gwoe-green">{offshoreFTE}</td>
                <td className="py-3 px-3 text-right font-mono text-gwoe-green">{formatCurrency(offshoreSpend)}</td>
                <td className="py-3 px-3 text-right font-mono text-gwoe-green">{formatCurrency(savingsEstimate)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
