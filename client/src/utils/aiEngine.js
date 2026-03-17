// AI logic engine — runs client-side
// Ported from server/src/routes/ai.js

const RATIONALE_PATTERNS = {
  L1: {
    default: "High-volume, process-driven work suitable for standardized offshore delivery with clear runbooks and SLAs.",
    keywords: {
      security: "While L1, this role handles security-sensitive data. Recommend enhanced vetting for offshore candidates.",
      creative: "Templated creative production. Suitable for offshore with strong brand guideline documentation.",
      data: "Routine data processing and maintenance. Well-suited for offshore with established quality checks."
    }
  },
  L2: {
    default: "Mid-level execution role. Offshore potential with proper knowledge transfer and escalation protocols.",
    keywords: {
      security: "Security-adjacent role. Partial offshoring possible with proper access controls and audit trails.",
      creative: "Creative execution with some judgment required. Consider hybrid model with onshore creative direction.",
      data: "Data analysis requiring moderate domain knowledge. Offshore viable with training investment."
    }
  },
  L3: {
    default: "Senior role requiring institutional knowledge and strategic judgment. Recommend retaining internally.",
    keywords: {
      security: "Security-critical role requiring trusted access and deep system knowledge. Strong retain recommendation.",
      creative: "Senior creative role requiring cultural nuance and editorial judgment. Recommend internal retention.",
      data: "Advanced analytics/architecture. IP sensitivity and strategic importance warrant internal retention."
    }
  },
  L4: {
    default: "Leadership/architect role. Core strategic function requiring organizational trust and vision. Do not offshore.",
    keywords: {
      security: "Top-tier security leadership. Absolutely critical to retain internally. Zero offshore recommendation.",
      creative: "Executive creative leadership. Brand-defining role with high reputational impact.",
      data: "Chief data/AI strategist. Proprietary IP creation and organizational strategy. Must retain."
    }
  }
};

const HIGH_QUALITY_LOSS_KEYWORDS = ['security', 'local', 'strategic', 'proprietary', 'trust', 'clearance', 'brand risk', 'cultural', 'regulatory', 'compliance', 'executive'];

export function generateRationale({ role_name, level, business_unit }) {
  const roleNameLower = (role_name || '').toLowerCase();
  const unitLower = (business_unit || '').toLowerCase();

  let category = 'default';
  if (roleNameLower.includes('security') || roleNameLower.includes('soc') || roleNameLower.includes('iam') || unitLower === 'cyber') {
    category = 'security';
  } else if (roleNameLower.includes('editor') || roleNameLower.includes('journalist') || roleNameLower.includes('anchor') || roleNameLower.includes('designer') || unitLower === 'news') {
    category = 'creative';
  } else if (roleNameLower.includes('data') || roleNameLower.includes('analyst') || roleNameLower.includes('ml') || roleNameLower.includes('etl') || unitLower === 'data') {
    category = 'data';
  }

  const levelPatterns = RATIONALE_PATTERNS[level] || RATIONALE_PATTERNS.L1;
  const rationale = levelPatterns.keywords[category] || levelPatterns.default;
  const offshoreRecommendation = (level === 'L1' || level === 'L2') ? 'Y' : 'N';
  const adjustedRecommendation = (category === 'security' && level === 'L2') ? 'P' : offshoreRecommendation;

  return { rationale, suggestedOffshore: offshoreRecommendation, suggestedRecommendation: adjustedRecommendation };
}

