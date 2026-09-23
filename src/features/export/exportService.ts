import { SavedProspect } from '../pipeline/pipelineTypes';
import { ExportOptions, ExportPreset, ProspectAuditMetrics } from './types';
import { isRestrictedProspect } from '../extractor/exclusionPolicy';
import { UserSettings } from '../settings/settingsStore';

/**
 * Escapes a cell value for RFC 4180 compliant CSV formatting.
 * If the value contains commas, double quotes, or newlines, it must be enclosed in quotes
 * and internal double quotes doubled.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Computes deep audit scores and outreach copy for a saved prospect.
 */
export function calculateProspectAuditScores(
  prospect: SavedProspect,
  settings?: UserSettings
): ProspectAuditMetrics {
  const auditItems = prospect.auditItems || [];
  const opportunities = prospect.opportunities || [];

  // 1. Mobile & SEO Score
  const seoItems = auditItems.filter((i) => i.category === 'SEO');
  const hasMetaIssue = seoItems.some((i) => i.status === 'Missing');
  const mobileSeoScore = hasMetaIssue ? 58 : 78;

  // 2. Conversion Architecture Score
  let conversionScore = 40;
  if (prospect.phone) conversionScore += 20;
  if (prospect.email) conversionScore += 15;
  const hasBookingOrChat = auditItems.some(
    (i) => i.category === 'Conversions' && (i.status === 'Strong' || i.status === 'Present')
  );
  if (hasBookingOrChat) conversionScore += 15;
  conversionScore = Math.min(conversionScore, 85);

  // 3. Social Proof & Authority Score
  const socialItems = auditItems.filter((i) => i.category === 'Social Proof');
  let socialScore = 50;
  const hasStrongReviews = socialItems.some((i) => i.status === 'Strong');
  if (hasStrongReviews) socialScore += 30;
  if (prospect.socials && Object.keys(prospect.socials).length > 0) socialScore += 15;
  socialScore = Math.min(socialScore, 95);

  // 4. Video & Modern Engagement Score
  const videoItems = auditItems.filter((i) => i.category === 'Content & Media');
  const hasVideo = videoItems.some((i) => i.status === 'Strong' || i.status === 'Present');
  const videoScore = hasVideo ? 70 : 30;

  // Overall Health Score
  const overallHealthScore = Math.round(
    mobileSeoScore * 0.2 +
    conversionScore * 0.35 +
    socialScore * 0.25 +
    videoScore * 0.2
  );

  // Derive top bottleneck
  let topBottleneck = 'Absence of high-converting short-form video commercials';
  if (videoScore < 50) {
    topBottleneck = 'Zero short-form social video ads on Instagram & TikTok';
  } else if (!prospect.email) {
    topBottleneck = 'Missing direct inbound contact email on website';
  } else if (conversionScore < 60) {
    topBottleneck = 'Friction in lead capture and lack of instant quote scheduler';
  } else if (socialScore < 65) {
    topBottleneck = 'Under-leveraged customer reviews & Google rating badge';
  }

  // Recommended service & retainer
  const topOp = opportunities[0];
  const recommendedService = topOp?.service || prospect.chosenService || 'Short-Form Video & Lead Engine';
  const estimatedRetainerValue = topOp?.estimatedRetainer || '$1,500 - $3,000/mo';

  // Extract outreach texts
  const senderName = settings?.senderName || 'Alex';
  const emailSubject = prospect.savedOutreach?.subject ||
    `Quick observation regarding ${prospect.businessName}'s customer acquisition`;

  const emailBody = prospect.savedOutreach?.body ||
    `Hi ${prospect.businessName} Team,\n\nI was looking into ${prospect.category || 'local businesses'} in ${prospect.location || 'your area'} and noticed you have great work, but ${topBottleneck.toLowerCase()}.\n\nWould you be open to seeing a 30-second concept we drafted to help capture more qualified leads?\n\nBest,\n${senderName}`;

  const smsHook = `Hey ${prospect.businessName}, loved your work in ${prospect.location || 'town'}. Noticed an easy way to fix ${topBottleneck.toLowerCase()}. Mind if I text over a 30-sec demo link?`;

  const videoAdHook = `Watch how ${prospect.businessName} transforms local projects in seconds. High-converting before & after showcase with clear call-to-action.`;

  return {
    overallHealthScore,
    mobileSeoScore,
    conversionScore,
    socialScore,
    videoScore,
    topBottleneck,
    recommendedService,
    estimatedRetainerValue,
    emailSubject,
    emailBody,
    smsHook,
    videoAdHook
  };
}

/**
 * Builds a formatted CSV string with RFC 4180 escaping and UTF-8 BOM.
 */
