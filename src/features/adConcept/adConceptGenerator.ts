import { BusinessIdentity } from '../extractor/types';
import { ServiceOpportunity } from '../opportunities/opportunityTypes';

export type AdFormat =
  | 'Cinematic'
  | 'High Stakes'
  | 'Before & After'
  | 'Testimonial'
  | 'Problem → Solution'
  | 'Funny'
  | 'Premium/Luxury'
  | 'Fast-Paced Social';

export type VideoDuration = '8s' | '10s' | '15s' | '30s';

export interface ShotItem {
  shotNumber: number;
  durationSeconds: number;
  scene: string;
  subject: string;
  cameraMovement: string;
  lighting: string;
  action: string;
  soundSfx: string;
  textOverlay: string;
}

export interface AdConcept {
  format: AdFormat;
  duration: VideoDuration;
  strategy: {
    hook: string;
    targetCustomer: string;
    corePainPoint: string;
    corePromise: string;
    callToAction: string;
  };
  shotList: ShotItem[];
  voiceover: string[];
  endCard: {
    headline: string;
    subheadline: string;
    callToAction: string;
    contactInfo: string;
    motionGraphicsNote: string;
  };
  generationPrompt: string; // Polished prompt for Google Flow / Veo / Sora
}

type BusinessArchetype = 'software' | 'agency' | 'ecommerce' | 'professional' | 'contractor';

function detectArchetype(identity: BusinessIdentity): BusinessArchetype {
  const text = (
    identity.businessName +
    ' ' +
    identity.domain +
    ' ' +
    identity.category +
    ' ' +
    (identity.tagline || '') +
    ' ' +
    (identity.description || '') +
    ' ' +
    identity.servicesOffered.join(' ')
  ).toLowerCase();

  if (
    /video editing|descript|podcast|software|saas|app|platform|transcription|cloud|screen record|ai tool/i.test(
      text
    )
  ) {
    return 'software';
  }
  if (/agency|marketing|consulting|creative studio|production company|design studio/i.test(text)) {
    return 'agency';
  }
  if (/store|shop|apparel|clothing|products|brand|ecommerce|cart/i.test(text)) {
    return 'ecommerce';
  }
  if (/legal|law|attorney|accounting|cpa|financial|medical|clinic|doctor|dent/i.test(text)) {
    return 'professional';
  }
  return 'contractor';
}

