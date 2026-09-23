import { UserLicenseState } from '../monetization/types';
import { UserSettings } from '../settings/settingsStore';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  context: string; // e.g. 'EXTRACTOR', 'TAB_DETECTION', 'CRM_WEBHOOK', 'PDF_REPORT', 'EXPORT', 'PAYMENT', 'ADMIN'
  message: string;
  details?: Record<string, unknown> | string;
  url?: string;
  errorStack?: string;
}

export interface DiagnosticReport {
  generatedAt: string;
  extensionVersion: string;
  userAgent: string;
  license: UserLicenseState;
  settings: Partial<UserSettings>;
  storageStats: {
    savedProspectsCount: number;
    logsCount: number;
    errorsCount: number;
  };
  recentLogs: LogEntry[];
}
