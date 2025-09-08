export const INVESTOR_EVALUATION_CATEGORIES = {
  investor_profile: {
    name: 'Investor Profile & Strategy',
    weight: 4,
    useInComparison: true,
    shortName: 'Profile'
  },
  fund_structure: {
    name: 'Fund Structure & Capital Source',
    weight: 3,
    useInComparison: false,
    shortName: 'Fund Structure'
  },
  track_record: {
    name: 'Track Record & References',
    weight: 6,
    useInComparison: true,
    shortName: 'Track Record'
  },
  value_add: {
    name: 'Value-Add Beyond Capital',
    weight: 7,
    useInComparison: true,
    shortName: 'Value-Add'
  },
  governance: {
    name: 'Governance & Control',
    weight: 5,
    useInComparison: true,
    shortName: 'Governance'
  },
  investment_philosophy: {
    name: 'Investment Philosophy & Alignment',
    weight: 7,
    useInComparison: true,
    shortName: 'Philosophy'
  },
  cultural_fit: {
    name: 'Cultural Fit',
    weight: 4,
    useInComparison: true,
    shortName: 'Culture'
  },
  negotiation: {
    name: 'Negotiation & Terms',
    weight: 6,
    useInComparison: true,
    shortName: 'Terms'
  },
  reputation: {
    name: 'Reputation & Market Perception',
    weight: 4,
    useInComparison: true,
    shortName: 'Reputation'
  },
  future_orientation: {
    name: 'Future Orientation',
    weight: 10,
    useInComparison: true,
    shortName: 'Future'
  },
  trust: {
    name: 'Trust & Transparency',
    weight: 7,
    useInComparison: true,
    shortName: 'Trust'
  },
  communication: {
    name: 'Chemistry & Communication Style',
    weight: 5,
    useInComparison: true,
    shortName: 'Communication'
  },
  decision_making: {
    name: 'Decision-Making & Conflict Resolution',
    weight: 5,
    useInComparison: true,
    shortName: 'Decision-Making'
  },
  founder_autonomy: {
    name: 'Founder Autonomy & Respect',
    weight: 7,
    useInComparison: true,
    shortName: 'Autonomy'
  },
  human_partnership: {
    name: 'Human Side of Partnership',
    weight: 6,
    useInComparison: false,
    shortName: 'Partnership'
  },
  relationship_potential: {
    name: 'Long-Term Relationship Potential',
    weight: 9,
    useInComparison: false,
    shortName: 'Long-Term'
  },
  self_awareness: {
    name: 'Investor\'s Own Self-Awareness',
    weight: 7,
    useInComparison: false,
    shortName: 'Self-Awareness'
  }
} as const

export const COMPARISON_CATEGORIES = Object.entries(INVESTOR_EVALUATION_CATEGORIES)
  .filter(([_, category]) => category.useInComparison)
  .reduce((acc, [key, category]) => {
    acc[key] = category
    return acc
  }, {} as Record<string, typeof INVESTOR_EVALUATION_CATEGORIES[keyof typeof INVESTOR_EVALUATION_CATEGORIES]>)

