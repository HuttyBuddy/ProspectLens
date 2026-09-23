import { SavedProspect, PipelineStats, PipelineStatus } from './pipelineTypes';
import { isRestrictedProspect } from '../extractor/exclusionPolicy';

const STORAGE_KEY = 'prospectlens_saved_prospects';

export async function getSavedProspects(): Promise<SavedProspect[]> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        const list = res[STORAGE_KEY];
        resolve(Array.isArray(list) ? list : []);
      });
    });
  }

  // Fallback for non-extension or dev environment
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveProspect(prospect: SavedProspect): Promise<void> {
  if (isRestrictedProspect(prospect.businessName, prospect.domain, prospect.category)) {
    throw new Error('Compliance Violation: Law and estate businesses cannot be saved to the pipeline.');
  }

  const current = await getSavedProspects();
  const existingIndex = current.findIndex((p) => p.domain === prospect.domain || p.id === prospect.id);

  let updated: SavedProspect[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = {
      ...updated[existingIndex],
      ...prospect,
      lastActivity: new Date().toISOString()
    };
  } else {
    updated = [
      {
        ...prospect,
        id: prospect.id || `prospect_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        dateDiscovered: prospect.dateDiscovered || new Date().toISOString(),
        lastActivity: new Date().toISOString()
      },
      ...current
    ];
  }

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => resolve());
    });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export async function updateProspectStatus(id: string, status: PipelineStatus): Promise<void> {
  const current = await getSavedProspects();
  const target = current.find((p) => p.id === id);
  if (target) {
    target.status = status;
    target.lastActivity = new Date().toISOString();
    await overwriteProspects(current);
  }
}

export async function updateProspectNotes(id: string, notes: string): Promise<void> {
  const current = await getSavedProspects();
  const target = current.find((p) => p.id === id);
  if (target) {
    target.notes = notes;
    target.lastActivity = new Date().toISOString();
    await overwriteProspects(current);
  }
}

export async function deleteProspect(id: string): Promise<void> {
  const current = await getSavedProspects();
  const filtered = current.filter((p) => p.id !== id);
  await overwriteProspects(filtered);
}

async function overwriteProspects(prospects: SavedProspect[]): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: prospects }, () => resolve());
    });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
  }
}

export function computePipelineStats(prospects: SavedProspect[]): PipelineStats {
  return {
    total: prospects.length,
    readyToContact: prospects.filter((p) => p.status === 'Ready to Contact').length,
    contacted: prospects.filter((p) => p.status === 'Contacted' || p.status === 'Follow Up').length,
    interested: prospects.filter((p) => p.status === 'Interested' || p.status === 'Meeting' || p.status === 'Proposal').length,
    won: prospects.filter((p) => p.status === 'Won').length
  };
}
