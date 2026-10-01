import { describe, it, expect } from 'vitest';
import {
  isValidEmailSyntax,
  isDisposable,
  isRoleAccount,
  deriveNameParts,
  normalizeDomain,
  generateEmailCandidates,
  labelCandidates,
  checkMxRecord,
  findAndVerifyEmails,
  EmailCandidate
} from '../features/emailFinder/emailFinder';

describe('Email Finder — validation helpers', () => {
  it('accepts well-formed emails and rejects malformed ones', () => {
    expect(isValidEmailSyntax('john.doe@apexroofing.com')).toBe(true);
    expect(isValidEmailSyntax('f.doe@apex-roofing.co.uk')).toBe(true);
    expect(isValidEmailSyntax('not-an-email')).toBe(false);
    expect(isValidEmailSyntax('missing@')).toBe(false);
    expect(isValidEmailSyntax('@nodomain.com')).toBe(false);
    expect(isValidEmailSyntax('double..dots@apex.com')).toBe(false);
  });

  it('flags disposable domains as risky', () => {
    expect(isDisposable('x@mailinator.com')).toBe(true);
    expect(isDisposable('x@guerrillamail.com')).toBe(true);
    expect(isDisposable('x@apexroofing.com')).toBe(false);
    expect(isDisposable('x@gmail.com')).toBe(false);
  });

  it('detects role accounts', () => {
    expect(isRoleAccount('info@apex.com')).toBe(true);
    expect(isRoleAccount('SUPPORT@apex.com')).toBe(true);
    expect(isRoleAccount('john.doe@apex.com')).toBe(false);
  });

  it('normalizes domains from URLs', () => {
    expect(normalizeDomain('https://www.ApexRoofing.com/about')).toBe('apexroofing.com');
    expect(normalizeDomain('apexroofing.com')).toBe('apexroofing.com');
  });
});

describe('Email Finder — name derivation', () => {
  it('derives first/last names from on-page email local-parts', () => {
    const names = deriveNameParts(['john.doe@apex.com', 'info@apex.com'], []);
    expect(names).toContainEqual({ first: 'john', last: 'doe', raw: 'john.doe' });
    // role accounts are not treated as names
    expect(names.every((n) => n.first !== 'info')).toBe(true);
  });

  it('derives names from contact names', () => {
    const names = deriveNameParts([], ['Sarah Connor']);
    expect(names).toContainEqual({ first: 'sarah', last: 'connor', raw: 'Sarah Connor' });
  });
});

describe('Email Finder — candidate generation', () => {
  it('emits on-page emails, name patterns, and role accounts without duplicates', () => {
    const candidates = generateEmailCandidates('apex.com', ['john.doe@apex.com']);
    const emails = candidates.map((c) => c.email);

    expect(emails).toContain('john.doe@apex.com');
    expect(emails).toContain('johndoe@apex.com');
    expect(emails).toContain('j.doe@apex.com');
    expect(emails).toContain('john@apex.com');
    expect(emails).toContain('info@apex.com');
    expect(emails).toContain('sales@apex.com');
    // no duplicates
    expect(new Set(emails).size).toBe(emails.length);
    // on-page email tagged correctly
    expect(candidates.find((c) => c.email === 'john.doe@apex.com')?.source).toBe('on-page');
  });

  it('returns an empty list for invalid domains', () => {
    expect(generateEmailCandidates('notadomain', [])).toEqual([]);
    expect(generateEmailCandidates('', [])).toEqual([]);
  });
});

describe('Email Finder — MX check and labeling', () => {
  const mxYes = (async () =>
    new Response(JSON.stringify({ Answer: [{ type: 15, data: '10 mail.apex.com.' }] }))) as any;
  const mxNo = (async () => new Response(JSON.stringify({ Answer: [] }))) as any;

  it('detects MX records via DNS-over-HTTPS', async () => {
    expect(await checkMxRecord('apex.com', mxYes)).toBe(true);
    expect(await checkMxRecord('apex.com', mxNo)).toBe(false);
  });

  it('labels on-page+MX as Verified, patterns as Likely, no-MX as Risky', () => {
    const candidates: EmailCandidate[] = [
      { email: 'john.doe@apex.com', source: 'on-page' },
      { email: 'johndoe@apex.com', source: 'name-pattern', pattern: 'firstlast' },
      { email: 'info@apex.com', source: 'role-account' }
    ];

    const withMx = labelCandidates(candidates, true);
    expect(withMx.find((c) => c.email === 'john.doe@apex.com')?.confidence).toBe('Verified');
    expect(withMx.find((c) => c.email === 'johndoe@apex.com')?.confidence).toBe('Likely');
    expect(withMx.find((c) => c.email === 'info@apex.com')?.confidence).toBe('Likely');

    const noMx = labelCandidates(candidates, false);
    expect(noMx.every((c) => c.confidence === 'Risky')).toBe(true);
  });

  it('always flags disposable domains as Risky', () => {
    const labeled = labelCandidates(
      [{ email: 'x@mailinator.com', source: 'on-page' }],
      true
    );
    expect(labeled[0].confidence).toBe('Risky');
  });

  it('findAndVerifyEmails runs the full pipeline with injected fetch', async () => {
    const verified = await findAndVerifyEmails('apex.com', ['john.doe@apex.com'], [], mxYes);
    expect(verified.length).toBeGreaterThan(0);
    expect(verified.find((v) => v.email === 'john.doe@apex.com')?.confidence).toBe('Verified');
  });
});