export function generateRiskAssessment({ role_name, level, qualitative_why, recommendation, estimated_spend, current_fte }) {
  const isOffshore = recommendation === 'Y';
  const isPartial = recommendation === 'P';
  const savingsEstimate = isOffshore ? Math.round(estimated_spend * 0.55) : isPartial ? Math.round(estimated_spend * 0.3) : 0;

  if (isOffshore) {
    return {
      pros: [
        `Potential annual savings of $${savingsEstimate.toLocaleString()} (est. 55% cost reduction for ${current_fte} FTE).`,
        `Access to 24/7 delivery model with follow-the-sun coverage for ${role_name}.`,
        `Scalable workforce — ability to flex ${role_name} capacity up/down based on demand.`
      ],
      cons: [
        `Knowledge transfer risk — estimated 3-6 month ramp period with potential quality dip.`,
        `Communication overhead — time zone differences may impact real-time collaboration.`,
        `Institutional knowledge loss — ${level} roles may hold undocumented tribal knowledge.`
      ],
      mitigation: [
        `Implement structured KT program with shadow period and documented runbooks.`,
        `Establish overlapping working hours (min. 4hrs) and regular sync cadences.`,
        `Create knowledge repository and cross-training program before transition.`
      ]
    };
  } else if (isPartial) {
    return {
      pros: [
        `Hybrid model offers partial savings of $${savingsEstimate.toLocaleString()} while retaining core expertise.`,
        `Maintains institutional knowledge onshore while offloading routine tasks.`,
        `Provides flexibility to scale offshore component based on performance.`
      ],
      cons: [
        `Complex management — requires coordination between onshore and offshore teams.`,
        `Potential quality inconsistency between onshore and offshore deliverables.`,
        `Higher initial setup cost due to dual-team structure and tooling requirements.`
      ],
      mitigation: [
        `Define clear swim lanes between onshore (strategy/review) and offshore (execution).`,
        `Implement unified quality metrics and regular calibration sessions.`,
        `Start with 70/30 onshore/offshore split, adjust based on quarterly performance review.`
      ]
    };
  }

  return {
    pros: [
      `Retaining ${role_name} (${level}) preserves critical institutional knowledge and quality.`,
      `Maintains direct stakeholder access and cultural alignment.`,
      `Reduces risk of IP leakage and security concerns for sensitive functions.`
    ],
    cons: [
      `Higher ongoing cost — current spend of $${(estimated_spend || 0).toLocaleString()} maintained.`,
      `Limited scalability — headcount increases require full domestic hiring cycles.`,
      `Potential for key-person dependency if ${role_name} expertise is concentrated.`
    ],
    mitigation: [
      `Invest in automation to increase per-FTE productivity and offset cost.`,
      `Build internal talent pipeline and cross-training to reduce key-person risk.`,
      `Consider selective task decomposition to identify any offshorable sub-tasks.`
    ]
  };
}

export function analyzeInsights({ qualitative_why, role_name, level }) {
  const text = `${qualitative_why} ${role_name}`.toLowerCase();
  const matchedKeywords = HIGH_QUALITY_LOSS_KEYWORDS.filter(kw => text.includes(kw));
  const hasHighQualityLossRisk = matchedKeywords.length > 0;

  let severity = 'low';
  if (matchedKeywords.length >= 3) severity = 'critical';
  else if (matchedKeywords.length >= 2) severity = 'high';
  else if (matchedKeywords.length >= 1) severity = 'medium';

  if (level === 'L3' || level === 'L4') {
    severity = severity === 'low' ? 'medium' : severity === 'medium' ? 'high' : 'critical';
  }

  const warnings = [];
  if (hasHighQualityLossRisk) {
    warnings.push({
      type: 'HIGH_QUALITY_LOSS',
      severity,
      message: `High Quality Loss Warning: Role "${role_name}" contains risk indicators [${matchedKeywords.join(', ')}]. Offshoring may result in significant quality degradation.`,
      keywords: matchedKeywords
    });
  }

  if (text.includes('security') || text.includes('clearance') || text.includes('trusted access')) {
    warnings.push({
      type: 'SECURITY_POLICY_CONFLICT',
      severity: 'critical',
      message: `Security Policy Conflict: "${role_name}" involves security-sensitive functions. Cross-reference with Cyber unit's security policy before offshoring.`,
      keywords: matchedKeywords.filter(k => ['security', 'clearance'].includes(k))
    });
  }

  return { hasHighQualityLossRisk, severity, warnings, matchedKeywords };
}

