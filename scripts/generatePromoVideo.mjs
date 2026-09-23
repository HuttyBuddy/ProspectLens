import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

async function generatePromoVideo() {
  console.log('🎬 Generating 1080p Chrome Web Store Promo Video for ProspectLens...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const tempDir = path.resolve('temp_video_frames');
  const assetsDir = path.resolve('src/features/store-listing/assets');
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(assetsDir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // Read existing screenshot base64s to embed seamlessly
  const sc1B64 = fs.readFileSync(path.join(assetsDir, 'screenshot-1-overview-1280x800.jpg')).toString('base64');
  const sc2B64 = fs.readFileSync(path.join(assetsDir, 'screenshot-2-audit-pdf-1280x800.jpg')).toString('base64');
  const sc3B64 = fs.readFileSync(path.join(assetsDir, 'screenshot-3-outreach-and-ad-1280x800.jpg')).toString('base64');
  const sc4B64 = fs.readFileSync(path.join(assetsDir, 'screenshot-4-crm-sync-export-1280x800.jpg')).toString('base64');

  const frames = [
    {
      id: 'frame1',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body {
              width: 1920px;
              height: 1080px;
              background: radial-gradient(circle at 50% 35%, #1E293B 0%, #020617 100%);
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .grid {
              position: absolute;
              inset: 0;
              background-image: linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
              background-size: 50px 50px;
            }
            .glow {
              position: absolute;
              width: 600px;
              height: 400px;
              background: #2563EB;
              filter: blur(160px);
              opacity: 0.4;
              top: 20%;
            }
            .badge {
              padding: 10px 24px;
              border-radius: 9999px;
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid rgba(56, 189, 248, 0.4);
              color: #38BDF8;
              font-size: 16px;
              font-weight: 800;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              margin-bottom: 30px;
              z-index: 2;
            }
            .logo {
              width: 120px;
              height: 120px;
              border-radius: 32px;
              background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
              box-shadow: 0 20px 50px -10px rgba(37, 99, 235, 0.7), 0 0 0 2px rgba(255, 255, 255, 0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 72px;
              font-weight: 900;
              margin-bottom: 24px;
              z-index: 2;
            }
            h1 {
              font-size: 76px;
              font-weight: 900;
              letter-spacing: -0.03em;
              line-height: 1.1;
              margin-bottom: 20px;
              z-index: 2;
            }
            h1 span {
              background: linear-gradient(135deg, #38BDF8 0%, #60A5FA 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            p {
              font-size: 26px;
              color: #94A3B8;
              max-width: 900px;
              line-height: 1.5;
              z-index: 2;
            }
            .chips {
              display: flex;
              gap: 16px;
              margin-top: 40px;
              z-index: 2;
            }
            .chip {
              padding: 12px 24px;
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid rgba(51, 65, 85, 0.8);
              border-radius: 16px;
              font-size: 18px;
              font-weight: 700;
              color: #F8FAFC;
            }
          </style>
        </head>
        <body>
          <div class="grid"></div>
          <div class="glow"></div>
          <div class="badge">Chrome Extension for Agencies & Freelancers</div>
          <div class="logo">P</div>
          <h1>ProspectLens<br><span>B2B Lead & Video Ad Copilot</span></h1>
          <p>Turn any local business website into a qualified high-ticket opportunity in seconds.</p>
          <div class="chips">
            <div class="chip">⚡ 1-Click Extraction</div>
            <div class="chip">📊 0-100 Growth Scorecard</div>
            <div class="chip">📄 Client Audit PDFs</div>
            <div class="chip">🚀 GoHighLevel Sync</div>
          </div>
        </body>
        </html>
      `
    },
    {
      id: 'frame2',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body {
              width: 1920px;
              height: 1080px;
              background: #020617;
              color: white;
              display: flex;
              align-items: center;
              padding: 60px 100px;
              gap: 80px;
              position: relative;
              overflow: hidden;
            }
            .grid {
              position: absolute;
              inset: 0;
              background-image: linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
              background-size: 50px 50px;
            }
            .left {
              flex: 1.1;
              z-index: 2;
            }
            .badge {
              display: inline-block;
              padding: 8px 18px;
              border-radius: 9999px;
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid rgba(56, 189, 248, 0.4);
              color: #38BDF8;
              font-size: 15px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin-bottom: 24px;
            }
            h2 {
              font-size: 56px;
              font-weight: 900;
              letter-spacing: -0.02em;
              line-height: 1.15;
              margin-bottom: 20px;
            }
            p {
              font-size: 22px;
              color: #94A3B8;
              line-height: 1.5;
              margin-bottom: 36px;
            }
            .feature-box {
              background: rgba(15, 23, 42, 0.8);
              border: 1px solid rgba(51, 65, 85, 0.7);
              border-radius: 16px;
              padding: 18px 24px;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .feature-box span.icon { font-size: 28px; }
            .feature-box h4 { font-size: 18px; font-weight: 700; color: #F8FAFC; margin-bottom: 4px; }
            .feature-box p { font-size: 15px; color: #94A3B8; margin: 0; }
            .right {
              flex: 1.3;
              z-index: 2;
              display: flex;
              justify-content: center;
            }
            .img-card {
              width: 100%;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 30px 80px -10px rgba(0,0,0,0.9), 0 0 40px rgba(56, 189, 248, 0.2);
              border: 1px solid rgba(148, 163, 184, 0.3);
            }
            .img-card img { width: 100%; display: block; }
          </style>
        </head>
        <body>
          <div class="grid"></div>
          <div class="left">
            <div class="badge">STEP 1: INSPECTION & AUDIT</div>
            <h2>Extract Brand Data & Marketing Weaknesses</h2>
            <p>Browse any contractor, clinic, or local service website. ProspectLens automatically calculates conversion bottlenecks.</p>
            <div class="feature-box">
              <span class="icon">⚡</span>
              <div>
                <h4>Zero-Friction Extraction</h4>
                <p>Captures contact emails, phone, review rating, CTAs, and video presence.</p>
              </div>
            </div>
            <div class="feature-box">
              <span class="icon">🎯</span>
              <div>
                <h4>Opportunity Engine</h4>
                <p>Prioritizes services you sell like Video Ads, Retainers, and Speed Optimization.</p>
              </div>
            </div>
          </div>
          <div class="right">
            <div class="img-card">
              <img src="data:image/jpeg;base64,${sc1B64}" />
            </div>
          </div>
        </body>
        </html>
      `
    },
    {
      id: 'frame3',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body {
              width: 1920px;
              height: 1080px;
              background: #020617;
              color: white;
              display: flex;
              align-items: center;
              padding: 60px 100px;
              gap: 80px;
              position: relative;
              overflow: hidden;
            }
            .grid {
              position: absolute;
              inset: 0;
              background-image: linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px);
              background-size: 50px 50px;
            }
            .left {
              flex: 1.1;
              z-index: 2;
            }
            .badge {
              display: inline-block;
              padding: 8px 18px;
              border-radius: 9999px;
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid rgba(16, 185, 129, 0.4);
              color: #34D399;
              font-size: 15px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin-bottom: 24px;
            }
            h2 {
              font-size: 56px;
              font-weight: 900;
              letter-spacing: -0.02em;
              line-height: 1.15;
              margin-bottom: 20px;
            }
            p {
              font-size: 22px;
              color: #94A3B8;
              line-height: 1.5;
              margin-bottom: 36px;
            }
            .feature-box {
              background: rgba(15, 23, 42, 0.8);
              border: 1px solid rgba(51, 65, 85, 0.7);
              border-radius: 16px;
              padding: 18px 24px;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .feature-box span.icon { font-size: 28px; }
            .feature-box h4 { font-size: 18px; font-weight: 700; color: #F8FAFC; margin-bottom: 4px; }
            .feature-box p { font-size: 15px; color: #94A3B8; margin: 0; }
            .right {
              flex: 1.3;
              z-index: 2;
              display: flex;
              justify-content: center;
            }
            .img-card {
              width: 100%;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 30px 80px -10px rgba(0,0,0,0.9), 0 0 40px rgba(16, 185, 129, 0.2);
              border: 1px solid rgba(148, 163, 184, 0.3);
            }
            .img-card img { width: 100%; display: block; }
          </style>
        </head>
        <body>
          <div class="grid"></div>
          <div class="left">
            <div class="badge">STEP 2: HIGH-TICKET DELIVERABLE</div>
            <h2>1-Click Client Growth Audit PDF Deliverable</h2>
            <p>Generate branded diagnostic reports that visually show business owners where they are losing leads.</p>
            <div class="feature-box">
              <span class="icon">📊</span>
              <div>
                <h4>4-Pillar Scorecard</h4>
                <p>Ratings for Conversion Architecture, Visual Ads, Social Proof, and Mobile.</p>
              </div>
            </div>
            <div class="feature-box">
              <span class="icon">💼</span>
              <div>
                <h4>Agency Whitelabeling</h4>
                <p>Branded with your agency name, advisor contact, and booking calendar.</p>
              </div>
            </div>
          </div>
          <div class="right">
            <div class="img-card">
              <img src="data:image/jpeg;base64,${sc2B64}" />
            </div>
          </div>
        </body>
        </html>
      `
    },
    {
      id: 'frame4',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body {
              width: 1920px;
              height: 1080px;
              background: #020617;
              color: white;
              display: flex;
              align-items: center;
              padding: 60px 100px;
              gap: 80px;
              position: relative;
              overflow: hidden;
            }
            .grid {
              position: absolute;
              inset: 0;
              background-image: linear-gradient(to right, rgba(96, 165, 250, 0.08) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(96, 165, 250, 0.08) 1px, transparent 1px);
              background-size: 50px 50px;
            }
            .left {
              flex: 1.1;
              z-index: 2;
            }
            .badge {
              display: inline-block;
              padding: 8px 18px;
              border-radius: 9999px;
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid rgba(96, 165, 250, 0.4);
              color: #60A5FA;
              font-size: 15px;
              font-weight: 800;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin-bottom: 24px;
            }
            h2 {
              font-size: 56px;
              font-weight: 900;
              letter-spacing: -0.02em;
              line-height: 1.15;
              margin-bottom: 20px;
            }
            p {
              font-size: 22px;
              color: #94A3B8;
              line-height: 1.5;
              margin-bottom: 36px;
            }
            .feature-box {
              background: rgba(15, 23, 42, 0.8);
              border: 1px solid rgba(51, 65, 85, 0.7);
              border-radius: 16px;
              padding: 18px 24px;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .feature-box span.icon { font-size: 28px; }
            .feature-box h4 { font-size: 18px; font-weight: 700; color: #F8FAFC; margin-bottom: 4px; }
            .feature-box p { font-size: 15px; color: #94A3B8; margin: 0; }
            .right {
              flex: 1.3;
              z-index: 2;
              display: flex;
              justify-content: center;
            }
            .img-card {
              width: 100%;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 30px 80px -10px rgba(0,0,0,0.9), 0 0 40px rgba(96, 165, 250, 0.2);
              border: 1px solid rgba(148, 163, 184, 0.3);
            }
            .img-card img { width: 100%; display: block; }
          </style>
        </head>
        <body>
          <div class="grid"></div>
          <div class="left">
            <div class="badge">STEP 3: OUTREACH & VIDEO ADS</div>
            <h2>AI Video Ad Angles & Cold Email Pitches</h2>
            <p>Skip generic outreach. Pitch tailored video advertising concepts and personalized cold email hooks.</p>
            <div class="feature-box">
              <span class="icon">🎬</span>
              <div>
                <h4>30-Sec Video Storyboards</h4>
                <p>Frame-by-frame TikTok/Reels angles formatted for Veo and Google Flow.</p>
              </div>
            </div>
            <div class="feature-box">
              <span class="icon">✉️</span>
              <div>
                <h4>Multi-Touch Sequences</h4>
                <p>Personalized observation openers, subject lines, and 160-char SMS hooks.</p>
              </div>
            </div>
          </div>
          <div class="right">
            <div class="img-card">
              <img src="data:image/jpeg;base64,${sc3B64}" />
            </div>
          </div>
        </body>
        </html>
      `
    },
    {
      id: 'frame5',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body {
              width: 1920px;
              height: 1080px;
              background: radial-gradient(circle at 50% 60%, #1E293B 0%, #020617 100%);
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .grid {
              position: absolute;
              inset: 0;
              background-image: linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
              background-size: 50px 50px;
            }
            .glow {
              position: absolute;
              width: 700px;
              height: 450px;
              background: #2563EB;
              filter: blur(180px);
              opacity: 0.35;
              top: 25%;
            }
            .badge {
              padding: 10px 24px;
              border-radius: 9999px;
              background: rgba(15, 23, 42, 0.85);
              border: 1px solid rgba(56, 189, 248, 0.4);
              color: #38BDF8;
              font-size: 16px;
              font-weight: 800;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              margin-bottom: 24px;
              z-index: 2;
            }
            h2 {
              font-size: 72px;
              font-weight: 900;
              letter-spacing: -0.03em;
              line-height: 1.1;
              margin-bottom: 20px;
              z-index: 2;
            }
            h2 span {
              background: linear-gradient(135deg, #38BDF8 0%, #60A5FA 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            p {
              font-size: 26px;
              color: #94A3B8;
              max-width: 900px;
              line-height: 1.5;
              margin-bottom: 40px;
              z-index: 2;
            }
            .cta-card {
              background: rgba(15, 23, 42, 0.9);
              border: 1px solid rgba(56, 189, 248, 0.4);
              border-radius: 24px;
              padding: 30px 60px;
              display: flex;
              align-items: center;
              gap: 30px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.6);
              z-index: 2;
            }
            .cta-p {
              width: 60px;
              height: 60px;
              border-radius: 16px;
              background: #2563EB;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: 900;
            }
            .cta-text { text-align: left; }
            .cta-title { font-size: 24px; font-weight: 800; color: white; margin-bottom: 4px; }
            .cta-sub { font-size: 16px; color: #38BDF8; }
            .stars { color: #F59E0B; font-size: 20px; margin-left: 20px; }
          </style>
        </head>
        <body>
          <div class="grid"></div>
          <div class="glow"></div>
          <div class="badge">INSTALL TODAY</div>
          <h2>Scale Your Agency With <span>ProspectLens</span></h2>
          <p>Available on the Chrome Web Store for Sales Consultants, Freelancers & Growth Agencies.</p>
          <div class="cta-card">
            <div class="cta-p">P</div>
            <div class="cta-text">
              <div class="cta-title">ProspectLens: B2B Lead & Video Ad Copilot</div>
              <div class="cta-sub">Free 10-Scan Trial • Instant Setup</div>
            </div>
            <div class="stars">★★★★★</div>
          </div>
        </body>
        </html>
      `
    }
  ];

  console.log('Rendering 5 high-definition 1080p slide frames...');
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    await page.setContent(f.html, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 400));
    const framePath = path.join(tempDir, `slide_${i + 1}.jpg`);
    await page.screenshot({ path: framePath, type: 'jpeg', quality: 98 });
    console.log(`✅ Saved ${path.basename(framePath)}`);
  }

  await browser.close();

  // 2. Compile into 30-Second MP4 Video using FFmpeg
  console.log('🎞️ Assembling 1080p MP4 promo video with smooth transitions using FFmpeg...');
  const outputMp4 = path.join(assetsDir, 'prospectlens-promo-video.mp4');

  // Each slide lasts 6 seconds (total 30s) with 0.8s crossfade
  const s1 = path.join(tempDir, 'slide_1.jpg');
  const s2 = path.join(tempDir, 'slide_2.jpg');
  const s3 = path.join(tempDir, 'slide_3.jpg');
  const s4 = path.join(tempDir, 'slide_4.jpg');
  const s5 = path.join(tempDir, 'slide_5.jpg');

  const ffmpegCmd = `ffmpeg -y \
    -loop 1 -t 6 -i "${s1}" \
    -loop 1 -t 6 -i "${s2}" \
    -loop 1 -t 6 -i "${s3}" \
    -loop 1 -t 6 -i "${s4}" \
    -loop 1 -t 6 -i "${s5}" \
    -filter_complex "\
      [0:v]fade=t=out:st=5.2:d=0.8[v0]; \
      [1:v]fade=t=in:st=0:d=0.8,fade=t=out:st=5.2:d=0.8[v1]; \
      [2:v]fade=t=in:st=0:d=0.8,fade=t=out:st=5.2:d=0.8[v2]; \
      [3:v]fade=t=in:st=0:d=0.8,fade=t=out:st=5.2:d=0.8[v3]; \
      [4:v]fade=t=in:st=0:d=0.8[v4]; \
      [v0][v1][v2][v3][v4]concat=n=5:v=1:a=0[outv]" \
    -map "[outv]" \
    -c:v libx264 -pix_fmt yuv420p -r 30 -preset slow -crf 18 \
    "${outputMp4}"`;

  execSync(ffmpegCmd, { stdio: 'inherit' });

  // Cleanup temp frames
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(`\n🎉 PROMO VIDEO SUCCESSFULLY CREATED: ${outputMp4}\n`);
}

generatePromoVideo().catch((err) => {
  console.error('❌ Failed creating promo video:', err);
  process.exit(1);
});
