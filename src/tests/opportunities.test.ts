import { describe, it, expect } from 'vitest';
import { evaluateOpportunities } from '../features/opportunities/opportunityRules';
import { DEMO_BUSINESSES } from '../features/demo/demoData';

describe('Sales Opportunity Engine ("What Should I Sell Them?")', () => {
  it('recommends top 3 opportunities based on audit evidence and prioritized user services', () => {
    const roofingDemo = DEMO_BUSINESSES[0].data;
    const result = evaluateOpportunities(roofingDemo, {
      servicesSold: ['AI Video Advertising', 'Website Redesign', 'SEO']
    });

    expect(result.topOpportunities.length).toBeLessThanOrEqual(3);
    expect(result.topOpportunities.length).toBeGreaterThan(0);

    // AI Video Advertising should be high because roofing is visual and video was missing
    const videoOpp = result.topOpportunities.find((o) => o.service.includes('Video'));
    expect(videoOpp).toBeDefined();
    expect(videoOpp?.confidence).toBe('High');
    expect(videoOpp?.evidence).toContain('Roofing Contractor');
    expect(videoOpp?.salesAngle).toBeDefined();
    expect(videoOpp?.suggestedDeliverable).toBeDefined();
  });

  it('customizes pricing guide when user provides custom rates', () => {
    const roofingDemo = DEMO_BUSINESSES[0].data;
    const result = evaluateOpportunities(roofingDemo, {
      servicesSold: ['AI Video Advertising'],
      customPricing: {
        'AI Video Advertising': '$2,500/mo'
      }
    });

    const videoOpp = result.allOpportunities.find((o) => o.service === 'AI Video Advertising');
    expect(videoOpp?.estimatedPricingGuide).toBe('$2,500/mo');
  });
});
