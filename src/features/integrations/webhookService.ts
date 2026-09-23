import { SavedProspect } from '../pipeline/pipelineTypes';
import { UserSettings } from '../settings/settingsStore';
import { CrmWebhookPayload, WebhookDeliveryResult } from './types';
import { isRestrictedProspect } from '../extractor/exclusionPolicy';
import { logInfo, logWarn, logError } from '../admin/loggerService';

/**
 * Formats a prospect into a universal JSON payload compatible with
 * GoHighLevel, Zapier Catch Hooks, Make.com, and HubSpot.
 */
export function formatCrmPayload(
  prospect: SavedProspect,
  settings: UserSettings
): CrmWebhookPayload {
  if (isRestrictedProspect(prospect.businessName, prospect.domain, prospect.category)) {
    throw new Error('Policy Violation: Excluded law and real estate businesses cannot be synced to CRM.');
  }

  // Derive bottlenecks from audit items
  const bottlenecks = (prospect.auditItems || [])
    .filter((item) => item.status === 'Missing' || item.status === 'Weak')
    .map((item) => item.label);

  const topOpportunities = (prospect.opportunities || [])
    .slice(0, 3)
    .map((opp) => opp.title);

  return {
    event: 'prospect_synced',
    prospect: {
      id: prospect.id,
      businessName: prospect.businessName,
      domain: prospect.domain,
      websiteUrl: prospect.websiteUrl,
      phone: prospect.phone || '',
      email: prospect.email || '',
      location: prospect.location || '',
      category: prospect.category,
      status: prospect.status,
      chosenService: prospect.chosenService || '',
      notes: prospect.notes || '',
      dateDiscovered: prospect.dateDiscovered
    },
    auditSummary: {
      overallScore: Math.round(75 - bottlenecks.length * 8),
      bottlenecks: bottlenecks.length > 0 ? bottlenecks : ['Missing short-form video ads', 'Untapped local review velocity'],
      topOpportunities: topOpportunities.length > 0 ? topOpportunities : ['AI Video Ads', 'Lead Nurturing Automation']
    },
    outreach: prospect.savedOutreach ? {
      channel: prospect.savedOutreach.channel,
      subject: prospect.savedOutreach.subject,
      body: prospect.savedOutreach.body
    } : undefined,
    agency: {
      agencyName: settings.companyName || 'Growth Agency',
      consultantName: settings.userName || 'Lead Consultant',
      email: settings.email || '',
      phone: settings.phone || ''
    },
    meta: {
      source: 'ProspectLens Chrome Extension',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Dispatches a prospect to the configured CRM webhook endpoint.
 */
export async function sendProspectToWebhook(
  prospect: SavedProspect,
  settings: UserSettings
): Promise<WebhookDeliveryResult> {
  const startTime = Date.now();
  const webhookUrl = settings.webhookUrl?.trim();

  if (!webhookUrl) {
    logWarn('CRM_WEBHOOK', 'Webhook dispatch skipped: No endpoint URL configured');
    return {
      success: false,
      message: 'No webhook endpoint configured. Set your GoHighLevel or Zapier webhook in Settings.',
      timestamp: new Date().toISOString(),
      durationMs: 0
    };
  }

  let payload: CrmWebhookPayload;
  try {
    payload = formatCrmPayload(prospect, settings);
  } catch (err: any) {
    logWarn('CRM_WEBHOOK', `Payload formatting failed: ${err.message}`, { prospect: prospect.businessName });
    return {
      success: false,
      message: err.message || 'Validation error while formatting CRM payload.',
      timestamp: new Date().toISOString(),
      durationMs: 0
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'ProspectLens-Webhook/1.0'
  };

  if (settings.webhookAuthHeader?.trim()) {
    headers['Authorization'] = settings.webhookAuthHeader.trim();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (response.ok || response.status === 200 || response.status === 201 || response.status === 202) {
      logInfo('CRM_WEBHOOK', `Successfully synced prospect to webhook (HTTP ${response.status})`, {
        prospect: prospect.businessName,
        destination: webhookUrl,
        durationMs
      });
      return {
        success: true,
        statusCode: response.status,
        statusText: response.statusText,
        message: `Successfully dispatched to CRM (${response.status} ${response.statusText || 'OK'})`,
        timestamp: new Date().toISOString(),
        durationMs,
        payloadSent: payload
      };
    } else {
      logError('CRM_WEBHOOK', `Webhook endpoint returned HTTP ${response.status}`, undefined, {
        statusCode: response.status,
        statusText: response.statusText,
        destination: webhookUrl
      });
      return {
        success: false,
        statusCode: response.status,
        statusText: response.statusText,
        message: `Webhook endpoint returned HTTP ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString(),
        durationMs,
        payloadSent: payload
      };
    }
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const isAbort = err.name === 'AbortError';
    logError('CRM_WEBHOOK', isAbort ? 'Webhook request timed out (12s)' : (err.message || 'Network error'), err, {
      destination: webhookUrl,
      durationMs
    });
    return {
      success: false,
      message: isAbort ? 'Webhook request timed out after 12s.' : (err.message || 'Network error delivering webhook.'),
      timestamp: new Date().toISOString(),
      durationMs,
      payloadSent: payload
    };
  }
}

/**
 * Sends a test ping to verify webhook connectivity without sending a real prospect.
 */
export async function testWebhookEndpoint(
  webhookUrl: string,
  authHeader?: string
): Promise<{ success: boolean; message: string; statusCode?: number }> {
  const trimmed = webhookUrl.trim();
  if (!trimmed) {
    return { success: false, message: 'Please enter a webhook URL.' };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authHeader?.trim()) {
      headers['Authorization'] = authHeader.trim();
    }

    const testPayload = {
      event: 'ping_test',
      source: 'ProspectLens Chrome Extension',
      message: 'Webhook connectivity test successful!',
      timestamp: new Date().toISOString()
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(trimmed, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok || res.status < 400) {
      return {
        success: true,
        statusCode: res.status,
        message: `Connected successfully! (HTTP ${res.status})`
      };
    } else {
      return {
        success: false,
        statusCode: res.status,
        message: `Endpoint returned HTTP ${res.status}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.name === 'AbortError' ? 'Ping timed out (8s).' : (err.message || 'Connection failed.')
    };
  }
}
