import { describe, it, expect } from 'vitest';
import {
  calculateProspectAuditScores,
  generateLeadsCsv,
  escapeCsvCell
} from '../features/export/exportService';
import { SavedProspect } from '../features/pipeline/pipelineTypes';
import { ExportOptions } from '../features/export/types';

describe('CSV / Excel Bulk Lead Exporter & Audit Scores', () => {
  const mockProspects: SavedProspect[] = [
    {
      id: 'summit-roofing',
      businessName: 'Summit Peak Roofing Co.',
      domain: 'summitpeakroofing-demo.com',
      websiteUrl: 'https://summitpeakroofing-demo.com',
      phone: '(555) 234-5678',
      email: 'contact@summitpeakroofing.com',
      location: 'Denver, CO',
      category: 'Roofing Contractor',
      socials: { facebook: 'https://facebook.com/summitroofing' },
      dateDiscovered: '2026-09-20',
      lastActivity: '2026-09-20',
      notes: 'High potential for short-form video ads.',
      auditItems: [
        { category: 'SEO', title: 'Meta Description', status: 'Present', details: 'Configured' },
        { category: 'Conversions', title: 'Click to Call', status: 'Strong', details: 'Direct phone' },
        { category: 'Social Proof', title: 'Google Reviews', status: 'Strong', details: '4.8 rating' },
        { category: 'Content & Media', title: 'Video Ads', status: 'Missing', details: 'No video found' }
      ],
      opportunities: [
        {
          id: 'video-ad-service',
          service: 'AI Video Ad Commercials',
          estimatedRetainer: '$1,500 - $3,000/mo',
          evidence: 'No short-form video on social channels'
        } as any
      ],
      chosenService: 'AI Video Ad Commercials',
      status: 'Ready to Contact'
    },
    {
      id: 'pureair-hvac',
      businessName: 'PureAir Heating & Cooling',
      domain: 'pureair-hvac-demo.com',
      websiteUrl: 'https://pureair-hvac-demo.com',
      phone: '(555) 987-6543',
      email: 'service@pureair.com',
      location: 'Austin, TX',
      category: 'HVAC Services',
      socials: {},
      dateDiscovered: '2026-09-21',
      lastActivity: '2026-09-21',
      notes: 'Needs speed to lead SMS automation.',
      auditItems: [],
      opportunities: [],
      status: 'New'
    },
    {
      id: 'law-firm-bad',
      businessName: 'Apex Injury Attorneys LLP',
      domain: 'apexinjurylaw.com',
      websiteUrl: 'https://apexinjurylaw.com',
      phone: '(555) 000-1111',
      email: 'info@apexinjurylaw.com',
      location: 'Dallas, TX',
      category: 'Law Firm & Personal Injury',
      socials: {},
      dateDiscovered: '2026-09-22',
      lastActivity: '2026-09-22',
      notes: 'Should be blocked.',
      auditItems: [],
      opportunities: [],
      status: 'New'
    },
    {
      id: 'realtor-bad',
      businessName: 'Prestige Realty Group LLC',
      domain: 'prestigerealty.com',
      websiteUrl: 'https://prestigerealty.com',
      phone: '(555) 222-3333',
      email: 'sales@prestigerealty.com',
      location: 'Miami, FL',
      category: 'Real Estate Agency & Homes for Sale',
      socials: {},
      dateDiscovered: '2026-09-22',
      lastActivity: '2026-09-22',
      notes: 'Should be blocked.',
      auditItems: [],
      opportunities: [],
      status: 'New'
    }
  ];

  it('calculates audit scores and bottlenecks accurately for a prospect', () => {
    const metrics = calculateProspectAuditScores(mockProspects[0]);

    expect(metrics.overallHealthScore).toBeGreaterThan(0);
    expect(metrics.overallHealthScore).toBeLessThanOrEqual(100);
    expect(metrics.mobileSeoScore).toBe(78);
    expect(metrics.conversionScore).toBeGreaterThan(50);
    expect(metrics.videoScore).toBe(30); // Since video was missing
    expect(metrics.topBottleneck).toContain('short-form');
    expect(metrics.recommendedService).toBe('AI Video Ad Commercials');
    expect(metrics.emailSubject).toContain('Summit Peak Roofing');
    expect(metrics.emailBody).toContain('Summit Peak Roofing');
    expect(metrics.smsHook).toContain('Summit Peak Roofing');
  });

  it('escapes cells adhering to RFC 4180 (quotes, commas, newlines)', () => {
    expect(escapeCsvCell('Simple text')).toBe('"Simple text"');
    expect(escapeCsvCell('Text with, comma')).toBe('"Text with, comma"');
    expect(escapeCsvCell('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    expect(escapeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
    expect(escapeCsvCell(null)).toBe('""');
  });

  it('generates Instantly / Smartlead formatted CSV with UTF-8 BOM', () => {
    const options: ExportOptions = {
      preset: 'instantly',
      format: 'csv',
      scope: 'all'
    };

    const csv = generateLeadsCsv(mockProspects, options, undefined, true);

    // Verify UTF-8 BOM (\uFEFF)
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Verify Instantly.ai expected column headers
    expect(csv).toContain('"Email"');
    expect(csv).toContain('"FirstName"');
    expect(csv).toContain('"CompanyName"');
    expect(csv).toContain('"AuditScore"');
    expect(csv).toContain('"TopBottleneck"');
    expect(csv).toContain('"PersonalizedSubject"');
    expect(csv).toContain('"PersonalizedEmailBody"');

    // Verify lead data is included
    expect(csv).toContain('"contact@summitpeakroofing.com"');
    expect(csv).toContain('"Summit Peak Roofing Co."');
  });

  it('generates Full Audit Intelligence with 26+ columns and scores', () => {
    const options: ExportOptions = {
      preset: 'full_audit',
      format: 'csv',
      scope: 'all'
    };

    const csv = generateLeadsCsv(mockProspects, options, undefined, true);

    expect(csv).toContain('"Overall Health Score"');
    expect(csv).toContain('"Mobile & SEO Score"');
    expect(csv).toContain('"Conversion Architecture Score"');
    expect(csv).toContain('"Social Proof Score"');
    expect(csv).toContain('"Video Creative Score"');
    expect(csv).toContain('"Primary Bottleneck"');
    expect(csv).toContain('"Facebook URL"');
    expect(csv).toContain('"https://facebook.com/summitroofing"');
  });

  it('strictly excludes law and real estate businesses from CSV exports', () => {
    const options: ExportOptions = {
      preset: 'full_audit',
      format: 'csv',
      scope: 'all'
    };

    const csv = generateLeadsCsv(mockProspects, options, undefined, true);

    // Law firm and Real estate businesses must NEVER be present
    expect(csv).not.toContain('Apex Injury Attorneys');
    expect(csv).not.toContain('apexinjurylaw.com');
    expect(csv).not.toContain('Prestige Realty Group');
    expect(csv).not.toContain('prestigerealty.com');
  });

  it('caps export to 3 records for Free plan users', () => {
    const manyProspects: SavedProspect[] = Array.from({ length: 10 }, (_, i) => ({
      id: `lead-${i}`,
      businessName: `Local Service Biz ${i}`,
      domain: `servicebiz${i}.com`,
      websiteUrl: `https://servicebiz${i}.com`,
      phone: '555-123-4567',
      email: `lead${i}@biz.com`,
      location: 'Seattle, WA',
      category: 'Plumbing Contractor',
      socials: {},
      dateDiscovered: '2026-09-20',
      lastActivity: '2026-09-20',
      notes: '',
      auditItems: [],
      opportunities: [],
      status: 'New'
    }));

    const options: ExportOptions = {
      preset: 'executive',
      format: 'csv',
      scope: 'all'
    };

    const freeCsv = generateLeadsCsv(manyProspects, options, undefined, false);
    // Split lines by CRLF (excluding BOM and empty lines)
    const lines = freeCsv.replace(/^\uFEFF/, '').trim().split('\r\n');
    // Header + max 3 rows = 4 lines
    expect(lines.length).toBe(4);

    const proCsv = generateLeadsCsv(manyProspects, options, undefined, true);
    const proLines = proCsv.replace(/^\uFEFF/, '').trim().split('\r\n');
    // Header + 10 rows = 11 lines
    expect(proLines.length).toBe(11);
  });
});
