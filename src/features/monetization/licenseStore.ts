import {
  UserLicenseState,
  SubscriptionTier,
  DEFAULT_LICENSE_STATE,
  FREE_TIER_SCAN_LIMIT,
  FREE_TIER_PROSPECT_LIMIT
} from './types';

const LICENSE_STORAGE_KEY = 'prospectlens_license_state';

export async function getLicenseState(): Promise<UserLicenseState> {
  let state = DEFAULT_LICENSE_STATE;

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    state = await new Promise<UserLicenseState>((resolve) => {
      chrome.storage.local.get([LICENSE_STORAGE_KEY], (res) => {
        const stored = res[LICENSE_STORAGE_KEY];
        resolve(stored ? { ...DEFAULT_LICENSE_STATE, ...stored } : DEFAULT_LICENSE_STATE);
      });
    });
  } else {
    try {
      const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
      if (raw) {
        state = { ...DEFAULT_LICENSE_STATE, ...JSON.parse(raw) };
      }
    } catch {
      state = DEFAULT_LICENSE_STATE;
    }
  }

  // Derive helper booleans
  state.isPro = state.tier === 'pro' || state.tier === 'agency';
  state.isAgency = state.tier === 'agency';
  state.scansMonthlyLimit = state.isPro ? Infinity : FREE_TIER_SCAN_LIMIT;
  state.savedProspectsLimit = state.isPro ? Infinity : FREE_TIER_PROSPECT_LIMIT;

  return state;
}

export async function saveLicenseState(state: UserLicenseState): Promise<void> {
  const updated: UserLicenseState = {
    ...state,
    isPro: state.tier === 'pro' || state.tier === 'agency',
    isAgency: state.tier === 'agency',
    scansMonthlyLimit: (state.tier === 'pro' || state.tier === 'agency') ? Infinity : FREE_TIER_SCAN_LIMIT,
    savedProspectsLimit: (state.tier === 'pro' || state.tier === 'agency') ? Infinity : FREE_TIER_PROSPECT_LIMIT
  };

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [LICENSE_STORAGE_KEY]: updated }, () => resolve());
    });
  } else {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(updated));
  }
}

/**
 * Checks if a scan can be performed and increments the counter if permitted.
 */
export async function recordScanUsage(): Promise<{ allowed: boolean; remaining: number; state: UserLicenseState }> {
  const state = await getLicenseState();

  if (state.isPro) {
    state.scansUsedThisMonth += 1;
    await saveLicenseState(state);
    return {
      allowed: true,
      remaining: Infinity,
      state
    };
  }

  if (state.scansUsedThisMonth >= state.scansMonthlyLimit) {
    return {
      allowed: false,
      remaining: 0,
      state
    };
  }

  state.scansUsedThisMonth += 1;
  await saveLicenseState(state);

  return {
    allowed: true,
    remaining: Math.max(0, state.scansMonthlyLimit - state.scansUsedThisMonth),
    state
  };
}

/**
 * Validates whether the user can save an additional prospect.
 */
export async function canSaveProspect(currentSavedCount: number): Promise<{ allowed: boolean; limit: number; isPro: boolean }> {
  const state = await getLicenseState();
  if (state.isPro) {
    return { allowed: true, limit: Infinity, isPro: true };
  }
  const allowed = currentSavedCount < state.savedProspectsLimit;
  return { allowed, limit: state.savedProspectsLimit, isPro: false };
}

/**
 * Switch or update subscription tier (Used in Settings and Upgrade Modal).
 */
export async function setSubscriptionTier(tier: SubscriptionTier): Promise<UserLicenseState> {
  const current = await getLicenseState();
  const updated: UserLicenseState = {
    ...current,
    tier,
    isPro: tier === 'pro' || tier === 'agency',
    isAgency: tier === 'agency',
    scansMonthlyLimit: (tier === 'pro' || tier === 'agency') ? Infinity : FREE_TIER_SCAN_LIMIT,
    savedProspectsLimit: (tier === 'pro' || tier === 'agency') ? Infinity : FREE_TIER_PROSPECT_LIMIT
  };
  await saveLicenseState(updated);
  return updated;
}

/**
 * Reset scan usage counter (useful for testing or monthly billing renewal).
 */
export async function resetUsage(): Promise<UserLicenseState> {
  const current = await getLicenseState();
  current.scansUsedThisMonth = 0;
  await saveLicenseState(current);
  return current;
}

/**
 * Set custom scan usage count (for admin/developer testing).
 */
export async function setScanUsageCount(count: number): Promise<UserLicenseState> {
  const current = await getLicenseState();
  current.scansUsedThisMonth = Math.max(0, count);
  await saveLicenseState(current);
  return current;
}
