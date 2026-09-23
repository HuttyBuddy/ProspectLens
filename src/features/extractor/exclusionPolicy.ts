/**
 * ProspectLens Strict Exclusion Policy
 *
 * Core Rule: NEVER scrape or extract information from law or estate businesses.
 * Categories strictly excluded:
 * 1. Law & Legal Services (Law firms, attorneys, solicitors, barristers, litigation, legal counsel, legal defense, legal clinics, etc.)
 * 2. Real Estate & Estate Services (Realtors, real estate agencies, brokers, property management, estate planning, wills & trusts, probate, estate sales & liquidators)
 */

export type ExclusionCategory = 'Law & Legal Services' | 'Real Estate & Estate Services';

export interface ExclusionCheckResult {
  isRestricted: boolean;
  category?: ExclusionCategory;
  reason?: string;
  matchedSignals: string[];
}

// Restricted Schema.org types
const LAW_SCHEMA_TYPES = [
  'legalservice',
  'attorney',
  'lawfirm',
  'legalagency',
  'notary'
];

const ESTATE_SCHEMA_TYPES = [
  'realestateagent',
  'realestateagency',
  'realestatelisting'
];

// Restricted Top-Level Domains (TLDs)
const LAW_TLDS = ['.law', '.legal', '.attorney', '.lawyer'];
const ESTATE_TLDS = ['.realty', '.realestate', '.properties'];

// Domain keyword patterns (requires word boundary or hyphens to avoid false positives like "slated" or "relate")
const LAW_DOMAIN_REGEX = /(?:^|[.-])(?:law|legal|attorney|attorneys|lawyer|lawyers|lawfirm|esq|esquire|solicitor|barrister|litigation|legalfirm)(?:[.-]|$)/i;
const LAW_DOMAIN_SUBSTRING_REGEX = /(?:lawfirm|attorneys?|lawyers?|legalgroup|lawgroup|lawcenter|legalservices|legalfirm)/i;

const ESTATE_DOMAIN_REGEX = /(?:^|[.-])(?:realty|realestate|realtor|realtors|properties|estateplanning|estatesale|estatesales|estates)(?:[.-]|$)/i;
const ESTATE_DOMAIN_SUBSTRING_REGEX = /(?:realty|realestate|realtor|estateplanning|estatesales?|estateliquidat)/i;

// Text patterns for Titles, Metas, Headings, and Content
const LAW_CONTENT_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\blaw\s+firms?\b/i, label: 'law firm' },
  { pattern: /\battorneys?\s+at\s+law\b/i, label: 'attorney at law' },
  { pattern: /\blaw\s+offices?\b/i, label: 'law office' },
  { pattern: /\blegal\s+services?\b/i, label: 'legal services' },
  { pattern: /\blegal\s+counsel\b/i, label: 'legal counsel' },
  { pattern: /\blaw\s+groups?\b/i, label: 'law group' },
  { pattern: /\blegal\s+groups?\b/i, label: 'legal group' },
  { pattern: /\bpersonal\s+injury\s+(?:lawyers?|attorneys?|law\s+firms?)\b/i, label: 'personal injury lawyer' },
  { pattern: /\bcriminal\s+defense\s+(?:lawyers?|attorneys?|law\s+firms?)\b/i, label: 'criminal defense attorney' },
  { pattern: /\bdivorce\s+(?:lawyers?|attorneys?|law\s+firms?)\b/i, label: 'divorce lawyer' },
  { pattern: /\bprobate\s+(?:lawyers?|attorneys?|law\s+firms?)\b/i, label: 'probate attorney' },
  { pattern: /\blitigation\s+(?:lawyers?|attorneys?|firms?|counsel)\b/i, label: 'litigation counsel' },
  { pattern: /\btrial\s+lawyers?\b/i, label: 'trial lawyer' },
  { pattern: /\blawyers?\b/i, label: 'lawyer' },
  { pattern: /\battorneys?\b/i, label: 'attorney' },
  { pattern: /\bsolicitors?\b/i, label: 'solicitor' },
  { pattern: /\bbarristers?\b/i, label: 'barrister' },
  { pattern: /\battorneys?\s+and\s+counselors?\b/i, label: 'attorneys and counselors' }
];

