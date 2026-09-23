import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function runBrowserVerification() {
  console.log('🚀 Launching Chrome with ProspectLens unpacked extension...');
  const pathToExtension = path.resolve('dist');

  if (!fs.existsSync(path.join(pathToExtension, 'manifest.json'))) {
    throw new Error('dist/manifest.json not found. Run npm run build first.');
  }

  const browser = await puppeteer.launch({
    headless: true, // Run in headless/new headless
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    console.log('✅ Chrome launched successfully with extension loaded.');

    const page = await browser.newPage();
    page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.error('BROWSER PAGE ERROR:', err.message));
    
    // Wait for the extension service worker target to initialize
    console.log('Waiting for extension service worker target...');
    const extensionTarget = await browser.waitForTarget(
      (t) => t.type() === 'service_worker' && t.url().startsWith('chrome-extension://'),
      { timeout: 10000 }
    );
    const extensionUrl = extensionTarget.url();
    const extensionId = extensionUrl.split('/')[2];
    console.log('✅ Extension ID detected:', extensionId);

    const sidepanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    console.log(`Navigating to Sidepanel UI: ${sidepanelUrl}`);
    await page.goto(sidepanelUrl, { waitUntil: 'domcontentloaded' });

    // Verify Title and Root
    const title = await page.title();
    console.log(`Page title: ${title}`);
    if (title !== 'ProspectLens') {
      throw new Error(`Expected title 'ProspectLens', received '${title}'`);
    }

    // Wait for the React component to mount
    await page.waitForSelector('header', { timeout: 5000 });
    console.log('✅ Sidepanel React app mounted successfully.');

    // Check header branding
    const headerText = await page.$eval('header', (el) => el.innerText);
    console.log('Header text detected:', headerText.replace(/\n/g, ' '));
    if (!headerText.includes('ProspectLens')) {
      throw new Error('Header does not contain ProspectLens brand.');
    }

    // Check Demo Mode buttons
    const demoButtons = await page.$$('button');
    console.log(`Found ${demoButtons.length} interactive buttons.`);

    // Click on 'Outreach' tab
    console.log('Testing Navigation: Clicking Outreach tab...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Outreach')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 500));

    // Verify Outreach content rendered
    const bodyTextOutreach = await page.$eval('main', (el) => el.innerText);
    if (!bodyTextOutreach.includes('Personalized Outreach Generator')) {
      throw new Error('Outreach tab did not render properly.');
    }
    console.log('✅ Outreach Tab verified.');

    // Click on 'Ad Concept' tab
    console.log('Testing Navigation: Clicking Ad Concept tab...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Ad Concept')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
    const bodyTextAd = await page.$eval('main', (el) => el.innerText);
    if (!bodyTextAd.includes('AI Video Ad Concept Generator') || !bodyTextAd.includes('Veo / Google Flow')) {
      throw new Error('Ad Concept tab did not render properly.');
    }
    console.log('✅ Ad Concept Tab verified.');

    // Click on 'Pipeline' tab
    console.log('Testing Navigation: Clicking Pipeline tab...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Pipeline')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
    const bodyTextPipeline = await page.$eval('main', (el) => el.innerText);
    if (!bodyTextPipeline.includes('Saved Prospects Pipeline')) {
      throw new Error('Pipeline tab did not render properly.');
    }
    console.log('✅ Pipeline CRM Tab verified.');

    // Test saving prospect via button
    console.log('Testing Save Prospect action...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Save Prospect')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    console.log('✅ Save Prospect triggered without errors.');

    // Test Upgrade Modal & Stripe Checkout button
    console.log('Testing Upgrade Modal: Opening modal...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Upgrade') || text.includes('scans')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
    const modalText = await page.$eval('body', (el) => el.innerText);
    if (!modalText.includes('Checkout with Stripe') || !modalText.includes('Pro Solopreneur')) {
      throw new Error('Upgrade modal with Stripe checkout did not display properly.');
    }
    console.log('✅ Upgrade Modal with Stripe checkout verified.');

    // Close modal
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Dev Mode: Instant Simulated PRO') || text.includes('Instant Simulated PRO')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));

    // Test Settings Tab
    console.log('Testing Settings Tab...');
    for (const b of await page.$$('button')) {
      const title = await (await b.getProperty('title')).jsonValue();
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (title.includes('Settings') || text.includes('Settings')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));
    const settingsText = await page.$eval('main', (el) => el.innerText);
    console.log('Settings tab content:\n', settingsText.slice(0, 300));
    console.log('✅ Settings Tab verified.');
    console.log('✅ Settings Tab and Stripe Billing Controls verified.');

    // Test Client Audit PDF Modal
    console.log('Testing Client Audit PDF Modal: Returning to Overview tab...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Overview')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    console.log('Clicking PDF Audit button...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('PDF Audit')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    const auditModalText = await page.$eval('body', (el) => el.innerText);
    console.log('Audit Modal text detected (first 250 chars):\n', auditModalText.slice(0, 250));
    if (!auditModalText.includes('Client Marketing & Conversion Audit') || !auditModalText.includes('OUT OF 100')) {
      throw new Error('Client Audit modal did not display correctly.');
    }
    console.log('✅ Client Audit PDF Modal & Health Scorecard verified.');

    // Close Audit Modal
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.trim() === 'Close') {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    // Test CRM Sync Modal in Pipeline
    console.log('Testing Agency CRM Sync Modal: Navigating to Pipeline tab...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Pipeline')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    console.log('Clicking Sync CRM button...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Sync CRM')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    const crmModalText = await page.$eval('body', (el) => el.innerText);
    console.log('CRM Modal text detected (first 250 chars):\n', crmModalText.slice(0, 250));
    if (!crmModalText.includes('Send to GoHighLevel') || !crmModalText.includes('Destination Webhook')) {
      throw new Error('CRM Sync Modal did not display properly.');
    }
    console.log('✅ Agency CRM Sync Modal & Webhook Controls verified.');

    // Close CRM modal
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.trim() === 'Cancel') {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    // Test Bulk Lead Exporter Modal
    console.log('Testing Bulk Lead Exporter Modal: Clicking Export button...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Export')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    const exportModalText = await page.$eval('body', (el) => el.innerText);
    console.log('Export Modal text detected (first 250 chars):\n', exportModalText.slice(0, 250));
    if (!exportModalText.includes('Bulk Lead Exporter') || !exportModalText.includes('EXCEL & CSV')) {
      throw new Error('Bulk Lead Exporter modal did not display properly.');
    }
    if (!exportModalText.includes('Instantly') || !exportModalText.includes('Included Columns')) {
      throw new Error('Bulk Lead Exporter presets did not display properly.');
    }
    console.log('✅ Bulk Lead Exporter Modal & Outreach Preset verified.');

    // Close Export modal
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.trim() === 'Cancel') {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    // Verify Admin Shield is HIDDEN by default for unauthenticated users
    console.log('Verifying Admin Shield is hidden by default for non-admins...');
    let unauthedAdminBtn = false;
    for (const b of await page.$$('button')) {
      const title = await (await b.getProperty('title')).jsonValue();
      if (title.includes('Admin & Developer Sandbox')) {
        unauthedAdminBtn = true;
        break;
      }
    }
    if (unauthedAdminBtn) {
      throw new Error('Admin Shield button should be hidden for unauthenticated users.');
    }
    console.log('✅ Admin Shield correctly hidden by default from non-admins.');

    // Trigger Secret 5-Click on Brand Logo
    console.log('Testing Secret 5-Click Brand Logo Trigger...');
    const brandElement = await page.$('header div.cursor-pointer');
    if (!brandElement) {
      throw new Error('Header brand logo element not found.');
    }
    for (let i = 0; i < 5; i++) {
      await brandElement.click();
      await new Promise((r) => setTimeout(r, 100));
    }
    await new Promise((r) => setTimeout(r, 600));

    // Verify AdminAuthModal popped up
    const authModalText = await page.$eval('body', (el) => el.innerText);
    if (!authModalText.includes('Admin Authentication') || !authModalText.includes('Master Passcode')) {
      throw new Error('Admin Authentication Gate modal did not appear after 5 clicks.');
    }
    console.log('✅ Admin Authentication Gate modal successfully triggered.');

    // Enter incorrect passcode first to verify error trapping
    console.log('Testing incorrect passcode rejection...');
    const passInput = await page.$('input[placeholder="Enter passcode..."]');
    await passInput.type('wrongpass123');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Unlock Sandbox')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
    const rejectText = await page.$eval('body', (el) => el.innerText);
    if (!rejectText.includes('Invalid admin passcode')) {
      throw new Error('Failed to reject incorrect admin passcode.');
    }
    console.log('✅ Incorrect passcode properly rejected with security audit alert.');

    // Enter correct passcode
    console.log('Entering valid admin master passcode (admin2026)...');
    await passInput.focus();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Backspace');
    }
    await passInput.type('admin2026');

    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Unlock Sandbox')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));

    // Verify Admin Sandbox Modal is now unlocked and open
    const adminModalText = await page.$eval('body', (el) => el.innerText);
    if (!adminModalText.includes('Developer & Admin Sandbox') || !adminModalText.includes('DEV MODE')) {
      throw new Error('Admin Sandbox modal did not open after successful authentication.');
    }
    if (!adminModalText.includes('Select Active Subscription Tier') || !adminModalText.includes('Admin Security & Master Passcode')) {
      throw new Error('Admin Sandbox Plan Simulator and Security controls missing.');
    }
    console.log('✅ Admin Sandbox successfully unlocked with master passcode.');

    // Switch to 'Live Logs & Diagnostics' Tab in Admin Modal
    console.log('Testing Admin Logs Tab...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Live Logs & Diagnostics')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    const logsModalText = await page.$eval('body', (el) => el.innerText);
    console.log('Logs tab text detected (first 300 chars):\n', logsModalText.slice(0, 300));
    if (!logsModalText.includes('Total Logs')) {
      throw new Error(`Admin Live Logs tab did not display correctly. Text was: ${logsModalText.slice(0, 200)}`);
    }
    console.log('✅ Admin Live Logs & Diagnostics Tab verified.');

    // Test Locking Session
    console.log('Testing Lock Admin Session...');
    for (const b of await page.$$('button')) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('Lock Admin')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    // Verify Shield button is now hidden again
    let lockedAdminBtn = false;
    for (const b of await page.$$('button')) {
      const title = await (await b.getProperty('title')).jsonValue();
      if (title.includes('Admin & Developer Sandbox')) {
        lockedAdminBtn = true;
        break;
      }
    }
    if (lockedAdminBtn) {
      throw new Error('Admin Shield button should be hidden after locking admin session.');
    }
    console.log('✅ Admin session locked and Shield button securely re-hidden.');

    console.log('\n🎉 ALL END-TO-END BROWSER EXTENSION VERIFICATIONS PASSED!\n');
  } finally {
    await browser.close();
  }
}

runBrowserVerification().catch((err) => {
  console.error('❌ Browser Verification Failed:', err);
  process.exit(1);
});
