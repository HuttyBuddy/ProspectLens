import { WebsiteExtractionResult } from '../extractor/types';
import { OpportunityEngineResult, ServiceOpportunity } from '../opportunities/types';
import { UserSettings } from '../settings/settingsStore';

export interface AuditCategoryScore {
  category: string;
  score: number; // 0 - 100
  status: 'Good' | 'Needs Improvement' | 'Critical';
  summary: string;
}

export interface ClientAuditData {
  businessName: string;
  websiteUrl: string;
  industry: string;
  generatedDate: string;
  overallScore: number;
  categoryScores: AuditCategoryScore[];
  detectedBottlenecks: string[];
  recommendedServices: Array<{
    title: string;
    priority: 'High' | 'Medium';
    estimatedImpact: string;
    rationale: string;
  }>;
  agency: {
    name: string;
    consultant: string;
    email: string;
    phone: string;
    cta: string;
  };
}
