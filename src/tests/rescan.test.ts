import { describe, it, expect } from 'vitest';
import {
  diffPillarScores,
  isScheduleDue,
  frequencyToMs,
  PILLAR_MOVE_THRESHOLD,
  OVERALL_MOVE_THRESHOLD,
  ScanHistoryEntry
} from '../features/rescan/rescanScheduler';

const previous: ScanHistoryEntry = {
  at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  pillarScores: [
    { id: 'conversion', category: 'Conversion Architecture', score: 75 },
    { id: 'video', category: 'Video & Visual Ads', score: 30 },
    { id: 'social', category: 'Social Proof & Authority', score: 55 },
    { id: 'mobile', category: 'Mobile & On-Page SEO', score: 55 },
    { id: 'local', category: 'Local SEO & Google Business Presence', score: 60 }
  ],
  overallScore: 60
};

describe('Re-scan scheduler — diffing', () => {
  it('flags a pillar move >= 10 as significant', () => {
    const current = previous.pillarScores.map((p) =>
      p.id === 'local' ? { ...p, score: 75 } : p
    );
    const diff = diffPillarScores(previous, current, 61);
    expect(diff.significant).toBe(true);
    const local = diff.pillarChanges.find((c) => c.id === 'local')!;
    expect(local.delta).toBe(15);
  });

  it('flags an overall move >= 5 as significant even when no pillar moved 10', () => {
    const current = previous.pillarScores.map((p) =>
      p.id === 'conversion' ? { ...p, score: 80 } : p
    );
    const diff = diffPillarScores(previous, current, 66);
    expect(diff.pillarChanges.every((c) => Math.abs(c.delta) < PILLAR_MOVE_THRESHOLD)).toBe(true);
    expect(diff.overallDelta).toBe(6);
    expect(diff.significant).toBe(true);
  });

  it('does not flag small noise as significant', () => {
    const current = previous.pillarScores.map((p) =>
      p.id === 'social' ? { ...p, score: 57 } : p
    );
    const diff = diffPillarScores(previous, current, 61);
    expect(diff.significant).toBe(false);
    expect(OVERALL_MOVE_THRESHOLD).toBe(5);
  });

  it('handles negative deltas (score drops)', () => {
    const current = previous.pillarScores.map((p) =>
      p.id === 'video' ? { ...p, score: 10 } : p
    );
    const diff = diffPillarScores(previous, current, 55);
    const video = diff.pillarChanges.find((c) => c.id === 'video')!;
    expect(video.delta).toBe(-20);
    expect(diff.significant).toBe(true);
  });
});

describe('Re-scan scheduler — timing', () => {
  it('frequencyToMs converts daily/weekly correctly', () => {
    expect(frequencyToMs('daily')).toBe(24 * 60 * 60 * 1000);
    expect(frequencyToMs('weekly')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('isScheduleDue detects overdue schedules', () => {
    const overdue = {
      id: 's1',
      prospectId: 'p1',
      businessName: 'Apex',
      frequency: 'daily' as const,
      nextRunAt: new Date(Date.now() - 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
    const future = { ...overdue, nextRunAt: new Date(Date.now() + 3600000).toISOString() };
    expect(isScheduleDue(overdue)).toBe(true);
    expect(isScheduleDue(future)).toBe(false);
  });
});