const ESTATE_CONTENT_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\breal\s+estate\b/i, label: 'real estate' },
  { pattern: /\brealtor[s]?\b/i, label: 'realtor' },
  { pattern: /\brealty\b/i, label: 'realty' },
  { pattern: /\breal\s+estate\s+(?:agents?|brokers?|agenc(?:y|ies)|groups?|brokerages?|firms?|services?)\b/i, label: 'real estate brokerage/agent' },
  { pattern: /\bcommercial\s+real\s+estate\b/i, label: 'commercial real estate' },
  { pattern: /\bresidential\s+real\s+estate\b/i, label: 'residential real estate' },
  { pattern: /\bestate\s+planning\b/i, label: 'estate planning' },
  { pattern: /\bestate\s+planning\s+(?:attorneys?|lawyers?|firms?|services?)\b/i, label: 'estate planning legal' },
  { pattern: /\bwills?\s+(?:and|&)\s+trusts?\b/i, label: 'wills and trusts' },
  { pattern: /\btrusts?\s+(?:and|&)\s+estates?\b/i, label: 'trusts and estates' },
  { pattern: /\bprobate\s+(?:and|&)\s+estate\b/i, label: 'probate and estate' },
  { pattern: /\bestate\s+sales?\b/i, label: 'estate sales' },
  { pattern: /\bestate\s+liquidat(?:ors?|ion)\b/i, label: 'estate liquidation' },
  { pattern: /\bproperty\s+management\s+(?:compan(?:y|ies)|groups?|services?)\b/i, label: 'property management' }
];

/**
 * Checks if a given URL, document, or metadata matches restricted Law or Estate business patterns.
 */
