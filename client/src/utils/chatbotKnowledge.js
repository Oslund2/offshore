// Chatbot knowledge base for GWOE offshore advisory
// Pattern-matching response engine with deep offshoring domain knowledge

import { US_RATES, OFFSHORE_COUNTRIES } from './offshoreRates';
import { formatCurrency } from './format';
import { HOURS_PER_FTE, fteToHours, fteToProductiveHours, hourlyRate, formatHourlyRate } from './capacityUtils';

// ── System Prompt (displayed context) ──────────────────────────────────────
export const SYSTEM_PROMPT = `You are the GWOE Offshore Strategy Advisor — an AI assistant specialized in global workforce optimization, offshoring strategy, capacity planning, and organizational transformation.

Your knowledge covers:
- Offshore destination analysis (India, Philippines, Poland, Mexico, Brazil, Vietnam, Romania, Colombia)
- Cost modeling: US vs offshore fully-loaded rates by level (L1–L4)
- Employee relations during offshoring transitions (communication plans, retention strategies, severance)
- Capacity planning: FTE-to-hours conversion, utilization rates, productive capacity
- Key offshore service providers (TCS, Infosys, Wipro, Accenture, Cognizant, HCL, etc.)
- Risk management: IP protection, regulatory compliance, quality assurance
- Change management: stakeholder communication, knowledge transfer, transition waves
- Governance models: BOT (Build-Operate-Transfer), managed services, staff augmentation, GCCs
- Industry benchmarks: attrition rates, ramp-up timelines, savings realization curves

You have access to the user's live workforce data and answer questions using their actual numbers when relevant.`;

// ── Knowledge Topics ───────────────────────────────────────────────────────

