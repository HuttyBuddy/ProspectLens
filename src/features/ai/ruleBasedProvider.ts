import { AIProvider } from './aiProviderInterface';
import { WebsiteExtractionResult, MarketingAudit, BusinessIdentity } from '../extractor/types';
import { ServiceOpportunity } from '../opportunities/opportunityTypes';
import { evaluateOpportunities } from '../opportunities/opportunityRules';
import { OutreachRequest, OutreachMessage, generatePersonalizedOutreach } from '../outreach/outreachGenerator';
import { AdConcept, AdFormat, VideoDuration, generateAdConcept } from '../adConcept/adConceptGenerator';

export class RuleBasedAIProvider implements AIProvider {
  name = 'Deterministic Local Engine';

  async isAvailable(): Promise<boolean> {
    return true; // Always fast, reliable, privacy-preserving, and free
  }

  async analyzeBusiness(extraction: WebsiteExtractionResult): Promise<MarketingAudit> {
    return extraction.audit;
  }

  async identifyOpportunities(extraction: WebsiteExtractionResult, servicesSold?: string[]): Promise<ServiceOpportunity[]> {
    const res = evaluateOpportunities(extraction, { servicesSold: servicesSold || [] });
    return res.allOpportunities;
  }

  async generateOutreach(req: OutreachRequest): Promise<OutreachMessage> {
    return generatePersonalizedOutreach(req);
  }

  async generateAdConcept(identity: BusinessIdentity, format: AdFormat, duration: VideoDuration): Promise<AdConcept> {
    return generateAdConcept(identity, undefined, format, duration);
  }
}
