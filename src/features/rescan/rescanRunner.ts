/**
 * Re-scan execution engine. Runs in the side panel (a DOM-capable
 * context) because MV3 service workers cannot parse HTML.
 *
 * Called on panel open and whenever the service worker's rescan alarm
 * fires while the panel is open.
 */
import { extractFromUrl } from '../extractor/fetchExtractor';
import { computePillarScores, computeOverallScore } from '../reports/pillarScores';
import { getSavedProspects } from '../pipeline/storageService';
import {
  getDueSchedules,
  advanceSchedule,
  removeScheduleForProspect,
  getScanHistory,
  recordScanHistory,
  ensureBaselineHistory,
  diffPillarScores,
  ScanDiff,
  StoredPillarScore
} from './rescanScheduler';

export interface RescanRunResult {
  scheduleId: string;
  businessName: string;
  success: boolean;
  diff?: ScanDiff;
  error?: string;
}

function notificationIcon(): string {
  return 'icons/icon-48.png';
}

export async function fireChangeNotification(
  businessName: string,
  diff: ScanDiff
): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.notifications) return;

  const movers = diff.pillarChanges
    .filter((c) => Math.abs(c.delta) >= 5)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)
    .map((c) => `${c.category}: ${c.previous} → ${c.current} (${c.delta > 0 ? '+' : ''}${c.delta})`);

  const lines = movers.length > 0 ? movers : [`Overall score ${diff.overallDelta > 0 ? '+' : ''}${diff.overallDelta}`];

  await new Promise<void>((resolve) => {
    chrome.notifications.create(
      `rescan_${Date.now()}`,
      {
        type: 'basic',
        iconUrl: notificationIcon(),
        title: `ProspectLens: ${businessName} score changed`,
        message: lines.join('\n'),
        priority: 1
      },
      () => resolve()
    );
  });
}

export async function runDueRescans(): Promise<RescanRunResult[]> {
  const due = await getDueSchedules();
  if (due.length === 0) return [];

  const prospects = await getSavedProspects();
  const results: RescanRunResult[] = [];

  for (const schedule of due) {
    const prospect = prospects.find((p) => p.id === schedule.prospectId);
    if (!prospect) {
      // Prospect deleted — drop the schedule.
      await removeScheduleForProspect(schedule.prospectId);
      continue;
    }

    try {
      await ensureBaselineHistory(prospect);

      const extraction = await extractFromUrl(prospect.websiteUrl);
      const pillars = computePillarScores(extraction);
      const overall = computeOverallScore(pillars);
      const stored: StoredPillarScore[] = pillars.map((p) => ({
        id: p.id,
        category: p.category,
        score: p.score
      }));

      const history = await getScanHistory(prospect.id);
      const previous = history[history.length - 1];

      let diff: ScanDiff | undefined;
      if (previous) {
        diff = diffPillarScores(previous, stored, overall);
        if (diff.significant) {
          await fireChangeNotification(prospect.businessName, diff);
        }
      }

      await recordScanHistory(prospect.id, stored, overall);
      results.push({ scheduleId: schedule.id, businessName: prospect.businessName, success: true, diff });
    } catch (e) {
      results.push({
        scheduleId: schedule.id,
        businessName: prospect.businessName,
        success: false,
        error: e instanceof Error ? e.message : 'Re-scan failed.'
      });
    } finally {
      // Always advance so a failing schedule doesn't spam retries every open.
      await advanceSchedule(schedule.id);
    }
  }

  return results;
}
