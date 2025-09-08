// Mock data for investor evaluation scores based on the new categories
// This simulates scores that would come from completing the investor evaluation questionnaire

export const MOCK_COMPANY_SCORES = {
  // These would normally come from answering the investor evaluation questions
  investor_profile: 65, // Above average profile fit
  track_record: 72, // Strong track record alignment
  value_add: 58, // Moderate value-add alignment
  governance: 43, // Below average governance fit
  investment_philosophy: 80, // Strong philosophical alignment  
  cultural_fit: 85, // Excellent cultural fit
  negotiation: 45, // Challenging negotiation fit
  reputation: 67, // Good reputation alignment
  future_orientation: 92, // Excellent future vision alignment
  trust: 78, // High trust and transparency
  communication: 88, // Excellent communication fit
  decision_making: 55, // Moderate decision-making fit
  founder_autonomy: 35 // Low autonomy alignment (potential concern)
}

// Updated investor criteria weights using the new evaluation system
export const UPDATED_INVESTOR_CRITERIA_WEIGHTS = {
  'TechVentures Capital': {
    investor_profile: 4,
    track_record: 6, 
    value_add: 7,
    governance: 5,
    investment_philosophy: 7,
    cultural_fit: 4,
    negotiation: 6,
    reputation: 4,
    future_orientation: 10, // Highest priority
    trust: 7,
    communication: 5,
    decision_making: 5,
    founder_autonomy: 7
  },
  'Growth Partners PE': {
    investor_profile: 4,
    track_record: 6,
    value_add: 7, 
    governance: 5,
    investment_philosophy: 7,
    cultural_fit: 4,
    negotiation: 6,
    reputation: 4,
    future_orientation: 10,
    trust: 7,
    communication: 5,
    decision_making: 5,
    founder_autonomy: 7
  },
  'Strategic Innovations Fund': {
    investor_profile: 4,
    track_record: 6,
    value_add: 7,
    governance: 5, 
    investment_philosophy: 7,
    cultural_fit: 4,
    negotiation: 6,
    reputation: 4,
    future_orientation: 10,
    trust: 7,
    communication: 5,
    decision_making: 5,
    founder_autonomy: 7
  },
  'Regional Capital Partners': {
    investor_profile: 4,
    track_record: 6,
    value_add: 7,
    governance: 5,
    investment_philosophy: 7,
    cultural_fit: 4,
    negotiation: 6,
    reputation: 4,
    future_orientation: 10,
    trust: 7,
    communication: 5,
    decision_making: 5,
    founder_autonomy: 7
  },
  'Enterprise Value Partners': {
    investor_profile: 4,
    track_record: 6,
    value_add: 7,
    governance: 5,
    investment_philosophy: 7,
    cultural_fit: 4,
    negotiation: 6,
    reputation: 4,
    future_orientation: 10,
    trust: 7,
    communication: 5,
    decision_making: 5,
    founder_autonomy: 7
  }
}