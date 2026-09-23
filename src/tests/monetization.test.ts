import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLicenseState,
  recordScanUsage,
  canSaveProspect,
  setSubscriptionTier,
  resetUsage,
  saveLicenseState
} from '../features/monetization/licenseStore';
import { FREE_TIER_SCAN_LIMIT, FREE_TIER_PROSPECT_LIMIT } from '../features/monetization/types';

describe('ProspectLens Monetization & Feature Gating Store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with free tier defaults and active limits', async () => {
    const license = await getLicenseState();
    expect(license.tier).toBe('free');
    expect(license.isPro).toBe(false);
    expect(license.scansMonthlyLimit).toBe(FREE_TIER_SCAN_LIMIT);
    expect(license.savedProspectsLimit).toBe(FREE_TIER_PROSPECT_LIMIT);
  });

  it('increments scan usage on free tier until limit is reached', async () => {
    // Reset to 0
    await resetUsage();
    let res = await recordScanUsage();
    expect(res.allowed).toBe(true);
    expect(res.state.scansUsedThisMonth).toBe(1);

    // Set to limit (10)
    const state = await getLicenseState();
    state.scansUsedThisMonth = 10;
    await saveLicenseState(state);

    // 11th scan should be rejected
    const blockedRes = await recordScanUsage();
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });

  it('unlocks unlimited scans when upgraded to pro plan', async () => {
    const proState = await setSubscriptionTier('pro');
    expect(proState.tier).toBe('pro');
    expect(proState.isPro).toBe(true);
    expect(proState.scansMonthlyLimit).toBe(Infinity);
    expect(proState.savedProspectsLimit).toBe(Infinity);

    // Even with 50 scans, it remains allowed
    proState.scansUsedThisMonth = 50;
    await saveLicenseState(proState);

    const res = await recordScanUsage();
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(Infinity);
  });

  it('enforces prospect storage limits for free vs pro tier', async () => {
    await setSubscriptionTier('free');
    const freeCheckUnder = await canSaveProspect(3);
    expect(freeCheckUnder.allowed).toBe(true);

    const freeCheckOver = await canSaveProspect(5);
    expect(freeCheckOver.allowed).toBe(false);
    expect(freeCheckOver.limit).toBe(5);

    await setSubscriptionTier('pro');
    const proCheck = await canSaveProspect(50);
    expect(proCheck.allowed).toBe(true);
    expect(proCheck.isPro).toBe(true);
  });

  it('resets usage counter when billing cycle or testing reset is invoked', async () => {
    await setSubscriptionTier('free');
    const state = await getLicenseState();
    state.scansUsedThisMonth = 8;
    await saveLicenseState(state);

    const resetState = await resetUsage();
    expect(resetState.scansUsedThisMonth).toBe(0);
  });

  it('syncs payment status safely in testing/non-browser environment', async () => {
    const { syncPaymentStatus } = await import('../features/monetization/paymentService');
    await setSubscriptionTier('free');
    const syncFree = await syncPaymentStatus();
    expect(syncFree.paid).toBe(false);
    expect(syncFree.tier).toBe('free');

    await setSubscriptionTier('pro');
    const syncPro = await syncPaymentStatus();
    expect(syncPro.paid).toBe(true);
    expect(syncPro.tier).toBe('pro');
  });

  it('handles stripe checkout fallback safely', async () => {
    const { openStripeCheckout } = await import('../features/monetization/paymentService');
    const checkoutRes = await openStripeCheckout('pro');
    expect(checkoutRes.success).toBe(true);
    expect(checkoutRes.fallbackUrl).toContain('extensionpay.com/extension/prospectlens');
  });
});
