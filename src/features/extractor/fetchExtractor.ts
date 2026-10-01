/**
 * Fetch-based page extraction.
 *
 * Fetches a URL's HTML, parses it with DOMParser, and runs the SAME
 * extraction engine the content script uses on live tabs. This lets
 * competitor benchmarking and scheduled re-scans audit any URL without
 * opening a tab or needing new permissions (host_permissions already
 * cover cross-origin fetch from extension contexts).
 *
 * NOTE: Must run in a DOM-capable context (side panel, tests) — MV3
 * service workers have no DOMParser, so re-scan execution is delegated
 * to the side panel (see features/rescan).
 *
 * Limitations: server-rendered HTML only — heavy SPAs that render
 * content via client-side JS will yield thin extractions.
 */
import { WebsiteExtractionResult } from './types';
import { extractBusinessIdentity } from './domExtractor';
import { extractMarketingAudit } from './signalsExtractor';
import { checkExclusionPolicy } from './exclusionPolicy';
import { normalizeDomain } from '../emailFinder/emailFinder';

export function normalizeUrl(raw: string): string {
  let url = (raw || '').trim();
  if (!url) throw new Error('Empty URL.');
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

export async function extractFromUrl(
  rawUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<WebsiteExtractionResult> {
  const url = normalizeUrl(rawUrl);
  const domain = normalizeDomain(url);

  let html: string;
  try {
    const res = await fetchImpl(url, { redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    html = await res.text();
  } catch (e) {
    throw new Error(
      `Could not fetch ${domain}: ${e instanceof Error ? e.message : 'network error'}. The site may block automated requests.`
    );
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  const policy = checkExclusionPolicy(doc, url);
  if (policy.isRestricted) {
    throw new Error(`Extraction blocked by policy: ${policy.reason || 'restricted business category'}.`);
  }

  const identity = extractBusinessIdentity(doc, url);
  const audit = extractMarketingAudit(doc, url);

  return {
    identity,
    audit,
    meta: {
      pageTitle: doc.title || '',
      url,
      wordCount: (doc.body?.textContent || '').split(/\s+/).filter(Boolean).length,
      extractedAt: new Date().toISOString(),
      isSpa: !!doc.querySelector('#root, #__next, [data-reactroot], app-root')
    }
  };
}
