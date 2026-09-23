import { describe, it, expect } from 'vitest';
import { buildClientAuditData, generateClientAuditPdf } from '../features/reports';
import { WebsiteExtractionResult } from '../features/extractor/types';
import { DEFAULT_SETTINGS } from '../features/settings/settingsStore';

describe('Client PDF Audit Report Engine', () => {
  const sampleExtraction: WebsiteExtractionResult = {
    identity: {
      businessName: 'Austin Peak Roofing Co.',
      domain: 'austinpeakroofing.com',
      websiteUrl: 'https://austinpeakroofing.com',
      category: 'Roofing Contractor',
      tagline: 'Precision Roofing in Austin',
      contacts: {
        phones: ['(512) 555-0199'],
        emails: ['hello@austinpeakroofing.com'],
        addresses: ['1204 Congress Ave, Austin, TX']
      },
      servicesOffered: ['Roof Replacement', 'Roof Repair'],
      serviceAreas: ['Austin', 'Round Rock'],
      socials: { facebook: 'https://facebook.com/austinpeakroofing' },
      hasJsonLd: true
    },
    meta: {
      pageTitle: 'Austin Peak Roofing Co.',
      url: 'https://austinpeakroofing.com',
      wordCount: 450,
      metaDescription: 'Top-rated residential and commercial roofing in Austin, TX with free inspections.',
      reviewRating: 4.8,
      reviewCount: 42,
      hasVideoEmbeds: false,
      hasReviewSchema: true
    },
    audit: {
      summary: 'Strong trust profile but lacks video media.',
      items: [],
      analyzedAt: new Date().toISOString()
    }
  };

  it('builds structured client audit data with health scores and bottlenecks', () => {
    const auditData = buildClientAuditData(sampleExtraction, null, DEFAULT_SETTINGS);

    expect(auditData.businessName).toBe('Austin Peak Roofing Co.');
    expect(auditData.overallScore).toBeGreaterThanOrEqual(40);
    expect(auditData.overallScore).toBeLessThanOrEqual(100);
    expect(auditData.categoryScores.length).toBe(4);
    expect(auditData.detectedBottlenecks.length).toBeGreaterThan(0);
    expect(auditData.recommendedServices.length).toBeGreaterThan(0);
    expect(auditData.agency.name).toBe(DEFAULT_SETTINGS.companyName);
  });

  it('strictly blocks audit generation for law or estate businesses', () => {
    const lawExtraction: WebsiteExtractionResult = {
      identity: {
        businessName: 'Austin Law Group & Associates',
        domain: 'austinlawgroup.com',
        websiteUrl: 'https://austinlawgroup.com',
        category: 'Law & Legal Services',
        contacts: { phones: [], emails: [], addresses: [] },
        servicesOffered: ['Legal Consultation'],
        serviceAreas: [],
        socials: {},
        hasJsonLd: false
      },
      meta: {
        pageTitle: 'Austin Law Group',
        url: 'https://austinlawgroup.com',
        wordCount: 300
      },
      audit: { summary: '', items: [], analyzedAt: new Date().toISOString() },
      isRestricted: true,
      restrictionReason: 'Law firm scraping blocked'
    };

    expect(() => buildClientAuditData(lawExtraction, null, DEFAULT_SETTINGS)).toThrowError(
      /Policy Violation/
    );
  });

  it('executes client audit PDF builder with jsPDF without throwing', async () => {
    const auditData = buildClientAuditData(sampleExtraction, null, DEFAULT_SETTINGS);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    expect(typeof doc.save).toBe('function');

    const originalCreateElement = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = () => {};
      }
      return el;
    });

    expect(() => generateClientAuditPdf(auditData)).not.toThrow();
    createSpy.mockRestore();
  });
});
