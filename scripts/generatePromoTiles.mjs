import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function generatePromoTiles() {
  console.log('🎨 Generating exact 440x280 and 1400x560 Chrome Web Store promo tiles...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const assetsDir = path.resolve('src/features/store-listing/assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  const page = await browser.newPage();

  // ==========================================
  // 1. SMALL PROMO TILE (EXACTLY 440 x 280 PX)
  // ==========================================
  console.log('Rendering Small Promo Tile (440 x 280)...');
  await page.setViewport({ width: 440, height: 280, deviceScaleFactor: 1 });

  const smallTileHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body {
          width: 440px;
          height: 280px;
          overflow: hidden;
          background: radial-gradient(circle at 50% 20%, #1E293B 0%, #020617 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          border: 1px solid rgba(56, 189, 248, 0.25);
        }
        .grid-bg {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .glow {
          position: absolute;
          width: 220px;
          height: 140px;
          background: #2563EB;
          filter: blur(60px);
          opacity: 0.35;
          top: 30px;
        }
        .content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo-wrap {
          width: 68px;
          height: 68px;
          border-radius: 18px;
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          position: relative;
        }
        .logo-p {
          font-size: 38px;
          font-weight: 900;
          color: #FFFFFF;
          line-height: 1;
        }
        .lens-ring {
          position: absolute;
          width: 28px;
          height: 28px;
          border: 2px dashed #38BDF8;
          border-radius: 50%;
          top: 10px;
          right: 10px;
        }
        .title {
          font-size: 26px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .subtitle {
          font-size: 13px;
          font-weight: 600;
          color: #38BDF8;
          letter-spacing: 0.02em;
          margin-bottom: 16px;
        }
        .pills {
          display: flex;
          gap: 8px;
        }
        .pill {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.35);
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          color: #F8FAFC;
          letter-spacing: 0.02em;
        }
      </style>
    </head>
    <body>
      <div class="grid-bg"></div>
      <div class="glow"></div>
      <div class="content">
        <div class="logo-wrap">
          <div class="lens-ring"></div>
          <span class="logo-p">P</span>
        </div>
        <div class="title">ProspectLens</div>
        <div class="subtitle">B2B Lead & Video Ad Copilot</div>
        <div class="pills">
          <span class="pill">⚡ 1-Click Extraction</span>
          <span class="pill">📄 Client PDF Audits</span>
          <span class="pill">🚀 CRM Sync</span>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(smallTileHtml, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 400));

  const smallTilePath = path.join(assetsDir, 'promo-tile-small-440x280.jpg');
  await page.screenshot({
    path: smallTilePath,
    type: 'jpeg',
    quality: 95
  });
  console.log('✅ Generated promo-tile-small-440x280.jpg (Exact 440x280 JPEG)');


  // ==========================================
  // 2. MARQUEE BANNER TILE (EXACTLY 1400 x 560 PX)
  // ==========================================
  console.log('Rendering Marquee Promo Tile (1400 x 560)...');
  await page.setViewport({ width: 1400, height: 560, deviceScaleFactor: 1 });

  const marqueeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body {
          width: 1400px;
          height: 560px;
          overflow: hidden;
          background: radial-gradient(circle at 75% 25%, #1E293B 0%, #020617 100%);
          display: flex;
          align-items: center;
          padding: 0 80px;
          gap: 60px;
          position: relative;
        }
        .grid-bg {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .glow-left {
          position: absolute;
          width: 450px;
          height: 350px;
          background: #2563EB;
          filter: blur(120px);
          opacity: 0.3;
          top: 100px;
          left: 50px;
        }
        .glow-right {
          position: absolute;
          width: 400px;
          height: 300px;
          background: #0284C7;
          filter: blur(100px);
          opacity: 0.25;
          top: 80px;
          right: 150px;
        }
        .left-col {
          flex: 1.25;
          z-index: 2;
          display: flex;
          flex-direction: column;
        }
        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #38BDF8;
          margin-bottom: 20px;
          align-self: flex-start;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        h1 {
          font-size: 48px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.025em;
          color: #FFFFFF;
          margin-bottom: 18px;
        }
        h1 span {
          background: linear-gradient(135deg, #38BDF8 0%, #60A5FA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p.desc {
          font-size: 18px;
          line-height: 1.5;
          color: #94A3B8;
          margin-bottom: 30px;
          max-width: 620px;
        }
        .feature-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .chip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(51, 65, 85, 0.8);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          color: #F8FAFC;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }
        .chip-icon {
          color: #38BDF8;
        }
        .right-col {
          flex: 1;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ui-card {
          width: 480px;
          background: #020617;
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 20px;
          box-shadow: 0 25px 60px -10px rgba(0,0,0,0.8), 0 0 30px rgba(37, 99, 235, 0.25);
          overflow: hidden;
        }
        .card-header {
          background: #0F172A;
          border-bottom: 1px solid #1E293B;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .p-box {
          width: 24px;
          height: 24px;
          background: #2563EB;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 14px;
          color: white;
        }
        .brand-text {
          font-size: 13px;
          font-weight: 800;
          color: #FFFFFF;
        }
        .status-badge {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34D399;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 9999px;
        }
        .card-body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .prospect-bar {
          background: #0F172A;
          border: 1px solid #1E293B;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .p-name {
          font-size: 14px;
          font-weight: 700;
          color: white;
        }
        .p-cat {
          font-size: 11px;
          color: #94A3B8;
        }
        .score-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          border: 2px solid #10B981;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .score-num {
          font-size: 15px;
          font-weight: 900;
          color: #34D399;
          line-height: 1;
        }
        .score-lbl {
          font-size: 8px;
          color: #94A3B8;
          font-weight: 700;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .metric-box {
          background: #0B1329;
          border: 1px solid #1E293B;
          border-radius: 10px;
          padding: 10px;
        }
        .m-label {
          font-size: 10px;
          color: #94A3B8;
          margin-bottom: 2px;
        }
        .m-val {
          font-size: 13px;
          font-weight: 700;
          color: #38BDF8;
        }
      </style>
    </head>
    <body>
      <div class="grid-bg"></div>
      <div class="glow-left"></div>
      <div class="glow-right"></div>
      <div class="left-col">
        <div class="brand-badge">⚡ CHROME EXTENSION COPILOT</div>
        <h1>Turn Any Local Website Into a <span>Sales Opportunity</span></h1>
        <p class="desc">
          Automate local business research, audit conversion bottlenecks, generate branded client PDF deliverables, and sync leads to GoHighLevel in 1 click.
        </p>
        <div class="feature-chips">
          <div class="chip"><span class="chip-icon">⚡</span> 1-Click Extraction</div>
          <div class="chip"><span class="chip-icon">📊</span> 0-100 Growth Scorecard</div>
          <div class="chip"><span class="chip-icon">📄</span> Branded Client PDF Audits</div>
          <div class="chip"><span class="chip-icon">🚀</span> Direct CRM Webhooks</div>
        </div>
      </div>
      <div class="right-col">
        <div class="ui-card">
          <div class="card-header">
            <div class="header-brand">
              <div class="p-box">P</div>
              <span class="brand-text">ProspectLens Copilot</span>
            </div>
            <span class="status-badge">ROOFING CONTRACTOR</span>
          </div>
          <div class="card-body">
            <div class="prospect-bar">
              <div>
                <div class="p-name">Summit Peak Roofing Co.</div>
                <div class="p-cat">Denver, CO • 4.7★ (28 Reviews)</div>
              </div>
              <div class="score-circle">
                <span class="score-num">58</span>
                <span class="score-lbl">AUDIT</span>
              </div>
            </div>
            <div class="metrics-grid">
              <div class="metric-box">
                <div class="m-label">Recommended Pitch</div>
                <div class="m-val">Video Ad Funnels</div>
              </div>
              <div class="metric-box">
                <div class="m-label">Estimated Retainer</div>
                <div class="m-val">$1,500 – $3,000/mo</div>
              </div>
            </div>
            <div class="metric-box" style="border-color: rgba(56, 189, 248, 0.4);">
              <div class="m-label">High-Priority Bottleneck Detected</div>
              <div class="m-val" style="color: #F8FAFC; font-size: 11px;">Missing video proof & no instant booking widget</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(marqueeHtml, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 400));

  const marqueePath = path.join(assetsDir, 'marquee-banner-1400x560.jpg');
  await page.screenshot({
    path: marqueePath,
    type: 'jpeg',
    quality: 95
  });
  console.log('✅ Generated marquee-banner-1400x560.jpg (Exact 1400x560 JPEG)');

  await browser.close();
  console.log('\n🎉 ALL PROMO TILES GENERATED AT EXACT STORE SPECIFICATIONS!\n');
}

generatePromoTiles().catch((err) => {
  console.error('❌ Failed generating promo tiles:', err);
  process.exit(1);
});
