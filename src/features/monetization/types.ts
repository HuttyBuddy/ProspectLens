export type SubscriptionTier = 'free' | 'pro' | 'agency';

export type GatedFeature =
  | 'csv_export'
  | 'advanced_outreach'
  | 'full_flow_prompts'
  | 'unlimited_scans'
  | 'unlimited_saved_prospects';

export interface UserLicenseState {
  tier: SubscriptionTier;
  scansUsedThisMonth: number;
  scansMonthlyLimit: number; // 10 for free, Infinity for pro
  savedProspectsLimit: number; // 5 for free, Infinity for pro
  billingPeriodEnd: string;
  isPro: boolean;
  isAgency: boolean;
}

export const FREE_TIER_SCAN_LIMIT = 10;
export const FREE_TIER_PROSPECT_LIMIT = 5;

export const DEFAULT_LICENSE_STATE: UserLicenseState = {
  tier: 'free',
  scansUsedThisMonth: 3, // Start with 3 used in demo so user sees the progress bar active
  scansMonthlyLimit: FREE_TIER_SCAN_LIMIT,
  savedProspectsLimit: FREE_TIER_PROSPECT_LIMIT,
  billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isPro: false,
  isAgency: false
};