export function generateLeadsCsv(
  prospects: SavedProspect[],
  options: ExportOptions,
  settings?: UserSettings,
  isPro: boolean = false
): string {
  // Strict law and estate exclusion filter
  const allowedProspects = prospects.filter(
    (p) => !isRestrictedProspect(p.businessName, p.domain, p.category)
  );

  // Free tier limit (cap at 3 records if not pro)
  const exportList = !isPro ? allowedProspects.slice(0, 3) : allowedProspects;

  const delimiter = options.format === 'tsv' ? '\t' : ',';
  let headers: string[] = [];
  const rows: string[][] = [];

  switch (options.preset) {
    case 'instantly': {
      headers = [
        'Email',
        'FirstName',
        'CompanyName',
        'Website',
        'Phone',
        'Location',
        'Industry',
        'AuditScore',
        'TopBottleneck',
        'RecommendedService',
        'PersonalizedSubject',
        'PersonalizedEmailBody',
        'SmsHook'
      ];

      for (const p of exportList) {
        const metrics = calculateProspectAuditScores(p, settings);
        // Simple heuristic for first name from business or default to 'Owner'
        const words = (p.businessName || '').split(' ');
        const firstName = words[0] || 'Team';

        rows.push([
          p.email || '',
          firstName,
          p.businessName,
          p.websiteUrl || `https://${p.domain}`,
          p.phone || '',
          p.location || '',
          p.category,
          String(metrics.overallHealthScore),
          metrics.topBottleneck,
          metrics.recommendedService,
          metrics.emailSubject,
          metrics.emailBody,
          metrics.smsHook
        ]);
      }
      break;
    }

    case 'executive': {
      headers = [
        'Company Name',
        'Website',
        'Primary Phone',
        'Primary Email',
        'Location',
        'Industry',
        'Pipeline Status',
        'Audit Health Score',
        'Primary Opportunity',
        'Est Retainer Value',
        'Discovered Date'
      ];

      for (const p of exportList) {
        const metrics = calculateProspectAuditScores(p, settings);
        rows.push([
          p.businessName,
          p.websiteUrl || `https://${p.domain}`,
          p.phone || '',
          p.email || '',
          p.location || '',
          p.category,
          p.status,
          `${metrics.overallHealthScore} / 100`,
          metrics.recommendedService,
          metrics.estimatedRetainerValue,
          p.dateDiscovered
        ]);
      }
      break;
    }

    case 'full_audit':
    default: {
      headers = [
        'Business Name',
        'Domain',
        'Website URL',
        'Phone',
        'Email',
        'City / Location',
        'Category / Industry',
        'Pipeline Status',
        'Date Discovered',
        'Overall Health Score',
        'Mobile & SEO Score',
        'Conversion Architecture Score',
        'Social Proof Score',
        'Video Creative Score',
        'Primary Bottleneck',
        'Recommended Service Pitch',
        'Est Retainer Value',
        'Cold Email Subject',
        'Cold Email Body',
        'SMS Hook',
        'Video Ad Hook',
        'Facebook URL',
        'Instagram URL',
        'LinkedIn URL',
        'YouTube URL',
        'Internal Notes'
      ];

      for (const p of exportList) {
        const metrics = calculateProspectAuditScores(p, settings);
        rows.push([
          p.businessName,
          p.domain,
          p.websiteUrl || `https://${p.domain}`,
          p.phone || '',
          p.email || '',
          p.location || '',
          p.category,
          p.status,
          p.dateDiscovered,
          String(metrics.overallHealthScore),
          String(metrics.mobileSeoScore),
          String(metrics.conversionScore),
          String(metrics.socialScore),
          String(metrics.videoScore),
          metrics.topBottleneck,
          metrics.recommendedService,
          metrics.estimatedRetainerValue,
          metrics.emailSubject,
          metrics.emailBody,
          metrics.smsHook,
          metrics.videoAdHook,
          p.socials?.facebook || '',
          p.socials?.instagram || '',
          p.socials?.linkedin || '',
          p.socials?.youtube || '',
          p.notes || ''
        ]);
      }
      break;
    }
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel respects UTF-8 encoding
  const BOM = '\uFEFF';
  const headerLine = headers.map(escapeCsvCell).join(delimiter);
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(delimiter));

  return BOM + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers a direct browser file download for the CSV string.
 */
export function downloadExportFile(
  content: string,
  filename: string,
  format: 'csv' | 'tsv' = 'csv'
): void {
  const mimeType = format === 'tsv' ? 'text/tab-separated-values;charset=utf-8;' : 'text/csv;charset=utf-8;';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
