import { AuditItem, MarketingAudit } from './types';
import { checkExclusionPolicy } from './exclusionPolicy';

export function extractMarketingAudit(doc: Document, url: string): MarketingAudit {
  const policy = checkExclusionPolicy(doc, url);
  if (policy.isRestricted) {
    return {
      items: [],
      summary: `Extraction prohibited by policy: Law and estate businesses are excluded from scraping.`,
      analyzedAt: new Date().toISOString()
    };
  }

  const items: AuditItem[] = [];

  const bodyText = (doc.body ? doc.body.innerText || doc.body.textContent || '' : '').toLowerCase();
  const allHtml = (doc.documentElement ? doc.documentElement.innerHTML : '').toLowerCase();

  // 1. Primary Headline / Value Proposition
  const h1Elements = Array.from(doc.querySelectorAll('h1'));
  const meaningfulH1 = h1Elements.find((h) => (h.textContent || '').trim().length > 15);
  if (meaningfulH1) {
    items.push({
      id: 'headline',
      category: 'Website',
      label: 'Clear Value Proposition / Headline',
      status: 'Strong',
      evidence: `Found descriptive H1: "${meaningfulH1.textContent?.trim().slice(0, 70)}..."`
    });
  } else if (h1Elements.length > 0) {
    items.push({
      id: 'headline',
      category: 'Website',
      label: 'Clear Value Proposition / Headline',
      status: 'Weak',
      evidence: 'H1 is generic or brief, lacking explicit local service differentiation.'
    });
  } else {
    items.push({
      id: 'headline',
      category: 'Website',
      label: 'Clear Value Proposition / Headline',
      status: 'Missing',
      evidence: 'No <h1> heading tag found on the inspected page.'
    });
  }

  // 2. Primary CTA / Action buttons
  const ctaButtons = Array.from(doc.querySelectorAll('a, button')).filter((el) => {
    const text = (el.textContent || '').toLowerCase().trim();
    return (
      text.includes('get a quote') ||
      text.includes('free estimate') ||
      text.includes('schedule') ||
      text.includes('book online') ||
      text.includes('request service') ||
      text.includes('call now')
    );
  });

  if (ctaButtons.length >= 2) {
    items.push({
      id: 'primary-cta',
      category: 'Conversions',
      label: 'Prominent Action CTAs',
      status: 'Strong',
      evidence: `Multiple clear call-to-actions identified ("${ctaButtons[0].textContent?.trim()}").`
    });
  } else if (ctaButtons.length === 1) {
    items.push({
      id: 'primary-cta',
      category: 'Conversions',
      label: 'Prominent Action CTAs',
      status: 'Present',
      evidence: `One CTA found: "${ctaButtons[0].textContent?.trim()}". Consider reinforcing sticky mobile CTAs.`
    });
  } else {
    items.push({
      id: 'primary-cta',
      category: 'Conversions',
      label: 'Prominent Action CTAs',
      status: 'Weak',
      evidence: 'No high-converting direct CTA button (e.g. Free Estimate, Book Online) detected.'
    });
  }

  // 3. Phone Visibility & Tap-to-Call
  const telLinks = doc.querySelectorAll('a[href^="tel:"]');
  if (telLinks.length > 0) {
    items.push({
      id: 'phone-visibility',
      category: 'Conversions',
      label: 'Click-to-Call Phone Accessibility',
      status: 'Strong',
      evidence: `Active tel: link detected (${telLinks.length} tap-to-call link(s) on page).`
    });
  } else if (/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/.test(bodyText)) {
    items.push({
      id: 'phone-visibility',
      category: 'Conversions',
      label: 'Click-to-Call Phone Accessibility',
      status: 'Present',
      evidence: 'Phone number found in text, but missing clickable mobile tap-to-call href="tel:" tag.'
    });
  } else {
    items.push({
      id: 'phone-visibility',
      category: 'Conversions',
      label: 'Click-to-Call Phone Accessibility',
      status: 'Missing',
      evidence: 'No visible phone number detected on the current page.'
    });
  }

  // 4. Contact / Lead Capture Form
  const forms = doc.querySelectorAll('form');
  const leadForms = Array.from(forms).filter((f) => {
    const text = (f.innerText || f.textContent || '').toLowerCase();
    const inputs = f.querySelectorAll('input, textarea, select');
    return inputs.length >= 2 && (text.includes('name') || text.includes('email') || text.includes('message') || text.includes('phone'));
  });

  if (leadForms.length > 0) {
    items.push({
      id: 'contact-form',
      category: 'Conversions',
      label: 'Lead Capture Form',
      status: 'Present',
      evidence: `Embedded form with ${leadForms[0].querySelectorAll('input, textarea').length} fields detected.`
    });
  } else {
    items.push({
      id: 'contact-form',
      category: 'Conversions',
      label: 'Lead Capture Form',
      status: 'Missing',
      evidence: 'No direct lead inquiry form on the reviewed page; user must navigate to contact or call.'
    });
  }

  // 5. Video Marketing & Visual Demonstration
  const videoTags = doc.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"]');
  if (videoTags.length > 0) {
    items.push({
      id: 'video-marketing',
      category: 'Content & Media',
      label: 'Video Marketing & Demonstration',
      status: 'Present',
      evidence: `Found ${videoTags.length} embedded video element(s) or video player frame(s).`
    });
  } else {
    items.push({
      id: 'video-marketing',
      category: 'Content & Media',
      label: 'Video Marketing & Demonstration',
      status: 'Missing',
      evidence: 'No video media found on this page. High-converting short video ads/walkthroughs could boost trust.'
    });
  }

  // 6. Testimonials & Social Proof
  const hasReviewWords =
    bodyText.includes('review') ||
    bodyText.includes('testimonial') ||
    bodyText.includes('what our clients say') ||
    bodyText.includes('5-star') ||
    bodyText.includes('rating') ||
    allHtml.includes('birdeye') ||
    allHtml.includes('podium') ||
    allHtml.includes('trustpilot');

  const reviewQuotes = doc.querySelectorAll('blockquote, .testimonial, .review, [class*="review"], [class*="testimonial"]');

  if (reviewQuotes.length > 0 || allHtml.includes('google-review')) {
    items.push({
      id: 'social-proof',
      category: 'Trust',
      label: 'Reviews & Social Proof',
      status: 'Strong',
      evidence: 'Dedicated testimonial or review component detected.'
    });
  } else if (hasReviewWords) {
    items.push({
      id: 'social-proof',
      category: 'Trust',
      label: 'Reviews & Social Proof',
      status: 'Present',
      evidence: 'References to customer reviews detected, but lacks prominent structured widget.'
    });
  } else {
    items.push({
      id: 'social-proof',
      category: 'Trust',
      label: 'Reviews & Social Proof',
      status: 'Weak',
      evidence: 'Minimal or no visible customer reviews / star ratings found on the page.'
    });
  }

  // 7. Trust Signals, Licenses & Certifications
  const trustTerms = ['licensed', 'insured', 'bonded', 'certified', 'bbb', 'warranty', 'guarantee', 'years in business', 'award'];
  const matchedTrust = trustTerms.filter((t) => bodyText.includes(t));
  if (matchedTrust.length >= 3) {
    items.push({
      id: 'trust-signals',
      category: 'Trust',
      label: 'Licensing & Guarantees',
      status: 'Strong',
      evidence: `Multiple credentials highlighted (${matchedTrust.slice(0, 3).join(', ')}).`
    });
  } else if (matchedTrust.length > 0) {
    items.push({
      id: 'trust-signals',
      category: 'Trust',
      label: 'Licensing & Guarantees',
      status: 'Present',
      evidence: `Mentioned: ${matchedTrust.join(', ')}. Could be highlighted more prominently.`
    });
  } else {
    items.push({
      id: 'trust-signals',
      category: 'Trust',
      label: 'Licensing & Guarantees',
      status: 'Weak',
      evidence: 'No explicit mentions of licensing, insurance, or guarantees found.'
    });
  }

  // 8. Mobile Responsiveness / Viewport Tag
  const viewportMeta = doc.querySelector('meta[name="viewport"]');
  if (viewportMeta && viewportMeta.getAttribute('content')?.includes('width=device-width')) {
    items.push({
      id: 'mobile-viewport',
      category: 'Website',
      label: 'Mobile Viewport Configuration',
      status: 'Present',
      evidence: 'Standard mobile viewport meta tag configured.'
    });
  } else {
    items.push({
      id: 'mobile-viewport',
      category: 'Website',
      label: 'Mobile Viewport Configuration',
      status: 'Missing',
      evidence: 'Missing standard responsive viewport meta tag. May render poorly on mobile devices.'
    });
  }

  // 9. Structured Data (JSON-LD)
  const jsonLd = doc.querySelector('script[type="application/ld+json"]');
  if (jsonLd) {
    items.push({
      id: 'structured-data',
      category: 'Trust',
      label: 'Schema.org Structured Data',
      status: 'Present',
      evidence: 'JSON-LD schema found, aiding local search engine indexation.'
    });
  } else {
    items.push({
      id: 'structured-data',
      category: 'Trust',
      label: 'Schema.org Structured Data',
      status: 'Missing',
      evidence: 'No JSON-LD local business schema found. Missed opportunity for Google Rich Snippets.'
    });
  }

  // 10. Social Media Links
  const socialCount = doc.querySelectorAll('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="youtube.com"], a[href*="tiktok.com"]').length;
  if (socialCount >= 2) {
    items.push({
      id: 'social-channels',
      category: 'Content & Media',
      label: 'Active Social Profiles',
      status: 'Present',
      evidence: `Links to ${socialCount} social media channels discovered on page.`
    });
  } else {
    items.push({
      id: 'social-channels',
      category: 'Content & Media',
      label: 'Active Social Profiles',
      status: 'Weak',
      evidence: 'Few or no social profile links found on website header/footer.'
    });
  }

  // 11. Live Chat / Instant Messaging
  const chatScripts = allHtml.includes('crisp.chat') || allHtml.includes('intercom') || allHtml.includes('drift') || allHtml.includes('tawk.to') || allHtml.includes('livechat') || allHtml.includes('tidio') || allHtml.includes('podium');
  if (chatScripts) {
    items.push({
      id: 'live-chat',
      category: 'Conversions',
      label: 'Instant Messaging / Web Chat',
      status: 'Present',
      evidence: 'Live chat or automated messenger widget detected.'
    });
  } else {
    items.push({
      id: 'live-chat',
      category: 'Conversions',
      label: 'Instant Messaging / Web Chat',
      status: 'Missing',
      evidence: 'No instant chat widget detected. Potential loss of immediate website visitors.'
    });
  }

  // 12. Financing / Flexible Payment Options
  const hasFinancing = bodyText.includes('financing available') || bodyText.includes('monthly payments') || bodyText.includes('0% apr') || bodyText.includes('low monthly');
  if (hasFinancing) {
    items.push({
      id: 'financing',
      category: 'Conversions',
      label: 'Financing & Payment Flexibility',
      status: 'Present',
      evidence: 'Financing or flexible monthly payment options are advertised.'
    });
  } else {
    items.push({
      id: 'financing',
      category: 'Conversions',
      label: 'Financing & Payment Flexibility',
      status: 'Unable to determine',
      evidence: 'No prominent financing options found on this page.'
    });
  }

  const missingCount = items.filter((i) => i.status === 'Missing' || i.status === 'Weak').length;
  const summary = `Evaluated 12 core digital marketing signals: ${missingCount} growth opportunity areas identified.`;

  return {
    items,
    summary,
    analyzedAt: new Date().toISOString()
  };
}
