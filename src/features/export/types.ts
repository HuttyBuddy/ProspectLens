export type ExportFormat = 'csv' | 'tsv';

export type ExportPreset = 'instantly' | 'full_audit' | 'executive';

export interface ExportPresetConfig {
  id: ExportPreset;
  name: string;
  badge: string;
  description: string;
  recommendedFor: string;
  columns: string[];
}

export interface ProspectAuditMetrics {
  overallHealthScore: number;
  mobileSeoScore: number;
  conversionScore: number;
  socialScore: number;
  videoScore: number;
  topBottleneck: string;
  recommendedService: string;
  estimatedRetainerValue: string;
  emailSubject: string;
  emailBody: string;
  smsHook: string;
  videoAdHook: string;
}

export interface ExportOptions {
  preset: ExportPreset;
  format: ExportFormat;
  scope: 'filtered' | 'all';
  includeAuditScores?: boolean;
  includeOutreach?: boolean;
  filename?: string;
}

export const EXPORT_PRESETS: ExportPresetConfig[] = [
  {
    id: 'instantly',
    name: 'Cold Outreach (Instantly / Smartlead / Apollo)',
    badge: 'RECOMMENDED',
    description: 'Optimized columns and personalized variables for direct CSV import into cold email senders.',
    recommendedFor: 'Instantly.ai, Smartlead.ai, Apollo.io, Lemlist',
    columns: [
      'Email',
      'First Name',
      'Company Name',
      'Website',
      'Phone',
      'Location',
      'Industry',
      'Audit_Score',
      'Top_Bottleneck',
      'Recommended_Service',
      'Personalized_Subject',
      'Personalized_Email_Body',
      'SMS_Hook'
    ]
  },
  {
    id: 'full_audit',
    name: 'Full Audit Intelligence (All 26+ Columns)',
    badge: 'COMPREHENSIVE',
    description: 'Complete data export with 4-pillar audit scores, bottleneck diagnostics, financials, and outreach scripts.',
    recommendedFor: 'Deep Analysis, Google Sheets, AirTable, Custom Databases',
    columns: [
      'Business Name',
      'Domain',
      'Website URL',
      'Phone',
      'Email',
      'City / Location',
      'Category / Industry',
      'Pipeline Status',
      'Date Discovered',
      'Overall Health Score',
      'Mobile & SEO Score',
      'Conversion Architecture Score',
      'Social Proof Score',
      'Video Creative Score',
      'Primary Bottleneck',
      'Recommended Service Pitch',
      'Est Retainer Value',
      'Cold Email Subject',
      'Cold Email Body',
      'SMS Hook',
      'Video Ad Hook',
      'Facebook URL',
      'Instagram URL',
      'LinkedIn URL',
      'YouTube URL',
      'Internal Notes'
    ]
  },
  {
    id: 'executive',
    name: 'Executive CRM Pipeline',
    badge: 'PIPELINE',
    description: 'Streamlined overview for tracking deal stages, contact methods, and estimated revenue.',
    recommendedFor: 'Executive Reviews, High-Level Sales Meetings, Excel Spreadsheets',
    columns: [
      'Company Name',
      'Website',
      'Primary Phone',
      'Primary Email',
      'Location',
      'Industry',
      'Pipeline Status',
      'Audit Health Score',
      'Primary Opportunity',
      'Est Retainer Value',
      'Discovered Date'
    ]
  }
];
