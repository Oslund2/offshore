import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatCurrency } from '../utils/format';
import { analyzeInsights } from '../utils/aiEngine';
import { US_RATES, OFFSHORE_COUNTRIES, scoreCountryFit } from '../utils/offshoreRates';

// ── Analysis Engine ──────────────────────────────────────────────
function runFullAnalysis(allRoles) {
  const contradictions = [];
  const quickWins = [];
  const hiddenRisks = [];
  const crossBU = [];
  const waves = { wave1: [], wave2: [], wave3: [], doNotMove: [] };

  for (const r of allRoles) {
    const insights = analyzeInsights(r);
    const why = (r.qualitative_why || '').toLowerCase();
    const hasSensitive = ['security', 'strategic', 'proprietary', 'trust', 'clearance', 'compliance', 'regulatory'].some(k => why.includes(k));

    // AI Confidence — how confident are we in the current recommendation
    let confidence = 70; // base
    if (r.qualitative_why && r.qualitative_why.length > 20) confidence += 10;
    if ((r.level === 'L1' || r.level === 'L2') && r.recommendation === 'Y') confidence += 15;
    if ((r.level === 'L3' || r.level === 'L4') && r.recommendation === 'N') confidence += 15;
    if ((r.level === 'L1' || r.level === 'L2') && r.recommendation === 'N' && !hasSensitive) confidence -= 25;
    if ((r.level === 'L3' || r.level === 'L4') && r.recommendation === 'Y' && hasSensitive) confidence -= 30;
    if (r.recommendation === 'P') confidence -= 5;
    r._confidence = Math.max(15, Math.min(99, confidence));
    r._insights = insights;

    // Contradictions: recommendation doesn't match what AI would suggest
    if ((r.level === 'L1' || r.level === 'L2') && r.recommendation === 'N' && !hasSensitive) {
      contradictions.push({
        role: r,
        type: 'missed_opportunity',
        message: `${r.level} role marked Retain but has no sensitive keywords. AI suggests Offshore.`,
        impact: r.estimated_spend * 0.55,
      });
    }
    if ((r.level === 'L3' || r.level === 'L4') && r.recommendation === 'Y' && hasSensitive) {
      contradictions.push({
        role: r,
        type: 'risky_offshore',
        message: `${r.level} role marked Offshore despite sensitive indicators: ${insights.matchedKeywords.join(', ')}.`,
        impact: r.estimated_spend,
      });
    }
    if (r.recommendation === 'Y' && insights.severity === 'critical') {
      contradictions.push({
        role: r,
        type: 'critical_risk',
        message: `Offshore recommendation conflicts with critical AI risk flags.`,
        impact: r.estimated_spend,
      });
    }

    // Quick Wins: high savings, low risk, easy to move
    if (r.recommendation === 'Y' && (r.level === 'L1' || r.level === 'L2') && !hasSensitive && r.estimated_spend > 0) {
      quickWins.push({
        role: r,
        savings: Math.round(r.estimated_spend * 0.55),
        difficulty: r.level === 'L1' ? 'Easy' : 'Moderate',
        timeline: r.level === 'L1' ? '30-60 days' : '60-90 days',
      });
    }

    // Hidden Risks: marked offshore but AI flags concerns
    if (r.recommendation === 'Y' && (insights.severity === 'high' || insights.severity === 'critical')) {
      hiddenRisks.push({
        role: r,
        severity: insights.severity,
        warnings: insights.warnings,
        keywords: insights.matchedKeywords,
      });
    }

    // Wave classification
    if (r.recommendation === 'N' || (hasSensitive && r.level !== 'L1')) {
      waves.doNotMove.push(r);
    } else if (r.level === 'L1' && r.recommendation === 'Y' && !hasSensitive) {
      waves.wave1.push(r);
    } else if ((r.level === 'L2' && r.recommendation === 'Y') || (r.level === 'L1' && r.recommendation === 'P')) {
      waves.wave2.push(r);
    } else {
      waves.wave3.push(r);
    }
  }

  // Cross-BU: find similar role names across different BUs with different recommendations
  const roleNameMap = {};
  for (const r of allRoles) {
    const key = r.role_name.toLowerCase().replace(/\s+(i+|sr|jr|lead|manager)$/i, '').trim();
    if (!roleNameMap[key]) roleNameMap[key] = [];
    roleNameMap[key].push(r);
  }
  for (const [, roles] of Object.entries(roleNameMap)) {
    if (roles.length < 2) continue;
    const recs = new Set(roles.map(r => r.recommendation));
    if (recs.size > 1) {
      crossBU.push({
        roleName: roles[0].role_name,
        instances: roles.map(r => ({
          unit: r.unitName,
          level: r.level,
          rec: r.recommendation,
          spend: r.estimated_spend,
          fte: r.current_fte,
        })),
      });
    }
  }

  // Best destination per wave
  const waveFit = {};
  for (const [waveName, waveRoles] of Object.entries(waves)) {
    if (waveName === 'doNotMove' || waveRoles.length === 0) continue;
    const countryScores = {};
    for (const country of OFFSHORE_COUNTRIES) {
      let total = 0;
      for (const r of waveRoles) {
        total += scoreCountryFit(country, r).score;
      }
      countryScores[country.id] = { country, avg: Math.round(total / waveRoles.length) };
    }
    waveFit[waveName] = Object.values(countryScores).sort((a, b) => b.avg - a.avg).slice(0, 2);
  }

  // Sort quick wins by savings desc
  quickWins.sort((a, b) => b.savings - a.savings);

  return { contradictions, quickWins: quickWins.slice(0, 8), hiddenRisks, crossBU, waves, waveFit, allRoles };
}

