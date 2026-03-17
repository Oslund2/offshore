// Cost-to-Risk Slider Logic
// Slider value: 0 = Max Quality (conservative), 100 = Max Savings (aggressive)
// Adjusts AI recommendations based on user's risk tolerance

// Returns an adjusted recommendation based on the slider position
export function getSliderAdjustedRecommendation(originalRec, level, qualitativeWhy, sliderValue) {
  // Neutral zone (40-60) = no adjustment
  if (sliderValue >= 40 && sliderValue <= 60) return originalRec;

  const why = (qualitativeWhy || '').toLowerCase();
  const hasSensitiveKeywords = ['security', 'strategic', 'proprietary', 'trust', 'clearance', 'brand risk', 'local'].some(k => why.includes(k));

  // Max Savings mode (>60): push more roles toward offshore
  if (sliderValue > 60) {
    const aggressiveness = (sliderValue - 60) / 40; // 0 to 1

    if (originalRec === 'N') {
      // L1/L2 retain → consider partial or full offshore
      if ((level === 'L1' || level === 'L2') && !hasSensitiveKeywords) return 'Y';
      if (level === 'L1' || level === 'L2') return aggressiveness > 0.5 ? 'P' : 'N';
      // L3 → consider partial if aggressive enough
      if (level === 'L3' && !hasSensitiveKeywords && aggressiveness > 0.5) return 'P';
      if (level === 'L3' && aggressiveness > 0.75) return 'P';
      // L4 stays N unless extremely aggressive
      if (level === 'L4' && aggressiveness > 0.9 && !hasSensitiveKeywords) return 'P';
    }
    if (originalRec === 'P') {
      // Partial → push to full offshore
      if ((level === 'L1' || level === 'L2')) return 'Y';
      if (level === 'L3' && aggressiveness > 0.5 && !hasSensitiveKeywords) return 'Y';
    }
  }

  // Max Quality mode (<40): pull roles back from offshore
  if (sliderValue < 40) {
    const conservatism = (40 - sliderValue) / 40; // 0 to 1

    if (originalRec === 'Y') {
      // Full offshore → consider partial or retain
      if ((level === 'L3' || level === 'L4')) return 'N';
      if (level === 'L2' && conservatism > 0.3) return 'P';
      if (level === 'L2' && hasSensitiveKeywords) return 'N';
      if (level === 'L1' && conservatism > 0.7) return 'P';
      if (level === 'L1' && hasSensitiveKeywords && conservatism > 0.5) return 'P';
    }
    if (originalRec === 'P') {
      // Partial → pull back to retain
      if (conservatism > 0.5) return 'N';
      if (hasSensitiveKeywords) return 'N';
    }
  }

  return originalRec;
}

// Returns a label describing the slider adjustment for a role
export function getSliderAdjustmentLabel(originalRec, adjustedRec) {
  if (originalRec === adjustedRec) return null;

  const labels = {
    'N→P': { text: 'Slider: Consider Partial', color: 'text-gwoe-amber' },
    'N→Y': { text: 'Slider: Push to Offshore', color: 'text-gwoe-green' },
    'P→Y': { text: 'Slider: Upgrade to Full', color: 'text-gwoe-green' },
    'P→N': { text: 'Slider: Pull to Retain', color: 'text-gwoe-red' },
    'Y→P': { text: 'Slider: Reduce to Partial', color: 'text-gwoe-amber' },
    'Y→N': { text: 'Slider: Pull to Retain', color: 'text-gwoe-red' },
  };

  return labels[`${originalRec}→${adjustedRec}`] || null;
}

// Calculate adjusted rollup totals based on slider
export function getSliderAdjustedTotals(roles, sliderValue) {
  let offshoreFTE = 0, offshoreSpend = 0;
  let partialFTE = 0, partialSpend = 0;
  let retainFTE = 0, retainSpend = 0;

  for (const r of roles) {
    const adjusted = getSliderAdjustedRecommendation(r.recommendation, r.level, r.qualitative_why, sliderValue);
    if (adjusted === 'Y') { offshoreFTE += r.current_fte; offshoreSpend += r.estimated_spend; }
    else if (adjusted === 'P') { partialFTE += r.current_fte; partialSpend += r.estimated_spend; }
    else { retainFTE += r.current_fte; retainSpend += r.estimated_spend; }
  }

  return { offshoreFTE, offshoreSpend, partialFTE, partialSpend, retainFTE, retainSpend };
}
