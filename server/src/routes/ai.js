const express = require('express');
const { getDb } = require('../database');
const router = express.Router();

// AI logic patterns for auto-rationale
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

// POST generate auto-rationale
router.post('/rationale', (req, res) => {
  const { role_name, level, business_unit } = req.body;

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

  res.json({
    rationale,
    suggestedOffshore: offshoreRecommendation,
    suggestedRecommendation: adjustedRecommendation
  });
});

// POST generate pros/cons risk assessment
router.post('/risk-assessment', (req, res) => {
  const { role_name, level, qualitative_why, recommendation, estimated_spend, current_fte } = req.body;

  const isOffshore = recommendation === 'Y';
  const isPartial = recommendation === 'P';
  const savingsEstimate = isOffshore ? Math.round(estimated_spend * 0.55) : isPartial ? Math.round(estimated_spend * 0.3) : 0;

  let pros, cons, mitigation;

  if (isOffshore) {
    pros = [
      `Potential annual savings of $${savingsEstimate.toLocaleString()} (est. 55% cost reduction for ${current_fte} FTE).`,
      `Access to 24/7 delivery model with follow-the-sun coverage for ${role_name}.`,
      `Scalable workforce — ability to flex ${role_name} capacity up/down based on demand.`
    ];
    cons = [
      `Knowledge transfer risk — estimated 3-6 month ramp period with potential quality dip.`,
      `Communication overhead — time zone differences may impact real-time collaboration.`,
      `Institutional knowledge loss — ${level} roles may hold undocumented tribal knowledge.`
    ];
    mitigation = [
      `Implement structured KT program with shadow period and documented runbooks.`,
      `Establish overlapping working hours (min. 4hrs) and regular sync cadences.`,
      `Create knowledge repository and cross-training program before transition.`
    ];
  } else if (isPartial) {
    pros = [
      `Hybrid model offers partial savings of $${savingsEstimate.toLocaleString()} while retaining core expertise.`,
      `Maintains institutional knowledge onshore while offloading routine tasks.`,
      `Provides flexibility to scale offshore component based on performance.`
    ];
    cons = [
      `Complex management — requires coordination between onshore and offshore teams.`,
      `Potential quality inconsistency between onshore and offshore deliverables.`,
      `Higher initial setup cost due to dual-team structure and tooling requirements.`
    ];
    mitigation = [
      `Define clear swim lanes between onshore (strategy/review) and offshore (execution).`,
      `Implement unified quality metrics and regular calibration sessions.`,
      `Start with 70/30 onshore/offshore split, adjust based on quarterly performance review.`
    ];
  } else {
    pros = [
      `Retaining ${role_name} (${level}) preserves critical institutional knowledge and quality.`,
      `Maintains direct stakeholder access and cultural alignment.`,
      `Reduces risk of IP leakage and security concerns for sensitive functions.`
    ];
    cons = [
      `Higher ongoing cost — current spend of $${(estimated_spend || 0).toLocaleString()} maintained.`,
      `Limited scalability — headcount increases require full domestic hiring cycles.`,
      `Potential for key-person dependency if ${role_name} expertise is concentrated.`
    ];
    mitigation = [
      `Invest in automation to increase per-FTE productivity and offset cost.`,
      `Build internal talent pipeline and cross-training to reduce key-person risk.`,
      `Consider selective task decomposition to identify any offshorable sub-tasks.`
    ];
  }

  res.json({ pros, cons, mitigation });
});

// POST AI insights check (quality loss warning)
router.post('/insights', (req, res) => {
  const { qualitative_why, role_name, level } = req.body;
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

  // Mirror check — cross-reference with security policy
  if (text.includes('security') || text.includes('clearance') || text.includes('trusted access')) {
    warnings.push({
      type: 'SECURITY_POLICY_CONFLICT',
      severity: 'critical',
      message: `Security Policy Conflict: "${role_name}" involves security-sensitive functions. Cross-reference with Cyber unit's security policy before offshoring.`,
      keywords: matchedKeywords.filter(k => ['security', 'clearance'].includes(k))
    });
  }

  res.json({ hasHighQualityLossRisk, severity, warnings, matchedKeywords });
});

