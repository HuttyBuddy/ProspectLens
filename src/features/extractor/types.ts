export interface ExtractedContact {
  phones: string[];
  emails: string[];
  addresses: string[];
  city?: string;
  state?: string;
  contactPageUrl?: string;
  aboutPageUrl?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  yelp?: string;
  googleMaps?: string;
}

export interface BusinessIdentity {
  businessName: string;
  domain: string;
  websiteUrl: string;
  category: string;
  servicesOffered: string[];
  serviceAreas: string[];
  contacts: ExtractedContact;
  socials: SocialLinks;
  tagline?: string;
  description?: string;
  hasJsonLd: boolean;
  rawJsonLdSnippet?: string;
}

export type AuditStatus = 'Strong' | 'Present' | 'Weak' | 'Missing' | 'Unable to determine';

export interface AuditItem {
  id: string;
  category: 'Website' | 'Conversions' | 'Trust' | 'Content & Media';
  label: string;
  status: AuditStatus;
  evidence: string;
  recommendation?: string;
}

export interface MarketingAudit {
  items: AuditItem[];
  summary: string;
  analyzedAt: string;
}

export interface WebsiteExtractionResult {
  identity: BusinessIdentity;
  audit: MarketingAudit;
  meta: {
    pageTitle: string;
    url: string;
    wordCount: number;
    extractedAt: string;
    isSpa: boolean;
  };
  isRestricted?: boolean;
  restrictionReason?: string;
  restrictionCategory?: 'Law & Legal Services' | 'Real Estate & Estate Services';
}