export function generateAdConcept(
  identity: BusinessIdentity,
  opportunity?: ServiceOpportunity,
  format: AdFormat = 'Before & After',
  duration: VideoDuration = '15s'
): AdConcept {
  if (identity.category.startsWith('Restricted')) {
    return {
      format,
      duration,
      strategy: {
        hook: 'Ad concept generation disabled by compliance policy.',
        targetCustomer: 'N/A',
        corePainPoint: 'Law and estate businesses are excluded by strict policy.',
        corePromise: 'N/A',
        callToAction: 'N/A'
      },
      shotList: [],
      voiceover: ['Ad concept generation is disabled for law and estate businesses.'],
      endCard: {
        headline: 'Restricted Category',
        subheadline: 'Generation Prohibited',
        callToAction: 'N/A',
        contactInfo: 'N/A',
        motionGraphicsNote: 'None'
      },
      generationPrompt: 'Ad concept generation is disabled for law and estate businesses under ProspectLens compliance policy.'
    };
  }

  const business = identity.businessName;
  const category = identity.category;
  const archetype = detectArchetype(identity);
  const totalSec = duration === '8s' ? 8 : duration === '10s' ? 10 : duration === '15s' ? 15 : 30;

  let hook = '';
  let pain = '';
  let promise = '';
  let cta = '';
  let targetAudience = '';
  let subheadline = '';

  // Archetype-aware positioning
  if (archetype === 'software') {
    targetAudience = `Content creators, video editors, podcasters, and marketing teams looking to produce studio-grade video 10x faster.`;
    subheadline = `Next-Generation ${category}`;

    if (format === 'Before & After') {
      hook = `Stop spending 8 hours cutting raw footage by hand.`;
      pain = `Tedious timeline scrubbing, sync issues, and endless filler word cutting killing your creative output.`;
      promise = `Edit video as effortlessly as editing a text doc with ${business}. Instant captions, studio sound, and AI cuts in seconds.`;
      cta = `Try ${business} for free today!`;
    } else if (format === 'Problem → Solution') {
      hook = `What if video editing felt as simple as writing an email?`;
      pain = `Traditional editing software feels like flying an airplane just to trim a 30-second social clip.`;
      promise = `AI-powered text-based editing, one-click filler word removal, and automatic multitrack captions with ${business}.`;
      cta = `Start creating for free on ${business}.`;
    } else if (format === 'Fast-Paced Social') {
      hook = `How top creators publish 10 viral clips a day without an agency.`;
      pain = `Spending the entire weekend manually editing instead of growing your audience.`;
      promise = `Automate clips, transcriptions, and eye-catching animations instantly with ${business}.`;
      cta = `Level up your content workflow with ${business}.`;
    } else {
      hook = `Transform your raw recording into a published masterpiece in minutes.`;
      pain = `Complex timelines and wasted hours on mundane audio cleanup.`;
      promise = `All-in-one AI recording, editing, and publishing workflow powered by ${business}.`;
      cta = `Get started with ${business} for free.`;
    }
  } else if (archetype === 'agency') {
    targetAudience = `Founders, CMOs, and growth leads seeking high-converting creative campaigns and measurable ROI.`;
    subheadline = `Premier Creative & Growth Studio`;

    hook = `Tired of vanity metrics that don't produce pipeline revenue?`;
    pain = `Burning marketing budget on generic creative that fails to differentiate your brand.`;
    promise = `Bespoke, data-backed growth strategies and high-performing creative built by ${business}.`;
    cta = `Book your strategic growth consultation with ${business}.`;
  } else if (archetype === 'ecommerce') {
    targetAudience = `Discerning consumers seeking superior quality, authentic design, and verified customer satisfaction.`;
    subheadline = `Curated Collection`;

    hook = `Experience the difference designed for everyday life.`;
    pain = `Settling for generic alternatives that wear out or disappoint.`;
    promise = `Uncompromising quality, thoughtful details, and guaranteed satisfaction from ${business}.`;
    cta = `Shop the latest release at ${business}.`;
  } else if (archetype === 'professional') {
    targetAudience = `Clients requiring trusted, experienced, and confidential professional expertise.`;
    subheadline = `Trusted Professional Advisory`;

    hook = `Navigating complex decisions requires experienced advisors you can trust.`;
    pain = `Uncertainty, costly compliance oversights, and lack of dedicated guidance.`;
    promise = `Proven track record, confidential consultation, and strategic clarity with ${business}.`;
    cta = `Schedule your confidential consultation with ${business}.`;
  } else {
    // Local contractor / physical service
    const location = identity.contacts.city ? `in ${identity.contacts.city}` : 'locally';
    targetAudience = `Homeowners and commercial property managers ${location} seeking trusted ${category.toLowerCase()} specialists.`;
    subheadline = `Premier ${category} Specialists`;

    if (format === 'Before & After') {
      hook = `Watch this outdated space transform into a masterpiece in seconds.`;
      pain = `Living with an old, worn-out setup that lowers your property value and ruins your daily comfort.`;
      promise = `Turn your vision into reality with expert ${category.toLowerCase()} from ${business}.`;
      cta = `Tap below to get your fast, free estimate from ${business}!`;
    } else if (format === 'High Stakes') {
      hook = `Don't ignore the warning signs before costly structural damage sets in.`;
      pain = `Small leaks or wear turning into an emergency repair bill running thousands of dollars.`;
      promise = `Certified inspection and rock-solid protection from the trusted team at ${business}.`;
      cta = `Schedule your urgent inspection with ${business}!`;
    } else {
      hook = `Is your ${category.toLowerCase()} causing you hidden stress?`;
      pain = `Dealing with messy, unreliable contractors who leave jobs half-done or surprise you with unexpected costs.`;
      promise = `Precision craftsmanship, honest upfront quotes, and flawless results guaranteed by ${business}.`;
      cta = `Get your free consultation from ${business}!`;
    }
  }

  // Build Shot List
  const shotList: ShotItem[] = [];

  if (archetype === 'software') {
    if (totalSec <= 10) {
      shotList.push({
        shotNumber: 1,
        durationSeconds: 3,
        scene: 'The Bottleneck / Creator Friction',
        subject: 'Content creator staring overwhelmed at complex, messy multi-track editing software with 100 confusing buttons',
        cameraMovement: 'Fast macro push-in on exhausted eyes and cluttered screen',
        lighting: 'Dim moody desk lamp with neon blue monitor glow',
        action: 'Creator sighs in frustration as timeline crashes or takes forever to render',
        soundSfx: 'Heavy keyboard clatter followed by error buzz and clock ticking',
        textOverlay: hook
      });
      shotList.push({
        shotNumber: 2,
        durationSeconds: 4,
        scene: 'The AI Breakthrough',
        subject: `Sleek modern UI of ${business} in dark mode with smooth waveform transcript`,
        cameraMovement: 'Dynamic whip-pan into high-speed UI interaction',
        lighting: 'Vibrant modern studio illumination, crisp screen glare',
        action: 'User simply highlights text transcript, presses delete, and video cut renders instantly in real time',
        soundSfx: 'Satisfying digital whoosh and crisp mechanical key click',
        textOverlay: 'Edit Video Like Text'
      });
      shotList.push({
        shotNumber: 3,
        durationSeconds: totalSec - 7,
        scene: 'Viral Finish & Creator Joy',
        subject: 'Polished vertical video playing with animated captions and studio sound as creator smiles with satisfaction',
        cameraMovement: 'Fast rotational zoom-out revealing millions of views',
        lighting: 'Bright, energetic creator studio rim light',
        action: 'Creator hits export in 1 click and high-fives collaborator',
        soundSfx: 'Upbeat modern synth drop and applause chime',
        textOverlay: `${business} | Try It Free`
      });
    } else {
      // 15s or 30s
      const s1 = Math.round(totalSec * 0.25);
      const s2 = Math.round(totalSec * 0.45);
      const s3 = Math.round(totalSec * 0.3);

      shotList.push({
        shotNumber: 1,
        durationSeconds: s1,
        scene: 'The Creator Struggle',
        subject: 'Video creator trapped in agonizing hours of manual timeline slicing and sync errors',
        cameraMovement: 'Slow tracking push-in with shallow depth of field',
        lighting: 'Late-night dim studio atmosphere with cold blue monitor light',
        action: 'Creator rubs forehead looking at a timeline that will take 5 more hours to finish',
        soundSfx: 'Subtle low bass tension rumble, mouse clicking furiously',
        textOverlay: hook
      });
      shotList.push({
        shotNumber: 2,
        durationSeconds: s2,
        scene: 'The Magic of AI Workflow',
        subject: `Intuitive ${business} interface transforming speech into text, auto-removing filler words and enhancing audio`,
        cameraMovement: 'Smooth 4K screen capture motion graphics with kinetic typography',
        lighting: 'Clean, luminous product showcase lighting',
        action: 'Words "um" and "uh" vanish with 1 click; studio voice effect toggles on with instant waveform leveling',
        soundSfx: 'Energetic upbeat future-bass beat kicks in with pristine vocal clarity',
        textOverlay: 'AI Video Editing Made Effortless'
      });
      shotList.push({
        shotNumber: 3,
        durationSeconds: s3,
        scene: 'Studio-Grade Results & Instant Export',
        subject: 'Show-stopping social clip ready for YouTube, TikTok, and podcasts with flawless captions',
        cameraMovement: 'Dynamic parallax floating screen mockup with branded elements',
        lighting: 'Vibrant, high-contrast creator aesthetic with subtle gradients',
        action: 'Finished video published; creator leans back smiling in awe at the time saved',
        soundSfx: 'Triumphant sonic crescendo and modern brand audio logo',
        textOverlay: `${business} — Create Faster`
      });
    }
  } else {
    // Physical / Contractor Workflow
    if (totalSec <= 10) {
      shotList.push({
        shotNumber: 1,
        durationSeconds: 3,
        scene: 'Problem State / Emotional Trigger',
        subject: `Close-up of worn down or damaged ${category.toLowerCase()} elements`,
        cameraMovement: 'Slow dramatic push-in with macro depth of field',
        lighting: 'Cool moody shadows highlighting texture and flaws',
        action: 'Customer looks on frustrated with visible concern',
        soundSfx: 'Subtle low bass boom with ticking clock',
        textOverlay: hook
      });
      shotList.push({
        shotNumber: 2,
        durationSeconds: 4,
        scene: 'The Transformation / Craft in Action',
        subject: `Skilled craftsperson from ${business} installing premium materials with precision`,
        cameraMovement: 'Dynamic whip-pan into high-speed slider tracking shot',
        lighting: 'Bright, warm natural golden sunlight',
        action: 'Sparks fly / clean install snap into place, revealing gleaming finish',
        soundSfx: 'Satisfying high-fidelity tool snap followed by upbeat swell',
        textOverlay: 'Engineered for Perfection'
      });
      shotList.push({
        shotNumber: 3,
        durationSeconds: totalSec - 7,
        scene: 'Pristine Finished Result & Relief',
        subject: 'Stunning completed project with delighted client smiling',
        cameraMovement: 'Wide cinematic arc tracking shot',
        lighting: 'Luminous cinematic daylight, architectural grade',
        action: 'Client inspects pristine work and nods approvingly',
        soundSfx: 'Inspiring musical flourish, warm resonant chord',
        textOverlay: `${business} | Get Started`
      });
    } else {
      const s1 = Math.round(totalSec * 0.25);
      const s2 = Math.round(totalSec * 0.4);
      const s3 = Math.round(totalSec * 0.35);

      shotList.push({
        shotNumber: 1,
        durationSeconds: s1,
        scene: 'The Relatable Problem',
        subject: `Damaged, weathered, or outdated ${category.toLowerCase()} needing urgent care`,
        cameraMovement: 'Dynamic handheld tilt showing depth of wear',
        lighting: 'Overcast, cold ambient lighting',
        action: 'Focus pulls from flaw to troubled client',
        soundSfx: 'Subtle ominous drone and audio tension',
        textOverlay: hook
      });
      shotList.push({
        shotNumber: 2,
        durationSeconds: s2,
        scene: 'The Expert Solution',
        subject: `Professional team from ${business} arriving with premium gear`,
        cameraMovement: 'Smooth gimbal tracking shot moving along the project line',
        lighting: 'Warm, vibrant afternoon golden hour illumination',
        action: 'Expert execution sequence showing meticulous attention to detail',
        soundSfx: 'Rhythmic, modern upbeat percussion track building energy',
        textOverlay: 'Master Craft. Flawless Execution.'
      });
      shotList.push({
        shotNumber: 3,
        durationSeconds: s3,
        scene: 'The Breathtaking Reveal & Trust Call',
        subject: 'Show-stopping reveal of completed project looking brand new',
        cameraMovement: 'Soaring drone pull-back or sweeping low-angle hero shot',
        lighting: 'Crisp, radiant high-end photography style',
        action: 'Delighted client embraces partner with relief; high-contrast before/after split screen',
        soundSfx: 'Triumphant sonic crescendo and branded audio chime',
        textOverlay: `${business} | Trusted Quality`
      });
    }
  }

  // Voiceover Script
  const voiceover =
    archetype === 'software'
      ? [
          `[00:00 - 00:03]: "${hook}"`,
          `[00:03 - 00:09]: "With ${business}, you edit video just like a document—automatic captions, instant audio cleanup, and AI cuts in seconds."`,
          `[00:09 - 00:${totalSec.toString().padStart(2, '0')}]: "${cta} Start creating free today."`
        ]
      : [
          `[00:00 - 00:03]: "${hook}"`,
          `[00:03 - 00:09]: "At ${business}, we deliver flawless results with transparent quotes and zero guesswork."`,
          `[00:09 - 00:${totalSec.toString().padStart(2, '0')}]: "${cta}"`
        ];

  // End Card
  const phone = identity.contacts.phones[0];
  const contactLine = phone
    ? `${identity.websiteUrl} | ${phone}`
    : identity.websiteUrl || identity.domain;

  const endCard = {
    headline: business,
    subheadline,
    callToAction: cta,
    contactInfo: contactLine,
    motionGraphicsNote:
      archetype === 'software'
        ? 'Sleek dark mode product logo with smooth glowing cyan border and subtle waveform particle effect.'
        : 'Clean animated badge with verified rating icon and subtle shimmer over the company logo.'
  };

  // Generation Prompt
  let generationPrompt = '';
  if (archetype === 'software') {
    generationPrompt = `[Google Flow / Veo Text-To-Video Prompt]
Cinematic ${duration} 4K vertical social commercial for innovative software platform "${business}".
Industry: ${category}.
Style: ${format}, modern tech creator studio aesthetic, shot on Arri Alexa Mini LF, 35mm anamorphic lens, high-contrast dark mode lighting with electric blue and cyan accent glows.
Narrative arc:
1. Hook: ${hook} showing exhausted content creator overwhelmed by cluttered legacy timeline software late at night.
2. Climax: Seamless UI transformation into "${business}"—editing video as easily as editing text, automated captions snapping to speech, pristine studio audio wave leveling.
3. Outcome: Creator delighted and relaxed as high-production vertical social video exports in seconds with viral aesthetics.
End frame: Clean modern dark branding for "${business}", showing clear call to action "${cta}".
No cartoon artifacts, photorealistic human expressions, crisp monitor reflections, natural motion blur.`;
  } else {
    generationPrompt = `[Google Flow / Veo Text-To-Video Prompt]
Cinematic ${duration} 4K vertical social commercial for service business "${business}".
Industry: ${category}.
Style: ${format}, shot on Arri Alexa Mini LF, 35mm anamorphic lens, warm golden hour lighting, hyper-realistic textures.
Narrative arc:
1. Hook: ${hook} showing authentic relatable setting.
2. Climax: High-speed precision craftsmanship and professional team at work, satisfying tactile details.
3. Outcome: Pristine finished transformation with delighted clients.
End frame: Professional branding for "${business}", showing verified badge and clear call to action "${cta}".
No cartoon artifacts, no uncanny valley, realistic human expressions, natural motion blur.`;
  }

  return {
    format,
    duration,
    strategy: {
      hook,
      targetCustomer: targetAudience,
      corePainPoint: pain,
      corePromise: promise,
      callToAction: cta
    },
    shotList,
    voiceover,
    endCard,
    generationPrompt
  };
}
