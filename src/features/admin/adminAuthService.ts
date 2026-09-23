/**
 * Admin Authentication & Session Management Service
 * Gated administrative and developer sandbox access for ProspectLens.
 */

import { logInfo, logWarn } from './loggerService';

const STORAGE_KEY_AUTH_STATE = 'prospectlens_admin_auth_state';
const STORAGE_KEY_PASSCODE_HASH = 'prospectlens_admin_passcode_hash';
const DEFAULT_ADMIN_PASSCODE = 'admin2026';

/**
 * Computes SHA-256 hash using Web Crypto API with graceful fallback.
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const normalized = passcode.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Deterministic fallback hash for non-subtle test environments
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Checks if admin session is currently active and authenticated.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(STORAGE_KEY_AUTH_STATE);
      return data[STORAGE_KEY_AUTH_STATE] === true;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_AUTH_STATE) === 'true';
    }
  } catch {
    // default to unauthenticated on error
  }
  return false;
}

/**
 * Retrieves the currently active passcode hash.
 * If none set, returns hash of default passcode ('admin2026').
 */
export async function getActivePasscodeHash(): Promise<string> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(STORAGE_KEY_PASSCODE_HASH);
      if (data[STORAGE_KEY_PASSCODE_HASH]) {
        return data[STORAGE_KEY_PASSCODE_HASH];
      }
    } else if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_PASSCODE_HASH);
      if (stored) {
        return stored;
      }
    }
  } catch {
    // proceed to default
  }
  return hashPasscode(DEFAULT_ADMIN_PASSCODE);
}

/**
 * Validates the provided passcode against the stored hash.
 * Returns true if valid, false otherwise. Logs security audit events.
 */
export async function verifyAdminPasscode(inputPasscode: string): Promise<boolean> {
  const inputHash = await hashPasscode(inputPasscode);
  const targetHash = await getActivePasscodeHash();

  const isValid = inputHash === targetHash;

  if (isValid) {
    logInfo('ADMIN_AUTH', 'Admin authentication verified successfully');
  } else {
    logWarn('ADMIN_AUTH', 'Failed admin authentication attempt with incorrect passcode');
  }

  return isValid;
}

/**
 * Sets the admin session status.
 * If remember is false, auth state will only persist for this browser instance session.
 */
export async function setAdminAuthenticated(authenticated: boolean): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      if (authenticated) {
        await chrome.storage.local.set({ [STORAGE_KEY_AUTH_STATE]: true });
      } else {
        await chrome.storage.local.remove(STORAGE_KEY_AUTH_STATE);
      }
    }
    if (typeof localStorage !== 'undefined') {
      if (authenticated) {
        localStorage.setItem(STORAGE_KEY_AUTH_STATE, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH_STATE);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Locks the admin session immediately, revoking access and hiding the admin shield.
 */
export async function lockAdminSession(): Promise<void> {
  await setAdminAuthenticated(false);
  logInfo('ADMIN_AUTH', 'Admin session locked by user');
}

/**
 * Updates the admin master passcode after verifying the current passcode.
 */
export async function updateAdminPasscode(
  currentPasscode: string,
  newPasscode: string
): Promise<{ success: boolean; error?: string }> {
  const isCurrentValid = await verifyAdminPasscode(currentPasscode);
  if (!isCurrentValid) {
    return { success: false, error: 'Current passcode is incorrect.' };
  }

  if (!newPasscode || newPasscode.trim().length < 6) {
    return { success: false, error: 'New passcode must be at least 6 characters long.' };
  }

  const newHash = await hashPasscode(newPasscode);
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [STORAGE_KEY_PASSCODE_HASH]: newHash });
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PASSCODE_HASH, newHash);
    }
    logInfo('ADMIN_AUTH', 'Admin master passcode successfully updated');
    return { success: true };
  } catch (err: any) {
    logWarn('ADMIN_AUTH', `Failed to persist new passcode: ${err?.message}`);
    return { success: false, error: 'Could not save new passcode to storage.' };
  }
}

/**
 * Resets the admin passcode to default ('admin2026').
 */
export async function resetAdminPasscodeToDefault(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.remove(STORAGE_KEY_PASSCODE_HASH);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PASSCODE_HASH);
    }
    logInfo('ADMIN_AUTH', 'Admin passcode reset to system default');
  } catch {
    // Ignore
  }
}
