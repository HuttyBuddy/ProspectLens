import { describe, it, expect } from 'vitest';
import { extractBusinessIdentity } from '../features/extractor/domExtractor';
import { extractMarketingAudit } from '../features/extractor/signalsExtractor';

describe('DOM & Metadata Extractor', () => {
  it('extracts business identity from JSON-LD schema', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Apex Roofing & Restoration</title>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "RoofingContractor",
              "name": "Apex Roofing & Restoration",
              "telephone": "(303) 555-1234",
              "email": "info@apexroofing.com",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 High St",
                "addressLocality": "Denver",
                "addressRegion": "CO",
                "postalCode": "80202"
              }
            }
          </script>
        </head>
        <body>
          <h1>Denver's Trusted Roofing Contractors</h1>
          <a href="tel:3035551234">Call (303) 555-1234</a>
          <a href="https://facebook.com/apexroofing">Facebook</a>
        </body>
      </html>
    `;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const result = extractBusinessIdentity(doc, 'https://apexroofing.com');

    expect(result.businessName).toBe('Apex Roofing & Restoration');
    expect(result.contacts.phones).toContain('(303) 555-1234');
    expect(result.contacts.emails).toContain('info@apexroofing.com');
    expect(result.contacts.city).toBe('Denver');
    expect(result.contacts.state).toBe('CO');
    expect(result.socials.facebook).toBe('https://facebook.com/apexroofing');
    expect(result.hasJsonLd).toBe(true);
  });

  it('handles websites without email gracefully with empty array', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Quick Clean - Tampa</title></head>
        <body>
          <h1>Tampa Auto Cleaning</h1>
          <a href="tel:8135559988">Call Us</a>
        </body>
      </html>
    `;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const result = extractBusinessIdentity(doc, 'https://tampaclean.com');

    expect(result.contacts.emails).toEqual([]);
    expect(result.contacts.phones.length).toBeGreaterThan(0);
  });

  it('evaluates marketing signals accurately without fake certainty', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Modern Remodeling</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <h1>Bespoke Architectural Remodeling in Denver</h1>
          <button>Get a Quote</button>
          <button>Free Estimate</button>
          <a href="tel:3035559000">Call Now</a>
          <div>Licensed, Insured, 20 Years in Business</div>
          <p>Read our 5-star customer reviews below.</p>
        </body>
      </html>
    `;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const audit = extractMarketingAudit(doc, 'https://modernremodel.com');

    const videoFinding = audit.items.find((i) => i.id === 'video-marketing');
    expect(videoFinding?.status).toBe('Missing');
    expect(videoFinding?.evidence).toContain('No video media found');

    const ctaFinding = audit.items.find((i) => i.id === 'primary-cta');
    expect(ctaFinding?.status).toBe('Strong');

    const trustFinding = audit.items.find((i) => i.id === 'trust-signals');
    expect(trustFinding?.status).toBe('Strong');
  });
});
