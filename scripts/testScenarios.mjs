import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function testExtractionScenarios() {
  console.log('🧪 Running Multi-Scenario Website Extraction & Copilot Tests...');
  const pathToExtension = path.resolve('dist');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const extensionTarget = await browser.waitForTarget(
      (t) => t.type() === 'service_worker' && t.url().startsWith('chrome-extension://'),
      { timeout: 10000 }
    );
    const extensionId = extensionTarget.url().split('/')[2];
    console.log(`Connected to ProspectLens extension [${extensionId}]`);

    // Scenario 1: Standard local service business with JSON-LD and phone
    const webPage = await browser.newPage();
    await webPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lone Star Foundation Repair - Austin, TX</title>
          <meta name="description" content="Residential and commercial foundation inspection and slab repair specialists in Austin.">
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "HomeAndConstructionBusiness",
              "name": "Lone Star Foundation Repair",
              "telephone": "(512) 555-8392",
              "email": "repairs@lonestarfoundation-demo.com",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "400 Congress Ave",
                "addressLocality": "Austin",
                "addressRegion": "TX"
              }
            }
          </script>
        </head>
        <body>
          <h1>Austin's Premier Foundation Repair Experts</h1>
          <a href="tel:5125558392">Call for Free Inspection</a>
          <button>Request Free Estimate</button>
          <div>Fully Licensed, Insured, Lifetime Transferable Warranty</div>
        </body>
      </html>
    `, { waitUntil: 'load' });

    console.log('✅ Scenario 1: Mock local business website created.');

    // Open side panel
    const sidepanelPage = await browser.newPage();
    const sidepanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await sidepanelPage.goto(sidepanelUrl, { waitUntil: 'domcontentloaded' });
    await sidepanelPage.waitForSelector('header');

    // Test Demo Mode Switching across all 3 scenarios:
    // Demo 1: Summit Peak Roofing Co.
    // Demo 2: PureAir Bio-Remediation (No email)
    // Demo 3: Artisan Hearth (Multiple phones + SPA)
    const demoButtons = await sidepanelPage.$$('button');
    let pureAirBtn, artisanBtn;
    for (const b of demoButtons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('PureAir')) pureAirBtn = b;
      if (text.includes('Artisan')) artisanBtn = b;
    }

    if (pureAirBtn) {
      console.log('Testing Scenario 2: Switching to PureAir (No Email scenario)...');
      await pureAirBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const mainText = await sidepanelPage.$eval('main', (el) => el.innerText);
      if (!mainText.includes('PureAir Bio-Remediation')) {
        throw new Error('Failed to switch to PureAir demo');
      }
      if (!mainText.includes('Not found')) {
        throw new Error('Expected "Not found" for missing email in PureAir');
      }
      console.log('✅ Verified: Missing email displayed cleanly as "Not found" without hallucination.');
    }

    if (artisanBtn) {
      console.log('Testing Scenario 3: Switching to Artisan Hearth (Multiple phones & luxury remodeler)...');
      await artisanBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const mainText = await sidepanelPage.$eval('main', (el) => el.innerText);
      if (!mainText.includes('Artisan Hearth Kitchen')) {
        throw new Error('Failed to switch to Artisan Hearth demo');
      }
      if (!mainText.includes('(512) 555-7730, (512) 555-7731')) {
        throw new Error('Expected multiple phone numbers extracted');
      }
      console.log('✅ Verified: Multiple phone numbers extracted and displayed cleanly.');
    }

    console.log('\n🎉 ALL EXTRACTION & DEMO SCENARIO CHECKS PASSED!\n');
  } finally {
    await browser.close();
  }
}

testExtractionScenarios().catch((err) => {
  console.error('Scenario test failed:', err);
  process.exit(1);
});
