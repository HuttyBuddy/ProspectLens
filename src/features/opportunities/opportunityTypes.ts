export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface ServiceOpportunity {
  id: string;
  service: string;
  evidence: string;
  salesAngle: string;
  suggestedDeliverable: string;
  confidence: ConfidenceLevel;
  whyPitchThis: string;
  suggestedOffer: string;
  estimatedPricingGuide?: string;
  isUserOfferedService?: boolean;
}

export interface OpportunityEngineResult {
  topOpportunities: ServiceOpportunity[]; // Top 3 "What Should I Sell Them?"
  allOpportunities: ServiceOpportunity[];
  businessOverview: {
    name: string;
    category: string;
    keyStrengths: string[];
    primaryGaps: string[];
  };
}
