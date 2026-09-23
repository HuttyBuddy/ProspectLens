import { WebsiteExtractionResult } from '../extractor/types';
import { ConfidenceLevel, OpportunityEngineResult, ServiceOpportunity } from './opportunityTypes';

export interface UserSettingsRules {
  servicesSold: string[]; // e.g. ["AI Video Advertising", "Web Design", "SEO"]
  customPricing?: Record<string, string>;
}

export function evaluateOpportunities(
  extraction: WebsiteExtractionResult,
  userSettings?: UserSettingsRules
): OpportunityEngineResult {
  if (extraction.isRestricted || extraction.identity.category.startsWith('Restricted')) {
    return {
      topOpportunities: [],
      allOpportunities: [],
      summary: 'Opportunity evaluation disabled: Law and estate businesses are excluded by compliance policy.'
    };
  }

  const { identity, audit } = extraction;
  const auditMap = new Map(audit.items.map((i) => [i.id, i]));
  const opportunities: ServiceOpportunity[] = [];

  const servicesSold = userSettings?.servicesSold || [
    'AI Video Advertising',
    'Website Redesign',
    'SEO',
    'Lead Nurturing & CRM Automation',
    'Review Generation & Reputation Management'
  ];

  const customPricing = userSettings?.customPricing || {};

  // 1. Video Advertising Opportunity
  const videoAudit = auditMap.get('video-marketing');
  if (videoAudit?.status === 'Missing' || videoAudit?.status === 'Weak') {
    const isTechOrSoftware = /software|saas|app|video|tech|platform/i.test(identity.category) || /descript|app\./i.test(identity.domain);
    const isVisualIndustry = /roofing|remodel|kitchen|landscap|clean|restoration|auto|dent/i.test(identity.category);
    
    if (isTechOrSoftware) {
      opportunities.push({
        id: 'ai-video-ads',
        service: 'Product Demo & Social Video Ads',
        evidence: `As an innovative platform in ${identity.category}, short-form social video ads and interactive feature teasers are the highest-converting customer acquisition channels.`,
        salesAngle: `Produce high-energy product demo shorts and workflow comparisons highlighting how users save 10+ hours with ${identity.businessName}.`,
        suggestedDeliverable: 'Three 15s viral feature walkthrough ads (Workflow Transformation, Before/After Speed, Creator Testimonial).',
        confidence: 'High',
        whyPitchThis: `SaaS buyers make split-second trial decisions on social feeds. Dynamic video demos convert viewers into active trial accounts 3x faster than text features.`,
        suggestedOffer: 'SaaS Viral Ad Sprint (3 high-converting vertical demo commercials + paid social copy).',
        estimatedPricingGuide: customPricing['AI Video Advertising'] || undefined
      });
    } else {
      opportunities.push({
        id: 'ai-video-ads',
        service: 'AI Video Advertising',
        evidence: `The business specializes in ${identity.category}, yet has no prominent video media or video ads on reviewed pages.`,
        salesAngle: `Create short cinematic before/after and project transformation ads to capture high-intent customers scrolling social feeds.`,
        suggestedDeliverable: 'Three 10–15s vertical ads (Before/After, Problem-Solution, Customer Proof).',
        confidence: isVisualIndustry ? 'High' : 'Medium',
        whyPitchThis: `${identity.businessName} sells high-ticket, visual services. Cinematic video ads build emotional trust 5x faster than static stock imagery.`,
        suggestedOffer: 'Starter Local Video Ad Pack (3 high-converting vertical video concepts + ad copy).',
        estimatedPricingGuide: customPricing['AI Video Advertising'] || undefined
      });
    }
  }

  // 2. Website Redesign / Landing Page Optimization
  const ctaAudit = auditMap.get('primary-cta');
  const formAudit = auditMap.get('contact-form');
  const mobileAudit = auditMap.get('mobile-viewport');
  if (ctaAudit?.status === 'Weak' || formAudit?.status === 'Missing' || mobileAudit?.status === 'Missing') {
    opportunities.push({
      id: 'web-redesign',
      service: 'Website Redesign & Conversion Optimization',
      evidence: `Website lacks a clear direct quote form or prominent mobile CTAs, creating high friction for paid/organic visitors.`,
      salesAngle: `Upgrade the site with instant quote capture, mobile-first design, and sticky call buttons to immediately double conversion rate.`,
      suggestedDeliverable: 'High-converting mobile-responsive landing page with fast quote calculator.',
      confidence: 'High',
      whyPitchThis: `Traffic sent to ${identity.domain} currently risks bouncing before taking action due to conversion friction.`,
      suggestedOffer: 'High-Converting Local Landing Page Build + Direct Form Integration.',
      estimatedPricingGuide: customPricing['Website Redesign'] || undefined
    });
  }

  // 3. Local SEO & Schema.org Rich Snippets
  const schemaAudit = auditMap.get('structured-data');
  const headlineAudit = auditMap.get('headline');
  if (schemaAudit?.status === 'Missing' || headlineAudit?.status === 'Weak') {
    opportunities.push({
      id: 'local-seo',
      service: 'Local SEO & Schema Optimization',
      evidence: `Missing LocalBusiness Schema.org markup and localized keyword targeting in headers.`,
      salesAngle: `Implement local rich snippets, geo-targeted service silos, and Google Maps ranking signals to dominate local search.`,
      suggestedDeliverable: 'Complete Schema.org deployment + on-page local keyword optimization for top 5 service areas.',
      confidence: 'High',
      whyPitchThis: `Without structured JSON-LD, search engines cannot properly display rich reviews, pricing, and operating hours in local pack rankings.`,
      suggestedOffer: 'Local Search Visibility & Rich Snippets Package.',
      estimatedPricingGuide: customPricing['SEO'] || undefined
    });
  }

  // 4. Review Generation & Reputation Management
  const reviewAudit = auditMap.get('social-proof');
  if (reviewAudit?.status === 'Weak' || reviewAudit?.status === 'Missing') {
    opportunities.push({
      id: 'reputation-management',
      service: 'Review Generation & Reputation Management',
      evidence: `Sparse or missing automated customer reviews and social proof widgets on main digital touchpoints.`,
      salesAngle: `Deploy automated SMS/Email post-job review request workflows to rapidly collect 5-star Google reviews.`,
      suggestedDeliverable: 'Automated 5-star review request funnel + website live review badge integration.',
      confidence: 'Medium',
      whyPitchThis: `Local consumers evaluate at least 3 contractors; lacking visible recent social proof costs them warm inbound calls.`,
      suggestedOffer: 'Turnkey Google Review Acceleration System.',
      estimatedPricingGuide: customPricing['Review Generation'] || undefined
    });
  }

  // 5. CRM & Instant Booking Automation
  const chatAudit = auditMap.get('live-chat');
  if (chatAudit?.status === 'Missing') {
    opportunities.push({
      id: 'crm-automation',
      service: 'Instant Lead Nurture & Booking Automation',
      evidence: `No instant chat widget or after-hours automated response system detected on the website.`,
      salesAngle: `Implement 24/7 AI-assisted booking & SMS follow-up so inquiries received after 5 PM are engaged in under 60 seconds.`,
      suggestedDeliverable: 'Web chat widget connected to instant 60-second SMS lead notification & appointment booking.',
      confidence: 'Medium',
      whyPitchThis: `Over 70% of homeowners choose the first contractor who responds. Instant engagement closes deals before competitors wake up.`,
      suggestedOffer: '24/7 Speed-to-Lead Response System.',
      estimatedPricingGuide: customPricing['Automation'] || undefined
    });
  }

  // 6. Social Media & Content Growth
  const socialAudit = auditMap.get('social-channels');
  if (socialAudit?.status === 'Weak' || !identity.socials.instagram) {
    opportunities.push({
      id: 'social-media',
      service: 'Social Media Management & Content Showcase',
      evidence: `Limited active social channel links or missing visual showcase channels (e.g. Instagram/TikTok).`,
      salesAngle: `Showcase weekly project transformations and behind-the-scenes craftsmanship to build local brand authority.`,
      suggestedDeliverable: 'Monthly 12-post social content engine with reels and project photo spotlights.',
      confidence: 'Low',
      whyPitchThis: `Establishes neighborhood credibility and reinforces word-of-mouth recommendations.`,
      suggestedOffer: 'Local Authority Social Retainer.',
      estimatedPricingGuide: customPricing['Social Media'] || undefined
    });
  }

  // Mark if user sells this service
  opportunities.forEach((opp) => {
    opp.isUserOfferedService = servicesSold.some(
      (s) =>
        s.toLowerCase().includes(opp.service.toLowerCase()) ||
        opp.service.toLowerCase().includes(s.toLowerCase())
    );
  });

  // Sort: User offered services first, then by confidence score (High -> Medium -> Low)
  const confidenceOrder: Record<ConfidenceLevel, number> = { High: 3, Medium: 2, Low: 1 };
  opportunities.sort((a, b) => {
    if (a.isUserOfferedService && !b.isUserOfferedService) return -1;
    if (!a.isUserOfferedService && b.isUserOfferedService) return 1;
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });

  const topOpportunities = opportunities.slice(0, 3);

  // Extract key strengths and primary gaps
  const keyStrengths = audit.items
    .filter((i) => i.status === 'Strong')
    .map((i) => i.label);
  const primaryGaps = audit.items
    .filter((i) => i.status === 'Missing' || i.status === 'Weak')
    .map((i) => i.label);

  return {
    topOpportunities,
    allOpportunities: opportunities,
    businessOverview: {
      name: identity.businessName,
      category: identity.category,
      keyStrengths: keyStrengths.length > 0 ? keyStrengths : ['Established Local Domain'],
      primaryGaps: primaryGaps.length > 0 ? primaryGaps : ['Video demonstration', 'Modern lead capture']
    }
  };
}
