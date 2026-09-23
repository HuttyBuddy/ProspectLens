import { jsPDF } from 'jspdf';
import { WebsiteExtractionResult } from '../extractor/types';
import { OpportunityEngineResult } from '../opportunities/types';
import { UserSettings } from '../settings/settingsStore';
import { ClientAuditData, AuditCategoryScore } from './types';
import { isRestrictedProspect } from '../extractor/exclusionPolicy';

/**
 * Computes structured audit data from extraction and opportunity insights.
 */
export function buildClientAuditData(
  extraction: WebsiteExtractionResult,
  opportunities: OpportunityEngineResult | null,
  settings: UserSettings
): ClientAuditData {
  const businessName = extraction.identity?.businessName || 'Valued Business';
  const domain = extraction.identity?.domain || '';
  const category = extraction.identity?.category || 'Local Business';
  const url = extraction.meta?.url || extraction.identity?.websiteUrl || '';

  if (
    extraction.isRestricted ||
    isRestrictedProspect(businessName, domain, category)
  ) {
    throw new Error('Policy Violation: Law and real estate businesses are excluded from audit reports.');
  }

  const identity = extraction.identity || ({} as any);
  const meta = extraction.meta || ({} as any);
  const contacts = identity.contacts || { phones: [], emails: [], addresses: [] };

  // 1. Mobile & Speed UX Score
  const hasMeta = Boolean(meta.metaDescription && meta.metaDescription.length > 20);
  const mobileScore = hasMeta ? 78 : 55;

  // 2. Conversion Architecture Score
  let conversionScore = 40;
  if (contacts.phones && contacts.phones.length > 0) conversionScore += 20;
  if (contacts.emails && contacts.emails.length > 0) conversionScore += 15;
  if (extraction.audit?.items?.some((i) => i.category === 'Conversions' && (i.status === 'Strong' || i.status === 'Present'))) {
    conversionScore += 15;
  }
  conversionScore = Math.min(conversionScore, 85);

  // 3. Social Proof & Authority Score
  let socialScore = 45;
  if (meta.reviewRating && meta.reviewRating >= 4.0) socialScore += 30;
  if (meta.reviewCount && meta.reviewCount > 10) socialScore += 15;
  if (identity.socials && Object.keys(identity.socials).length > 0) socialScore += 10;
  socialScore = Math.min(socialScore, 95);

  // 4. Video & Modern Engagement Score (typically lower for local businesses)
  const hasVideo = meta.hasVideoEmbeds || Boolean(meta.videoEmbeds && meta.videoEmbeds.length > 0);
  const videoScore = hasVideo ? 70 : 30;

  // Overall Score (Weighted)
  const overallScore = Math.round(
    mobileScore * 0.2 +
    conversionScore * 0.35 +
    socialScore * 0.25 +
    videoScore * 0.2
  );

  const categoryScores: AuditCategoryScore[] = [
    {
      category: 'Conversion Architecture',
      score: conversionScore,
      status: conversionScore > 70 ? 'Good' : conversionScore > 50 ? 'Needs Improvement' : 'Critical',
      summary: contacts.phones?.length > 0
        ? 'Direct phone detected; opportunity to add instant 1-click booking and lead magnets.'
        : 'Missing direct phone or friction in contact capture.'
    },
    {
      category: 'Video & Visual Ads',
      score: videoScore,
      status: videoScore > 60 ? 'Good' : 'Critical',
      summary: videoScore < 50
        ? 'Zero short-form video commercials found; missing 82% of social traffic opportunities.'
        : 'Basic video assets detected; could benefit from high-converting 4K short-form video.'
    },
    {
      category: 'Social Proof & Authority',
      score: socialScore,
      status: socialScore > 75 ? 'Good' : 'Needs Improvement',
      summary: meta.reviewRating
        ? `Strong ${meta.reviewRating}★ rating with ${meta.reviewCount || 0} reviews ready to showcase in retargeting ads.`
        : 'Limited review schema or testimonials highlighted above the fold.'
    },
    {
      category: 'Mobile & On-Page SEO',
      score: mobileScore,
      status: mobileScore > 70 ? 'Good' : 'Needs Improvement',
      summary: hasMeta
        ? 'Meta descriptions present; local geographic keywords can be further optimized.'
        : 'Meta descriptions missing or incomplete for localized search intent.'
    }
  ];

  // Derive bottlenecks
  const detectedBottlenecks: string[] = [];
  if (videoScore < 50) {
    detectedBottlenecks.push('Absence of dynamic short-form video ads on Instagram, TikTok, and Meta feeds.');
  }
  if (!contacts.emails || contacts.emails.length === 0) {
    detectedBottlenecks.push('No direct contact email displayed for inbound commercial inquiries.');
  }
  if (!meta.reviewCount || meta.reviewCount < 20) {
    detectedBottlenecks.push('Under-leveraged customer review flywheel to build trust with new visitors.');
  }
  if (conversionScore < 65) {
    detectedBottlenecks.push('Lack of prominent, benefit-driven primary Call-To-Action above the fold.');
  }
  if (detectedBottlenecks.length < 3) {
    detectedBottlenecks.push('Opportunity for speed-to-lead automated SMS follow-up on quote inquiries.');
  }

  // Recommended high-ROI services
  const topOps = (opportunities?.topOpportunities || []).slice(0, 3);
  const recommendedServices = topOps.length > 0
    ? topOps.map((op) => ({
        title: op.title,
        priority: (op.impact === 'High' ? 'High' : 'Medium') as 'High' | 'Medium',
        estimatedImpact: op.expectedRevenueImpact || 'Estimated 20-35% boost in pipeline velocity',
        rationale: op.quickPitch
      }))
    : [
        {
          title: 'High-Converting Short-Form AI Video Ads',
          priority: 'High' as const,
          estimatedImpact: '3x increase in social CTR and inbound qualified leads',
          rationale: 'Engage local consumers with dynamic 15-second cinematic video showcases.'
        },
        {
          title: 'Automated Lead Capture & Instant SMS Follow-Up',
          priority: 'High' as const,
          estimatedImpact: 'Capture up to 40% of leads lost to delayed responses',
          rationale: 'Instantly message inbound website quote requests within 60 seconds.'
        },
        {
          title: 'Local Authority & Reputation Booster',
          priority: 'Medium' as const,
          estimatedImpact: 'Top 3 Google Maps placement in local service radius',
          rationale: 'Systematize review collection and showcase 5-star social proof.'
        }
      ];

  return {
    businessName,
    websiteUrl: url || `https://${domain}`,
    industry: category,
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    overallScore,
    categoryScores,
    detectedBottlenecks,
    recommendedServices,
    agency: {
      name: settings.companyName || 'Growth Advisory Partners',
      consultant: settings.userName || 'Lead Growth Strategist',
      email: settings.email || 'strategy@agencygrowth.io',
      phone: settings.phone || '(555) 019-2831',
      cta: settings.defaultCta || 'Schedule a 15-Minute Strategic Growth Review'
    }
  };
}

