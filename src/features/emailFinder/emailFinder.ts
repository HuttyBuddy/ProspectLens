/**
 * Email Finder — pure candidate generation and verification logic.
 *
 * Generates candidate email addresses for a prospect's domain using
 * on-page emails (mailto: / JSON-LD / footer patterns harvested by the
 * extractor) plus name-pattern and role-account permutations, then
 * verifies them with DNS MX lookups via Google's keyless DoH endpoint.
 *
 * No external LLM or paid APIs are used anywhere in this module.
 */

export type EmailSource = 'on-page' | 'name-pattern' | 'role-account';
export type EmailConfidence = 'Verified' | 'Likely' | 'Risky';

export interface EmailCandidate {
  email: string;
  source: EmailSource;
  pattern?: string;
  derivedFrom?: string;
}

export interface VerifiedEmail extends EmailCandidate {
  confidence: EmailConfidence;
  mxFound: boolean;
  reason: string;
}

export const ROLE_ACCOUNTS = [
  'info',
  'contact',
  'hello',
  'support',
  'sales',
  'team',
  'office',
  'admin',
  'billing',
  'service'
];

const ROLE_PREFIXES = new Set([
  'info', 'contact', 'hello', 'support', 'sales', 'team', 'office', 'admin',
  'billing', 'service', 'help', 'noreply', 'no-reply', 'donotreply', 'mail',
  'enquiries', 'inquiries', 'general', 'customerservice', 'customersupport'
]);

// Common free / disposable domains flagged as risky for cold outreach.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'yopmail.com', 'throwawaymail.com', 'getnada.com', 'temp-mail.org',
  'sharklasers.com', 'grr.la', 'dispostable.com', 'fakeinbox.com',
  'trashmail.com', 'mintemail.com', 'maildrop.cc', 'mytemp.email',
  'tempmailo.com', 'mohmal.com', 'emailondeck.com', 'spambog.com'
]);

const EMAIL_SYNTAX = /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function isValidEmailSyntax(email: string): boolean {
  return EMAIL_SYNTAX.test(email.trim());
}

export function getEmailDomain(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase() : '';
}

export function isDisposable(email: string): boolean {
  return DISPOSABLE_DOMAINS.has(getEmailDomain(email));
}

export function isRoleAccount(email: string): boolean {
  const local = email.split('@')[0]?.toLowerCase() || '';
  return ROLE_PREFIXES.has(local);
}

export interface NameParts {
  first: string;
  last: string;
  raw: string;
}

/**
 * Pull {first,last} name candidates from on-page email local-parts
 * (e.g. john.doe@ → {first:'john', last:'doe'}) and from contact names.
 */
export function deriveNameParts(onPageEmails: string[], contactNames: string[]): NameParts[] {
  const seen = new Set<string>();
  const out: NameParts[] = [];

  const push = (first: string, last: string, raw: string) => {
    const key = `${first}|${last}`;
    if (first.length >= 2 && last.length >= 2 && !seen.has(key)) {
      seen.add(key);
      out.push({ first, last, raw });
    }
  };

  for (const email of onPageEmails) {
    const local = email.split('@')[0] || '';
    const tokens = local.toLowerCase().split(/[._-]+/).filter((t) => /^[a-z]{2,}$/.test(t));
    if (tokens.length >= 2 && !ROLE_PREFIXES.has(tokens[0])) {
      push(tokens[0], tokens[tokens.length - 1], local);
    }
  }

  for (const name of contactNames) {
    const tokens = name.toLowerCase().split(/[^a-z]+/).filter((t) => t.length >= 2);
    if (tokens.length >= 2) {
      push(tokens[0], tokens[tokens.length - 1], name);
    }
  }

  return out;
}

