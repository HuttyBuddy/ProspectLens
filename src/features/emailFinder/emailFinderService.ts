/**
 * Email Finder service — orchestrates candidate generation, verification,
 * and monthly usage metering against the license tier.
 */
import { WebsiteExtractionResult } from '../extractor/types';
import {
  VerifiedEmail,
  findAndVerifyEmails,
  normalizeDomain
} from './emailFinder';
import { canFindEmails, recordEmailFindUsage } from '../monetization/licenseStore';

export interface EmailFindResult {
  allowed: boolean;
  emails: VerifiedEmail[];
  domain: string;
  used: number;
  remaining: number;
  limit: number;
  tier: string;
  checkedAt: string;
  blockedReason?: string;
}

export async function runEmailFinder(
  extraction: WebsiteExtractionResult
): Promise<EmailFindResult> {
  const gate = await canFindEmails();
  if (!gate.allowed) {
    return {
      allowed: false,
      emails: [],
      domain: '',
      used: gate.state.emailFindsUsedThisMonth,
      remaining: 0,
      limit: gate.limit,
      tier: gate.state.tier,
      checkedAt: new Date().toISOString(),
      blockedReason: `Monthly email-find limit reached (${gate.limit}/mo on the ${gate.state.tier} plan). Upgrade for more.`
    };
  }

  const domain = normalizeDomain(
    extraction.identity?.domain || extraction.identity?.websiteUrl || ''
  );
  const onPageEmails = extraction.identity?.contacts?.emails || [];

  const emails = await findAndVerifyEmails(domain, onPageEmails);

  // Meter usage: one find per candidate checked.
  const usage = await recordEmailFindUsage(emails.length);

  return {
    allowed: true,
    emails,
    domain,
    used: usage.state.emailFindsUsedThisMonth,
    remaining: usage.remaining,
    limit: gate.limit,
    tier: gate.state.tier,
    checkedAt: new Date().toISOString()
  };
}
