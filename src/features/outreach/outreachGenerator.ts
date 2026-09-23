import { ServiceOpportunity } from '../opportunities/opportunityTypes';
import { BusinessIdentity } from '../extractor/types';

export type OutreachChannel = 'Email' | 'DM' | 'LinkedIn' | 'SMS' | 'ColdCall';
export type OutreachTone = 'Friendly' | 'Direct' | 'Professional' | 'Casual';

export interface OutreachRequest {
  channel: OutreachChannel;
  tone: OutreachTone;
  opportunity: ServiceOpportunity;
  identity: BusinessIdentity;
  senderName?: string;
  senderCompany?: string;
  customCta?: string;
  variantModifier?: 'default' | 'shorter' | 'more_casual' | 'more_direct';
}

export interface OutreachMessage {
  subject?: string;
  body: string;
  channel: OutreachChannel;
  tone: OutreachTone;
  charCount: number;
}

export function generatePersonalizedOutreach(req: OutreachRequest): OutreachMessage {
  const { channel, tone, opportunity, identity, senderName = 'Alex', senderCompany = 'Local Growth Partners', customCta, variantModifier = 'default' } = req;

  if (identity.category.startsWith('Restricted')) {
    return {
      subject: 'Outreach Generation Prohibited',
      body: 'ProspectLens is strictly configured to not generate outreach for law firms or estate businesses.',
      channel,
      tone,
      charCount: 0
    };
  }

  const targetName = identity.businessName;
  const locationStr = identity.contacts.city ? ` in ${identity.contacts.city}` : '';
  const serviceTarget = opportunity.service;
  const specificObservation = opportunity.evidence.replace(/^The business /i, '').trim();

  let defaultCallToAction = 'Would you be open to seeing a 30-second concept we drafted for you?';
  if (channel === 'SMS') defaultCallToAction = 'Mind if I text over the quick demo link?';
  if (channel === 'ColdCall') defaultCallToAction = 'Do you have 2 minutes to hear how we helped a similar team, or should I email you the quick breakdown?';
  if (channel === 'DM') defaultCallToAction = 'Happy to drop a quick preview link here if you want to take a look.';

  const finalCta = customCta || defaultCallToAction;

  let subject = '';
  let body = '';

  // Channel & Tone matrix
  if (channel === 'Email') {
    if (tone === 'Friendly') {
      subject = `Quick question regarding ${targetName}'s project showcase`;
      body = `Hi ${targetName} team,

I came across ${targetName} while researching leading ${identity.category.toLowerCase()} specialists${locationStr}.

I noticed ${specificObservation}. With the quality of work you do, having ${opportunity.salesAngle.toLowerCase()} could be a massive conversion lift for homeowners evaluating your site.

${finalCta} No hard pitch either way—just thought it might be useful for your team.

Best regards,
${senderName}
${senderCompany ? `| ${senderCompany}` : ''}`;
    } else if (tone === 'Direct') {
      subject = `Idea for ${targetName}: ${serviceTarget}`;
      body = `Hi ${targetName},

I reviewed your site today and noticed ${specificObservation}.

We specialize in ${serviceTarget} for ${identity.category.toLowerCase()} businesses. By implementing ${opportunity.suggestedDeliverable.toLowerCase()}, you can capture more high-margin local jobs that currently slip away.

${finalCta}

Thanks,
${senderName}`;
    } else if (tone === 'Casual') {
      subject = `thought for ${targetName}`;
      body = `Hey team at ${targetName},

Was browsing your website${locationStr} and loved your project portfolio. 

Only thing I noticed was ${specificObservation}. Had an idea for ${serviceTarget.toLowerCase()} that could showcase your transformations really well.

${finalCta}

Cheers,
${senderName}`;
    } else {
      // Professional
      subject = `Growth opportunity regarding ${targetName} | ${serviceTarget}`;
      body = `Dear ${targetName} Management,

During an analysis of local digital presence among top ${identity.category.toLowerCase()} providers${locationStr}, I took note of ${targetName}'s strong foundation.

However, an audit of the web presence highlights that ${specificObservation}. Addressing this with ${opportunity.salesAngle.toLowerCase()} can substantially improve conversion velocity.

${finalCta}

Sincerely,
${senderName}
${senderCompany ? `\n${senderCompany}` : ''}`;
    }
  } else if (channel === 'DM') {
    if (tone === 'Casual' || tone === 'Friendly') {
      body = `Hey ${targetName}! Came across your page while checking out ${identity.category.toLowerCase()} work${locationStr}. 

Noticed ${specificObservation}. We put together a quick concept for ${serviceTarget.toLowerCase()} that would look great on your feed and site.

${finalCta}`;
    } else {
      body = `Hi ${targetName} team, reaching out because I noticed ${specificObservation}. We build ${serviceTarget} for local contractors to boost inbound inquiries. ${finalCta}`;
    }
  } else if (channel === 'LinkedIn') {
    body = `Hi ${targetName} team,

I came across your company while researching reputable ${identity.category.toLowerCase()} firms${locationStr}.

I noticed ${specificObservation}. We help service businesses turn website traffic into signed projects through ${serviceTarget.toLowerCase()}.

${finalCta}

Best,
${senderName}`;
  } else if (channel === 'SMS') {
    body = `Hi ${targetName}, this is ${senderName}. Was looking at your website and noticed ${specificObservation}. Put together a quick idea for ${serviceTarget.toLowerCase()} that could help win more jobs. ${finalCta}`;
  } else if (channel === 'ColdCall') {
    body = `[Opener]: "Hi, this is ${senderName}. I was actually reviewing ${targetName}'s website just now and noticed you do incredible work in ${identity.category.toLowerCase()}, but ${specificObservation}."

[Bridge]: "We help contractors solve that by setting up ${opportunity.suggestedDeliverable.toLowerCase()} so you capture homeowners when they are comparing quotes."

[Ask]: "${finalCta}"`;
  }

  // Handle runtime modifiers: shorter, more_casual, more_direct
  if (variantModifier === 'shorter') {
    if (channel === 'Email') {
      subject = `Quick note: ${targetName}`;
      body = `Hi ${targetName},

Noticed ${specificObservation}.

We put together an idea for ${serviceTarget.toLowerCase()} to help ${targetName} convert more local inquiries.

${finalCta}

Best,
${senderName}`;
    } else {
      body = `Hey ${targetName} - noticed ${specificObservation}. Have a quick idea for ${serviceTarget.toLowerCase()} to boost your local quote volume. ${finalCta}`;
    }
  } else if (variantModifier === 'more_casual') {
    body = body.replace(/Dear/g, 'Hey').replace(/Sincerely,/g, 'Best,').replace(/Management/g, 'folks');
  } else if (variantModifier === 'more_direct') {
    body = `Hi ${targetName},\n\nYour site currently has ${specificObservation}.\n\nWe can implement ${opportunity.suggestedDeliverable} to fix this.\n\n${finalCta}\n\n-${senderName}`;
  }

  return {
    subject: subject || undefined,
    body: body.trim(),
    channel,
    tone,
    charCount: body.length
  };
}
