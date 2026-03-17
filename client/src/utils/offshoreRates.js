// Offshore country rate data — average annual fully-loaded cost per FTE by level
// Sources: industry benchmarks, Everest Group, NASSCOM, Deloitte GBS studies
// All figures in USD, fully loaded (salary + benefits + overhead + management)

export const US_RATES = {
  L1: 65000,
  L2: 95000,
  L3: 140000,
  L4: 200000,
};

export const OFFSHORE_COUNTRIES = [
  {
    id: 'india',
    name: 'India',
    flag: '🇮🇳',
    region: 'South Asia',
    timezone: 'UTC+5:30',
    rates: { L1: 18000, L2: 28000, L3: 48000, L4: 75000 },
    riskProfile: {
      talentPool: 95,
      english: 78,
      infrastructure: 72,
      ipProtection: 60,
      politicalStability: 65,
      culturalAlignment: 68,
      timeZoneOverlap: 25,
    },
    strengths: ['Massive talent pool', 'Mature BPO/IT ecosystem', 'Strong STEM education', 'Cost leader'],
    risks: ['High attrition rates (15-25%)', 'Time zone gap with US', 'IP enforcement concerns', 'Quality variance across vendors'],
    bestFor: ['IT Services', 'Data Engineering', 'QA/Testing', 'Finance & Admin', 'SOC Operations'],
  },
  {
    id: 'philippines',
    name: 'Philippines',
    flag: '🇵🇭',
    region: 'Southeast Asia',
    timezone: 'UTC+8',
    rates: { L1: 15000, L2: 24000, L3: 42000, L4: 68000 },
    riskProfile: {
      talentPool: 75,
      english: 90,
      infrastructure: 60,
      ipProtection: 55,
      politicalStability: 58,
      culturalAlignment: 82,
      timeZoneOverlap: 20,
    },
    strengths: ['Excellent English proficiency', 'Strong cultural affinity with US', 'Customer-service oriented', 'Cost effective'],
    risks: ['Natural disaster exposure', 'Infrastructure gaps outside Manila', 'Smaller tech talent pool', 'Political volatility'],
    bestFor: ['Customer Support', 'Content Moderation', 'Social Media', 'Audience & Social', 'Copy Editing'],
  },
  {
    id: 'poland',
    name: 'Poland',
    flag: '🇵🇱',
    region: 'Eastern Europe',
    timezone: 'UTC+1',
    rates: { L1: 32000, L2: 48000, L3: 72000, L4: 105000 },
    riskProfile: {
      talentPool: 70,
      english: 75,
      infrastructure: 85,
      ipProtection: 88,
      politicalStability: 78,
      culturalAlignment: 80,
      timeZoneOverlap: 55,
    },
    strengths: ['EU data protection (GDPR)', 'Strong engineering culture', 'Good time zone overlap with US East', 'High-quality output'],
    risks: ['Higher cost than Asia', 'Smaller talent pool', 'Competitive market for talent', 'Geopolitical proximity to conflict'],
    bestFor: ['Software Development', 'Security Engineering', 'Data Science', 'Product Design', 'DevOps'],
  },
  {
    id: 'mexico',
    name: 'Mexico',
    flag: '🇲🇽',
    region: 'Latin America',
    timezone: 'UTC-6',
    rates: { L1: 28000, L2: 42000, L3: 65000, L4: 95000 },
    riskProfile: {
      talentPool: 65,
      english: 60,
      infrastructure: 68,
      ipProtection: 62,
      politicalStability: 60,
      culturalAlignment: 78,
      timeZoneOverlap: 95,
    },
    strengths: ['Same/similar time zones as US', 'Nearshore convenience', 'USMCA trade alignment', 'Growing tech hubs (GDL, MTY, CDMX)'],
    risks: ['English proficiency varies', 'Security concerns in some regions', 'Smaller senior talent pool', 'Wage inflation in tech hubs'],
    bestFor: ['Front-end Development', 'UX/UI Design', 'Finance & Admin', 'Real-time Collaboration Roles'],
  },
  {
    id: 'brazil',
    name: 'Brazil',
    flag: '🇧🇷',
    region: 'Latin America',
    timezone: 'UTC-3',
    rates: { L1: 25000, L2: 38000, L3: 60000, L4: 90000 },
    riskProfile: {
      talentPool: 72,
      english: 50,
      infrastructure: 65,
      ipProtection: 60,
      politicalStability: 55,
      culturalAlignment: 72,
      timeZoneOverlap: 70,
    },
    strengths: ['Large developer community', 'Creative/design talent', 'Favorable time zone overlap', 'Strong fintech ecosystem'],
    risks: ['English proficiency gaps', 'Complex labor laws', 'Currency volatility', 'Tax/regulatory complexity'],
    bestFor: ['Software Development', 'UI/UX Production', 'Data Engineering', 'QA Testing'],
  },
  {
    id: 'vietnam',
    name: 'Vietnam',
    flag: '🇻🇳',
    region: 'Southeast Asia',
    timezone: 'UTC+7',
    rates: { L1: 14000, L2: 22000, L3: 38000, L4: 60000 },
    riskProfile: {
      talentPool: 68,
      english: 55,
      infrastructure: 58,
      ipProtection: 48,
      politicalStability: 72,
      culturalAlignment: 60,
      timeZoneOverlap: 15,
    },
    strengths: ['Rapidly growing tech sector', 'Very competitive costs', 'Young educated workforce', 'Government support for IT'],
    risks: ['English proficiency developing', 'IP protection immature', 'Limited senior talent', 'Infrastructure outside major cities'],
    bestFor: ['QA/Testing', 'Front-end Development', 'Data Entry/Processing', 'ETL Pipeline Maintenance'],
  },
  {
    id: 'romania',
    name: 'Romania',
    flag: '🇷🇴',
    region: 'Eastern Europe',
    timezone: 'UTC+2',
    rates: { L1: 28000, L2: 42000, L3: 65000, L4: 95000 },
    riskProfile: {
      talentPool: 60,
      english: 78,
      infrastructure: 78,
      ipProtection: 85,
      politicalStability: 75,
      culturalAlignment: 76,
      timeZoneOverlap: 50,
    },
    strengths: ['Strong multilingual talent', 'EU member (GDPR compliance)', 'Competitive Eastern European rates', 'Established outsourcing market'],
    risks: ['Smaller absolute talent pool', 'Brain drain to Western Europe', 'Infrastructure gaps in rural areas', 'Limited L4 talent availability'],
    bestFor: ['Software Development', 'Cybersecurity', 'Data Engineering', 'GRC/Compliance'],
  },
  {
    id: 'colombia',
    name: 'Colombia',
    flag: '🇨🇴',
    region: 'Latin America',
    timezone: 'UTC-5',
    rates: { L1: 22000, L2: 35000, L3: 55000, L4: 82000 },
    riskProfile: {
      talentPool: 58,
      english: 52,
      infrastructure: 62,
      ipProtection: 58,
      politicalStability: 55,
      culturalAlignment: 74,
      timeZoneOverlap: 90,
    },
    strengths: ['US Eastern time zone', 'Rapidly growing tech scene', 'Government incentives for BPO', 'Competitive cost structure'],
    risks: ['English proficiency varies', 'Smaller senior talent pool', 'Security perceptions', 'Infrastructure outside major cities'],
    bestFor: ['Customer Support', 'Finance & Admin', 'Front-end Development', 'Content Production'],
  },
];

