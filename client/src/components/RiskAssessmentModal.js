import React from 'react';
import { getRecommendationBadge, formatCurrency } from '../utils/format';
import { getTopCountries, US_RATES } from '../utils/offshoreRates';

export default function RiskAssessmentModal({ role, assessment, onClose }) {
  const badge = getRecommendationBadge(role.recommendation);
  const topCountries = role.recommendation !== 'N' ? getTopCountries(role, 3) : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="card p-6 max-w-2xl w-full mx-4 glow-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">{role.role_name}</h3>
            <p className="text-xs text-gwoe-muted mt-0.5">
              {role.level} — <span className={badge.class}>{badge.label}</span>
              {role.current_fte > 0 && <span className="ml-2">· {role.current_fte} FTE</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-gwoe-muted hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gwoe-green flex items-center gap-2 mb-2">
              <span>▲</span> Pros
            </h4>
            <ul className="space-y-1.5">
              {assessment.pros.map((p, i) => (
                <li key={i} className="text-xs text-gwoe-muted pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-gwoe-green">
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gwoe-red flex items-center gap-2 mb-2">
              <span>▼</span> Cons
            </h4>
            <ul className="space-y-1.5">
              {assessment.cons.map((c, i) => (
                <li key={i} className="text-xs text-gwoe-muted pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-gwoe-red">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gwoe-accent flex items-center gap-2 mb-2">
              <span>◆</span> Mitigation Strategy
            </h4>
            <ul className="space-y-1.5">
              {assessment.mitigation.map((m, i) => (
                <li key={i} className="text-xs text-gwoe-muted pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-gwoe-accent">
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* AI Country Recommendations */}
          {topCountries.length > 0 && (
            <div className="border-t border-gwoe-border pt-4">
              <h4 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                <span>🌍</span> AI-Recommended Offshore Destinations
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {topCountries.map(({ country, fit, savings }, i) => (
                  <div key={country.id} className={`bg-gwoe-bg rounded-lg p-3 border ${i === 0 ? 'border-gwoe-accent/40' : 'border-gwoe-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-xs font-medium text-white">{country.name}</span>
                      </div>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        fit.grade === 'A' ? 'bg-gwoe-green/20 text-gwoe-green' :
                        fit.grade === 'B' ? 'bg-gwoe-accent/20 text-gwoe-accent' :
                        fit.grade === 'C' ? 'bg-gwoe-amber/20 text-gwoe-amber' :
                        'bg-gwoe-red/20 text-gwoe-red'
                      }`}>
                        {fit.grade}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gwoe-muted">US Rate</span>
                        <span className="font-mono text-white">{formatCurrency(US_RATES[role.level])}/yr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gwoe-muted">{country.name} Rate</span>
                        <span className="font-mono text-gwoe-accent">{formatCurrency(country.rates[role.level])}/yr</span>
                      </div>
                      <div className="flex justify-between border-t border-gwoe-border pt-1">
                        <span className="text-gwoe-green font-medium">Savings/FTE</span>
                        <span className="font-mono text-gwoe-green">{formatCurrency(savings.savings / (role.current_fte || 1))}</span>
                      </div>
                      {role.current_fte > 1 && (
                        <div className="flex justify-between">
                          <span className="text-gwoe-green font-medium">Total ({role.current_fte} FTE)</span>
                          <span className="font-mono text-gwoe-green font-bold">{formatCurrency(savings.savings)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gwoe-border">
                      {fit.factors.slice(0, 3).map((f, j) => (
                        <div key={j} className="flex justify-between text-xs">
                          <span className="text-gwoe-muted">{f.factor}</span>
                          <span className={
                            f.impact === 'positive' ? 'text-gwoe-green' :
                            f.impact === 'negative' ? 'text-gwoe-red' : 'text-gwoe-muted'
                          }>{f.value}</span>
                        </div>
                      ))}
                    </div>

                    {i === 0 && (
                      <div className="mt-2 text-center">
                        <span className="text-xs bg-gwoe-accent/10 text-gwoe-accent px-2 py-0.5 rounded border border-gwoe-accent/20">
                          Top Pick
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gwoe-border flex justify-end">
          <button onClick={onClose} className="btn-secondary text-xs">Close</button>
        </div>
      </div>
    </div>
  );
}
