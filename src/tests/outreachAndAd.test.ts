import { describe, it, expect } from 'vitest';
import { generatePersonalizedOutreach } from '../features/outreach/outreachGenerator';
import { generateAdConcept } from '../features/adConcept/adConceptGenerator';
import { DEMO_BUSINESSES } from '../features/demo/demoData';
import { evaluateOpportunities } from '../features/opportunities/opportunityRules';

describe('Outreach & Ad Concept Generators', () => {
  const moldDemo = DEMO_BUSINESSES[1].data;
  const opps = evaluateOpportunities(moldDemo).allOpportunities;
  const targetOpp = opps[0];

  it('generates multi-channel personalized outreach with no fake claims', () => {
    const emailMsg = generatePersonalizedOutreach({
      channel: 'Email',
      tone: 'Direct',
      opportunity: targetOpp,
      identity: moldDemo.identity,
      senderName: 'Jordan Vance'
    });

    expect(emailMsg.subject).toBeDefined();
    expect(emailMsg.body).toContain(moldDemo.identity.businessName);
    expect(emailMsg.body).toContain('Jordan Vance');
    expect(emailMsg.channel).toBe('Email');
    expect(emailMsg.charCount).toBeGreaterThan(50);
  });

  it('adjusts length with shorter modifier', () => {
    const normal = generatePersonalizedOutreach({
      channel: 'Email',
      tone: 'Friendly',
      opportunity: targetOpp,
      identity: moldDemo.identity
    });

    const shorter = generatePersonalizedOutreach({
      channel: 'Email',
      tone: 'Friendly',
      opportunity: targetOpp,
      identity: moldDemo.identity,
      variantModifier: 'shorter'
    });

    expect(shorter.charCount).toBeLessThan(normal.charCount);
  });

  it('generates structured video ad concepts with storyboard timing and Veo generation prompt', () => {
    const concept = generateAdConcept(moldDemo.identity, targetOpp, 'Problem → Solution', '15s');

    expect(concept.format).toBe('Problem → Solution');
    expect(concept.duration).toBe('15s');
    expect(concept.strategy.hook).toBeDefined();
    expect(concept.shotList.length).toBeGreaterThanOrEqual(3);

    // Prompt check
    expect(concept.generationPrompt).toContain('Veo');
    expect(concept.generationPrompt).toContain(moldDemo.identity.businessName);
  });

  it('generates tailored SaaS/creator ad concepts for tech platforms like Descript', () => {
    const descriptIdentity = {
      businessName: 'Descript',
      domain: 'descript.com',
      websiteUrl: 'https://descript.com',
      category: 'AI Video Editing & SaaS Platform',
      servicesOffered: ['Video Editing', 'Podcast Production', 'AI Voice', 'Transcription'],
      serviceAreas: [],
      contacts: { phones: [], emails: [], addresses: [] },
      socials: {},
      hasJsonLd: false
    };

    const concept = generateAdConcept(descriptIdentity, undefined, 'Before & After', '15s');

    expect(concept.strategy.hook).toContain('cutting raw footage');
    expect(concept.generationPrompt).toContain('Descript');
    expect(concept.generationPrompt).toContain('software platform');
    expect(concept.generationPrompt).not.toContain('craftsmanship');
    expect(concept.generationPrompt).not.toContain('contractor');
    expect(concept.shotList[0].subject).toContain('creator');
    expect(concept.endCard.callToAction).toContain('free');
  });
});
