import { BusinessIdentity, ExtractedContact, SocialLinks } from './types';
import { checkExclusionPolicy } from './exclusionPolicy';

export function extractBusinessIdentity(doc: Document, currentUrl: string): BusinessIdentity {
  const parsedUrl = new URL(currentUrl);
  const domain = parsedUrl.hostname.replace(/^www\./, '');

  // 1. JSON-LD Extraction
  let jsonLdData: any = null;
  const jsonLdScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of jsonLdScripts) {
    try {
      const parsed = JSON.parse(script.textContent || '{}');
      // Look for LocalBusiness, Organization, Store, HomeAndConstructionBusiness, ProfessionalService, etc.
      const candidate = Array.isArray(parsed)
        ? parsed.find((item: any) => isBusinessSchema(item['@type'])) || parsed[0]
        : parsed['@graph']
        ? parsed['@graph'].find((item: any) => isBusinessSchema(item['@type'])) || parsed['@graph'][0]
        : parsed;

      if (candidate && (isBusinessSchema(candidate['@type']) || !jsonLdData)) {
        jsonLdData = candidate;
        if (isBusinessSchema(candidate['@type'])) break;
      }
    } catch {
      // Malformed JSON-LD script, ignore safely
    }
  }

  // 2. Business Name resolution
  let businessName = '';
  if (jsonLdData?.name && typeof jsonLdData.name === 'string') {
    businessName = jsonLdData.name.trim();
  }
  if (!businessName) {
    const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
    if (ogSiteName && ogSiteName.trim().length > 1) {
      businessName = ogSiteName.trim();
    }
  }
  if (!businessName) {
    // Try meta title delimiters
    const title = doc.title || '';
    const parts = title.split(/[-|–—:•]/);
    if (parts.length > 1) {
      // Often the business name is the first or last part
      const firstPart = parts[0].trim();
      const lastPart = parts[parts.length - 1].trim();
      businessName = firstPart.length < 35 && firstPart.length > 2 ? firstPart : lastPart;
    } else if (title.trim()) {
      businessName = title.trim();
    } else {
      // Fallback domain-based name
      const nameFromDomain = domain.split('.')[0];
      businessName = nameFromDomain.charAt(0).toUpperCase() + nameFromDomain.slice(1);
    }
  }

  // Compliance Policy Guard: Strictly NEVER scrape law or estate businesses
  const policyCheck = checkExclusionPolicy(doc, currentUrl, jsonLdData);
  if (policyCheck.isRestricted) {
    return {
      businessName: businessName || 'Restricted Business',
      domain,
      websiteUrl: currentUrl,
      category: `Restricted: ${policyCheck.category}`,
      servicesOffered: [],
      serviceAreas: [],
      contacts: {
        phones: [],
        emails: [],
        addresses: []
      },
      socials: {},
      tagline: 'Scraping blocked by ProspectLens compliance policy.',
      description: 'ProspectLens strictly prohibits scraping or extracting data from law firms and estate businesses.',
      hasJsonLd: !!jsonLdData,
      rawJsonLdSnippet: undefined
    };
  }

  // 3. Contact extraction (Phones, Emails, Address)
  const contacts = extractContacts(doc, jsonLdData, parsedUrl.origin);

  // 4. Social Links
  const socials = extractSocialLinks(doc, jsonLdData);

  // 5. Category & Services offered
  const { category, servicesOffered, serviceAreas } = extractCategoryAndServices(doc, jsonLdData, businessName);

  // 6. Meta description & Tagline
  const metaDescription =
    doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
    '';

  const h1 = doc.querySelector('h1')?.textContent?.trim();
  const tagline = h1 && h1.length < 100 ? h1 : metaDescription.slice(0, 100);

  return {
    businessName,
    domain,
    websiteUrl: currentUrl,
    category: category || 'Local Business',
    servicesOffered: servicesOffered.length > 0 ? servicesOffered : ['Local Services'],
    serviceAreas,
    contacts,
    socials,
    tagline,
    description: metaDescription,
    hasJsonLd: !!jsonLdData,
    rawJsonLdSnippet: jsonLdData ? JSON.stringify(jsonLdData).slice(0, 1000) : undefined
  };
}

function isBusinessSchema(type: string | string[] | undefined): boolean {
  if (!type) return false;
  const types = Array.isArray(type) ? type : [type];
  const targetTypes = [
    'localbusiness',
    'organization',
    'homeandconstructionbusiness',
    'roofingcontractor',
    'plumber',
    'electrician',
    'hvacbusiness',
    'professionalservice',
    'dentist',
    'medicalbusiness',
    'restaurant',
    'store'
  ];
  return types.some((t) => typeof t === 'string' && targetTypes.some((tt) => t.toLowerCase().includes(tt)));
}

