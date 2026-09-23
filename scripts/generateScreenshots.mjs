import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function generateStoreScreenshots() {
  console.log('🚀 Launching Puppeteer to capture exact 1280x800 Chrome Web Store screenshots...');

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
    const sidepanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;

    const assetsDir = path.resolve('src/features/store-listing/assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    // 1. Capture Sidepanel Views
    const sidePage = await browser.newPage();
    await sidePage.setViewport({ width: 440, height: 700, deviceScaleFactor: 2 });
    await sidePage.goto(sidepanelUrl, { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Capture View 1: Overview & Opportunity Engine
    const sideOverviewB64 = await sidePage.screenshot({ encoding: 'base64' });

    // Switch to Outreach Tab
    for (const b of await sidePage.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Outreach')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    const sideOutreachB64 = await sidePage.screenshot({ encoding: 'base64' });

    // Switch to Pipeline Tab
    for (const b of await sidePage.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Pipeline')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    // Open CRM Sync modal
    for (const b of await sidePage.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Sync CRM')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    const sideCrmB64 = await sidePage.screenshot({ encoding: 'base64' });

    // Close CRM modal
    for (const b of await sidePage.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.trim() === 'Cancel') {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 400));

    // Open Client Audit PDF Modal
    for (const b of await sidePage.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Overview')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
    for (const b of await sidePage.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('PDF Audit')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    const sideAuditB64 = await sidePage.screenshot({ encoding: 'base64' });

    // 2. Now compose 1280x800 Showcase Pages
    const showcasePage = await browser.newPage();
    await showcasePage.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

    const screenshots = [
      {
        filename: 'screenshot-1-overview-1280x800.jpg',
        badge: 'DISCOVERY & AUDIT COPILOT',
        badgeColor: '#38BDF8',
        title: 'Turn Any Local Business Website Into a Sales Opportunity',
        description: 'Extract brand identity, audit conversion weaknesses, and uncover high-ticket service opportunities in 1 click.',
        imgB64: sideOverviewB64,
        callouts: [
          { icon: '⚡', title: '1-Click Extraction', text: 'Extracts name, contacts, review scores, CTAs, and video presence instantly.' },
          { icon: '🎯', title: 'Opportunity Engine', text: 'Prioritizes services you sell like Video Ads, Speed Optimization, and SEO.' },
          { icon: '🛡️', title: 'Restricted Industry Filter', text: 'Strict zero-scrape policy automatically excludes law firms & real estate.' }
        ]
      },
      {
        filename: 'screenshot-2-audit-pdf-1280x800.jpg',
        badge: 'CLIENT DELIVERABLE',
        badgeColor: '#10B981',
        title: 'Generate Professional 1-Page Growth Audit PDF Reports',
        description: 'Pitch local business owners with objective conversion scorecards, bottleneck analysis, and your agency branding.',
        imgB64: sideAuditB64,
        callouts: [
          { icon: '📊', title: '0-100 Scorecard', text: '4-pillar rating: Conversion Architecture, Visual Ads, Social Proof, and Mobile.' },
          { icon: '🔍', title: 'Revenue Bottlenecks', text: 'Pinpoints concrete leak points to demonstrate why they need your agency.' },
          { icon: '💼', title: 'Whitelabel Header', text: 'Personalized with your agency name, advisor contact, and booking calendar.' }
        ]
      },
      {
        filename: 'screenshot-3-outreach-and-ad-1280x800.jpg',
        badge: 'OUTREACH & VIDEO ADS',
        badgeColor: '#60A5FA',
        title: 'Cold Email Pitches & AI Video Ad Storyboards',
        description: 'Custom multi-touch outreach sequences and 30-second vertical video storyboard concepts ready for Veo & Google Flow.',
        imgB64: sideOutreachB64,
        callouts: [
          { icon: '✉️', title: 'Personalized Email Copy', text: 'Tailored subject lines, observation openers, and frictionless calls-to-action.' },
          { icon: '🎬', title: 'Video Ad Storyboards', text: 'Frame-by-frame 30s TikTok/Reels concepts with visual prompts & audio voiceovers.' },
          { icon: '💬', title: 'SMS Quick Pitch', text: 'Punchy 160-character cold text hooks for fast owner response rates.' }
        ]
      },
      {
        filename: 'screenshot-4-crm-sync-export-1280x800.jpg',
        badge: 'AUTOMATION & PIPELINE',
        badgeColor: '#A78BFA',
        title: '1-Click GoHighLevel Sync & Bulk Lead Exporter',
        description: 'Dispatch leads with audit metrics directly to your CRM webhook or export clean CSV files formatted for Instantly & Apollo.',
        imgB64: sideCrmB64,
        callouts: [
          { icon: '⚡', title: 'Direct Webhook Sync', text: '1-click payload dispatch to GoHighLevel, Zapier, HubSpot, and Make workflows.' },
          { icon: '📋', title: 'Outreach CSV Presets', text: 'Pre-mapped headers for email sequencers like Instantly, Smartlead, and Excel.' },
          { icon: '📈', title: 'Pipeline Tracker', text: 'Organize leads by stage from New Discovery to Proposal Sent and Won.' }
        ]
      }
    ];

    for (const sc of screenshots) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body {
              width: 1280px;
              height: 800px;
              overflow: hidden;
              background: radial-gradient(circle at 75% 20%, #0F172A 0%, #020617 100%);
              color: #FFFFFF;
              display: flex;
              padding: 50px 60px;
              gap: 50px;
              position: relative;
            }
            .grid-pattern {
              position: absolute;
              inset: 0;
              background-image: linear-gradient(to right, rgba(51, 65, 85, 0.12) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(51, 65, 85, 0.12) 1px, transparent 1px);
              background-size: 40px 40px;
              pointer-events: none;
            }
            .left-col {
              flex: 1.2;
              display: flex;
              flex-direction: column;
              justify-content: center;
              z-index: 2;
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 14px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: ${sc.badgeColor};
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid ${sc.badgeColor}40;
              margin-bottom: 20px;
              align-self: flex-start;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            h1 {
              font-size: 38px;
              font-weight: 800;
              line-height: 1.15;
              letter-spacing: -0.02em;
              color: #FFFFFF;
              margin-bottom: 16px;
            }
            p.sub {
              font-size: 17px;
              line-height: 1.5;
              color: #94A3B8;
              margin-bottom: 36px;
            }
            .callouts {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .callout-item {
              display: flex;
              align-items: flex-start;
              gap: 14px;
              background: rgba(15, 23, 42, 0.7);
              border: 1px solid rgba(51, 65, 85, 0.6);
              padding: 14px 18px;
              border-radius: 14px;
              box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .callout-icon {
              font-size: 20px;
              line-height: 1;
              flex-shrink: 0;
              margin-top: 2px;
            }
            .callout-title {
              font-size: 14px;
              font-weight: 700;
              color: #F8FAFC;
              margin-bottom: 3px;
            }
            .callout-desc {
              font-size: 12px;
              color: #94A3B8;
              line-height: 1.4;
            }
            .right-col {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 2;
            }
            .mockup-container {
              width: 440px;
              height: 680px;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(148, 163, 184, 0.2);
              background: #020617;
            }
            .mockup-header {
              height: 28px;
              background: #0F172A;
              border-bottom: 1px solid #1E293B;
              display: flex;
              align-items: center;
              padding: 0 12px;
              gap: 6px;
            }
            .dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }
            .dot-red { background: #EF4444; }
            .dot-yellow { background: #F59E0B; }
            .dot-green { background: #10B981; }
            .mockup-title {
              margin-left: 10px;
              font-size: 10px;
              color: #64748B;
              font-weight: 600;
            }
            .mockup-img {
              width: 100%;
              height: calc(100% - 28px);
              object-fit: cover;
              object-position: top;
            }
          </style>
        </head>
        <body>
          <div class="grid-pattern"></div>
          <div class="left-col">
            <div class="badge">${sc.badge}</div>
            <h1>${sc.title}</h1>
            <p class="sub">${sc.description}</p>
            <div class="callouts">
              ${sc.callouts.map(c => `
                <div class="callout-item">
                  <div class="callout-icon">${c.icon}</div>
                  <div>
                    <div class="callout-title">${c.title}</div>
                    <div class="callout-desc">${c.text}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="right-col">
            <div class="mockup-container">
              <div class="mockup-header">
                <div class="dot dot-red"></div>
                <div class="dot dot-yellow"></div>
                <div class="dot dot-green"></div>
                <span class="mockup-title">ProspectLens Chrome Sidepanel</span>
              </div>
              <img class="mockup-img" src="data:image/png;base64,${sc.imgB64}" />
            </div>
          </div>
        </body>
        </html>
      `;

      await showcasePage.setContent(html, { waitUntil: 'load' });
      await new Promise((r) => setTimeout(r, 400));

      const outputPath = path.join(assetsDir, sc.filename);
      await showcasePage.screenshot({
        path: outputPath,
        type: 'jpeg',
        quality: 95
      });
      console.log(`✅ Generated: ${sc.filename} (Exact 1280x800 JPEG)`);
    }

    console.log('\n🎉 ALL 4 STORE SCREENSHOTS SUCCESSFULLY GENERATED AT 1280x800!\n');
  } finally {
    await browser.close();
  }
}

generateStoreScreenshots().catch((err) => {
  console.error('❌ Failed generating store screenshots:', err);
  process.exit(1);
});
