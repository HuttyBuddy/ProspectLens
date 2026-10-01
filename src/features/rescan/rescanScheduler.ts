/**
 * Scheduled re-scan scheduler — pure storage + timing + diffing logic.
 *
 * Architecture note: MV3 service workers have no DOMParser, so the actual
 * re-fetch/parse/diff execution happens in the side panel (see
 * rescanRunner.ts). The service worker owns the clock (chrome.alarms),
 * marks schedules due, and pings any open side panel to run them; the
 * panel also checks for due schedules every time it opens, so nothing
 * is lost when the panel was closed at alarm time.
 */
import { SavedProspect } from '../pipeline/pipelineTypes';

export type RescanFrequency = 'daily' | 'weekly';

export interface RescanSchedule {
  id: string;
  prospectId: string;
  businessName: string;
  frequency: RescanFrequency;
  nextRunAt: string;
  createdAt: string;
}

export interface StoredPillarScore {
  id: string;
  category: string;
  score: number;
}

export interface ScanHistoryEntry {
  at: string;
  pillarScores: StoredPillarScore[];
  overallScore: number;
}

export interface PillarChange {
  id: string;
  category: string;
  previous: number;
  current: number;
  delta: number;
}

export interface ScanDiff {
  pillarChanges: PillarChange[];
  overallDelta: number;
  /** Significant: any pillar moved >= 10 or overall moved >= 5. */
  significant: boolean;
}

export const RESCAN_TICK_ALARM = 'prospectlens-rescan-tick';
export const SCHEDULES_KEY = 'prospectlens_rescan_schedules';
export const HISTORY_KEY = 'prospectlens_scan_history';
export const PILLAR_MOVE_THRESHOLD = 10;
export const OVERALL_MOVE_THRESHOLD = 5;

function storageAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

async function storageGet<T>(key: string, fallback: T): Promise<T> {
  if (storageAvailable()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => resolve((res[key] as T | undefined) ?? fallback));
    });
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function storageSet(key: string, value: unknown): Promise<void> {
  if (storageAvailable()) {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    });
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function frequencyToMs(frequency: RescanFrequency): number {
  return frequency === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
}

export function isScheduleDue(schedule: RescanSchedule, now: number = Date.now()): boolean {
  return new Date(schedule.nextRunAt).getTime() <= now;
}

export async function getSchedules(): Promise<RescanSchedule[]> {
  return storageGet<RescanSchedule[]>(SCHEDULES_KEY, []);
}

export async function getDueSchedules(now: number = Date.now()): Promise<RescanSchedule[]> {
  const schedules = await getSchedules();
  return schedules.filter((s) => isScheduleDue(s, now));
}

export async function createSchedule(
  prospect: SavedProspect,
  frequency: RescanFrequency
): Promise<RescanSchedule> {
  const schedules = await getSchedules();
  const existing = schedules.find((s) => s.prospectId === prospect.id);
  if (existing) {
    existing.frequency = frequency;
    existing.nextRunAt = new Date(Date.now() + frequencyToMs(frequency)).toISOString();
    await storageSet(SCHEDULES_KEY, schedules);
    return existing;
  }
  const schedule: RescanSchedule = {
    id: `rescan_${Date.now()}`,
    prospectId: prospect.id,
    businessName: prospect.businessName,
    frequency,
    nextRunAt: new Date(Date.now() + frequencyToMs(frequency)).toISOString(),
    createdAt: new Date().toISOString()
  };
  schedules.push(schedule);
  await storageSet(SCHEDULES_KEY, schedules);
  return schedule;
}

export async function cancelSchedule(scheduleId: string): Promise<void> {
  const schedules = await getSchedules();
  await storageSet(
    SCHEDULES_KEY,
    schedules.filter((s) => s.id !== scheduleId)
  );
}

export async function advanceSchedule(scheduleId: string): Promise<void> {
  const schedules = await getSchedules();
  const s = schedules.find((x) => x.id === scheduleId);
  if (s) {
    s.nextRunAt = new Date(Date.now() + frequencyToMs(s.frequency)).toISOString();
    await storageSet(SCHEDULES_KEY, schedules);
  }
}

export async function removeScheduleForProspect(prospectId: string): Promise<void> {
  const schedules = await getSchedules();
  await storageSet(
    SCHEDULES_KEY,
    schedules.filter((s) => s.prospectId !== prospectId)
  );
}

// ── Scan history ─────────────────────────────────────────────

export async function getScanHistory(prospectId: string): Promise<ScanHistoryEntry[]> {
  const all = await storageGet<Record<string, ScanHistoryEntry[]>>(HISTORY_KEY, {});
  return all[prospectId] || [];
}

export async function recordScanHistory(
  prospectId: string,
  pillarScores: StoredPillarScore[],
  overallScore: number
): Promise<void> {
  const all = await storageGet<Record<string, ScanHistoryEntry[]>>(HISTORY_KEY, {});
  const list = all[prospectId] || [];
  list.push({ at: new Date().toISOString(), pillarScores, overallScore });
  // Keep the last 24 scans per prospect.
  all[prospectId] = list.slice(-24);
  await storageSet(HISTORY_KEY, all);
}

// ── Diffing ──────────────────────────────────────────────────

export function diffPillarScores(
  previous: ScanHistoryEntry,
  currentPillars: StoredPillarScore[],
  currentOverall: number
): ScanDiff {
  const prevById = new Map(previous.pillarScores.map((p) => [p.id, p]));
  const pillarChanges: PillarChange[] = currentPillars.map((c) => {
    const prev = prevById.get(c.id);
    const previousScore = prev ? prev.score : c.score;
    return {
      id: c.id,
      category: c.category,
      previous: previousScore,
      current: c.score,
      delta: c.score - previousScore
    };
  });

  const overallDelta = currentOverall - previous.overallScore;
  const significant =
    pillarChanges.some((c) => Math.abs(c.delta) >= PILLAR_MOVE_THRESHOLD) ||
    Math.abs(overallDelta) >= OVERALL_MOVE_THRESHOLD;

  return { pillarChanges, overallDelta, significant };
}

/**
 * Build the initial history baseline from a saved prospect's stored
 * pillar snapshot (captured at save time).
 */
export async function ensureBaselineHistory(prospect: SavedProspect): Promise<void> {
  if (!prospect.pillarScores || prospect.pillarScores.length === 0) return;
  const history = await getScanHistory(prospect.id);
  if (history.length === 0) {
    await recordScanHistory(prospect.id, prospect.pillarScores, prospect.overallScore ?? 0);
  }
}
