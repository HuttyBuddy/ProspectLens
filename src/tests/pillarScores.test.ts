import { describe, it, expect } from 'vitest';
import {
  computePillarScores,
  computeOverallScore,
  scoreLocalSeoItems,
  PILLAR_WEIGHTS
} from '../features/reports/pillarScores';
import { WebsiteExtractionResult } from '../features/extractor/types';

const baseExtraction: WebsiteExtractionResult = {
  identity: {
    businessName: 'Test Plumbing Co.',
    domain: 'testplumbing.com',
    websiteUrl: 'https://testplumbing.com',
    category: 'Plumber',
    contacts: {
      phones: ['(555) 123-4567'],
      emails: ['info@testplumbing.com'],
      addresses: ['123 Main St, Austin, TX']
    },
    servicesOffered: [],
    serviceAreas: ['Austin'],
    socials: { facebook: 'https://facebook.com/testplumbing' },
    hasJsonLd: true
  },
  meta: {
    pageTitle: 'Test Plumbing',
    url: 'https://testplumbing.com',
    wordCount: 500,
    extractedAt: new Date().toISOString(),
    isSpa: false
  },
  audit: { summary: '', items: [], analyzedAt: new Date().toISOString() }
};

describe('Pillar scoring engine', () => {
  it('returns 5 pillars in a stable order', () => {
    const pillars = computePillarScores(baseExtraction);
    expect(pillars.map((p) => p.id)).toEqual(['conversion', 'video', 'social', 'mobile', 'local']);
  });

  it('weights sum to 1.0', () => {
    const total = Object.values(PILLAR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('scores Local SEO from audit items when present', () => {
    const withItems: WebsiteExtractionResult = {
      ...baseExtraction,
      audit: {
        summary: '',
        analyzedAt: new Date().toISOString(),
        items: [
          { id: 'local-schema', category: 'Local SEO', label: 'x', status: 'Strong', evidence: 'x' },
          { id: 'local-nap', category: 'Local SEO', label: 'x', status: 'Strong', evidence: 'x' },
          { id: 'local-click-to-call', category: 'Local SEO', label: 'x', status: 'Strong', evidence: 'x' },
          { id: 'local-maps', category: 'Local SEO', label: 'x', status: 'Missing', evidence: 'x' },
          { id: 'local-reviews', category: 'Local SEO', label: 'x', status: 'Weak', evidence: 'x' },
          { id: 'local-service-area', category: 'Local SEO', label: 'x', status: 'Present', evidence: 'x' }
        ]
      }
    };
    const local = computePillarScores(withItems).find((p) => p.id === 'local')!;
    // (100+100+100+0+40+75)/6 = 69.16 → 69
    expect(local.score).toBe(69);
    expect(local.status).toBe('Needs Improvement');
  });

  it('falls back to identity signals when no audit items exist', () => {
    const local = computePillarScores(baseExtraction).find((p) => p.id === 'local')!;
    // hasJsonLd 25 + phone 20 + address 20 + socials 20 + serviceAreas 15 = 100
    expect(local.score).toBe(100);
    expect(local.status).toBe('Good');
  });

  it('keeps legacy pillar scores identical to the pre-refactor formulas', () => {
    const pillars = computePillarScores(baseExtraction);
    const byId = Object.fromEntries(pillars.map((p) => [p.id, p.score]));
    // mobile: metaDescription missing → 55
    expect(byId.mobile).toBe(55);
    // conversion: 40 + 20 (phone) + 15 (email) + 0 (no items) = 75
    expect(byId.conversion).toBe(75);
    // social: 45 + 0 + 0 + 10 (socials) = 55
    expect(byId.social).toBe(55);
    // video: no embeds → 30
    expect(byId.video).toBe(30);
  });

  it('computeOverallScore applies the documented weights', () => {
    const pillars = computePillarScores(baseExtraction);
    const overall = computeOverallScore(pillars);
    // 75*.30 + 30*.15 + 55*.25 + 55*.15 + 100*.15 = 22.5+4.5+13.75+8.25+15 = 64
    expect(overall).toBe(64);
  });

  it('scoreLocalSeoItems maps statuses to points and averages', () => {
    expect(scoreLocalSeoItems([{ status: 'Strong' }, { status: 'Missing' }])).toBe(50);
    expect(scoreLocalSeoItems([])).toBe(0);
    expect(
      scoreLocalSeoItems([{ status: 'Present' }, { status: 'Weak' }, { status: 'Unable to determine' }])
    ).toBe(Math.round((75 + 40 + 50) / 3));
  });
});