/**
 * Generates and downloads an executive, vector-crisp 1-page A4 PDF Client Audit Report.
 */
export function generateClientAuditPdf(auditData: ClientAuditData): void {
  // A4 dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. TOP HEADER BANNER (Dark slate: #090d16)
  doc.setFillColor(9, 13, 22);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent line (Cyan: #06b6d4)
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 42, pageWidth, 1.5, 'F');

  // Agency Brand / Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 182, 212);
  doc.text(auditData.agency.name.toUpperCase(), margin, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Digital Growth & Conversion Audit • ${auditData.generatedDate}`, margin, 19);

  // Main Target Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`Executive Growth Audit: ${auditData.businessName}`, margin, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  const cleanUrl = auditData.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  doc.text(`Target URL: ${cleanUrl}  |  Industry: ${auditData.industry}`, margin, 35);

  // 2. OVERALL SCORECARD BOX
  const scoreBoxY = 48;
  doc.setFillColor(248, 250, 252); // soft slate
  doc.roundedRect(margin, scoreBoxY, contentWidth, 34, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, scoreBoxY, contentWidth, 34, 3, 3, 'S');

  // Big Score Badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 5, scoreBoxY + 5, 38, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(6, 182, 212);
  doc.text(`${auditData.overallScore}`, margin + 24, scoreBoxY + 16, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('OUT OF 100', margin + 24, scoreBoxY + 22, { align: 'center' });

  // Score description text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Website Conversion & Marketing Health Index', margin + 48, scoreBoxY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `This assessment evaluates high-impact digital levers that directly correlate with inbound local sales.`,
    margin + 48,
    scoreBoxY + 19
  );
  doc.text(
    `Overall Assessment: Your digital foundation is in place, with significant upside in visual ads and automated capture.`,
    margin + 48,
    scoreBoxY + 24
  );

  // 3. FOUR CORE CATEGORY METRICS
  const catStartY = 87;
  const colWidth = (contentWidth - 6) / 2;

  auditData.categoryScores.forEach((cat, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = margin + col * (colWidth + 6);
    const y = catStartY + row * 24;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, colWidth, 20, 2, 2, 'FD');

    // Title and Score
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(cat.category, x + 4, y + 6);

    const scoreColor = cat.score >= 70 ? [16, 185, 129] : cat.score >= 50 ? [217, 119, 6] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${cat.score}%`, x + colWidth - 4, y + 6, { align: 'right' });

    // Progress Bar Background
    doc.setFillColor(241, 245, 249);
    doc.rect(x + 4, y + 8.5, colWidth - 8, 2, 'F');

    // Progress Bar Fill
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    const fillWidth = ((colWidth - 8) * cat.score) / 100;
    doc.rect(x + 4, y + 8.5, fillWidth, 2, 'F');

    // Summary text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const splitSummary = doc.splitTextToSize(cat.summary, colWidth - 8);
    doc.text(splitSummary, x + 4, y + 14);
  });

  // 4. DETECTED REVENUE & CONVERSION BOTTLENECKS
  const bottlenecksY = 140;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Conversion Bottlenecks Identified', margin, bottlenecksY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Addressing these friction points typically yields the fastest return on marketing spend.', margin, bottlenecksY + 4.5);

  let bY = bottlenecksY + 11;
  auditData.detectedBottlenecks.slice(0, 3).forEach((item, index) => {
    // Bullet marker
    doc.setFillColor(239, 68, 68);
    doc.circle(margin + 2, bY - 1, 1.2, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(item, contentWidth - 8);
    doc.text(lines, margin + 7, bY);
    bY += 6.5;
  });

  // 5. RECOMMENDED GROWTH ROADMAP (PITCH SERVICES)
  const roadmapY = bY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Recommended High-ROI Service Roadmap', margin, roadmapY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Turnkey marketing initiatives designed to capture local market share immediately.', margin, roadmapY + 4.5);

  let rY = roadmapY + 10;
  auditData.recommendedServices.slice(0, 3).forEach((srv) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, rY, contentWidth, 18, 2, 2, 'FD');

    // Left priority indicator bar
    doc.setFillColor(srv.priority === 'High' ? 6 : 59, srv.priority === 'High' ? 182 : 130, srv.priority === 'High' ? 212 : 246);
    doc.roundedRect(margin, rY, 3, 18, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(srv.title, margin + 6, rY + 5.5);

    // Impact Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(2, 132, 199);
    doc.text(`[Impact: ${srv.estimatedImpact}]`, margin + contentWidth - 4, rY + 5.5, { align: 'right' });

    // Rationale
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const splitRat = doc.splitTextToSize(srv.rationale, contentWidth - 12);
    doc.text(splitRat, margin + 6, rY + 11.5);

    rY += 21;
  });

  // 6. BOTTOM CALL TO ACTION & AGENCY CONTACT BLOCK
  const ctaY = 240;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, ctaY, contentWidth, 36, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Next Strategic Step: Complimentary 15-Minute Strategy Review', margin + 6, ctaY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `We have already generated campaign concepts tailored specifically to ${auditData.businessName}. Let's review the exact execution plan.`,
    margin + 6,
    ctaY + 16
  );

  // Agency Contact Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 182, 212);
  doc.text(`Prepared By: ${auditData.agency.consultant}  •  ${auditData.agency.name}`, margin + 6, ctaY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Direct Contact: ${auditData.agency.email}  |  ${auditData.agency.phone}`, margin + 6, ctaY + 30);

  // Footer Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by ${auditData.agency.name} using ProspectLens Intelligence Engine. Strictly confidential for ${auditData.businessName}.`,
    pageWidth / 2,
    288,
    { align: 'center' }
  );

  // Trigger download
  const safeFileName = `${auditData.businessName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Growth_Audit.pdf`;
  doc.save(safeFileName);
}