function extractContacts(doc: Document, jsonLd: any, origin: string): ExtractedContact {
  const phones = new Set<string>();
  const emails = new Set<string>();
  const addresses = new Set<string>();
  let contactPageUrl: string | undefined;
  let aboutPageUrl: string | undefined;

  // From JSON-LD
  if (jsonLd) {
    if (jsonLd.telephone) {
      const tel = String(jsonLd.telephone).trim();
      if (tel) phones.add(tel);
    }
    if (jsonLd.email) {
      const em = String(jsonLd.email).trim();
      if (em && em.includes('@')) emails.add(em.toLowerCase());
    }
    if (jsonLd.address) {
      const addr = jsonLd.address;
      if (typeof addr === 'string') {
        addresses.add(addr);
      } else if (typeof addr === 'object') {
        const parts = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean);
        if (parts.length > 0) addresses.add(parts.join(', '));
      }
    }
  }

  // Tel links
  const telLinks = doc.querySelectorAll('a[href^="tel:"]');
  telLinks.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const phone = href.replace(/^tel:/i, '').replace(/[^0-9+().\-\s]/g, '').trim();
    if (phone.length >= 7) phones.add(phone);
  });

  // Mailto links
  const mailLinks = doc.querySelectorAll('a[href^="mailto:"]');
  mailLinks.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const cleanMail = href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
    if (cleanMail && cleanMail.includes('@') && !cleanMail.endsWith('.png') && !cleanMail.endsWith('.jpg')) {
      emails.add(cleanMail);
    }
  });

  // Body text regex search for phone numbers if none found
  if (phones.size === 0) {
    const bodyText = doc.body ? doc.body.innerText || doc.body.textContent || '' : '';
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = phoneRegex.exec(bodyText)) !== null && count < 3) {
      phones.add(match[0].trim());
      count++;
    }
  }

  // Regex for emails in visible footer or contact blocks if no mailto found
  if (emails.size === 0) {
    const footer = doc.querySelector('footer, #footer, .footer, .contact');
    const footerText = footer ? footer.textContent || '' : '';
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let match: RegExpExecArray | null;
    while ((match = emailRegex.exec(footerText)) !== null && emails.size < 2) {
      const email = match[1].toLowerCase();
      // Filter out obvious image or font false positives
      if (!email.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i)) {
        emails.add(email);
      }
    }
  }

  // Detect Contact & About page links
  const allLinks = Array.from(doc.querySelectorAll('a[href]'));
  for (const link of allLinks) {
    const href = link.getAttribute('href') || '';
    const text = (link.textContent || '').toLowerCase().trim();
    const resolved = resolveUrl(href, origin);

    if (!contactPageUrl && (text.includes('contact') || href.toLowerCase().includes('contact'))) {
      contactPageUrl = resolved;
    }
    if (!aboutPageUrl && (text.includes('about') || href.toLowerCase().includes('about'))) {
      aboutPageUrl = resolved;
    }
    if (contactPageUrl && aboutPageUrl) break;
  }

  // Infer city & state from address
  let city: string | undefined;
  let state: string | undefined;
  if (addresses.size > 0) {
    const firstAddr = Array.from(addresses)[0];
    const match = firstAddr.match(/([^,]+),\s*([A-Z]{2})\b/);
    if (match) {
      city = match[1].trim();
      state = match[2].trim();
    }
  }

  return {
    phones: Array.from(phones),
    emails: Array.from(emails),
    addresses: Array.from(addresses),
    city,
    state,
    contactPageUrl,
    aboutPageUrl
  };
}

function extractSocialLinks(doc: Document, jsonLd: any): SocialLinks {
  const socials: SocialLinks = {};

  // Check JSON-LD sameAs
  if (jsonLd?.sameAs) {
    const list = Array.isArray(jsonLd.sameAs) ? jsonLd.sameAs : [jsonLd.sameAs];
    for (const url of list) {
      if (typeof url === 'string') matchSocialUrl(url, socials);
    }
  }

  // Check DOM links
  const links = doc.querySelectorAll('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="youtube.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="tiktok.com"], a[href*="yelp.com"]');
  links.forEach((a) => {
    const href = a.getAttribute('href');
    if (href) matchSocialUrl(href, socials);
  });

  return socials;
}

function matchSocialUrl(url: string, socials: SocialLinks) {
  const u = url.toLowerCase();
  if (u.includes('facebook.com/') && !socials.facebook && !u.includes('/sharer')) socials.facebook = url;
  else if (u.includes('instagram.com/') && !socials.instagram) socials.instagram = url;
  else if (u.includes('linkedin.com/') && !socials.linkedin && !u.includes('/share')) socials.linkedin = url;
  else if (u.includes('youtube.com/') && !socials.youtube) socials.youtube = url;
  else if ((u.includes('twitter.com/') || u.includes('x.com/')) && !socials.twitter && !u.includes('/intent')) socials.twitter = url;
  else if (u.includes('tiktok.com/') && !socials.tiktok) socials.tiktok = url;
  else if (u.includes('yelp.com/biz/') && !socials.yelp) socials.yelp = url;
}

