import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';
import { US_RATES, OFFSHORE_COUNTRIES, calculateRoleSavings } from '../utils/offshoreRates';

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatLocalTime(ianaZone, now) {
  return now.toLocaleTimeString('en-US', {
    timeZone: ianaZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Pure display component — receives allRoles from App.js, no independent data fetching
export default function SavingsCalculator({ allRoles }) {
  const roles = allRoles || [];
  const now = useCurrentTime();
  const [selectedCountries, setSelectedCountries] = useState(['india', 'philippines', 'poland']);

  const toggleCountry = (id) => {
    setSelectedCountries(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const activeCountries = OFFSHORE_COUNTRIES.filter(c => selectedCountries.includes(c.id));
  const offshoreRoles = roles.filter(r => r.recommendation === 'Y' || r.recommendation === 'P');

  // Calculate totals per country
  const countryTotals = activeCountries.map(country => {
    let totalUsCost = 0;
    let totalOffshoreCost = 0;

    for (const role of offshoreRoles) {
      const usRate = US_RATES[role.level] || US_RATES.L1;
      const countryRate = country.rates[role.level] || country.rates.L1;
      const multiplier = role.recommendation === 'P' ? 0.5 : 1;
      totalUsCost += usRate * role.current_fte * multiplier;
      totalOffshoreCost += countryRate * role.current_fte * multiplier;
    }

    return {
      country,
      totalUsCost,
      totalOffshoreCost,
      totalSavings: totalUsCost - totalOffshoreCost,
      savingsPercent: totalUsCost > 0 ? Math.round(((totalUsCost - totalOffshoreCost) / totalUsCost) * 100) : 0,
    };
  });

  if (roles.length === 0) {
    return <p className="text-gwoe-muted">Loading savings calculator...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Country Selector */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Select Offshore Destinations</h3>
        <div className="flex flex-wrap gap-2">
          {OFFSHORE_COUNTRIES.map(c => (
            <button
              key={c.id}
              onClick={() => toggleCountry(c.id)}
              className={`px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                selectedCountries.includes(c.id)
                  ? 'bg-gwoe-accent/20 text-gwoe-accent border border-gwoe-accent/40'
                  : 'bg-gwoe-bg text-gwoe-muted border border-gwoe-border hover:border-gwoe-accent/30'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
              <span className="text-xs opacity-60">{c.timezone} · {formatLocalTime(c.ianaZone, now)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Savings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {countryTotals.map(({ country, totalUsCost, totalOffshoreCost, totalSavings, savingsPercent }) => (
          <div key={country.id} className="card p-5 glow-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{country.flag}</span>
              <div>
                <h4 className="text-sm font-semibold text-white">{country.name}</h4>
                <p className="text-xs text-gwoe-muted">{country.region} · {country.timezone} · {formatLocalTime(country.ianaZone, now)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gwoe-muted">US Cost (baseline)</span>
                <span className="font-mono text-white">{formatCurrency(totalUsCost)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gwoe-muted">Offshore Cost</span>
                <span className="font-mono text-gwoe-accent">{formatCurrency(totalOffshoreCost)}</span>
              </div>
              <div className="border-t border-gwoe-border pt-2 flex justify-between">
                <span className="text-sm font-medium text-gwoe-green">Annual Savings</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-gwoe-green">{formatCurrency(totalSavings)}</span>
                  <span className="text-xs text-gwoe-green ml-2">({savingsPercent}%)</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gwoe-border">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gwoe-muted">Talent Pool</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gwoe-bg rounded-full">
                      <div className="h-full bg-gwoe-accent rounded-full" style={{ width: `${country.riskProfile.talentPool}%` }}></div>
                    </div>
                    <span className="text-gwoe-muted w-6 text-right">{country.riskProfile.talentPool}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gwoe-muted">English</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gwoe-bg rounded-full">
                      <div className="h-full bg-gwoe-accent rounded-full" style={{ width: `${country.riskProfile.english}%` }}></div>
                    </div>
                    <span className="text-gwoe-muted w-6 text-right">{country.riskProfile.english}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gwoe-muted">IP Protection</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gwoe-bg rounded-full">
                      <div className="h-full bg-gwoe-accent rounded-full" style={{ width: `${country.riskProfile.ipProtection}%` }}></div>
                    </div>
                    <span className="text-gwoe-muted w-6 text-right">{country.riskProfile.ipProtection}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gwoe-muted">TZ Overlap</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gwoe-bg rounded-full">
                      <div className="h-full bg-gwoe-accent rounded-full" style={{ width: `${country.riskProfile.timeZoneOverlap}%` }}></div>
                    </div>
                    <span className="text-gwoe-muted w-6 text-right">{country.riskProfile.timeZoneOverlap}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gwoe-border">
              <p className="text-xs text-gwoe-muted mb-1">Best for:</p>
              <div className="flex flex-wrap gap-1">
                {country.bestFor.slice(0, 3).map((b, i) => (
                  <span key={i} className="text-xs bg-gwoe-bg px-2 py-0.5 rounded text-gwoe-accent">{b}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Rate Comparison Table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gwoe-border">
          <h3 className="text-sm font-semibold text-white">US vs. Offshore Rate Comparison by Level</h3>
          <p className="text-xs text-gwoe-muted mt-0.5">Fully-loaded annual cost per FTE (salary + benefits + overhead)</p>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gwoe-border text-gwoe-muted text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-3 font-medium">Level</th>
                <th className="text-right py-3 px-3 font-medium">🇺🇸 US Rate</th>
                {activeCountries.map(c => (
                  <th key={c.id} className="text-right py-3 px-3 font-medium">{c.flag} {c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['L1', 'L2', 'L3', 'L4'].map(level => (
                <tr key={level} className="border-b border-gwoe-border/50 hover:bg-gwoe-bg/50">
                  <td className="py-3 px-3 font-mono text-gwoe-accent font-medium">{level}</td>
                  <td className="py-3 px-3 text-right font-mono text-white">{formatCurrency(US_RATES[level])}</td>
                  {activeCountries.map(c => {
                    const { savings, savingsPercent } = calculateRoleSavings(US_RATES[level], c.rates[level], 1);
                    return (
                      <td key={c.id} className="py-3 px-3 text-right">
                        <span className="font-mono text-white">{formatCurrency(c.rates[level])}</span>
                        <span className="text-xs text-gwoe-green ml-2">-{savingsPercent}%</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-by-Role Breakdown */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gwoe-border">
          <h3 className="text-sm font-semibold text-white">Role-by-Role Savings Projection</h3>
          <p className="text-xs text-gwoe-muted mt-0.5">
            Showing {offshoreRoles.length} roles recommended for offshoring (Y) or partial offshoring (P)
          </p>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gwoe-border text-gwoe-muted text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-3 font-medium">Role</th>
                <th className="text-center py-3 px-2 font-medium w-12">Lvl</th>
                <th className="text-center py-3 px-2 font-medium w-12">FTE</th>
                <th className="text-right py-3 px-3 font-medium">US Cost</th>
                {activeCountries.map(c => (
                  <th key={c.id} className="text-right py-3 px-3 font-medium">{c.flag} Savings</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offshoreRoles.map((role, i) => {
                const usRate = US_RATES[role.level] || US_RATES.L1;
                const multiplier = role.recommendation === 'P' ? 0.5 : 1;
                const usCost = usRate * role.current_fte * multiplier;

                return (
                  <tr key={i} className="border-b border-gwoe-border/50 hover:bg-gwoe-bg/50">
                    <td className="py-2.5 px-3">
                      <span className="text-white text-xs">{role.role_name}</span>
                      <span className="text-gwoe-muted text-xs ml-2">({role.unitName})</span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-xs text-gwoe-accent">{role.level}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-xs">{role.recommendation === 'P' ? `${role.current_fte}×50%` : role.current_fte}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs text-white">{formatCurrency(usCost)}</td>
                    {activeCountries.map(c => {
                      const countryRate = c.rates[role.level] || c.rates.L1;
                      const offshoreCost = countryRate * role.current_fte * multiplier;
                      const savings = usCost - offshoreCost;
                      return (
                        <td key={c.id} className="py-2.5 px-3 text-right font-mono text-xs text-gwoe-green">
                          {formatCurrency(savings)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gwoe-accent/30 font-semibold">
                <td className="py-3 px-3 text-white" colSpan={3}>TOTAL PROJECTED SAVINGS</td>
                <td className="py-3 px-3 text-right font-mono text-white">
                  {formatCurrency(offshoreRoles.reduce((s, r) => {
                    const m = r.recommendation === 'P' ? 0.5 : 1;
                    return s + (US_RATES[r.level] || US_RATES.L1) * r.current_fte * m;
                  }, 0))}
                </td>
                {activeCountries.map(c => (
                  <td key={c.id} className="py-3 px-3 text-right font-mono text-gwoe-green text-base">
                    {formatCurrency(offshoreRoles.reduce((s, r) => {
                      const m = r.recommendation === 'P' ? 0.5 : 1;
                      const usCost = (US_RATES[r.level] || US_RATES.L1) * r.current_fte * m;
                      const offCost = (c.rates[r.level] || c.rates.L1) * r.current_fte * m;
                      return s + (usCost - offCost);
                    }, 0))}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Country Risk Comparison */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gwoe-border">
          <h3 className="text-sm font-semibold text-white">Country Risk Profile Comparison</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeCountries.map(c => (
              <div key={c.id} className="bg-gwoe-bg rounded-lg p-4 border border-gwoe-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{c.flag}</span>
                  <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                </div>

                <div className="space-y-1.5 mb-3">
                  {Object.entries(c.riskProfile).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-gwoe-muted w-24 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex-1 h-1.5 bg-gwoe-card rounded-full">
                        <div
                          className={`h-full rounded-full ${val >= 70 ? 'bg-gwoe-green' : val >= 50 ? 'bg-gwoe-amber' : 'bg-gwoe-red'}`}
                          style={{ width: `${val}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono text-gwoe-muted w-6 text-right">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gwoe-border pt-2">
                  <p className="text-xs text-gwoe-green mb-1">Strengths</p>
                  {c.strengths.slice(0, 2).map((s, i) => (
                    <p key={i} className="text-xs text-gwoe-muted">+ {s}</p>
                  ))}
                  <p className="text-xs text-gwoe-red mt-1.5 mb-1">Risks</p>
                  {c.risks.slice(0, 2).map((r, i) => (
                    <p key={i} className="text-xs text-gwoe-muted">- {r}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
