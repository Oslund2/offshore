import React from 'react';
import { formatCurrency } from '../utils/format';

export default function DashboardView({ rollup, onNavigate }) {
  if (!rollup) return <p className="text-gwoe-muted">Loading dashboard...</p>;

  const { overall, byUnit, byLevel } = rollup;
  const savingsEstimate = Math.round(overall.offshore_spend * 0.55);
  const offshorePercent = Math.round((overall.offshore_fte / overall.total_fte) * 100);
  const qualityScore = Math.round(100 - (overall.retain_fte / overall.total_fte) * 40 - (overall.partial_fte / overall.total_fte) * 20);

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">Total Workforce</p>
          <p className="text-3xl font-bold text-white mt-2">{overall.total_fte}</p>
          <p className="text-xs text-gwoe-muted mt-1">FTE across {byUnit.length} units</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">Annual Spend</p>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(overall.total_spend)}</p>
          <p className="text-xs text-gwoe-muted mt-1">{overall.total_roles} evaluated roles</p>
        </div>
        <div className="card p-5 glow-border">
          <p className="text-xs text-gwoe-green uppercase tracking-wider">Potential FTE Savings</p>
          <p className="text-3xl font-bold text-gwoe-green mt-2">{overall.offshore_fte}</p>
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
                <span className="text-gwoe-green">Offshore ({overall.offshore_fte} FTE)</span>
                <span className="text-gwoe-muted">{offshorePercent}%</span>
              </div>
              <div className="h-2 bg-gwoe-bg rounded-full overflow-hidden">
                <div className="h-full bg-gwoe-green rounded-full" style={{ width: `${offshorePercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gwoe-amber">Partial ({overall.partial_fte} FTE)</span>
                <span className="text-gwoe-muted">{Math.round((overall.partial_fte / overall.total_fte) * 100)}%</span>
              </div>
              <div className="h-2 bg-gwoe-bg rounded-full overflow-hidden">
                <div className="h-full bg-gwoe-amber rounded-full" style={{ width: `${(overall.partial_fte / overall.total_fte) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gwoe-red">Retain ({overall.retain_fte} FTE)</span>
                <span className="text-gwoe-muted">{Math.round((overall.retain_fte / overall.total_fte) * 100)}%</span>
              </div>
              <div className="h-2 bg-gwoe-bg rounded-full overflow-hidden">
                <div className="h-full bg-gwoe-red rounded-full" style={{ width: `${(overall.retain_fte / overall.total_fte) * 100}%` }}></div>
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
                <td className="py-3 px-3 text-right font-mono text-white">{overall.total_roles}</td>
                <td className="py-3 px-3 text-right font-mono text-white">{overall.total_fte}</td>
                <td className="py-3 px-3 text-right font-mono text-white">{formatCurrency(overall.total_spend)}</td>
                <td className="py-3 px-3 text-right font-mono text-gwoe-green">{overall.offshore_fte}</td>
                <td className="py-3 px-3 text-right font-mono text-gwoe-green">{formatCurrency(overall.offshore_spend)}</td>
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
