import { UserLicenseState, SubscriptionTier } from './types';
import { getLicenseState, setSubscriptionTier } from './licenseStore';

export const DEFAULT_EXTENSIONPAY_ID = 'prospectlens';

export interface PaymentStatusResult {
  paid: boolean;
  tier: SubscriptionTier;
  planNickname?: string | null;
  email?: string | null;
  paidAt?: Date | null;
  updatedLicense?: UserLicenseState;
}

let extpayInstance: any = null;

/**
 * Safely retrieves or initializes the ExtPay client instance.
 * Gracefully returns null if running outside of a browser extension.
 */
export async function getExtPayClient(extensionId: string = DEFAULT_EXTENSIONPAY_ID): Promise<any> {
  if (extpayInstance) return extpayInstance;

  // Verify browser extension environment exists with chrome.runtime
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    return null;
  }

  try {
    const ExtPayModule = await import('extpay');
    const ExtPay = (ExtPayModule as any).default || ExtPayModule;
    extpayInstance = ExtPay(extensionId);
    return extpayInstance;
  } catch (err) {
    console.warn('[ProspectLens] Could not initialize ExtPay client:', err);
    return null;
  }
}

/**
 * Initializes the background worker listener for ExtensionPay.
 * Must be invoked inside background/serviceWorker.ts.
 */
export async function initBackgroundPaymentListener(extensionId: string = DEFAULT_EXTENSIONPAY_ID): Promise<void> {
  const client = await getExtPayClient(extensionId);
  if (client?.startBackground) {
    try {
      client.startBackground();
      console.log('[ProspectLens] ExtPay background listener registered.');
    } catch (err) {
      console.warn('[ProspectLens] Failed to start ExtPay background:', err);
    }
  }
}

/**
 * Synchronizes user payment status from ExtensionPay / Stripe with the local license store.
 */
export async function syncPaymentStatus(extensionId: string = DEFAULT_EXTENSIONPAY_ID): Promise<PaymentStatusResult> {
  const currentLicense = await getLicenseState();
  const client = await getExtPayClient(extensionId);

  if (!client) {
    // Return current local state if ExtPay is not available (e.g., in dev/test)
    return {
      paid: currentLicense.isPro,
      tier: currentLicense.tier,
      updatedLicense: currentLicense
    };
  }

  try {
    const user = await client.getUser();

    if (user.paid) {
      const planName = (user.plan?.nickname || '').toLowerCase();
      const detectedTier: SubscriptionTier = planName.includes('agency') ? 'agency' : 'pro';

      const updatedLicense = await setSubscriptionTier(detectedTier);
      return {
        paid: true,
        tier: detectedTier,
        planNickname: user.plan?.nickname || null,
        email: user.email,
        paidAt: user.paidAt,
        updatedLicense
      };
    } else {
      // If user was paid before through live Stripe and is no longer active, revert to free
      if (currentLicense.isPro && !user.paid) {
        const updatedLicense = await setSubscriptionTier('free');
        return {
          paid: false,
          tier: 'free',
          updatedLicense
        };
      }
      return {
        paid: false,
        tier: currentLicense.tier,
        updatedLicense: currentLicense
      };
    }
  } catch (err) {
    console.warn('[ProspectLens] Failed to sync payment status with ExtensionPay:', err);
    return {
      paid: currentLicense.isPro,
      tier: currentLicense.tier,
      updatedLicense: currentLicense
    };
  }
}

/**
 * Opens the ExtensionPay hosted Stripe checkout page for the specified plan.
 */
export async function openStripeCheckout(
  tier: 'pro' | 'agency' = 'pro',
  extensionId: string = DEFAULT_EXTENSIONPAY_ID
): Promise<{ success: boolean; fallbackUrl?: string }> {
  const client = await getExtPayClient(extensionId);

  if (client?.openPaymentPage) {
    try {
      await client.openPaymentPage(tier);
      return { success: true };
    } catch (err) {
      console.warn('[ProspectLens] ExtPay openPaymentPage error, opening fallback URL:', err);
    }
  }

  // Fallback direct URL if extension popup blocks script
  const fallbackUrl = `https://extensionpay.com/extension/${extensionId}`;
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url: fallbackUrl });
  } else if (typeof window !== 'undefined') {
    window.open(fallbackUrl, '_blank');
  }

  return { success: true, fallbackUrl };
}

/**
 * Opens the Stripe customer portal to manage subscription, cancel, or update payment card.
 */
export async function openBillingPortal(extensionId: string = DEFAULT_EXTENSIONPAY_ID): Promise<void> {
  const client = await getExtPayClient(extensionId);

  if (client?.openLoginPage) {
    try {
      await client.openLoginPage();
      return;
    } catch (err) {
      console.warn('[ProspectLens] ExtPay openLoginPage error:', err);
    }
  }

  const fallbackUrl = `https://extensionpay.com/extension/${extensionId}`;
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url: fallbackUrl });
  } else if (typeof window !== 'undefined') {
    window.open(fallbackUrl, '_blank');
  }
}