function extractCategoryAndServices(doc: Document, jsonLd: any, businessName: string): { category: string; servicesOffered: string[]; serviceAreas: string[] } {
  let category = '';
  const services = new Set<string>();
  const areas = new Set<string>();

  // Check JSON-LD
  if (jsonLd) {
    if (jsonLd['@type']) {
      const typeStr = Array.isArray(jsonLd['@type']) ? jsonLd['@type'].join(', ') : jsonLd['@type'];
      category = formatSchemaType(typeStr);
    }
    if (jsonLd.areaServed) {
      const a = Array.isArray(jsonLd.areaServed) ? jsonLd.areaServed : [jsonLd.areaServed];
      a.forEach((item: any) => {
        const name = typeof item === 'string' ? item : item?.name;
        if (name) areas.add(name);
      });
    }
  }

  // Keyword scan for common local industries
  const fullText = (doc.title + ' ' + (doc.querySelector('meta[name="description"]')?.getAttribute('content') || '') + ' ' + (doc.body ? doc.body.innerText || '' : '')).toLowerCase();

  const industryPatterns = [
    { cat: 'AI Video Editing & SaaS Platform', terms: ['video editing', 'ai video', 'podcast editing', 'transcription', 'screen recording', 'video creation', 'text-based video', 'audiogram'] },
    { cat: 'B2B Software & Technology', terms: ['saas', 'software platform', 'api', 'cloud platform', 'workflow automation', 'developer tools'] },
    { cat: 'Creative & Digital Agency', terms: ['digital agency', 'creative studio', 'production company', 'branding agency', 'video production agency'] },
    { cat: 'E-commerce & Consumer Brand', terms: ['ecommerce', 'online store', 'cart', 'shop now', 'free shipping', 'checkout'] },
    { cat: 'Roofing Contractor', terms: ['roofing', 'roof replacement', 'roof repair', 'shingles', 'gutters'] },
    { cat: 'Mold Remediation & Water Damage', terms: ['mold remediation', 'water damage', 'mold removal', 'flood restoration'] },
    { cat: 'Kitchen & Bath Remodeling', terms: ['kitchen remodeling', 'bathroom remodel', 'cabinet refacing', 'countertops', 'custom kitchen'] },
    { cat: 'HVAC Services', terms: ['hvac', 'air conditioning', 'furnace repair', 'heating and cooling', 'ac repair'] },
    { cat: 'Plumbing Services', terms: ['plumbing', 'drain cleaning', 'water heater', 'emergency plumber', 'leak detection'] },
    { cat: 'Electrician Services', terms: ['electrical contractor', 'licensed electrician', 'ev charger installation', 'panel upgrade'] },
    { cat: 'Landscaping & Tree Service', terms: ['landscaping', 'tree removal', 'lawn care', 'hardscaping', 'irrigation'] },
    { cat: 'Dental Practice', terms: ['dental', 'dentist', 'cosmetic dentistry', 'teeth whitening', 'implants', 'orthodontics'] },
    { cat: 'Auto Repair & Detailing', terms: ['auto repair', 'mechanic', 'car detailing', 'brake service', 'transmission repair'] },
    { cat: 'Commercial Cleaning', terms: ['janitorial', 'commercial cleaning', 'office cleaning', 'pressure washing'] }
  ];

  for (const item of industryPatterns) {
    const matches = item.terms.filter((t) => fullText.includes(t));
    if (matches.length >= 2 || (matches.length >= 1 && !category)) {
      if (!category || category === 'Local Business' || category === 'Organization') {
        category = item.cat;
      }
      matches.forEach((m) => services.add(capitalize(m)));
    }
  }

  // Search service navigation links
  const serviceLinks = doc.querySelectorAll('a[href*="service"], nav a, .nav a, header a');
  serviceLinks.forEach((a) => {
    const text = (a.textContent || '').trim();
    if (text.length > 3 && text.length < 35 && !text.toLowerCase().includes('home') && !text.toLowerCase().includes('contact') && !text.toLowerCase().includes('about')) {
      if (services.size < 8) {
        services.add(text);
      }
    }
  });

  return {
    category: category || 'Local Business',
    servicesOffered: Array.from(services).slice(0, 10),
    serviceAreas: Array.from(areas)
  };
}

function formatSchemaType(schemaType: string): string {
  const clean = schemaType.replace(/http:\/\/schema\.org\//g, '').replace(/https:\/\/schema\.org\//g, '');
  return clean
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

function resolveUrl(href: string, origin: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('/')) return `${origin}${href}`;
  return `${origin}/${href}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
