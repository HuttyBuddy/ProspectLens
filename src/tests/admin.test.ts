import { describe, it, expect, beforeEach } from 'vitest';
import {
  addLog,
  getLogs,
  clearLogs,
  logInfo,
  logWarn,
  logError,
  buildDiagnosticReport
} from '../features/admin/loggerService';
import { DEFAULT_LICENSE_STATE } from '../features/monetization/types';
import { DEFAULT_SETTINGS } from '../features/settings/settingsStore';
import { setScanUsageCount, setSubscriptionTier } from '../features/monetization/licenseStore';

describe('Admin Panel & Diagnostics Logger', () => {
  beforeEach(async () => {
    await clearLogs();
  });

  it('records log entries with correct level, context, and timestamp', async () => {
    await logInfo('EXTRACTOR', 'Page scan started', { url: 'https://testroofing.com' });
    await logWarn('TAB_DETECTION', 'No active tab in current window, fell back to last focused');
    await logError(
      'CRM_WEBHOOK',
      'Webhook connection timeout',
      new Error('ETIMEDOUT 5000ms'),
      { destination: 'https://hooks.zapier.com' }
    );

    const logs = await getLogs();
    expect(logs.length).toBe(3);

    // Latest is at index 0 (unshift)
    const errLog = logs[0];
    expect(errLog.level).toBe('ERROR');
    expect(errLog.context).toBe('CRM_WEBHOOK');
    expect(errLog.message).toBe('Webhook connection timeout');
    expect(errLog.errorStack).toContain('ETIMEDOUT');

    const infoLog = logs[2];
    expect(infoLog.level).toBe('INFO');
    expect(infoLog.context).toBe('EXTRACTOR');
  });

  it('maintains circular buffer under maximum entries', async () => {
    // Add 160 logs (limit is 150)
    for (let i = 0; i < 160; i++) {
      await logInfo('STRESS_TEST', `Message ${i}`);
    }

    const logs = await getLogs();
    expect(logs.length).toBe(150);
    // Newest is index 0
    expect(logs[0].message).toBe('Message 159');
  });

  it('clears all logs on clearLogs() call', async () => {
    await logInfo('TEST', 'Test log');
    expect((await getLogs()).length).toBe(1);

    await clearLogs();
    expect((await getLogs()).length).toBe(0);
  });

  it('compiles a structured diagnostic report object with license and stats', async () => {
    await logInfo('BOOT', 'Extension loaded');
    await logError('PAYMENT', 'Stripe checkout canceled by user');

    const report = await buildDiagnosticReport(
      { ...DEFAULT_LICENSE_STATE, tier: 'pro', isPro: true },
      DEFAULT_SETTINGS,
      5
    );

    expect(report.extensionVersion).toBe('1.0.0');
    expect(report.license.tier).toBe('pro');
    expect(report.storageStats.savedProspectsCount).toBe(5);
    expect(report.storageStats.logsCount).toBe(2);
    expect(report.storageStats.errorsCount).toBe(1);
    expect(report.recentLogs.length).toBe(2);
  });

  it('allows admin to set scan usage count and subscription tier', async () => {
    const updatedTier = await setSubscriptionTier('agency');
    expect(updatedTier.tier).toBe('agency');
    expect(updatedTier.isAgency).toBe(true);
    expect(updatedTier.isPro).toBe(true);

    const updatedScans = await setScanUsageCount(8);
    expect(updatedScans.scansUsedThisMonth).toBe(8);
  });
});