// ── Severity badge ───────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-900/40 text-red-400 border-red-700/40',
    high: 'bg-orange-900/40 text-orange-400 border-orange-700/40',
    medium: 'bg-amber-900/40 text-amber-400 border-amber-700/40',
    low: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium uppercase tracking-wider ${styles[severity] || styles.low}`}>
      {severity}
    </span>
  );
}

// ── Animated scan line ───────────────────────────────────────────
function ScanAnimation({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('Initializing neural analysis engine...');

  useEffect(() => {
    const phases = [
      { at: 5, text: 'Scanning workforce topology...' },
      { at: 20, text: 'Cross-referencing role classifications...' },
      { at: 35, text: 'Detecting recommendation contradictions...' },
      { at: 50, text: 'Calculating risk-adjusted opportunity scores...' },
      { at: 65, text: 'Mapping cross-BU patterns...' },
      { at: 80, text: 'Generating transition wave strategy...' },
      { at: 92, text: 'Compiling intelligence brief...' },
    ];
    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + 1.5 + Math.random() * 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        const currentPhase = [...phases].reverse().find(ph => next >= ph.at);
        if (currentPhase) setPhase(currentPhase.text);
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-full max-w-lg text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-2 border-gwoe-accent/30 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-t-gwoe-accent rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
          <div className="absolute inset-3 border-2 border-t-gwoe-green rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          <div className="absolute inset-6 border-2 border-t-gwoe-amber rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gwoe-accent font-mono">{Math.round(progress)}%</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-white mb-2">AI Deep Analysis</h3>
        <p className="text-xs text-gwoe-accent font-mono mb-4 h-4">{phase}</p>

        <div className="w-full h-1.5 bg-gwoe-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gwoe-accent via-gwoe-green to-gwoe-accent rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// ── Confidence Ring ──────────────────────────────────────────────
function ConfidenceRing({ value, size = 32 }) {
  const color = value >= 80 ? 'text-gwoe-green' : value >= 60 ? 'text-gwoe-amber' : 'text-gwoe-red';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gwoe-border" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeDasharray={`${value}, 100`} className={color}
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <span className={`absolute text-xs font-bold font-mono ${color}`} style={{ fontSize: size * 0.28 }}>{value}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
// Pure display component — receives allRoles from App.js, no independent data fetching
export default function AICommandCenter({ allRoles }) {
  const [scanning, setScanning] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedContradiction, setExpandedContradiction] = useState(null);

  // Memoize analysis so it only recomputes when allRoles changes
  const analysis = useMemo(() => {
    if (!allRoles || allRoles.length === 0) return null;
    return runFullAnalysis(allRoles);
  }, [allRoles]);

  const handleScanComplete = useCallback(() => setScanning(false), []);

  if (!analysis) {
    return <p className="text-gwoe-muted">Loading AI Command Center...</p>;
  }

  if (scanning) {
    return <ScanAnimation onComplete={handleScanComplete} />;
  }

  const { contradictions, quickWins, hiddenRisks, crossBU, waves, waveFit, allRoles: analyzedRoles } = analysis;

  // Aggregate stats
  const totalRoles = analyzedRoles.length;
  const avgConfidence = Math.round(analyzedRoles.reduce((s, r) => s + r._confidence, 0) / totalRoles);
  const totalQuickWinSavings = quickWins.reduce((s, q) => s + q.savings, 0);
  const criticalIssues = contradictions.filter(c => c.type === 'critical_risk' || c.type === 'risky_offshore').length;

  const wave1FTE = waves.wave1.reduce((s, r) => s + r.current_fte, 0);
  const wave2FTE = waves.wave2.reduce((s, r) => s + r.current_fte, 0);
  const wave3FTE = waves.wave3.reduce((s, r) => s + r.current_fte, 0);
  const retainFTE = waves.doNotMove.reduce((s, r) => s + r.current_fte, 0);
  const wave1Savings = waves.wave1.reduce((s, r) => s + r.estimated_spend * 0.55, 0);
  const wave2Savings = waves.wave2.reduce((s, r) => s + r.estimated_spend * 0.55, 0);
  const wave3Savings = waves.wave3.reduce((s, r) => s + r.estimated_spend * 0.55, 0);

  const tabs = [
    { id: 'overview', label: 'Intel Overview', count: null },
    { id: 'contradictions', label: 'Contradictions', count: contradictions.length },
    { id: 'quickwins', label: 'Quick Wins', count: quickWins.length },
    { id: 'risks', label: 'Risk Hotspots', count: hiddenRisks.length },
    { id: 'crossbu', label: 'Cross-BU Intel', count: crossBU.length },
    { id: 'waves', label: 'Transition Waves', count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gwoe-accent/30 to-gwoe-green/30 flex items-center justify-center border border-gwoe-accent/30 flex-shrink-0">
            <span className="text-lg">&#9043;</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Command Center</h2>
            <p className="text-xs text-gwoe-muted">Proactive intelligence across {totalRoles} roles</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gwoe-muted">Avg. Confidence</p>
            <ConfidenceRing value={avgConfidence} size={38} />
          </div>
          <button
            onClick={() => setScanning(true)}
            className="px-3 py-2 text-xs bg-gwoe-accent/20 text-gwoe-accent rounded-md hover:bg-gwoe-accent/30 border border-gwoe-accent/30 transition-colors"
          >
            Re-scan
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {criticalIssues > 0 && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-md px-4 py-3 flex items-center gap-3">
          <span className="text-red-400 text-lg">&#9888;</span>
          <div>
            <p className="text-sm font-medium text-red-400">
              {criticalIssues} Critical Issue{criticalIssues > 1 ? 's' : ''} Detected
            </p>
            <p className="text-xs text-red-400/70">
              AI found roles with conflicting offshore recommendations and risk signals. Review the Contradictions tab.
            </p>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">Contradictions</p>
          <p className="text-2xl font-bold text-gwoe-amber mt-1">{contradictions.length}</p>
          <p className="text-xs text-gwoe-muted">recommendations to review</p>
        </div>
        <div className="card p-4 glow-border">
          <p className="text-xs text-gwoe-green uppercase tracking-wider">Quick Win Savings</p>
          <p className="text-2xl font-bold text-gwoe-green mt-1">{formatCurrency(totalQuickWinSavings)}</p>
          <p className="text-xs text-gwoe-muted">{quickWins.length} low-risk roles</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gwoe-red uppercase tracking-wider">Risk Hotspots</p>
          <p className="text-2xl font-bold text-gwoe-red mt-1">{hiddenRisks.length}</p>
          <p className="text-xs text-gwoe-muted">flagged for review</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gwoe-accent uppercase tracking-wider">Cross-BU Conflicts</p>
          <p className="text-2xl font-bold text-gwoe-accent mt-1">{crossBU.length}</p>
          <p className="text-xs text-gwoe-muted">inconsistent decisions</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gwoe-muted uppercase tracking-wider">AI Confidence</p>
          <p className="text-2xl font-bold text-white mt-1">{avgConfidence}%</p>
          <p className="text-xs text-gwoe-muted">across all roles</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gwoe-border pb-px overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-gwoe-accent'
                : 'text-gwoe-muted hover:text-gwoe-text'
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-gwoe-accent/20 text-gwoe-accent' : 'bg-gwoe-border text-gwoe-muted'
              }`}>{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gwoe-accent rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Confidence Distribution */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">AI Confidence Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'High (80-99%)', min: 80, max: 100, color: 'bg-gwoe-green', textColor: 'text-gwoe-green' },
                { label: 'Good (60-79%)', min: 60, max: 80, color: 'bg-gwoe-accent', textColor: 'text-gwoe-accent' },
                { label: 'Low (40-59%)', min: 40, max: 60, color: 'bg-gwoe-amber', textColor: 'text-gwoe-amber' },
                { label: 'Poor (<40%)', min: 0, max: 40, color: 'bg-gwoe-red', textColor: 'text-gwoe-red' },
              ].map(band => {
                const count = analyzedRoles.filter(r => r._confidence >= band.min && r._confidence < band.max).length;
                const pct = totalRoles > 0 ? Math.round((count / totalRoles) * 100) : 0;
                return (
                  <div key={band.label} className="text-center">
                    <div className="h-24 flex items-end justify-center mb-2">
                      <div
                        className={`w-12 ${band.color}/30 rounded-t-md border-t-2 ${band.color.replace('bg-', 'border-')} transition-all duration-500`}
                        style={{ height: `${Math.max(8, pct)}%` }}
                      ></div>
                    </div>
                    <p className={`text-lg font-bold ${band.textColor}`}>{count}</p>
                    <p className="text-xs text-gwoe-muted">{band.label}</p>
                    <p className="text-xs text-gwoe-muted">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Intelligence Brief */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">AI Intelligence Brief</h3>
            <div className="bg-gwoe-bg rounded-lg p-4 border border-gwoe-border space-y-3 text-sm text-gwoe-text leading-relaxed">
              <p>
                Analysis of <strong className="text-white">{totalRoles} roles</strong> across{' '}
                <strong className="text-white">{new Set(analyzedRoles.map(r => r.unitName)).size} business units</strong>{' '}
                reveals an average AI confidence of <strong className={avgConfidence >= 70 ? 'text-gwoe-green' : 'text-gwoe-amber'}>{avgConfidence}%</strong> in
                current recommendations.
              </p>
              {contradictions.length > 0 && (
                <p>
                  <span className="text-gwoe-amber font-medium">&#9679; {contradictions.length} contradictions detected</span> — roles where the
                  current recommendation conflicts with AI risk signals.
                  {contradictions.filter(c => c.type === 'missed_opportunity').length > 0 && (
                    <> Notably, <strong className="text-gwoe-green">
                      {contradictions.filter(c => c.type === 'missed_opportunity').length} roles</strong> are
                      marked Retain but appear suitable for offshoring, representing{' '}
                      <strong className="text-gwoe-green">
                        {formatCurrency(contradictions.filter(c => c.type === 'missed_opportunity').reduce((s, c) => s + c.impact, 0))}
                      </strong> in unrealized savings.
                    </>
                  )}
                </p>
              )}
              {quickWins.length > 0 && (
                <p>
                  <span className="text-gwoe-green font-medium">&#9679; {quickWins.length} quick wins identified</span> — low-risk, high-impact roles
                  that can be transitioned within 30-90 days for an immediate{' '}
                  <strong className="text-gwoe-green">{formatCurrency(totalQuickWinSavings)}</strong> in annual savings.
                </p>
              )}
              {crossBU.length > 0 && (
                <p>
                  <span className="text-gwoe-accent font-medium">&#9679; {crossBU.length} cross-BU inconsistencies</span> — identical
                  roles in different business units have conflicting recommendations, suggesting organizational
                  alignment opportunities.
                </p>
              )}
              <p className="text-xs text-gwoe-muted pt-2 border-t border-gwoe-border">
                Generated by GWOE AI Engine — {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Contradictions Tab ──────────────────────────────── */}
      {activeTab === 'contradictions' && (
        <div className="space-y-3">
          {contradictions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gwoe-green text-3xl mb-2">&#10003;</p>
              <p className="text-sm text-gwoe-muted">No contradictions found. All recommendations align with AI analysis.</p>
            </div>
          ) : (
            contradictions.map((c, i) => (
              <div
                key={i}
                className={`card overflow-hidden transition-all duration-200 ${
                  c.type === 'critical_risk' ? 'border-l-2 border-l-red-500' :
                  c.type === 'risky_offshore' ? 'border-l-2 border-l-orange-500' :
                  'border-l-2 border-l-amber-500'
                }`}
              >
                <div
                  className="px-5 py-4 cursor-pointer hover:bg-gwoe-bg/50 transition-colors"
                  onClick={() => setExpandedContradiction(expandedContradiction === i ? null : i)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ConfidenceRing value={c.role._confidence} size={34} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{c.role.role_name}</span>
                          <span className="text-xs font-mono text-gwoe-accent">{c.role.level}</span>
                          <span className="text-xs text-gwoe-muted">({c.role.unitName})</span>
                        </div>
                        <p className="text-xs text-gwoe-muted mt-0.5">{c.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.type === 'missed_opportunity' && (
                        <span className="text-xs text-gwoe-green font-mono">+{formatCurrency(c.impact)} potential</span>
                      )}
                      {c.type === 'risky_offshore' && (
                        <span className="text-xs text-gwoe-red font-mono">{formatCurrency(c.impact)} at risk</span>
                      )}
                      <span className="text-gwoe-muted text-xs">{expandedContradiction === i ? '▼' : '▶'}</span>
                    </div>
                  </div>
                </div>
                {expandedContradiction === i && (
                  <div className="px-5 py-4 bg-gwoe-bg/50 border-t border-gwoe-border">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-gwoe-muted mb-1">Current Recommendation</p>
                        <span className={c.role.recommendation === 'Y' ? 'badge-yes' : c.role.recommendation === 'P' ? 'badge-partial' : 'badge-no'}>
                          {c.role.recommendation === 'Y' ? 'Offshore' : c.role.recommendation === 'P' ? 'Partial' : 'Retain'}
                        </span>
                      </div>
                      <div>
                        <p className="text-gwoe-muted mb-1">AI Confidence</p>
                        <span className={`font-mono font-bold ${c.role._confidence >= 60 ? 'text-gwoe-green' : 'text-gwoe-red'}`}>
                          {c.role._confidence}%
                        </span>
                      </div>
                      <div>
                        <p className="text-gwoe-muted mb-1">Spend / FTE</p>
                        <span className="font-mono text-white">{formatCurrency(c.role.estimated_spend)} / {c.role.current_fte} FTE</span>
                      </div>
                    </div>
                    {c.role.qualitative_why && (
                      <div className="mt-3">
                        <p className="text-xs text-gwoe-muted mb-1">Rationale</p>
                        <p className="text-xs text-gwoe-text">{c.role.qualitative_why}</p>
                      </div>
                    )}
                    {c.role._insights.matchedKeywords.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gwoe-muted mb-1">Risk Keywords Detected</p>
                        <div className="flex gap-1 flex-wrap">
                          {c.role._insights.matchedKeywords.map(kw => (
                            <span key={kw} className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-700/30">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Quick Wins Tab ──────────────────────────────────── */}
      {activeTab === 'quickwins' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Highest-Impact Quick Wins</h3>
              <span className="text-xs text-gwoe-green font-mono">Total: {formatCurrency(totalQuickWinSavings)}/yr</span>
            </div>
            <div className="space-y-2">
              {quickWins.map((q, i) => {
                const barWidth = totalQuickWinSavings > 0 ? Math.round((q.savings / totalQuickWinSavings) * 100) : 0;
                return (
                  <div key={i} className="relative bg-gwoe-bg rounded-lg p-4 border border-gwoe-border overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gwoe-green/5 border-r border-gwoe-green/20 transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gwoe-green/50 font-mono w-6">#{i + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{q.role.role_name}</span>
                            <span className="text-xs font-mono text-gwoe-accent">{q.role.level}</span>
                          </div>
                          <p className="text-xs text-gwoe-muted">{q.role.unitName} / {q.role.deptName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gwoe-green font-mono">{formatCurrency(q.savings)}/yr</p>
                          <p className="text-xs text-gwoe-muted">{q.role.current_fte} FTE</p>
                        </div>
                        <div className="text-right w-20">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            q.difficulty === 'Easy' ? 'bg-gwoe-green/20 text-gwoe-green' : 'bg-gwoe-amber/20 text-gwoe-amber'
                          }`}>{q.difficulty}</span>
                          <p className="text-xs text-gwoe-muted mt-0.5">{q.timeline}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Risk Hotspots Tab ───────────────────────────────── */}
      {activeTab === 'risks' && (
        <div className="space-y-3">
          {hiddenRisks.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gwoe-green text-3xl mb-2">&#9670;</p>
              <p className="text-sm text-gwoe-muted">No hidden risk hotspots detected. All offshore recommendations appear sound.</p>
            </div>
          ) : (
            hiddenRisks.map((hr, i) => (
              <div key={i} className="card p-5 border-l-2 border-l-red-500">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ConfidenceRing value={hr.role._confidence} size={34} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{hr.role.role_name}</span>
                        <span className="text-xs font-mono text-gwoe-accent">{hr.role.level}</span>
                        <SeverityBadge severity={hr.severity} />
                      </div>
                      <p className="text-xs text-gwoe-muted">{hr.role.unitName} — {formatCurrency(hr.role.estimated_spend)} / {hr.role.current_fte} FTE</p>
                    </div>
                  </div>
                  <span className="badge-yes">Currently: Offshore</span>
                </div>
                {hr.warnings.map((w, j) => (
                  <div key={j} className="bg-red-900/10 border border-red-700/20 rounded-md px-3 py-2 mb-2">
                    <p className="text-xs text-red-400">{w.message}</p>
                  </div>
                ))}
                <div className="flex gap-1 flex-wrap mt-2">
                  {hr.keywords.map(kw => (
                    <span key={kw} className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-700/30">{kw}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Cross-BU Intel Tab ──────────────────────────────── */}
      {activeTab === 'crossbu' && (
        <div className="space-y-4">
          {crossBU.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gwoe-accent text-3xl mb-2">&#9634;</p>
              <p className="text-sm text-gwoe-muted">No cross-BU inconsistencies found. Recommendations are consistent across units.</p>
            </div>
          ) : (
            crossBU.map((cb, i) => (
              <div key={i} className="card p-5">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-gwoe-accent">&#8644;</span>
                  {cb.roleName}
                  <span className="text-xs text-gwoe-muted font-normal">({cb.instances.length} instances across BUs)</span>
                </h4>
                <div className="grid gap-2">
                  {cb.instances.map((inst, j) => (
                    <div key={j} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gwoe-bg rounded-md px-4 py-2.5 border border-gwoe-border gap-1 sm:gap-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-white">{inst.unit}</span>
                        <span className="text-xs font-mono text-gwoe-accent">{inst.level}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-gwoe-muted">{inst.fte} FTE</span>
                        <span className="text-xs font-mono text-gwoe-muted">{formatCurrency(inst.spend)}</span>
                        <span className={inst.rec === 'Y' ? 'badge-yes' : inst.rec === 'P' ? 'badge-partial' : 'badge-no'}>
                          {inst.rec === 'Y' ? 'Offshore' : inst.rec === 'P' ? 'Partial' : 'Retain'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gwoe-amber mt-2">
                  &#9888; Same role, different recommendations — consider aligning to a single organizational policy.
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Transition Waves Tab ────────────────────────────── */}
      {activeTab === 'waves' && (
        <div className="space-y-4">
          {/* Timeline Visual */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">AI-Generated Transition Roadmap</h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gwoe-border"></div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {[
                  { label: 'Wave 1', sub: 'Months 1-3', roles: waves.wave1, fte: wave1FTE, savings: wave1Savings, color: 'gwoe-green', fit: waveFit.wave1 },
                  { label: 'Wave 2', sub: 'Months 4-6', roles: waves.wave2, fte: wave2FTE, savings: wave2Savings, color: 'gwoe-accent', fit: waveFit.wave2 },
                  { label: 'Wave 3', sub: 'Months 7-12', roles: waves.wave3, fte: wave3FTE, savings: wave3Savings, color: 'gwoe-amber', fit: waveFit.wave3 },
                  { label: 'Do Not Move', sub: 'Retain', roles: waves.doNotMove, fte: retainFTE, savings: 0, color: 'gwoe-red', fit: null },
                ].map((wave, i) => (
                  <div key={i} className="text-center">
                    <div className={`w-3 h-3 rounded-full bg-${wave.color} mx-auto mb-4 border-2 border-gwoe-card relative z-10`}></div>
                    <div className={`bg-${wave.color}/10 border border-${wave.color}/30 rounded-lg p-4`}>
                      <p className={`text-sm font-bold text-${wave.color}`}>{wave.label}</p>
                      <p className="text-xs text-gwoe-muted mb-3">{wave.sub}</p>
                      <p className="text-2xl font-bold text-white">{wave.roles.length}</p>
                      <p className="text-xs text-gwoe-muted">roles ({wave.fte} FTE)</p>
                      {wave.savings > 0 && (
                        <p className="text-sm font-mono text-gwoe-green mt-2">{formatCurrency(Math.round(wave.savings))}/yr</p>
                      )}
                      {wave.fit && wave.fit.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gwoe-border">
                          <p className="text-xs text-gwoe-muted mb-1">Best Destinations</p>
                          {wave.fit.map((f, j) => (
                            <div key={j} className="flex items-center justify-center gap-1 text-xs">
                              <span>{f.country.flag}</span>
                              <span className="text-gwoe-text">{f.country.name}</span>
                              <span className="text-gwoe-muted">({f.avg})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wave Detail Tables */}
          {[
            { key: 'wave1', label: 'Wave 1 — Immediate Movers', roles: waves.wave1, color: 'gwoe-green' },
            { key: 'wave2', label: 'Wave 2 — Structured Transition', roles: waves.wave2, color: 'gwoe-accent' },
            { key: 'wave3', label: 'Wave 3 — Complex/Hybrid', roles: waves.wave3, color: 'gwoe-amber' },
          ].map(wave => wave.roles.length > 0 && (
            <div key={wave.key} className="card">
              <div className={`px-5 py-3 border-b border-gwoe-border flex items-center gap-2`}>
                <div className={`w-2 h-2 rounded-full bg-${wave.color}`}></div>
                <h4 className="text-sm font-semibold text-white">{wave.label}</h4>
                <span className="text-xs text-gwoe-muted">({wave.roles.length} roles)</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm min-w-[580px]">
                  <thead>
                    <tr className="border-b border-gwoe-border text-gwoe-muted text-xs uppercase tracking-wider">
                      <th className="text-left py-2 px-3 font-medium">Role</th>
                      <th className="text-left py-2 px-3 font-medium">Unit</th>
                      <th className="text-center py-2 px-2 font-medium w-12">Level</th>
                      <th className="text-right py-2 px-2 font-medium w-14">FTE</th>
                      <th className="text-right py-2 px-3 font-medium">Spend</th>
                      <th className="text-right py-2 px-3 font-medium">Est. Savings</th>
                      <th className="text-center py-2 px-2 font-medium w-16">Conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wave.roles.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b border-gwoe-border/50 hover:bg-gwoe-bg/50">
                        <td className="py-2 px-3 text-white text-xs">{r.role_name}</td>
                        <td className="py-2 px-3 text-gwoe-muted text-xs">{r.unitName}</td>
                        <td className="py-2 px-2 text-center font-mono text-xs text-gwoe-accent">{r.level}</td>
                        <td className="py-2 px-2 text-right font-mono text-xs">{r.current_fte}</td>
                        <td className="py-2 px-3 text-right font-mono text-xs">{formatCurrency(r.estimated_spend)}</td>
                        <td className="py-2 px-3 text-right font-mono text-xs text-gwoe-green">{formatCurrency(Math.round(r.estimated_spend * 0.55))}</td>
                        <td className="py-2 px-2 text-center"><ConfidenceRing value={r._confidence} size={26} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {wave.roles.length > 10 && (
                  <p className="text-xs text-gwoe-muted text-center mt-2">+ {wave.roles.length - 10} more roles</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
