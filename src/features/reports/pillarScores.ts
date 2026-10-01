/**
 * Shared pillar scoring engine for ProspectLens audits.
 *
 * Computes the 5 audit pillars (0-100) from a WebsiteExtractionResult:
 *  1. Conversion Architecture (30%)
 *  2. Video & Visual Ads (15%)
 *  3. Social Proof & Authority (25%)
 *  4. Mobile & On-Page SEO (15%)
 *  5. Local SEO & Google Business Presence (15%)
 *
 * Shared by the PDF report generator, competitor benchmarking, and
 * scheduled re-scan diffing so all three always score identically.
 */
import { AuditStatus, WebsiteExtractionResult } from '../extractor/types';

export interface PillarScore {
  id: 'conversion' | 'video' | 'social' | 'mobile' | 'local';
  category: string;
  score: number;
  status: 'Good' | 'Needs Improvement' | 'Critical';
  summary: string;
}

export const PILLAR_WEIGHTS: Record<PillarScore['id'], number> = {
  mobile: 0.15,
  conversion: 0.3,
  social: 0.25,
  video: 0.15,
  local: 0.15
};

const STATUS_POINTS: Record<AuditStatus, number> = {
  Strong: 100,
  Present: 75,
  Weak: 40,
  Missing: 0,
  'Unable to determine': 50
};

/** Convert Local SEO audit items into a 0-100 pillar score. */
export function scoreLocalSeoItems(items: { status: AuditStatus }[]): number {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, i) => sum + (STATUS_POINTS[i.status] ?? 50), 0);
  return Math.round(total / items.length);
}

export function computePillarScores(extraction: WebsiteExtractionResult): PillarScore[] {
  const identity = extraction.identity || ({} as Record<string, any>);
  const meta = (extraction.meta || {}) as Record<string, any>;
  const auditItems = extraction.audit?.items || [];
  const contacts = identity.contacts || { phones: [], emails: [], addresses: [] };

  // 1. Mobile & On-Page SEO (15%)
  const hasMeta = Boolean(meta.metaDescription && meta.metaDescription.length > 20);
  const mobileScore = hasMeta ? 78 : 55;

  // 2. Conversion Architecture (30%)
  let conversionScore = 40;
  if (contacts.phones && contacts.phones.length > 0) conversionScore += 20;
  if (contacts.emails && contacts.emails.length > 0) conversionScore += 15;
  if (auditItems.some((i) => i.category === 'Conversions' && (i.status === 'Strong' || i.status === 'Present'))) {
    conversionScore += 15;
  }
  conversionScore = Math.min(conversionScore, 85);

  // 3. Social Proof & Authority (25%)
  let socialScore = 45;
  if (meta.reviewRating && meta.reviewRating >= 4.0) socialScore += 30;
  if (meta.reviewCount && meta.reviewCount > 10) socialScore += 15;
  if (identity.socials && Object.keys(identity.socials).length > 0) socialScore += 10;
  socialScore = Math.min(socialScore, 95);

  // 4. Video & Visual Ads (15%)
  const hasVideo = meta.hasVideoEmbeds || Boolean(meta.videoEmbeds && meta.videoEmbeds.length > 0);
  const videoScore = hasVideo ? 70 : 30;

  // 5. Local SEO & Google Business Presence (15%)
  const localItems = auditItems.filter((i) => i.category === 'Local SEO');
  let localScore: number;
  if (localItems.length > 0) {
    localScore = scoreLocalSeoItems(localItems);
  } else {
    // Identity-based fallback for synthetic/legacy extractions with no audit items.
    localScore = 0;
    if (identity.hasJsonLd) localScore += 25;
    if (contacts.phones && contacts.phones.length > 0) localScore += 20;
    if (contacts.addresses && contacts.addresses.length > 0) localScore += 20;
    if (identity.socials && Object.keys(identity.socials).length > 0) localScore += 20;
    if (identity.serviceAreas && identity.serviceAreas.length > 0) localScore += 15;
    localScore = Math.min(localScore, 100);
  }

  const mkStatus = (score: number, goodAt: number, okAt: number): PillarScore['status'] =>
    score > goodAt ? 'Good' : score > okAt ? 'Needs Improvement' : 'Critical';

  return [
    {
      id: 'conversion',
      category: 'Conversion Architecture',
      score: conversionScore,
      status: mkStatus(conversionScore, 70, 50),
      summary: 'CTA clarity, form friction, trust signals, and conversion-path strength.'
    },
    {
      id: 'video',
      category: 'Video & Visual Ads',
      score: videoScore,
      status: videoScore > 60 ? 'Good' : 'Critical',
      summary: 'Video content, visual proof, and short-form ad creative presence.'
    },
    {
      id: 'social',
      category: 'Social Proof & Authority',
      score: socialScore,
      status: socialScore > 75 ? 'Good' : 'Needs Improvement',
      summary: 'Review volume, ratings, testimonials, and platform authority.'
    },
    {
      id: 'mobile',
      category: 'Mobile & On-Page SEO',
      score: mobileScore,
      status: mobileScore > 70 ? 'Good' : 'Needs Improvement',
      summary: 'Mobile readiness, metadata, and on-page search fundamentals.'
    },
    {
      id: 'local',
      category: 'Local SEO & Google Business Presence',
      score: localScore,
      status: mkStatus(localScore, 70, 50),
      summary: 'Google Maps visibility, NAP consistency, review footprint, and local schema.'
    }
  ];
}

/** Weighted overall score (0-100) from pillar scores. */
export function computeOverallScore(pillars: PillarScore[]): number {
  const weighted = pillars.reduce((sum, p) => sum + p.score * PILLAR_WEIGHTS[p.id], 0);
  return Math.round(weighted);
}