// POST generate executive summary
router.post('/executive-summary', (req, res) => {
  const db = getDb();

  const overall = db.prepare(`
    SELECT
      SUM(current_fte) as total_fte,
      SUM(estimated_spend) as total_spend,
      SUM(CASE WHEN recommendation = 'Y' THEN current_fte ELSE 0 END) as offshore_fte,
      SUM(CASE WHEN recommendation = 'Y' THEN estimated_spend ELSE 0 END) as offshore_spend,
      SUM(CASE WHEN recommendation = 'P' THEN current_fte ELSE 0 END) as partial_fte,
      SUM(CASE WHEN recommendation = 'N' THEN current_fte ELSE 0 END) as retain_fte
    FROM roles
  `).get();

  const byUnit = db.prepare(`
    SELECT
      bu.name,
      SUM(r.current_fte) as total_fte,
      SUM(CASE WHEN r.recommendation = 'Y' THEN r.current_fte ELSE 0 END) as offshore_fte,
      SUM(CASE WHEN r.recommendation = 'Y' THEN r.estimated_spend ELSE 0 END) as offshore_spend
    FROM business_units bu
    JOIN departments d ON d.business_unit_id = bu.id
    JOIN roles r ON r.department_id = d.id
    GROUP BY bu.id
    ORDER BY offshore_spend DESC
  `).all();

  const highRiskRoles = db.prepare(`
    SELECT role_name, level, qualitative_why
    FROM roles
    WHERE recommendation = 'N' AND level IN ('L3', 'L4')
    ORDER BY estimated_spend DESC
    LIMIT 5
  `).all();

  const savingsEstimate = Math.round(overall.offshore_spend * 0.55);
  const offshorePercent = Math.round((overall.offshore_fte / overall.total_fte) * 100);
  const qualityRiskScore = Math.round(100 - (overall.retain_fte / overall.total_fte) * 40 - (overall.partial_fte / overall.total_fte) * 20);

  const topUnit = byUnit[0];
  const unitBreakdown = byUnit.map(u =>
    `${u.name}: ${u.offshore_fte} FTE ($${Math.round(u.offshore_spend * 0.55 / 1000)}K savings)`
  ).join('; ');

  const summary = `EXECUTIVE SUMMARY — Global Workforce Optimization Analysis

This analysis evaluates ${overall.total_fte} FTE across ${byUnit.length} business units with a combined annual spend of $${(overall.total_spend / 1000000).toFixed(1)}M. Our assessment identifies ${overall.offshore_fte} FTE (${offshorePercent}%) as strong candidates for offshoring, with an additional ${overall.partial_fte} FTE suitable for hybrid onshore/offshore models.

FINANCIAL IMPACT: Full implementation of recommended offshoring could yield estimated annual savings of $${(savingsEstimate / 1000000).toFixed(1)}M, assuming a 55% cost reduction on offshored roles. The highest-impact unit is ${topUnit.name} with ${topUnit.offshore_fte} FTE identified for transition.

UNIT BREAKDOWN: ${unitBreakdown}.

QUALITY RISK ASSESSMENT: The AI Sentiment Score for overall quality risk is ${qualityRiskScore}/100 (higher = more aggressive offshoring). ${overall.retain_fte} FTE are flagged for mandatory retention due to strategic importance, security requirements, or cultural sensitivity. Key retention roles include ${highRiskRoles.slice(0, 3).map(r => `${r.role_name} (${r.level})`).join(', ')}.

RECOMMENDATION: Proceed with Phase 1 offshoring of L1/L2 roles across all units (${overall.offshore_fte} FTE), implement 90-day knowledge transfer programs, and establish quarterly quality reviews before considering L3 hybrid models. Estimated timeline: 6-9 months for full transition with parallel onshore support during ramp period.`;

  res.json({
    summary,
    metrics: {
      totalFTE: overall.total_fte,
      totalSpend: overall.total_spend,
      offshoreFTE: overall.offshore_fte,
      offshoreSpend: overall.offshore_spend,
      estimatedSavings: savingsEstimate,
      qualityRiskScore,
      offshorePercent
    }
  });
});

module.exports = router;
