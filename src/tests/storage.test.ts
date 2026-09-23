import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedProspects,
  saveProspect,
  updateProspectStatus,
  deleteProspect,
  computePipelineStats
} from '../features/pipeline/storageService';
import { SavedProspect } from '../features/pipeline/pipelineTypes';

describe('Prospect Pipeline Storage & Stats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves, retrieves, updates status, and deletes prospects', async () => {
    const mockProspect: SavedProspect = {
      id: 'test-1',
      businessName: 'Apex Roofing',
      domain: 'apexroofing.com',
      websiteUrl: 'https://apexroofing.com',
      category: 'Roofing Contractor',
      socials: {},
      dateDiscovered: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      notes: 'Initial test note',
      auditItems: [],
      opportunities: [],
      status: 'Ready to Contact'
    };

    await saveProspect(mockProspect);
    let list = await getSavedProspects();
    expect(list.length).toBe(1);
    expect(list[0].businessName).toBe('Apex Roofing');

    // Update status to 'Interested'
    await updateProspectStatus('test-1', 'Interested');
    list = await getSavedProspects();
    expect(list[0].status).toBe('Interested');

    // Compute stats
    const stats = computePipelineStats(list);
    expect(stats.total).toBe(1);
    expect(stats.interested).toBe(1);
    expect(stats.readyToContact).toBe(0);

    // Delete
    await deleteProspect('test-1');
    list = await getSavedProspects();
    expect(list.length).toBe(0);
  });
});
