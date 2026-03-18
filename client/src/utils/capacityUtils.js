// Capacity utilities — convert FTE to hours and hourly rates
// Standard: 1 FTE = 2,080 hours/year (52 weeks x 40 hours)
// "All-in" means fully loaded: salary + benefits + overhead + management

export const HOURS_PER_FTE = 2080;

// Typical utilization rates (productive hours vs total hours)
// After PTO, holidays, meetings, admin — actual productive capacity
export const UTILIZATION_RATE = 0.80; // 80% — industry standard

export function fteToHours(fte) {
  return Math.round(fte * HOURS_PER_FTE);
}

export function fteToProductiveHours(fte) {
  return Math.round(fte * HOURS_PER_FTE * UTILIZATION_RATE);
}

export function hourlyRate(annualSpend, fte) {
  if (!fte || fte === 0) return 0;
  const totalHours = fteToHours(fte);
  return totalHours > 0 ? annualSpend / totalHours : 0;
}

export function productiveHourlyRate(annualSpend, fte) {
  if (!fte || fte === 0) return 0;
  const productiveHours = fteToProductiveHours(fte);
  return productiveHours > 0 ? annualSpend / productiveHours : 0;
}

export function formatHourlyRate(rate) {
  return `$${rate.toFixed(2)}/hr`;
}

export function formatHours(hours) {
  if (hours >= 10000) return `${(hours / 1000).toFixed(1)}K hrs`;
  return `${hours.toLocaleString()} hrs`;
}

// Capacity gap analysis
export function analyzeCapacityGap(currentFTE, neededFTE) {
  const gap = neededFTE - currentFTE;
  const gapHours = fteToProductiveHours(gap);
  return {
    gapFTE: gap,
    gapHours: Math.abs(gapHours),
    status: gap > 0 ? 'understaffed' : gap < 0 ? 'overstaffed' : 'balanced',
    percentUtilized: neededFTE > 0 ? Math.round((currentFTE / neededFTE) * 100) : 100,
  };
}