export const INVESTOR_EVALUATION_QUESTIONS = {
  investor_profile: [
    "What is your typical check size and stage of investment?",
    "What revenue/profitability profile do you usually invest in?", 
    "Do you typically lead rounds or follow?",
    "How many new deals do you do each year vs. follow-on investments?",
    "What's your average hold period before exit?"
  ],
  fund_structure: [
    "What fund are you investing out of right now, and when was it raised?",
    "How much dry powder do you have left in this fund?",
    "Who are your LPs (institutions, family offices, etc.)?",
    "How do you handle reserve capital for follow-on rounds?",
    "What pressures (e.g., fund lifecycle, exit timing) could affect your ability to support us?"
  ],
  track_record: [
    "Can you share examples of companies you've backed at a similar stage/industry?",
    "What has been your most successful investment, and why?",
    "What's an example of a company that didn't go well, and what did you learn?",
    "Can I speak with a few founders you've worked with—both successes and failures?"
  ],
  value_add: [
    "How do you support portfolio companies (strategic introductions, hiring, M&A, fundraising, governance)?",
    "Do you have an internal team for talent, marketing, ops, etc.?",
    "How often do you interact with founders—weekly, monthly, quarterly?",
    "Can you describe a time when you rolled up your sleeves to help a company through a tough moment?",
    "Do you help with introductions to future investors or buyers?"
  ],
  governance: [
    "What board structure do you typically require?",
    "Do you require veto rights or protective provisions? Which ones?",
    "How do you approach disagreements with founders?",
    "What are your expectations for reporting and communication cadence?",
    "In tough situations, do you lean toward replacing management or working through issues?"
  ],
  investment_philosophy: [
    "What excites you about our business and this sector?",
    "How do you think about balancing growth vs. profitability?",
    "Do you prefer capital-efficient growth or \"swing for the fences\"?",
    "How do you evaluate success in your investments?",
    "What's your exit philosophy—strategic sale, IPO, secondary?"
  ],
  cultural_fit: [
    "How do you see the founder/CEO's role evolving after your investment?",
    "What do you value most in your relationship with founders?",
    "What's your style: hands-on, advisory, or mostly passive?",
    "Have you had long-term partnerships with founders across multiple ventures?",
    "What are red flags for you in a founder relationship?"
  ],
  negotiation: [
    "How flexible are you on valuation vs. ownership targets?",
    "How do you think about pro rata rights, liquidation preferences, or anti-dilution?",
    "Are you open to creative structures (convertible notes, SAFE, revenue-based, earn-outs)?",
    "How do you approach down rounds or recapitalizations?",
    "How do you typically structure follow-on participation?"
  ],
  reputation: [
    "How are you perceived by co-investors and banks?",
    "What reputation do you have with founders you've backed?",
    "Have you ever had litigation or disputes with portfolio founders?",
    "Do you have preferred relationships with certain acquirers or strategics?"
  ],
  future_orientation: [
    "How do you see this industry evolving in the next 5–10 years?",
    "How do you help companies prepare for the next round of financing?",
    "What's your appetite for supporting inorganic growth (acquisitions)?",
    "Do you see this business as a potential platform investment or bolt-on?"
  ],
  trust: [
    "When you don't know the answer to something, how do you typically respond?",
    "Tell me about a time you delivered bad news to a founder—how did you handle it?",
    "How do you prefer to receive tough news from me (straightforward, detailed, early vs. later)?"
  ],
  communication: [
    "How do you like to communicate (text, calls, structured updates, informal check-ins)?",
    "How often do you expect to interact outside of formal board meetings?",
    "What frustrates you most in working with founders?",
    "Do you see yourself as more of a coach, a partner, or a watchdog?"
  ],
  decision_making: [
    "Can you share an example of when you and a founder strongly disagreed? How did it play out?",
    "When decisions are urgent, how quickly can you move?",
    "How do you handle situations when LP pressure conflicts with what's best for the company?"
  ],
  founder_autonomy: [
    "How do you think about the balance between founder control and investor oversight?",
    "What's your view on founder secondaries (taking some liquidity)?",
    "How do you view first-time vs. repeat founders?",
    "If I want to pivot strategy, what would your response typically be?"
  ],
  human_partnership: [
    "What motivates you personally about this line of work?",
    "Outside of financial return, what do you hope to get from this investment?",
    "How do you support founders during high-stress moments (burnout, fundraising struggles, market downturns)?",
    "What do you do when you lose conviction in a company?"
  ],
  relationship_potential: [
    "Do you invest in the same founder across multiple companies?",
    "What's an example of a founder relationship you've kept long after the business exited?",
    "Do you see yourself as someone who mentors and develops founders, or primarily as capital?"
  ],
  self_awareness: [
    "What do you think founders misunderstand about you or your firm?",
    "If I spoke to three of your portfolio CEOs, what would they say you're best at—and worst at?",
    "What's something you're trying to improve in how you work with founders?"
  ]
} as const

export type InvestorDimension = keyof typeof INVESTOR_EVALUATION_CATEGORIES
export type ComparisonDimension = keyof typeof COMPARISON_CATEGORIES