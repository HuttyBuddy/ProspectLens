import { SavedProspect } from '../pipeline/pipelineTypes';
import { UserSettings } from '../settings/settingsStore';

export interface CrmWebhookPayload {
  event: 'prospect_discovered' | 'prospect_synced';
  prospect: {
    id: string;
    businessName: string;
    domain: string;
    websiteUrl: string;
    phone: string;
    email: string;
    location: string;
    category: string;
    status: string;
    chosenService: string;
    notes: string;
    dateDiscovered: string;
  };
  auditSummary: {
    overallScore: number;
    bottlenecks: string[];
    topOpportunities: string[];
  };
  outreach?: {
    channel: string;
    subject: string;
    body: string;
  };
  agency: {
    agencyName: string;
    consultantName: string;
    email: string;
    phone: string;
  };
  meta: {
    source: 'ProspectLens Chrome Extension';
    version: '1.0.0';
    timestamp: string;
  };
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  statusText?: string;
  message: string;
  timestamp: string;
  durationMs: number;
  payloadSent?: CrmWebhookPayload;
}