export function normalizeDomain(raw: string): string {
  let d = (raw || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
  return d;
}

/**
 * Build the candidate list for a domain:
 *  - every on-page email (source 'on-page')
 *  - name-pattern permutations for each derived name
 *  - role-account addresses (info@, contact@, ...)
 */
export function generateEmailCandidates(
  domain: string,
  onPageEmails: string[],
  contactNames: string[] = []
): EmailCandidate[] {
  const d = normalizeDomain(domain);
  if (!d || !d.includes('.')) return [];

  const candidates: EmailCandidate[] = [];
  const seen = new Set<string>();
  const push = (c: EmailCandidate) => {
    const key = c.email.toLowerCase();
    if (!seen.has(key) && isValidEmailSyntax(c.email)) {
      seen.add(key);
      candidates.push(c);
    }
  };

  // 1. On-page emails first (highest confidence).
  for (const email of onPageEmails) {
    const normalized = email.trim().toLowerCase();
    push({ email: normalized, source: 'on-page' });
  }

  // 2. Name-pattern permutations.
  const names = deriveNameParts(onPageEmails, contactNames);
  const patterns: Array<{ id: string; build: (f: string, l: string) => string }> = [
    { id: 'first.last', build: (f, l) => `${f}.${l}` },
    { id: 'firstlast', build: (f, l) => `${f}${l}` },
    { id: 'f.last', build: (f, l) => `${f[0]}.${l}` },
    { id: 'first', build: (f) => `${f}` },
    { id: 'first_last', build: (f, l) => `${f}_${l}` }
  ];
  for (const name of names) {
    for (const p of patterns) {
      push({
        email: `${p.build(name.first, name.last)}@${d}`,
        source: 'name-pattern',
        pattern: p.id,
        derivedFrom: name.raw
      });
    }
  }

  // 3. Role accounts.
  for (const role of ROLE_ACCOUNTS) {
    push({ email: `${role}@${d}`, source: 'role-account' });
  }

  return candidates;
}

/**
 * MX lookup via Google's keyless DNS-over-HTTPS endpoint.
 * `fetchImpl` is injectable for tests; defaults to global fetch.
 */
export async function checkMxRecord(
  domain: string,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  try {
    const res = await fetchImpl(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
    if (!res.ok) return false;
    const data = (await res.json()) as { Answer?: Array<{ type: number }> };
    return Array.isArray(data.Answer) && data.Answer.some((a) => a.type === 15);
  } catch {
    return false;
  }
}

/**
 * Label every candidate:
 *  - Verified: found on-page AND domain has MX records
 *  - Likely:   pattern/role candidate AND domain has MX records
 *  - Risky:    no MX records, or a disposable domain
 */
export function labelCandidates(
  candidates: EmailCandidate[],
  mxFound: boolean
): VerifiedEmail[] {
  return candidates.map((c) => {
    const disposable = isDisposable(c.email);
    let confidence: EmailConfidence;
    let reason: string;

    if (disposable) {
      confidence = 'Risky';
      reason = 'Disposable/free-mail domain — avoid for cold outreach.';
    } else if (!mxFound) {
      confidence = 'Risky';
      reason = 'No MX records for this domain — mail will likely bounce.';
    } else if (c.source === 'on-page') {
      confidence = 'Verified';
      reason = 'Found on the prospect\u2019s own site and the domain accepts mail.';
    } else {
      confidence = 'Likely';
      reason = `Domain accepts mail; ${c.source === 'name-pattern' ? `common ${c.pattern} pattern` : 'standard role account'}.`;
    }

    return { ...c, confidence, mxFound, reason };
  });
}

/**
 * Full pipeline: candidates → MX check → labels.
 * Each candidate counts as one "find" for usage metering.
 */
export async function findAndVerifyEmails(
  domain: string,
  onPageEmails: string[],
  contactNames: string[] = [],
  fetchImpl: typeof fetch = fetch
): Promise<VerifiedEmail[]> {
  const d = normalizeDomain(domain);
  const candidates = generateEmailCandidates(d, onPageEmails, contactNames);
  if (candidates.length === 0) return [];
  const mxFound = await checkMxRecord(d, fetchImpl);
  return labelCandidates(candidates, mxFound);
}
