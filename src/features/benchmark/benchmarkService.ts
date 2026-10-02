/**
 * Competitor benchmarking — run the SAME audit engine against 1-3
 * competitor URLs (fetched + parsed in the side panel) and compare
 * pillar-by-pillar against a saved prospect.
 */
import { extractFromUrl } from '../extractor/fetchExtractor';
import { computePillarScores, computeOverallScore, PillarScore } from '../reports/pillarScores';
import { normalizeDomain } from '../emailFinder/emailFinder';

export interface StoredPillar {
  id: string;
  category: string;
  score: number;
}

export interface CompetitorBenchmark {
  id: string;
  prospectId: string;
  competitorUrl: string;
  competitorName: string;
  pillarScores: StoredPillar[];
  overallScore: number;
  auditedAt: string;
}

export interface PillarGap {
  id: string;
  category: string;
  prospectScore: number;
  competitorScore: number;
  /** competitorScore - prospectScore; negative means the prospect is ahead. */
  delta: number;
  /** |delta| >= 15 → prospect is losing badly here. */
  significant: boolean;
}

export interface PitchAngle {
  title: string;
  angle: string;
  evidence: string;
}

const STORAGE_KEY = 'prospectlens_benchmarks';

function storageAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

export async function getBenchmarks(prospectId: string): Promise<CompetitorBenchmark[]> {
  let all: Record<string, CompetitorBenchmark[]> = {};
  if (storageAvailable()) {
    all = await new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (res) => resolve((res[STORAGE_KEY] as Record<string, CompetitorBenchmark[]> | undefined) || {}));
    });
  } else {
    try {
      all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      all = {};
    }
  }
  return all[prospectId] || [];
}

async function saveBenchmarks(prospectId: string, list: CompetitorBenchmark[]): Promise<void> {
  if (storageAvailable()) {
    const all: Record<string, CompetitorBenchmark[]> = await new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (res) => resolve((res[STORAGE_KEY] as Record<string, CompetitorBenchmark[]> | undefined) || {}));
    });
    all[prospectId] = list;
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: all }, () => resolve());
    });
  } else {
    let all: Record<string, CompetitorBenchmark[]> = {};
    try {
      all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      all = {};
    }
    all[prospectId] = list;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export async function deleteBenchmark(prospectId: string, benchmarkId: string): Promise<void> {
  const list = await getBenchmarks(prospectId);
  await saveBenchmarks(
    prospectId,
    list.filter((b) => b.id !== benchmarkId)
  );
}

/**
 * Run a full audit of a competitor URL with the shared extraction engine.
 */
export async function runCompetitorBenchmark(
  prospectId: string,
  competitorUrl: string
): Promise<CompetitorBenchmark> {
  const extraction = await extractFromUrl(competitorUrl);
  const pillars = computePillarScores(extraction);

  const benchmark: CompetitorBenchmark = {
    id: `bench_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    prospectId,
    competitorUrl,
    competitorName: extraction.identity.businessName || normalizeDomain(competitorUrl),
    pillarScores: pillars.map((p) => ({ id: p.id, category: p.category, score: p.score })),
    overallScore: computeOverallScore(pillars),
    auditedAt: new Date().toISOString()
  };

  const list = await getBenchmarks(prospectId);
  list.push(benchmark);
  await saveBenchmarks(prospectId, list);
  return benchmark;
}

/**
 * Pillar-by-pillar gap analysis. Positive delta = competitor is ahead.
 */
export function computeGaps(
  prospectPillars: StoredPillar[] | PillarScore[],
  competitorPillars: StoredPillar[] | PillarScore[]
): PillarGap[] {
  const prospectById = new Map(prospectPillars.map((p) => [p.id, p]));
  return competitorPillars.map((c) => {
    const prospect = prospectById.get(c.id);
    const prospectScore = prospect ? prospect.score : 0;
    const delta = c.score - prospectScore;
    return {
      id: c.id,
      category: c.category,
      prospectScore,
      competitorScore: c.score,
      delta,
      significant: Math.abs(delta) >= 15
    };
  });
}

/**
 * Generate 2-3 sales pitch angles from the gaps, in the opportunity-engine
 * voice (evidence → sales angle → deliverable).
 */
export function generatePitchAngles(
  gaps: PillarGap[],
  prospectName: string,
  competitorName: string
): PitchAngle[] {
  const angles: PitchAngle[] = [];

  const losing = gaps.filter((g) => g.delta >= 10).sort((a, b) => b.delta - a.delta);
  const winning = gaps.filter((g) => g.delta <= -15).sort((a, b) => a.delta - b.delta);

  const angleCopy: Record<string, { title: string; service: string }> = {
    local: {
      title: 'Own the Local Search Pack Before They Do',
      service: 'Google Business Profile optimization + review-generation system'
    },
    conversion: {
      title: 'Steal Their Clicks With a Higher-Converting Site',
      service: 'Conversion-focused landing page + instant lead capture'
    },
    social: {
      title: 'Out-Authority Them With Social Proof',
      service: 'Review flywheel + testimonial video ads'
    },
    video: {
      title: 'Dominate the Feed Where They Are Invisible',
      service: 'Short-form AI video ad package (15s, ready for Meta/TikTok)'
    },
    mobile: {
      title: 'Win the Mobile "Near Me" Search',
      service: 'Mobile-first SEO tune-up + speed optimization'
    }
  };

  for (const gap of losing.slice(0, 2)) {
    const copy = angleCopy[gap.id];
    if (!copy) continue;
    angles.push({
      title: copy.title,
      angle: `${competitorName} is outscoring ${prospectName} on ${gap.category} (${gap.competitorScore} vs ${gap.prospectScore}). That gap is costing real calls every week — closing it is the fastest path to taking their market share.`,
      evidence: `${gap.category}: ${competitorName} ${gap.competitorScore} vs ${prospectName} ${gap.prospectScore} (+${gap.delta} gap). Pitch: ${copy.service}.`
    });
  }

  if (winning.length > 0 && angles.length < 3) {
    const win = winning[0];
    angles.push({
      title: 'Protect the Lead You Already Have',
      angle: `${prospectName} is beating ${competitorName} on ${win.category} (${win.prospectScore} vs ${win.competitorScore}) — but ${competitorName} is closing in elsewhere. Lock in the advantage with ongoing optimization before the gap flips.`,
      evidence: `${win.category}: ${prospectName} ${win.prospectScore} vs ${competitorName} ${win.competitorScore}. Pitch: monthly growth retainer.`
    });
  }

  if (angles.length === 0) {
    angles.push({
      title: 'Neck and Neck — Differentiation Wins',
      angle: `${prospectName} and ${competitorName} score within striking distance on every pillar. The winner here will be whoever markets harder — video ads and review velocity are the tiebreakers.`,
      evidence: 'No pillar gap ≥ 10 points in either direction. Pitch: short-form video ads + review engine.'
    });
  }

  return angles.slice(0, 3);
}
