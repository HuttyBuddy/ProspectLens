import { extractBusinessIdentity } from './domExtractor';
import { extractMarketingAudit } from './signalsExtractor';
import { WebsiteExtractionResult } from './types';
import { checkExclusionPolicy } from './exclusionPolicy';

export function runExtraction(): WebsiteExtractionResult {
  const url = window.location.href;
  const policy = checkExclusionPolicy(document, url);

  if (policy.isRestricted) {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const title = document.title || 'Restricted Entity';
    return {
      isRestricted: true,
      restrictionReason: policy.reason,
      restrictionCategory: policy.category,
      identity: {
        businessName: title.split(/[-|–—:•]/)[0].trim() || 'Restricted Business',
        domain,
        websiteUrl: url,
        category: `Restricted: ${policy.category}`,
        servicesOffered: [],
        serviceAreas: [],
        contacts: {
          phones: [],
          emails: [],
          addresses: []
        },
        socials: {},
        tagline: 'Scraping blocked by ProspectLens compliance policy.',
        description: 'Information extraction is strictly prohibited for law and estate businesses.',
        hasJsonLd: false
      },
      audit: {
        items: [],
        summary: `Scraping blocked: ${policy.reason}`,
        analyzedAt: new Date().toISOString()
      },
      meta: {
        pageTitle: document.title,
        url,
        wordCount: 0,
        extractedAt: new Date().toISOString(),
        isSpa: false
      }
    };
  }

  const identity = extractBusinessIdentity(document, url);
  const audit = extractMarketingAudit(document, url);

  const isSpa = !!document.querySelector('#root, #__next, [data-reactroot], app-root');
  const wordCount = (document.body ? document.body.innerText || '' : '').split(/\s+/).filter(Boolean).length;

  return {
    identity,
    audit,
    meta: {
      pageTitle: document.title,
      url,
      wordCount,
      extractedAt: new Date().toISOString(),
      isSpa
    }
  };
}

// Chrome message listener for runtime requests from sidepanel/background
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'EXTRACT_PAGE_DATA') {
      try {
        const data = runExtraction();
        sendResponse({ success: true, data });
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || 'Extraction failed' });
      }
    }
    return true; // async callback support
  });
}
