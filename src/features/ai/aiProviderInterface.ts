import { BusinessIdentity, MarketingAudit, WebsiteExtractionResult } from '../extractor/types';
import { ServiceOpportunity } from '../opportunities/opportunityTypes';
import { OutreachMessage, OutreachRequest } from '../outreach/outreachGenerator';
import { AdConcept, AdFormat, VideoDuration } from '../adConcept/adConceptGenerator';

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  analyzeBusiness(extraction: WebsiteExtractionResult): Promise<MarketingAudit>;
  identifyOpportunities(extraction: WebsiteExtractionResult, servicesSold?: string[]): Promise<ServiceOpportunity[]>;
  generateOutreach(req: OutreachRequest): Promise<OutreachMessage>;
  generateAdConcept(identity: BusinessIdentity, format: AdFormat, duration: VideoDuration): Promise<AdConcept>;
}