export function checkExclusionPolicy(doc?: Document | null, url: string = '', jsonLdCandidate?: any): ExclusionCheckResult {
  const matchedSignals: string[] = [];
  let category: ExclusionCategory | undefined;

  let domain = '';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    domain = url.toLowerCase();
  }

  // 1. Check TLDs
  for (const tld of LAW_TLDS) {
    if (domain.endsWith(tld)) {
      matchedSignals.push(`Restricted Law TLD: ${tld}`);
      category = 'Law & Legal Services';
    }
  }
  for (const tld of ESTATE_TLDS) {
    if (domain.endsWith(tld)) {
      matchedSignals.push(`Restricted Estate TLD: ${tld}`);
      category = 'Real Estate & Estate Services';
    }
  }

  // 2. Check Domain Tokens and Slugs
  const domainParts = domain.split('.');
  const domainNameOnly = domainParts.slice(0, -1).join('.'); // e.g. "smithandassociateslaw"

  if (
    LAW_DOMAIN_REGEX.test(domain) ||
    LAW_DOMAIN_SUBSTRING_REGEX.test(domain) ||
    domainNameOnly.endsWith('law') ||
    domainNameOnly.endsWith('legal') ||
    /(?:^|[a-z0-9])law$/i.test(domainNameOnly) ||
    /\b(law|legal|lawyer|lawyers|attorney|attorneys|lawfirm)\b/i.test(domain.replace(/[.-]/g, ' '))
  ) {
    matchedSignals.push(`Domain contains legal identifier: ${domain}`);
    category = category || 'Law & Legal Services';
  }
  if (
    ESTATE_DOMAIN_REGEX.test(domain) ||
    ESTATE_DOMAIN_SUBSTRING_REGEX.test(domain) ||
    domainNameOnly.endsWith('realty') ||
    domainNameOnly.endsWith('estate') ||
    domainNameOnly.endsWith('estates') ||
    /\b(realty|estate|estates|realtor|realtors)\b/i.test(domain.replace(/[.-]/g, ' '))
  ) {
    matchedSignals.push(`Domain contains real estate identifier: ${domain}`);
    category = category || 'Real Estate & Estate Services';
  }

  // 3. Check JSON-LD Schema Types
  if (jsonLdCandidate) {
    const typeCandidates: string[] = [];
    const collectTypes = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj['@type']) {
        if (Array.isArray(obj['@type'])) {
          typeCandidates.push(...obj['@type']);
        } else if (typeof obj['@type'] === 'string') {
          typeCandidates.push(obj['@type']);
        }
      }
      if (Array.isArray(obj)) {
        obj.forEach(collectTypes);
      }
      if (Array.isArray(obj['@graph'])) {
        obj['@graph'].forEach(collectTypes);
      }
    };
    collectTypes(jsonLdCandidate);

    for (const t of typeCandidates) {
      const lower = t.toLowerCase();
      if (LAW_SCHEMA_TYPES.some((st) => lower.includes(st))) {
        matchedSignals.push(`Schema.org Legal Type: ${t}`);
        category = category || 'Law & Legal Services';
      }
      if (ESTATE_SCHEMA_TYPES.some((st) => lower.includes(st))) {
        matchedSignals.push(`Schema.org Estate Type: ${t}`);
        category = category || 'Real Estate & Estate Services';
      }
    }
  }

  // 4. Check Document (Title, Meta, Headings)
  if (doc) {
    // Check JSON-LD script tags if not passed
    if (!jsonLdCandidate) {
      const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
      for (const s of scripts) {
        try {
          const parsed = JSON.parse(s.textContent || '{}');
          const raw = JSON.stringify(parsed).toLowerCase();
          if (LAW_SCHEMA_TYPES.some((st) => raw.includes(`"${st}"`))) {
            matchedSignals.push(`JSON-LD contains legal service schema`);
            category = category || 'Law & Legal Services';
          }
          if (ESTATE_SCHEMA_TYPES.some((st) => raw.includes(`"${st}"`))) {
            matchedSignals.push(`JSON-LD contains real estate schema`);
            category = category || 'Real Estate & Estate Services';
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    const title = doc.title || doc.querySelector('title')?.textContent || '';
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const h1 = doc.querySelector('h1')?.textContent || '';
    const h2s = Array.from(doc.querySelectorAll('h2')).map((h) => h.textContent || '').join(' ');

    const combinedText = `${title} ${ogTitle} ${metaDesc} ${ogDesc} ${h1} ${h2s}`;

    // Law checks
    for (const item of LAW_CONTENT_PATTERNS) {
      if (item.pattern.test(combinedText)) {
        matchedSignals.push(`Legal indicator found: "${item.label}"`);
        category = category || 'Law & Legal Services';
      }
    }

    // Estate checks
    for (const item of ESTATE_CONTENT_PATTERNS) {
      if (item.pattern.test(combinedText)) {
        matchedSignals.push(`Estate indicator found: "${item.label}"`);
        category = category || 'Real Estate & Estate Services';
      }
    }
  }

  if (matchedSignals.length > 0) {
    return {
      isRestricted: true,
      category: category || 'Law & Legal Services',
      reason: `Scraping is strictly prohibited for ${category || 'law and estate'} businesses under ProspectLens compliance policy.`,
      matchedSignals
    };
  }

  return {
    isRestricted: false,
    matchedSignals: []
  };
}

/**
 * Check if a prospect record represents an excluded law or estate business.
 */
export function isRestrictedProspect(businessName?: string, domain?: string, category?: string): boolean {
  if (!businessName && !domain && !category) return false;
  const combined = `${businessName || ''} ${domain || ''} ${category || ''}`.toLowerCase();

  if (combined.includes('restricted')) return true;

  // Direct category matching
  if (
    combined.includes('law & legal') ||
    combined.includes('real estate') ||
    combined.includes('estate planning') ||
    combined.includes('legal services')
  ) {
    return true;
  }

  // Quick domain/name check
  const check = checkExclusionPolicy(null, domain || businessName || '');
  if (check.isRestricted) return true;

  for (const item of LAW_CONTENT_PATTERNS) {
    if (item.pattern.test(combined)) return true;
  }
  for (const item of ESTATE_CONTENT_PATTERNS) {
    if (item.pattern.test(combined)) return true;
  }

  return false;
}