// Calculate savings for a role at a specific country
export function calculateRoleSavings(usRate, countryRate, fte) {
  const usCost = usRate * fte;
  const offshoreCost = countryRate * fte;
  const savings = usCost - offshoreCost;
  const savingsPercent = usRate > 0 ? Math.round((savings / usCost) * 100) : 0;
  return { usCost, offshoreCost, savings, savingsPercent };
}

// Score country fit for a specific role
export function scoreCountryFit(country, role) {
  const profile = country.riskProfile;
  let score = 0;
  let factors = [];

  // Base cost savings weight
  const usRate = US_RATES[role.level] || US_RATES.L1;
  const countryRate = country.rates[role.level] || country.rates.L1;
  const savingsPct = ((usRate - countryRate) / usRate) * 100;
  score += savingsPct * 0.3;
  factors.push({ factor: 'Cost Savings', value: `${Math.round(savingsPct)}%`, impact: savingsPct > 50 ? 'positive' : 'neutral' });

  // Talent pool
  score += profile.talentPool * 0.15;
  factors.push({ factor: 'Talent Pool', value: `${profile.talentPool}/100`, impact: profile.talentPool > 70 ? 'positive' : profile.talentPool > 50 ? 'neutral' : 'negative' });

  // English proficiency (more important for client-facing)
  const roleLower = (role.role_name || '').toLowerCase();
  const isClientFacing = roleLower.includes('manager') || roleLower.includes('lead') || roleLower.includes('anchor') || roleLower.includes('reporter');
  const englishWeight = isClientFacing ? 0.2 : 0.1;
  score += profile.english * englishWeight;
  factors.push({ factor: 'English Proficiency', value: `${profile.english}/100`, impact: profile.english > 75 ? 'positive' : profile.english > 55 ? 'neutral' : 'negative' });

  // IP Protection (critical for L3/L4 and security roles)
  const isSensitive = roleLower.includes('security') || roleLower.includes('architect') || roleLower.includes('data scientist') || role.level === 'L4';
  const ipWeight = isSensitive ? 0.2 : 0.1;
  score += profile.ipProtection * ipWeight;
  factors.push({ factor: 'IP Protection', value: `${profile.ipProtection}/100`, impact: profile.ipProtection > 75 ? 'positive' : profile.ipProtection > 55 ? 'neutral' : 'negative' });

  // Time zone overlap
  score += profile.timeZoneOverlap * 0.1;
  factors.push({ factor: 'Time Zone Overlap', value: `${profile.timeZoneOverlap}/100`, impact: profile.timeZoneOverlap > 60 ? 'positive' : profile.timeZoneOverlap > 30 ? 'neutral' : 'negative' });

  // Cultural alignment
  score += profile.culturalAlignment * 0.05;
  factors.push({ factor: 'Cultural Alignment', value: `${profile.culturalAlignment}/100`, impact: profile.culturalAlignment > 70 ? 'positive' : 'neutral' });

  return {
    score: Math.round(score),
    grade: score >= 70 ? 'A' : score >= 55 ? 'B' : score >= 40 ? 'C' : 'D',
    factors,
  };
}

// Get top recommended countries for a role
export function getTopCountries(role, count = 3) {
  return OFFSHORE_COUNTRIES
    .map(country => ({
      country,
      fit: scoreCountryFit(country, role),
      savings: calculateRoleSavings(
        US_RATES[role.level] || US_RATES.L1,
        country.rates[role.level] || country.rates.L1,
        role.current_fte || 1
      ),
    }))
    .sort((a, b) => b.fit.score - a.fit.score)
    .slice(0, count);
}
