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

  it('evaluates Local SEO signals: full local footprint scores Strong', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Denver Drain Pros</title>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Plumber",
              "name": "Denver Drain Pros",
              "telephone": "(303) 555-0100",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "456 Elm St",
                "addressLocality": "Denver",
                "addressRegion": "CO"
              },
              "areaServed": "Denver Metro"
            }
          </script>
        </head>
        <body>
          <h1>Denver's Trusted Drain Experts</h1>
          <a href="tel:3035550100">Call Now</a>
          <iframe src="https://www.google.com/maps/embed?pb=123"></iframe>
          <a href="https://www.google.com/maps/place/Denver+Drain+Pros">Find us on Google Maps</a>
          <a href="https://www.yelp.com/biz/denver-drain-pros">Yelp reviews</a>
          <p>Leave us a review on Google!</p>
          <p>Proudly serving the Denver metro area.</p>
        </body>
      </html>
    `;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const audit = extractMarketingAudit(doc, 'https://denverdrainpros.com');

    const localItems = audit.items.filter((i) => i.category === 'Local SEO');
    expect(localItems.length).toBe(6);

    const byId = Object.fromEntries(localItems.map((i) => [i.id, i.status]));
    expect(byId['local-schema']).toBe('Strong');
    expect(byId['local-nap']).toBe('Strong');
    expect(byId['local-click-to-call']).toBe('Strong');
    expect(byId['local-maps']).toBe('Strong');
    expect(byId['local-reviews']).toBe('Strong');
    expect(byId['local-service-area']).toBe('Strong');
  });

  it('flags a thin local footprint as Missing/Weak', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Generic Biz</title></head>
        <body><h1>Welcome to our website</h1><p>We do stuff.</p></body>
      </html>
    `;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const audit = extractMarketingAudit(doc, 'https://genericbiz.com');

    const byId = Object.fromEntries(
      audit.items.filter((i) => i.category === 'Local SEO').map((i) => [i.id, i.status])
    );
    expect(byId['local-schema']).toBe('Missing');
    expect(byId['local-maps']).toBe('Missing');
    expect(byId['local-click-to-call']).toBe('Missing');
    expect(['Weak', 'Missing']).toContain(byId['local-nap']);
  });
});
