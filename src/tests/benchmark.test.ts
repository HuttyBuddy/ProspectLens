import { describe, it, expect } from 'vitest';
import {
  computeGaps,
  generatePitchAngles
} from '../features/benchmark/benchmarkService';
import { StoredPillar } from '../features/benchmark/benchmarkService';

const prospect: StoredPillar[] = [
  { id: 'conversion', category: 'Conversion Architecture', score: 75 },
  { id: 'video', category: 'Video & Visual Ads', score: 30 },
  { id: 'social', category: 'Social Proof & Authority', score: 55 },
  { id: 'mobile', category: 'Mobile & On-Page SEO', score: 55 },
  { id: 'local', category: 'Local SEO & Google Business Presence', score: 60 }
];

const competitor: StoredPillar[] = [
  { id: 'conversion', category: 'Conversion Architecture', score: 70 },
  { id: 'video', category: 'Video & Visual Ads', score: 85 },
  { id: 'social', category: 'Social Proof & Authority', score: 50 },
  { id: 'mobile', category: 'Mobile & On-Page SEO', score: 60 },
  { id: 'local', category: 'Local SEO & Google Business Presence', score: 90 }
];

describe('Competitor benchmarking', () => {
  it('computeGaps reports competitor-minus-prospect deltas', () => {
    const gaps = computeGaps(prospect, competitor);
    const video = gaps.find((g) => g.id === 'video')!;
    expect(video.delta).toBe(55); // 85 - 30
    expect(video.significant).toBe(true);

    const social = gaps.find((g) => g.id === 'social')!;
    expect(social.delta).toBe(-5); // prospect ahead
    expect(social.significant).toBe(false);
  });

  it('generatePitchAngles targets the biggest losing gaps first', () => {
    const gaps = computeGaps(prospect, competitor);
    const angles = generatePitchAngles(gaps, 'Apex Plumbing', 'Rival Plumbing');

    expect(angles.length).toBeGreaterThan(0);
    expect(angles.length).toBeLessThanOrEqual(3);
    // Biggest loss is video (+55) → video pitch should lead
    expect(angles[0].title).toContain('Feed');
    // All angles name both businesses
    for (const a of angles) {
      expect(a.angle).toContain('Apex Plumbing');
      expect(a.angle).toContain('Rival Plumbing');
      expect(a.evidence).toBeTruthy();
    }
  });

  it('generates a "protect the lead" angle when the prospect wins big somewhere', () => {
    const strongProspect: StoredPillar[] = prospect.map((p) =>
      p.id === 'social' ? { ...p, score: 95 } : p
    );
    const gaps = computeGaps(strongProspect, competitor);
    const angles = generatePitchAngles(gaps, 'Apex', 'Rival');
    expect(angles.some((a) => a.title.includes('Protect the Lead'))).toBe(true);
  });

  it('falls back to a differentiation angle when scores are neck-and-neck', () => {
    const gaps = computeGaps(prospect, prospect);
    const angles = generatePitchAngles(gaps, 'Apex', 'Rival');
    expect(angles.length).toBe(1);
    expect(angles[0].title).toContain('Neck and Neck');
  });
});
