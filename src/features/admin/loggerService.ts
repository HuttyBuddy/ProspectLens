import { LogEntry, LogLevel, DiagnosticReport } from './types';
import { UserLicenseState } from '../monetization/types';
import { UserSettings } from '../settings/settingsStore';

const LOGS_STORAGE_KEY = 'prospectlens_system_logs';
const MAX_LOG_ENTRIES = 150;

// In-memory cache for fast read/writes
let memoryLogs: LogEntry[] = [];
let isInitialized = false;

async function loadPersistedLogs(): Promise<LogEntry[]> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([LOGS_STORAGE_KEY], (res) => {
        const stored = res[LOGS_STORAGE_KEY];
        resolve(Array.isArray(stored) ? stored : []);
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(LOGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

async function persistLogs(logs: LogEntry[]): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [LOGS_STORAGE_KEY]: logs }, () => resolve());
    });
  } else {
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Ignore quota errors in constrained environments
    }
  }
}

/**
 * Initializes logs cache from storage.
 */
export async function initLogger(): Promise<void> {
  if (isInitialized) return;
  memoryLogs = await loadPersistedLogs();
  isInitialized = true;
}

/**
 * Appends a log entry to the circular buffer and persists to storage.
 */
export async function addLog(
  level: LogLevel,
  context: string,
  message: string,
  details?: Record<string, unknown> | string,
  error?: Error | unknown,
  url?: string
): Promise<LogEntry> {
  if (!isInitialized) {
    await initLogger();
  }

  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();

  let errorStack: string | undefined;
  if (error instanceof Error) {
    errorStack = error.stack;
    if (!message) message = error.message;
  } else if (typeof error === 'string') {
    errorStack = error;
  }

  const entry: LogEntry = {
    id,
    timestamp,
    level,
    context: context.toUpperCase(),
    message,
    details: details ? (typeof details === 'object' ? details : { raw: details }) : undefined,
    url,
    errorStack
  };

  // Add to head of memory logs and keep under limit
  memoryLogs.unshift(entry);
  if (memoryLogs.length > MAX_LOG_ENTRIES) {
    memoryLogs = memoryLogs.slice(0, MAX_LOG_ENTRIES);
  }

  // Print formatted to browser console
  const consolePrefix = `[ProspectLens][${entry.context}][${entry.level}]`;
  if (level === 'ERROR') {
    console.error(consolePrefix, message, details || '', error || '');
  } else if (level === 'WARN') {
    console.warn(consolePrefix, message, details || '');
  } else if (level === 'DEBUG') {
    console.debug(consolePrefix, message, details || '');
  } else {
    console.log(consolePrefix, message, details || '');
  }

  // Asynchronously persist
  persistLogs(memoryLogs).catch(() => {});

  return entry;
}

export function logInfo(context: string, message: string, details?: any, url?: string) {
  return addLog('INFO', context, message, details, undefined, url);
}

export function logWarn(context: string, message: string, details?: any, url?: string) {
  return addLog('WARN', context, message, details, undefined, url);
}

export function logError(context: string, message: string, error?: any, details?: any, url?: string) {
  return addLog('ERROR', context, message, details, error, url);
}

export function logDebug(context: string, message: string, details?: any, url?: string) {
  return addLog('DEBUG', context, message, details, undefined, url);
}

/**
 * Retrieves all stored system log entries.
 */
export async function getLogs(): Promise<LogEntry[]> {
  if (!isInitialized) {
    await initLogger();
  }
  return [...memoryLogs];
}

/**
 * Clears all stored system log entries.
 */
export async function clearLogs(): Promise<void> {
  memoryLogs = [];
  isInitialized = true;
  await persistLogs([]);
}

/**
 * Compiles a structured diagnostic report object.
 */
export async function buildDiagnosticReport(
  license: UserLicenseState,
  settings: UserSettings,
  savedProspectsCount: number
): Promise<DiagnosticReport> {
  const logs = await getLogs();
  const errorsCount = logs.filter((l) => l.level === 'ERROR').length;

  return {
    generatedAt: new Date().toISOString(),
    extensionVersion: '1.0.0',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Environment',
    license,
    settings: {
      servicesSold: settings.servicesSold,
      pricingMode: settings.pricingMode,
      agencyName: settings.agencyName,
      webhookPlatform: settings.webhookPlatform,
      webhookUrl: settings.webhookUrl ? '[CONFIGURED]' : '[NONE]'
    },
    storageStats: {
      savedProspectsCount,
      logsCount: logs.length,
      errorsCount
    },
    recentLogs: logs
  };
}

/**
 * Triggers browser download of the diagnostic report JSON file.
 */
export function downloadDiagnosticReport(report: DiagnosticReport): void {
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `prospectlens-diagnostic-report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the diagnostic report JSON string to the clipboard.
 */
export async function copyDiagnosticReportToClipboard(report: DiagnosticReport): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(report, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(jsonStr);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sets up global unhandled error listeners in window.
 */
export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    addLog(
      'ERROR',
      'UNHANDLED_EXCEPTION',
      event.message || 'Unknown window error',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      },
      event.error,
      window.location.href
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    addLog(
      'ERROR',
      'UNHANDLED_PROMISE_REJECTION',
      event.reason?.message || String(event.reason) || 'Promise rejected without error message',
      undefined,
      event.reason,
      window.location.href
    );
  });
}