export function generateExecutiveSummary(allRoles, byUnit) {
  const totalFTE = allRoles.reduce((s, r) => s + r.current_fte, 0);
  const totalSpend = allRoles.reduce((s, r) => s + r.estimated_spend, 0);
  const offshoreFTE = allRoles.filter(r => r.recommendation === 'Y').reduce((s, r) => s + r.current_fte, 0);
  const offshoreSpend = allRoles.filter(r => r.recommendation === 'Y').reduce((s, r) => s + r.estimated_spend, 0);
  const partialFTE = allRoles.filter(r => r.recommendation === 'P').reduce((s, r) => s + r.current_fte, 0);
  const retainFTE = allRoles.filter(r => r.recommendation === 'N').reduce((s, r) => s + r.current_fte, 0);

  const savingsEstimate = Math.round(offshoreSpend * 0.55);
  const offshorePercent = totalFTE > 0 ? Math.round((offshoreFTE / totalFTE) * 100) : 0;
  const qualityRiskScore = totalFTE > 0 ? Math.round(100 - (retainFTE / totalFTE) * 40 - (partialFTE / totalFTE) * 20) : 0;

  const highRiskRoles = allRoles
    .filter(r => r.recommendation === 'N' && (r.level === 'L3' || r.level === 'L4'))
    .sort((a, b) => b.estimated_spend - a.estimated_spend)
    .slice(0, 3);

  const unitBreakdown = byUnit.map(u => {
    const uOffshoreSpend = u.roles.filter(r => r.recommendation === 'Y').reduce((s, r) => s + r.estimated_spend, 0);
    const uOffshoreFTE = u.roles.filter(r => r.recommendation === 'Y').reduce((s, r) => s + r.current_fte, 0);
    return `${u.name}: ${uOffshoreFTE} FTE ($${Math.round(uOffshoreSpend * 0.55 / 1000)}K savings)`;
  }).join('; ');

  const topUnit = byUnit.reduce((best, u) => {
    const s = u.roles.filter(r => r.recommendation === 'Y').reduce((s, r) => s + r.estimated_spend, 0);
    return s > (best.spend || 0) ? { name: u.name, spend: s, fte: u.roles.filter(r => r.recommendation === 'Y').reduce((s, r) => s + r.current_fte, 0) } : best;
  }, {});

  const summary = `EXECUTIVE SUMMARY — Global Workforce Optimization Analysis

This analysis evaluates ${totalFTE} FTE across ${byUnit.length} business units with a combined annual spend of $${(totalSpend / 1000000).toFixed(1)}M. Our assessment identifies ${offshoreFTE} FTE (${offshorePercent}%) as strong candidates for offshoring, with an additional ${partialFTE} FTE suitable for hybrid onshore/offshore models.

FINANCIAL IMPACT: Full implementation of recommended offshoring could yield estimated annual savings of $${(savingsEstimate / 1000000).toFixed(1)}M, assuming a 55% cost reduction on offshored roles. The highest-impact unit is ${topUnit.name} with ${topUnit.fte} FTE identified for transition.

UNIT BREAKDOWN: ${unitBreakdown}.

QUALITY RISK ASSESSMENT: The AI Sentiment Score for overall quality risk is ${qualityRiskScore}/100 (higher = more aggressive offshoring). ${retainFTE} FTE are flagged for mandatory retention due to strategic importance, security requirements, or cultural sensitivity. Key retention roles include ${highRiskRoles.map(r => `${r.role_name} (${r.level})`).join(', ')}.

RECOMMENDATION: Proceed with Phase 1 offshoring of L1/L2 roles across all units (${offshoreFTE} FTE), implement 90-day knowledge transfer programs, and establish quarterly quality reviews before considering L3 hybrid models. Estimated timeline: 6-9 months for full transition with parallel onshore support during ramp period.`;

  return {
    summary,
    metrics: { totalFTE, totalSpend, offshoreFTE, offshoreSpend, estimatedSavings: savingsEstimate, qualityRiskScore, offshorePercent }
  };
}
