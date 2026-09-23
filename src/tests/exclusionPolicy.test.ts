import { describe, it, expect, beforeEach } from 'vitest';
import { checkExclusionPolicy, isRestrictedProspect } from '../features/extractor/exclusionPolicy';
import { extractBusinessIdentity } from '../features/extractor/domExtractor';
import { extractMarketingAudit } from '../features/extractor/signalsExtractor';
import { evaluateOpportunities } from '../features/opportunities/opportunityRules';
import { generatePersonalizedOutreach } from '../features/outreach/outreachGenerator';
import { generateAdConcept } from '../features/adConcept/adConceptGenerator';
import { saveProspect, getSavedProspects } from '../features/pipeline/storageService';

describe('ProspectLens Strict Exclusion Policy: Law & Estate Businesses', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Policy Detection Rules', () => {
    it('detects law firms by domain name', () => {
      const res = checkExclusionPolicy(null, 'https://www.smithandassociateslaw.com');
      expect(res.isRestricted).toBe(true);
      expect(res.category).toBe('Law & Legal Services');
    });

    it('detects law firms by TLD (.law or .legal)', () => {
      const res = checkExclusionPolicy(null, 'https://justicegroup.law');
      expect(res.isRestricted).toBe(true);
      expect(res.category).toBe('Law & Legal Services');
    });

    it('detects law firms by page title and legal keywords', () => {
      const doc = document.implementation.createHTMLDocument('Morgan & Partners | Criminal Defense Attorneys at Law');
      const res = checkExclusionPolicy(doc, 'https://morganpartners-demo.com');
      expect(res.isRestricted).toBe(true);
      expect(res.category).toBe('Law & Legal Services');
    });

    it('detects real estate agencies by domain name and TLD', () => {
      const res = checkExclusionPolicy(null, 'https://austinluxuryrealty.com');
      expect(res.isRestricted).toBe(true);
      expect(res.category).toBe('Real Estate & Estate Services');
    });

    it('detects real estate brokers by page heading and title', () => {
      const doc = document.implementation.createHTMLDocument('Compass Premier Properties');
      const h1 = doc.createElement('h1');
      h1.textContent = 'Top Licensed Real Estate Agents & Brokers';
      doc.body.appendChild(h1);

      const res = checkExclusionPolicy(doc, 'https://compasspremierproperties.com');
      expect(res.isRestricted).toBe(true);
      expect(res.category).toBe('Real Estate & Estate Services');
    });

    it('detects estate planning, wills & trusts businesses', () => {
      const doc = document.implementation.createHTMLDocument('Bay Area Estate Planning & Trusts');
      const meta = doc.createElement('meta');
      meta.name = 'description';
      meta.content = 'Premier estate planning attorney assisting families with wills, trusts, and probate.';
      doc.head.appendChild(meta);

      const res = checkExclusionPolicy(doc, 'https://bayareaestateplanning.com');
      expect(res.isRestricted).toBe(true);
      expect(res.category).toBe('Real Estate & Estate Services');
    });

    it('allows valid local trades and SaaS without false positives', () => {
      // Lawn care contains "lawn" which should NOT trigger "law"
      const lawnDoc = document.implementation.createHTMLDocument('Green Thumb Lawn Care & Landscaping');
      const lawnRes = checkExclusionPolicy(lawnDoc, 'https://greenthumblawn.com');
      expect(lawnRes.isRestricted).toBe(false);

      // Descript AI SaaS
      const saasDoc = document.implementation.createHTMLDocument('Descript | All-in-one AI Video Editing');
      const saasRes = checkExclusionPolicy(saasDoc, 'https://descript.com');
      expect(saasRes.isRestricted).toBe(false);

      // Roofing contractor
      const roofDoc = document.implementation.createHTMLDocument('Summit Peak Roofing Co.');
      const roofRes = checkExclusionPolicy(roofDoc, 'https://summitpeakroofing.com');
      expect(roofRes.isRestricted).toBe(false);
    });
  });

  describe('Zero-Scrape Guarantee', () => {
    it('refuses to extract contacts, phones, emails, or services from law firm websites', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Blackwood Legal Group | Personal Injury Lawyers</title>
          </head>
          <body>
            <h1>Blackwood Legal Group - Personal Injury Lawyers</h1>
            <a href="tel:5551234567">Call (555) 123-4567</a>
            <a href="mailto:contact@blackwoodlaw.com">Email Us</a>
            <p>100 Legal Way, New York, NY</p>
          </body>
        </html>
      `;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const identity = extractBusinessIdentity(doc, 'https://blackwoodlaw.com');

      expect(identity.category).toContain('Restricted');
      expect(identity.contacts.phones).toHaveLength(0);
      expect(identity.contacts.emails).toHaveLength(0);
      expect(identity.contacts.addresses).toHaveLength(0);
      expect(identity.servicesOffered).toHaveLength(0);
      expect(identity.socials).toEqual({});
    });

    it('refuses to extract marketing audit signals from real estate websites', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pacific Coast Realty | Real Estate Brokerage</title>
          </head>
          <body>
            <h1>Pacific Coast Realty</h1>
            <button>Get A Free Home Estimate</button>
            <a href="tel:5559876543">Call Agent</a>
          </body>
        </html>
      `;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const audit = extractMarketingAudit(doc, 'https://pacificcoastrealty.com');

      expect(audit.items).toHaveLength(0);
      expect(audit.summary).toContain('prohibited by policy');
    });
  });

  describe('Pipeline & Storage Policy Enforcement', () => {
    it('throws error and blocks saving any restricted law or estate prospect', async () => {
      const lawProspect = {
        id: 'p_law_1',
        businessName: 'Vance & Associates Law Firm',
        domain: 'vancelaw.com',
        websiteUrl: 'https://vancelaw.com',
        category: 'Law & Legal Services',
        dateDiscovered: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'Ready to Contact' as const
      };

      await expect(saveProspect(lawProspect)).rejects.toThrow(/Compliance Violation/);
      const list = await getSavedProspects();
      expect(list).toHaveLength(0);
    });

    it('throws error and blocks saving real estate agencies', async () => {
      const realEstateProspect = {
        id: 'p_estate_1',
        businessName: 'Sunset Realty Group',
        domain: 'sunsetrealty.com',
        websiteUrl: 'https://sunsetrealty.com',
        category: 'Real Estate & Estate Services',
        dateDiscovered: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'Ready to Contact' as const
      };

      await expect(saveProspect(realEstateProspect)).rejects.toThrow(/Compliance Violation/);
    });

    it('allows saving valid non-restricted businesses', async () => {
      const rooferProspect = {
        id: 'p_roof_1',
        businessName: 'Apex Roofing Experts',
        domain: 'apexroofing.com',
        websiteUrl: 'https://apexroofing.com',
        category: 'Roofing Contractor',
        dateDiscovered: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        status: 'Ready to Contact' as const
      };

      await saveProspect(rooferProspect);
      const list = await getSavedProspects();
      expect(list).toHaveLength(1);
      expect(list[0].businessName).toBe('Apex Roofing Experts');
    });
  });

  describe('Generators Disabled for Restricted Categories', () => {
    const restrictedExtraction = {
      isRestricted: true,
      restrictionReason: 'Policy violation',
      identity: {
        businessName: 'Apex Law Office',
        domain: 'apexlaw.com',
        websiteUrl: 'https://apexlaw.com',
        category: 'Restricted: Law & Legal Services',
        servicesOffered: [],
        serviceAreas: [],
        contacts: { phones: [], emails: [], addresses: [] },
        socials: {},
        hasJsonLd: false
      },
      audit: { items: [], summary: '', analyzedAt: '' },
      meta: { pageTitle: 'Apex Law', url: 'https://apexlaw.com', wordCount: 0, extractedAt: '', isSpa: false }
    };

    it('evaluates zero opportunities for restricted entities', () => {
      const opps = evaluateOpportunities(restrictedExtraction as any);
      expect(opps.topOpportunities).toHaveLength(0);
      expect(opps.allOpportunities).toHaveLength(0);
    });

    it('refuses to generate outreach for restricted entities', () => {
      const outreach = generatePersonalizedOutreach({
        channel: 'Email',
        tone: 'Direct',
        opportunity: { id: '1', service: 'SEO', evidence: '', salesAngle: '', suggestedDeliverable: '', confidence: 'High', whyPitchThis: '', suggestedOffer: '' },
        identity: restrictedExtraction.identity
      });
      expect(outreach.subject).toContain('Prohibited');
      expect(outreach.charCount).toBe(0);
    });

    it('refuses to generate video ad concepts for restricted entities', () => {
      const ad = generateAdConcept(restrictedExtraction.identity, undefined, 'Before & After', '15s');
      expect(ad.strategy.hook).toContain('disabled');
      expect(ad.shotList).toHaveLength(0);
    });
  });
});
