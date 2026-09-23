import { AuditItem } from '../extractor/types';
import { ServiceOpportunity } from '../opportunities/opportunityTypes';
import { OutreachMessage } from '../outreach/outreachGenerator';

export type PipelineStatus =
  | 'New'
  | 'Researching'
  | 'Ready to Contact'
  | 'Contacted'
  | 'Follow Up'
  | 'Interested'
  | 'Meeting'
  | 'Proposal'
  | 'Won'
  | 'Lost';

export const PIPELINE_STATUSES: PipelineStatus[] = [
  'New',
  'Researching',
  'Ready to Contact',
  'Contacted',
  'Follow Up',
  'Interested',
  'Meeting',
  'Proposal',
  'Won',
  'Lost'
];

export interface SavedProspect {
  id: string; // Unique ID (e.g. domain or uuid)
  businessName: string;
  domain: string;
  websiteUrl: string;
  phone?: string;
  email?: string;
  location?: string;
  category: string;
  socials: Record<string, string | undefined>;
  dateDiscovered: string;
  lastActivity: string;
  notes: string;
  auditItems: AuditItem[];
  opportunities: ServiceOpportunity[];
  chosenService?: string;
  savedOutreach?: OutreachMessage;
  status: PipelineStatus;
}

export interface PipelineFilterOptions {
  searchQuery?: string;
  status?: PipelineStatus | 'All';
  category?: string | 'All';
}

export interface PipelineStats {
  total: number;
  readyToContact: number;
  contacted: number;
  interested: number;
  won: number;
}
