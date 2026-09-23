import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatCrmPayload, sendProspectToWebhook, testWebhookEndpoint } from '../features/integrations';
import { SavedProspect } from '../features/pipeline/pipelineTypes';
import { DEFAULT_SETTINGS } from '../features/settings/settingsStore';

describe('Agency CRM & Webhook Integration Engine', () => {
  const sampleProspect: SavedProspect = {
    id: 'summit-roofing-123',
    businessName: 'Summit Peak Roofing Co.',
    domain: 'summitpeakroofing.com',
    websiteUrl: 'https://summitpeakroofing.com',
    phone: '(303) 555-0194',
    email: 'contact@summitpeakroofing.com',
    location: 'Denver, CO',
    category: 'Roofing Contractor',
    status: 'Ready to Contact',
    chosenService: 'AI Video Advertising',
    dateDiscovered: '2026-09-22',
    lastActivity: '2026-09-22',
    notes: 'Great candidate for short-form video ads.',
    socials: { facebook: 'https://facebook.com/summitpeakroofing' },
    auditItems: [
      { id: '1', category: 'Conversions', label: 'Missing video commercials', status: 'Missing', evidence: '' },
      { id: '2', category: 'Trust', label: '5-star reviews present', status: 'Strong', evidence: '' }
    ],
    opportunities: [
      {
        id: 'opp-1',
        title: 'Short-Form AI Video Commercials',
        category: 'AI Video Advertising',
        priority: 'High',
        impact: 'High',
        difficulty: 'Easy',
        confidenceScore: 92,
        clientProblem: 'No video ads on social',
        recommendedSolution: '15s cinematic spot',
        whyThisBusiness: 'Great visual proof',
        expectedRevenueImpact: '+$4,000/mo',
        quickPitch: 'We storyboarded a video ad for your roofing company.'
      }
    ],
    savedOutreach: {
      channel: 'Email',
      subject: 'Video idea for Summit Peak Roofing Co.',
      body: 'Hi Summit Peak team, loved your project gallery...',
      wordCount: 45
    }
  };

  it('formats universal CRM JSON payload compatible with GoHighLevel and Zapier', () => {
    const payload = formatCrmPayload(sampleProspect, DEFAULT_SETTINGS);

    expect(payload.event).toBe('prospect_synced');
    expect(payload.prospect.businessName).toBe('Summit Peak Roofing Co.');
    expect(payload.prospect.phone).toBe('(303) 555-0194');
    expect(payload.prospect.email).toBe('contact@summitpeakroofing.com');
    expect(payload.prospect.chosenService).toBe('AI Video Advertising');
    expect(payload.outreach?.channel).toBe('Email');
    expect(payload.outreach?.subject).toContain('Summit Peak Roofing');
    expect(payload.agency.agencyName).toBe(DEFAULT_SETTINGS.companyName);
    expect(payload.meta.source).toBe('ProspectLens Chrome Extension');
  });

  it('strictly blocks law and estate businesses from webhook dispatch', () => {
    const lawProspect: SavedProspect = {
      ...sampleProspect,
      businessName: 'Apex Litigation & Injury Law Firm',
      domain: 'apexinjurylaw.com',
      category: 'Law & Legal Services'
    };

    expect(() => formatCrmPayload(lawProspect, DEFAULT_SETTINGS)).toThrowError(
      /Policy Violation/
    );
  });

  it('returns clean error if webhook URL is not configured', async () => {
    const emptySettings = { ...DEFAULT_SETTINGS, webhookUrl: '' };
    const res = await sendProspectToWebhook(sampleProspect, emptySettings);

    expect(res.success).toBe(false);
    expect(res.message).toContain('No webhook endpoint configured');
  });

  it('successfully dispatches prospect payload over mock fetch', async () => {
    const settingsWithWebhook = {
      ...DEFAULT_SETTINGS,
      webhookUrl: 'https://services.leadconnectorhq.com/hooks/mock-inbound-webhook',
      webhookAuthHeader: 'Bearer ghl-test-token-123'
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ status: 'success' })
    });
    global.fetch = mockFetch;

    const res = await sendProspectToWebhook(sampleProspect, settingsWithWebhook);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe(settingsWithWebhook.webhookUrl);
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers['Authorization']).toBe('Bearer ghl-test-token-123');
    expect(calledOptions.headers['Content-Type']).toBe('application/json');

    const sentBody = JSON.parse(calledOptions.body);
    expect(sentBody.prospect.businessName).toBe('Summit Peak Roofing Co.');
    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(200);
  });

  it('executes webhook test ping endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200
    });
    global.fetch = mockFetch;

    const testRes = await testWebhookEndpoint('https://hooks.zapier.com/hooks/catch/123/abc');
    expect(testRes.success).toBe(true);
    expect(testRes.statusCode).toBe(200);
  });
});