const TOPICS = {
  providers: {
    keywords: ['provider', 'vendor', 'company', 'compan', 'firm', 'partner', 'who should', 'tcs', 'infosys', 'wipro', 'accenture', 'cognizant', 'hcl', 'outsourc', 'bpo'],
    title: 'Key Offshore Service Providers',
    response: `**Tier 1 — Global System Integrators (GSIs)**
These firms handle large-scale engagements ($10M+/yr) with mature delivery models:

| Provider | HQ | Strengths | Typical Pricing |
|----------|-----|-----------|----------------|
| **Accenture** | Ireland/US | Strategy + execution, industry depth | Premium (1.3-1.5x market) |
| **TCS** | India | Largest workforce (~615K), strong delivery | Competitive |
| **Infosys** | India | Digital transformation, automation | Market rate |
| **Cognizant** | US/India | US-centric model, healthcare/finance | Market+ |
| **Wipro** | India | Infrastructure, cyber, consulting | Competitive |
| **HCL Tech** | India | Engineering R&D, infrastructure | Competitive |
| **Tech Mahindra** | India | Telecom, 5G, enterprise apps | Below market |

**Tier 2 — Specialized / Mid-Market**
Better for targeted engagements ($1-10M/yr):
- **EPAM Systems** — Engineering excellence, Eastern Europe focus
- **Globant** — Digital/creative, LatAm delivery
- **Genpact** — Finance & admin BPO, analytics
- **EXL Service** — Data, analytics, operations
- **Softtek** — Nearshore LatAm specialist

**Tier 3 — Boutique / Staff Augmentation**
Best for small teams or niche skills ($500K-$5M/yr):
- **Toptal** — Vetted freelance talent marketplace
- **Andela** — African developer talent
- **BairesDev** — LatAm engineering
- **Turing** — AI-matched remote engineers

**Recommendation:** Start with 2-3 providers in a competitive RFP. Use a multi-vendor strategy to avoid lock-in. For your first wave, consider a Tier 1 for infrastructure + a Tier 2 specialist for niche skills.`,
  },

  concerns: {
    keywords: ['concern', 'risk', 'worry', 'problem', 'issue', 'challenge', 'fear', 'downside', 'disadvantage', 'pitfall', 'what could go wrong', 'fail'],
    title: 'Key Concerns & Risks in Offshoring',
    response: `**Top 10 Concerns (ranked by impact):**

**1. Quality Degradation**
- Risk: Output quality drops during transition (typical 15-30% dip in months 1-3)
- Mitigation: Parallel run periods, detailed SOPs, quality gates, onshore tech leads

**2. Knowledge Loss**
- Risk: Institutional knowledge walks out the door with departing employees
- Mitigation: 90-day knowledge transfer plans, documentation sprints, video recordings of key processes

**3. Communication & Time Zone Gaps**
- Risk: Async delays, cultural misunderstandings, lost context
- Mitigation: 4-hour overlap windows, designated "bridge" roles, collaboration tools (Slack, Teams), weekly video syncs

**4. Employee Morale (Onshore)**
- Risk: Survivors' guilt, fear of job loss, disengagement, unionization
- Mitigation: Transparent communication, retention bonuses for key talent, career path redefinition, involvement in transition

**5. IP & Data Security**
- Risk: Sensitive data exposure, trade secrets, compliance violations
- Mitigation: NDAs, background checks, network segmentation, DLP tools, SOC 2 Type II certified partners

**6. Attrition at Offshore Sites**
- Risk: India averages 15-25% annual attrition in IT; Philippines 12-20%
- Mitigation: Above-market comp, career paths, team continuity bonuses, backup/shadow resources

**7. Regulatory Compliance**
- Risk: GDPR, HIPAA, SOX, CCPA — data residency requirements
- Mitigation: Legal review per jurisdiction, data classification, partner compliance certifications

**8. Hidden Costs**
- Risk: Travel, management overhead, rework, vendor management office (VMO)
- Mitigation: Budget 15-20% on top of quoted rates for "friction costs"

**9. Vendor Lock-in**
- Risk: Single provider becomes difficult to replace
- Mitigation: Multi-vendor strategy, internal ownership of architecture/IP, contractual knowledge transfer clauses

**10. Political & Reputational Risk**
- Risk: "Shipping jobs overseas" backlash, political shifts, local disruptions
- Mitigation: Position as "global talent strategy", maintain local jobs in strategic roles, community investment`,
  },

  employee_relations: {
    keywords: ['employee', 'staff', 'team', 'morale', 'communicate', 'tell', 'announce', 'hr', 'retention', 'severance', 'layoff', 'let go', 'displaced', 'transition', 'people', 'union', 'relations', 'human', 'talent'],
    title: 'Employee Relations During Offshoring Transitions',
    response: `**Communication Timeline & Best Practices:**

**Phase 1 — Pre-Announcement (Weeks -4 to -1)**
- Brief HR, Legal, and executive sponsors
- Prepare FAQ documents, talking points for managers
- Draft retention packages for key employees you want to KEEP
- Identify employees eligible for internal redeployment
- Prepare severance packages (typically 2-4 weeks per year of service)

**Phase 2 — Announcement (Day 0)**
- CEO/SVP-level communication — this must come from the top
- All-hands meeting (never email-first for bad news)
- Simultaneously brief managers with detailed talking points
- Make HR/EAP resources immediately available
- Be honest: "We are transitioning X roles to [location] over [timeline]"

**Phase 3 — Transition Period (Weeks 1-12)**
- Affected employees need to know: timeline, severance, outplacement support
- Retained employees need to know: their role is safe, new responsibilities, growth path
- Knowledge transfer assignments (pair affected employees with offshore counterparts)
- Consider retention bonuses (30-50% of annual salary) for key transition participants
- Weekly check-ins with managers for temperature readings

**Phase 4 — Post-Transition (Months 3-6)**
- Celebrate retained team, redefine roles toward higher-value work
- Promote internal mobility for displaced employees where possible
- Monitor engagement scores closely
- Address survivor guilt directly in team meetings

**Key Principles:**
- **Never surprise people** — rumors are worse than news
- **Generous severance** pays for itself in transition quality and employer brand
- **Outplacement services** — job coaching, resume help, interview prep ($2-5K/person)
- **Legal review** — WARN Act (60-day notice for 100+ layoffs), state laws vary
- **Retention bonuses** — 3-6 month cliff vesting to keep people through knowledge transfer
- **Career pathing** — show remaining employees the path to more strategic work`,
  },

  offshore_managers: {
    keywords: ['manage offshore', 'manage remote', 'offshore manager', 'onsite manager', 'governance', 'oversight', 'control', 'manage team', 'delivery manager', 'engagement manager', 'operating model', 'how many', 'ratio', 'span of control'],
    title: 'Offshore Management & Governance Models',
    response: `**Management Ratios — How Many Onshore FTEs to Manage Offshore:**

| Offshore Team Size | Recommended Onshore FTEs | Roles Needed |
|-------------------|-------------------------|--------------|
| 5-15 | 1-2 | Engagement Lead + Part-time PM |
| 15-40 | 2-4 | Delivery Manager + Tech Lead + PM |
| 40-100 | 4-8 | VMO Director + Delivery Mgrs + Tech Leads + QA Lead |
| 100+ | 8-15 | Full VMO (Vendor Management Office) |

**Typical rule of thumb: 1 onshore manager per 8-12 offshore FTEs**

**Governance Models:**

**1. Staff Augmentation** (most control, most overhead)
- Offshore staff embedded in your teams
- You manage day-to-day
- Best for: small teams, specialized skills, tight integration
- Onshore management: High — 1:6 ratio

**2. Managed Services / Outcome-Based** (balanced)
- Vendor owns delivery, you own requirements
- SLAs, KPIs, service credits
- Best for: well-defined processes, IT ops, support functions
- Onshore management: Medium — 1:15 ratio

**3. Build-Operate-Transfer (BOT)** (long-term play)
- Vendor builds the team, operates for 12-24 months, transfers to you
- You get a turnkey offshore center
- Best for: large-scale (50+ FTEs), long-term strategy
- Onshore management: Low initially, builds over time

**4. Global Capability Center (GCC)** (full ownership)
- Your own entity abroad
- Full control, but full setup cost and compliance burden
- Best for: 100+ FTEs, IP-sensitive work, long-term (5+ year) commitment
- Onshore management: Full governance team needed

**The "Bridge Role" — Critical for Success:**
Every offshore engagement needs at least one person who:
- Understands both cultures and work styles
- Has authority to make decisions
- Is available during overlap hours
- Can translate business context to technical tasks
- Typical title: "Onshore Anchor" or "Delivery Bridge"`,
  },

  capacity: {
    keywords: ['capacity', 'hours', 'utilization', 'workload', 'bandwidth', 'overwork', 'understaffed', 'burn', 'gap', 'how many hours', 'hourly', 'all-in', 'all in', 'rate per hour', 'cost per hour', 'productive'],
    title: 'Capacity Planning & All-In Hourly Analysis',
    response: (context) => {
      const { allRoles } = context;
      const totalFTE = allRoles.reduce((s, r) => s + r.current_fte, 0);
      const totalSpend = allRoles.reduce((s, r) => s + r.estimated_spend, 0);
      const totalHours = fteToHours(totalFTE);
      const productiveHours = fteToProductiveHours(totalFTE);
      const avgHourly = hourlyRate(totalSpend, totalFTE);

      return `**Your Current Capacity Profile:**

| Metric | Value |
|--------|-------|
| Total FTE | ${totalFTE} |
| Total Annual Spend | ${formatCurrency(totalSpend)} |
| **All-In Hours (Gross)** | **${totalHours.toLocaleString()} hrs/yr** |
| **Productive Hours (80% util.)** | **${productiveHours.toLocaleString()} hrs/yr** |
| **Avg All-In Hourly Rate** | **${formatHourlyRate(avgHourly)}** |
| Productive Hourly Rate | ${formatHourlyRate(avgHourly / 0.80)} |

**Key Capacity Concepts:**

- **1 FTE = ${HOURS_PER_FTE.toLocaleString()} hours/year** (52 weeks x 40 hours)
- **Productive hours** = 80% of gross (after PTO, holidays, meetings, admin)
- **All-in rate** includes salary + benefits + overhead + workspace + management
- A typical US L1 at ${formatCurrency(US_RATES.L1)}/yr = ${formatHourlyRate(US_RATES.L1 / HOURS_PER_FTE)} all-in
- A typical India L1 at $18,000/yr = $8.65/hr all-in

**Capacity Gap Strategy:**
If you're understaffed, offshoring gives you MORE hours for LESS money:
- 10 US L2 FTEs = 20,800 hrs @ ${formatCurrency(US_RATES.L2 * 10)}/yr
- Same budget offshore (India) = ~34 L2 FTEs = 70,720 hrs — **3.4x the capacity**

Use the **Capacity Toggle** on the Dashboard and Business Unit views to see hours and hourly rates across your entire workforce.`;
    },
  },

  savings: {
    keywords: ['save', 'saving', 'cost', 'reduce', 'cheaper', 'expensive', 'budget', 'money', 'roi', 'return on investment', 'payback', 'break even', 'how much'],
    title: 'Cost Savings & ROI Analysis',
    response: (context) => {
      const { allRoles } = context;
      const totalSpend = allRoles.reduce((s, r) => s + r.estimated_spend, 0);
      const offshoreRoles = allRoles.filter(r => r.recommendation === 'Y');
      const offshoreSpend = offshoreRoles.reduce((s, r) => s + r.estimated_spend, 0);
      const estSavings = Math.round(offshoreSpend * 0.55);

      return `**Your Savings Potential (Based on Current Data):**

| Metric | Value |
|--------|-------|
| Total Annual Spend | ${formatCurrency(totalSpend)} |
| Offshore-Eligible Spend | ${formatCurrency(offshoreSpend)} |
| **Estimated Annual Savings** | **${formatCurrency(estSavings)}** |
| Savings Rate | ~55% on transitioned roles |

**Industry Savings Benchmarks by Destination:**
${OFFSHORE_COUNTRIES.map(c => `- **${c.flag} ${c.name}**: L1 saves ${Math.round((1 - c.rates.L1 / US_RATES.L1) * 100)}%, L2 saves ${Math.round((1 - c.rates.L2 / US_RATES.L2) * 100)}%, L3 saves ${Math.round((1 - c.rates.L3 / US_RATES.L3) * 100)}%`).join('\n')}

**Savings Realization Curve:**
- **Months 1-3:** Net negative (transition costs, parallel run, severance)
- **Months 4-6:** Break-even point for most engagements
- **Months 7-12:** 40-60% of projected steady-state savings
- **Year 2+:** Full savings realization (85-100% of target)

**Hidden Costs to Budget For (typically 15-25% of contract):**
- Vendor management office (VMO): 2-4 FTEs
- Travel: 2-4 trips/year for key stakeholders
- Tools & licenses: Collaboration, security, access management
- Rework/quality remediation: 5-10% initially
- Knowledge transfer: 60-90 days of overlap pay`;
    },
  },

  timeline: {
    keywords: ['timeline', 'how long', 'when', 'schedule', 'phases', 'wave', 'roadmap', 'plan', 'start', 'begin', 'implement', 'rollout'],
    title: 'Offshoring Implementation Timeline',
    response: `**Typical Offshoring Rollout — 12-Month Plan:**

**Phase 0: Strategy & Business Case (Weeks 1-4)**
- Workforce analysis (you're doing this in GWOE now)
- Vendor shortlist and RFP
- Financial modeling and board approval
- Legal/compliance review

**Phase 1: Pilot (Months 2-4) — Wave 1**
- Select 5-15 low-risk L1/L2 roles
- Choose 1-2 vendors
- 30-day knowledge transfer
- Parallel run for 2-4 weeks
- Measure quality, throughput, satisfaction
- **Expected savings: 40-60% on pilot roles**

**Phase 2: Expansion (Months 5-8) — Wave 2**
- Scale to 15-40 roles based on pilot learnings
- Add L2/P roles with structured transition plans
- Establish VMO (Vendor Management Office)
- Formalize SLAs and governance
- **Expected savings: Building toward 50-65%**

**Phase 3: Optimization (Months 9-12) — Wave 3**
- Complex/hybrid roles, specialized skills
- Potential BOT or GCC evaluation
- Continuous improvement program
- Automation overlay for further savings
- **Expected savings: Approaching steady-state**

**Key Milestones:**
- Week 4: Vendor selected, contracts signed
- Month 2: First offshore hires onboarded
- Month 3: Knowledge transfer complete for Wave 1
- Month 6: Pilot results validated, Wave 2 starts
- Month 9: Full operating model in place
- Month 12: Steady-state operations, continuous improvement

**Critical Success Factor:** Don't rush. Companies that try to offshore 100+ roles in <6 months typically see 2x the quality issues vs. a phased approach.`,
  },

  knowledge_transfer: {
    keywords: ['knowledge transfer', 'kt', 'training', 'onboard', 'ramp', 'documentation', 'handoff', 'hand off', 'teach', 'learn'],
    title: 'Knowledge Transfer Best Practices',
    response: `**Knowledge Transfer Framework (60-90 Day Standard):**

**Week 1-2: Documentation Sprint**
- Process maps for every workflow (use Miro/Lucidchart)
- Record screen captures of daily tasks (Loom/Teams recordings)
- Document tribal knowledge, decision trees, escalation paths
- Create FAQ for common edge cases
- Inventory all tools, access, credentials needed

**Week 3-4: Shadow Phase**
- Offshore team shadows onshore team (screen sharing, pair work)
- Daily 1-hour Q&A sessions
- Offshore team takes notes, builds their own runbooks
- Onshore team validates documentation accuracy

**Week 5-6: Reverse Shadow**
- Offshore team does the work, onshore team watches
- Onshore corrects in real-time
- Error log maintained for pattern identification
- Quality checkpoints at day 1, 3, 5 of each week

**Week 7-8: Supervised Independence**
- Offshore operates independently with same-day review
- Onshore available for escalations only
- Quality metrics tracked daily
- Weekly calibration sessions

**Week 9-12: Full Independence + Hypercare**
- Offshore fully autonomous
- Onshore available for escalations only (not daily review)
- Weekly quality reviews
- Monthly governance meetings
- Formal sign-off at week 12

**Knowledge Transfer Anti-Patterns:**
- "Just read the wiki" — wikis are never complete
- Skipping the documentation phase — biggest predictor of failure
- No overlap period — always plan for 2-4 weeks of parallel run
- One-way communication — KT must be bi-directional
- Ignoring cultural context — explain the "why" not just the "what"`,
  },

  quality: {
    keywords: ['quality', 'metrics', 'kpi', 'sla', 'measure', 'track', 'performance', 'standard', 'benchmark'],
    title: 'Quality Management & SLAs for Offshore Teams',
    response: `**Essential Offshore Quality Metrics:**

**Operational KPIs:**
| Metric | Target | Red Flag |
|--------|--------|----------|
| First-pass quality | >95% | <85% |
| SLA adherence | >98% | <90% |
| Rework rate | <5% | >15% |
| Avg resolution time | Per SLA | >2x SLA |
| Customer satisfaction | >4.2/5 | <3.5/5 |

**People KPIs:**
| Metric | Target | Red Flag |
|--------|--------|----------|
| Attrition rate | <15%/yr | >25%/yr |
| Backfill time | <30 days | >60 days |
| Training completion | 100% | <80% |
| Utilization rate | 75-85% | <65% or >95% |

**Governance KPIs:**
| Metric | Target | Red Flag |
|--------|--------|----------|
| Escalation rate | <5% | >15% |
| Compliance audits | 100% pass | Any fail |
| Knowledge retention | >90% | <70% |

**SLA Framework Template:**
- **P1 (Critical):** Response <15 min, Resolution <4 hrs
- **P2 (High):** Response <1 hr, Resolution <8 hrs
- **P3 (Medium):** Response <4 hrs, Resolution <24 hrs
- **P4 (Low):** Response <8 hrs, Resolution <5 business days

**Service Credits:** Typical 5-15% of monthly fees at risk for SLA misses.

**Quality Improvement Levers:**
1. Weekly quality reviews (not monthly — too late to correct)
2. Dedicated QA role onshore (1 per 20-30 offshore FTEs)
3. Automated testing/validation where possible
4. Root cause analysis for every P1/P2 defect
5. Quarterly business reviews with vendor leadership`,
  },

  countries: {
    keywords: ['country', 'countries', 'destination', 'where', 'india', 'philippines', 'poland', 'mexico', 'location', 'best place', 'nearshore', 'offshore location'],
    title: 'Offshore Destination Comparison',
    response: `**Offshore Destination Quick Reference:**

${OFFSHORE_COUNTRIES.map(c => `**${c.flag} ${c.name}** (${c.region})
- Timezone: ${c.timezone} | Rates: L1 ${formatCurrency(c.rates.L1)} / L2 ${formatCurrency(c.rates.L2)} / L3 ${formatCurrency(c.rates.L3)}
- Best for: ${c.bestFor.join(', ')}
- Strengths: ${c.strengths[0]}, ${c.strengths[1]}
- Key risk: ${c.risks[0]}
`).join('\n')}

**Decision Framework:**
- **Lowest cost:** Vietnam, Philippines, Colombia
- **Best English:** Philippines, Poland, Romania
- **Best time zone (US):** Mexico, Colombia (same zone), Brazil (1-3 hrs)
- **Strongest IP protection:** Poland, Romania (EU/GDPR)
- **Largest talent pool:** India (by far)
- **Best for first-time offshorers:** Philippines (cultural alignment) or Mexico (nearshore simplicity)`,
  },

  getting_started: {
    keywords: ['start', 'begin', 'first', 'new to', 'never', 'help me', 'what should', 'how do i', 'guide', 'advice', 'recommend'],
    title: 'Getting Started with Offshoring',
    response: (context) => {
      const { allRoles } = context;
      const l1l2 = allRoles.filter(r => (r.level === 'L1' || r.level === 'L2') && r.recommendation === 'Y');
      const quickWinSavings = Math.round(l1l2.reduce((s, r) => s + r.estimated_spend * 0.55, 0));

      return `**Your Offshoring Quick-Start Guide:**

Based on your GWOE data, here's a tailored starting point:

**Step 1: Validate Quick Wins**
You have **${l1l2.length} L1/L2 roles** marked for offshoring — these are your lowest-risk, highest-confidence moves worth an estimated **${formatCurrency(quickWinSavings)}/yr** in savings.

**Step 2: Pick a Pilot**
- Select 5-10 of those L1/L2 roles from a single department
- Choose roles with well-documented processes
- Avoid roles with regulatory/compliance sensitivity for the pilot

**Step 3: Select 2-3 Vendors**
- Run a competitive RFP (use the Savings Calculator for rate comparisons)
- Request case studies for similar role types
- Require a pilot period (3 months) before committing to scale

**Step 4: Plan the Transition**
- 60-day knowledge transfer plan
- 2-week parallel run
- Assign an onshore "bridge" role
- Set quality metrics and SLAs upfront

**Step 5: Communicate Transparently**
- Brief leadership, then managers, then all-hands
- Be honest about what's changing and why
- Offer support for affected employees

**Step 6: Execute & Measure**
- Track quality, cost, and satisfaction weekly
- Course-correct at Week 4 and Week 8
- Gate Wave 2 on Wave 1 success metrics

**Common First-Timer Mistakes to Avoid:**
1. Trying to offshore too many roles at once
2. Choosing the cheapest vendor (not the best fit)
3. Underinvesting in knowledge transfer
4. Not having an onshore manager dedicated to the offshore team
5. Expecting Day 1 savings (there's always a J-curve)`;
    },
  },
};

