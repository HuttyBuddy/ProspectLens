import { describe, it, expect, beforeEach } from 'vitest';
import {
  verifyAdminPasscode,
  isAdminAuthenticated,
  setAdminAuthenticated,
  lockAdminSession,
  updateAdminPasscode,
  resetAdminPasscodeToDefault,
  hashPasscode
} from '../features/admin/adminAuthService';

describe('Admin Authentication & Access Control', () => {
  beforeEach(async () => {
    localStorage.clear();
    await resetAdminPasscodeToDefault();
    await setAdminAuthenticated(false);
  });

  it('verifies default admin master passcode correctly', async () => {
    const isValid = await verifyAdminPasscode('admin2026');
    expect(isValid).toBe(true);
  });

  it('rejects incorrect passcodes', async () => {
    const isValid = await verifyAdminPasscode('wrongpassword123');
    expect(isValid).toBe(false);

    const emptyValid = await verifyAdminPasscode('');
    expect(emptyValid).toBe(false);
  });

  it('manages admin session authentication and immediate lock', async () => {
    expect(await isAdminAuthenticated()).toBe(false);

    await setAdminAuthenticated(true);
    expect(await isAdminAuthenticated()).toBe(true);

    await lockAdminSession();
    expect(await isAdminAuthenticated()).toBe(false);
  });

  it('enforces validation rules when updating master passcode', async () => {
    // Fails with wrong current passcode
    const failWrongCurrent = await updateAdminPasscode('wrongcurrent', 'newPasscode123');
    expect(failWrongCurrent.success).toBe(false);
    expect(failWrongCurrent.error).toContain('incorrect');

    // Fails if new passcode is too short (< 6 chars)
    const failShort = await updateAdminPasscode('admin2026', '123');
    expect(failShort.success).toBe(false);
    expect(failShort.error).toContain('at least 6 characters');

    // Succeeds with correct current and valid new passcode
    const success = await updateAdminPasscode('admin2026', 'securePass2026!');
    expect(success.success).toBe(true);

    // New passcode is now accepted
    expect(await verifyAdminPasscode('securePass2026!')).toBe(true);

    // Old default passcode is now rejected
    expect(await verifyAdminPasscode('admin2026')).toBe(false);
  });

  it('resets custom passcode back to default', async () => {
    await updateAdminPasscode('admin2026', 'customPasscode777');
    expect(await verifyAdminPasscode('customPasscode777')).toBe(true);

    await resetAdminPasscodeToDefault();
    expect(await verifyAdminPasscode('admin2026')).toBe(true);
    expect(await verifyAdminPasscode('customPasscode777')).toBe(false);
  });
});
