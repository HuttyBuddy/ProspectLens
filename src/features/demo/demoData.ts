import { WebsiteExtractionResult } from '../extractor/types';

export interface DemoBusiness {
  id: string;
  name: string;
  industry: string;
  url: string;
  data: WebsiteExtractionResult;
}

export const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    id: 'demo-roofing',
    name: 'Summit Peak Roofing Co.',
    industry: 'Roofing Contractor',
    url: 'https://summitpeakroofing-demo.com',
    data: {
      identity: {
        businessName: 'Summit Peak Roofing Co.',
        domain: 'summitpeakroofing-demo.com',
        websiteUrl: 'https://summitpeakroofing-demo.com',
        category: 'Roofing Contractor',
        servicesOffered: ['Residential Roofing', 'Commercial Roof Replacement', 'Storm Damage Inspection', 'Emergency Tarping'],
        serviceAreas: ['Denver', 'Aurora', 'Lakewood', 'Boulder'],
        contacts: {
          phones: ['(303) 555-0194'],
          emails: ['contact@summitpeakroofing-demo.com'],
          addresses: ['4820 Industrial Blvd, Denver, CO 80216'],
          city: 'Denver',
          state: 'CO',
          contactPageUrl: 'https://summitpeakroofing-demo.com/contact',
          aboutPageUrl: 'https://summitpeakroofing-demo.com/about'
        },
        socials: {
          facebook: 'https://facebook.com/summitpeakroofing',
          googleMaps: 'https://maps.google.com/?cid=10928374'
        },
        tagline: 'Denver’s Trusted Residential & Commercial Roofing Experts',
        description: 'Licensed and insured roofing contractors delivering premier shingle, metal, and flat roof installations.',
        hasJsonLd: true
      },
      audit: {
        items: [
          {
            id: 'headline',
            category: 'Website',
            label: 'Clear Value Proposition / Headline',
            status: 'Strong',
            evidence: 'Found descriptive H1: "Denver’s Trusted Residential & Commercial Roofing Experts"'
          },
          {
            id: 'primary-cta',
            category: 'Conversions',
            label: 'Prominent Action CTAs',
            status: 'Present',
            evidence: 'Button "Get An Estimate" found in top header; lacks sticky mobile call button.'
          },
          {
            id: 'phone-visibility',
            category: 'Conversions',
            label: 'Click-to-Call Phone Accessibility',
            status: 'Strong',
            evidence: 'Active tel:(303) 555-0194 tap-to-call link detected.'
          },
          {
            id: 'contact-form',
            category: 'Conversions',
            label: 'Lead Capture Form',
            status: 'Present',
            evidence: 'Standard 4-field inquiry form found on homepage.'
          },
          {
            id: 'video-marketing',
            category: 'Content & Media',
            label: 'Video Marketing & Demonstration',
            status: 'Missing',
            evidence: 'No video media found on this page. High-ticket drone before/after clips could dramatically increase conversion.'
          },
          {
            id: 'social-proof',
            category: 'Trust',
            label: 'Reviews & Social Proof',
            status: 'Present',
            evidence: 'Static customer text quotes found, but no verified Google or Birdeye live review widget.'
          },
          {
            id: 'trust-signals',
            category: 'Trust',
            label: 'Licensing & Guarantees',
            status: 'Strong',
            evidence: 'Mentions "Licensed, Insured, 50-Year GAF Manufacturer Warranty".'
          },
          {
            id: 'structured-data',
            category: 'Trust',
            label: 'Schema.org Structured Data',
            status: 'Present',
            evidence: 'Basic RoofingContractor schema verified.'
          },
          {
            id: 'live-chat',
            category: 'Conversions',
            label: 'Instant Messaging / Web Chat',
            status: 'Missing',
            evidence: 'No 24/7 web chat or SMS inquiry capture tool detected.'
          }
        ],
        summary: 'Solid local foundation with strong licensing, but missing modern video demonstration and after-hours chat capture.',
        analyzedAt: new Date().toISOString()
      },
      meta: {
        pageTitle: 'Summit Peak Roofing Co. | Denver Roofing Contractor',
        url: 'https://summitpeakroofing-demo.com',
        wordCount: 840,
        extractedAt: new Date().toISOString(),
        isSpa: false
      }
    }
  },
  {
    id: 'demo-mold',
    name: 'PureAir Bio-Remediation & Restoration',
    industry: 'Mold Remediation company',
    url: 'https://pureair-restoration-demo.com',
    data: {
      identity: {
        businessName: 'PureAir Bio-Remediation & Restoration',
        domain: 'pureair-restoration-demo.com',
        websiteUrl: 'https://pureair-restoration-demo.com',
        category: 'Mold Remediation & Water Damage',
        servicesOffered: ['Toxic Mold Removal', 'Black Mold Air Testing', 'Basement Flood Dryout', 'Thermal Imaging Leak Detection'],
        serviceAreas: ['Tampa', 'St. Petersburg', 'Clearwater'],
        contacts: {
          phones: ['(813) 555-8291'],
          emails: [], // Test with NO public email found
          addresses: ['1204 Gulf Breeze Way, Tampa, FL 33602'],
          city: 'Tampa',
          state: 'FL',
          contactPageUrl: 'https://pureair-restoration-demo.com/emergency'
        },
        socials: {
          facebook: 'https://facebook.com/pureairtampa'
        },
        tagline: '24/7 Certified Mold Testing and Emergency Remediation',
        description: 'IICRC certified microbial remediation specialists serving the Tampa Bay area.',
        hasJsonLd: false
      },
      audit: {
        items: [
          {
            id: 'headline',
            category: 'Website',
            label: 'Clear Value Proposition / Headline',
            status: 'Strong',
            evidence: 'H1 clearly highlights 24/7 certified mold inspection and water damage response.'
          },
          {
            id: 'primary-cta',
            category: 'Conversions',
            label: 'Prominent Action CTAs',
            status: 'Strong',
            evidence: 'High-contrast "Call for Emergency Dispatch" button prominent above the fold.'
          },
          {
            id: 'phone-visibility',
            category: 'Conversions',
            label: 'Click-to-Call Phone Accessibility',
            status: 'Strong',
            evidence: 'Clickable tel:(813) 555-8291 tap-to-call link detected.'
          },
          {
            id: 'contact-form',
            category: 'Conversions',
            label: 'Lead Capture Form',
            status: 'Missing',
            evidence: 'Requires calling; lacks quick after-hours inspection booking form.'
          },
          {
            id: 'video-marketing',
            category: 'Content & Media',
            label: 'Video Marketing & Demonstration',
            status: 'Missing',
            evidence: 'No video content explaining mold containment or safety protocols to anxious homeowners.'
          },
          {
            id: 'social-proof',
            category: 'Trust',
            label: 'Reviews & Social Proof',
            status: 'Weak',
            evidence: 'Only 1 generic testimonial without client names or verification badges.'
          },
          {
            id: 'structured-data',
            category: 'Trust',
            label: 'Schema.org Structured Data',
            status: 'Missing',
            evidence: 'No Schema.org LocalBusiness structured data found.'
          },
          {
            id: 'social-channels',
            category: 'Content & Media',
            label: 'Active Social Profiles',
            status: 'Weak',
            evidence: 'Only 1 Facebook page linked; inactive presence on other channels.'
          }
        ],
        summary: 'Emergency-focused with high urgent-call priority, but lacks social proof, email contact, and video explanation.',
        analyzedAt: new Date().toISOString()
      },
      meta: {
        pageTitle: 'PureAir Restoration | Certified Mold Removal Tampa',
        url: 'https://pureair-restoration-demo.com',
        wordCount: 620,
        extractedAt: new Date().toISOString(),
        isSpa: false
      }
    }
  },
  {
    id: 'demo-kitchen',
    name: 'Artisan Hearth Kitchen & Bath Remodeling',
    industry: 'Kitchen remodeling company',
    url: 'https://artisanhearth-remodeling-demo.com',
    data: {
      identity: {
        businessName: 'Artisan Hearth Kitchen & Bath Remodeling',
        domain: 'artisanhearth-remodeling-demo.com',
        websiteUrl: 'https://artisanhearth-remodeling-demo.com',
        category: 'Kitchen & Bath Remodeling',
        servicesOffered: ['Luxury Kitchen Redesigns', 'Custom Cabinetry', 'Quartz & Marble Countertops', 'Spa Bathroom Additions'],
        serviceAreas: ['Austin', 'Round Rock', 'West Lake Hills'],
        contacts: {
          phones: ['(512) 555-7730', '(512) 555-7731'], // Multiple phones
          emails: ['design@artisanhearth-demo.com'],
          addresses: ['7400 Shoal Creek Blvd, Austin, TX 78757'],
          city: 'Austin',
          state: 'TX',
          contactPageUrl: 'https://artisanhearth-demo.com/schedule-consultation',
          aboutPageUrl: 'https://artisanhearth-demo.com/our-story'
        },
        socials: {
          instagram: 'https://instagram.com/artisanhearth_atx',
          facebook: 'https://facebook.com/artisanhearth',
          linkedin: 'https://linkedin.com/company/artisanhearth'
        },
        tagline: 'Custom Kitchens Crafted for Timeless Elegance',
        description: 'Award-winning design-build kitchen and bath contractor serving greater Austin.',
        hasJsonLd: true
      },
      audit: {
        items: [
          {
            id: 'headline',
            category: 'Website',
            label: 'Clear Value Proposition / Headline',
            status: 'Strong',
            evidence: 'Elegant H1 highlighting bespoke architectural kitchen renovations.'
          },
          {
            id: 'primary-cta',
            category: 'Conversions',
            label: 'Prominent Action CTAs',
            status: 'Present',
            evidence: 'Schedule Design Consultation button present, but links to an external Calendly without clear value proposition on page.'
          },
          {
            id: 'phone-visibility',
            category: 'Conversions',
            label: 'Click-to-Call Phone Accessibility',
            status: 'Strong',
            evidence: 'Multiple phone numbers detected with active call links.'
          },
          {
            id: 'video-marketing',
            category: 'Content & Media',
            label: 'Video Marketing & Demonstration',
            status: 'Missing',
            evidence: 'Relies solely on high-res static photos; missing 4K video walkthroughs of finished custom cabinet and quartz transformations.'
          },
          {
            id: 'social-proof',
            category: 'Trust',
            label: 'Reviews & Social Proof',
            status: 'Strong',
            evidence: 'Features 5-star Houzz Best of Design badges and client portfolio quotes.'
          },
          {
            id: 'financing',
            category: 'Conversions',
            label: 'Financing & Payment Flexibility',
            status: 'Unable to determine',
            evidence: 'No financing options or monthly estimate breakdowns presented for $40k-$100k renovations.'
          },
          {
            id: 'live-chat',
            category: 'Conversions',
            label: 'Instant Messaging / Web Chat',
            status: 'Missing',
            evidence: 'No instant design chat widget to capture affluent visitors browsing after hours.'
          }
        ],
        summary: 'Stunning luxury brand imagery, but completely missing short video ad storytelling and instant consultative chat.',
        analyzedAt: new Date().toISOString()
      },
      meta: {
        pageTitle: 'Artisan Hearth | Luxury Kitchen Remodeling Austin TX',
        url: 'https://artisanhearth-remodeling-demo.com',
        wordCount: 1150,
        extractedAt: new Date().toISOString(),
        isSpa: true
      }
    }
  }
];