// ── Response Engine ────────────────────────────────────────────────────────

export function generateResponse(userMessage, context) {
  const lower = userMessage.toLowerCase().trim();

  // Check each topic for keyword matches
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, topic] of Object.entries(TOPICS)) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (lower.includes(kw)) {
        score += kw.length; // longer keyword matches = higher confidence
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { key, topic };
    }
  }

  if (bestMatch && bestScore >= 3) {
    const { topic } = bestMatch;
    const response = typeof topic.response === 'function'
      ? topic.response(context)
      : topic.response;

    return {
      title: topic.title,
      content: response,
      confidence: Math.min(95, 50 + bestScore * 5),
    };
  }

  // Fallback — general help
  return {
    title: 'How Can I Help?',
    content: `I can help you with offshore workforce strategy. Try asking about:

- **"What are the key offshore providers?"** — vendor landscape and selection
- **"What are the main concerns with offshoring?"** — risks and mitigations
- **"How do we handle employee relations?"** — communication, severance, morale
- **"How many people to manage offshore teams?"** — governance models and ratios
- **"Tell me about capacity and hourly rates"** — FTE to hours conversion, all-in rates
- **"How much can we save?"** — cost analysis based on your data
- **"What's the timeline for offshoring?"** — phased implementation roadmap
- **"How does knowledge transfer work?"** — 60-90 day KT framework
- **"What quality metrics should we track?"** — SLAs and KPIs
- **"Compare offshore countries"** — destination analysis
- **"How do we get started?"** — personalized quick-start guide based on your data

I'll use your actual GWOE workforce data to personalize answers wherever possible.`,
    confidence: 0,
  };
}

// ── Suggested Questions ────────────────────────────────────────────────────

export const SUGGESTED_QUESTIONS = [
  { label: 'Getting Started', question: 'How should we get started with offshoring?' },
  { label: 'Key Providers', question: 'Who are the key offshore service providers?' },
  { label: 'Risks & Concerns', question: 'What are the main concerns and risks with offshoring?' },
  { label: 'Employee Relations', question: 'How do we handle employee relations during an offshore transition?' },
  { label: 'Capacity & Hours', question: 'Tell me about our capacity in hours and hourly rates' },
  { label: 'Cost Savings', question: 'How much can we save by offshoring?' },
  { label: 'Offshore Managers', question: 'How many people do we need to manage offshore teams?' },
  { label: 'Country Comparison', question: 'Compare the offshore destination countries for us' },
  { label: 'Timeline', question: 'What does a typical offshoring timeline look like?' },
  { label: 'Knowledge Transfer', question: 'How does knowledge transfer work?' },
  { label: 'Quality & SLAs', question: 'What quality metrics and SLAs should we track?' },
];
