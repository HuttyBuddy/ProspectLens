import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function generateAllIcons() {
  console.log('🎨 Generating Chrome Web Store compliant extension icons...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // SVG Template for the 128x128 icon with EXACT 96x96 inner icon and 16px transparent padding
  const svg128 = `
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iconGrad" x1="16" y1="16" x2="112" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2563EB"/>
          <stop offset="100%" stop-color="#1D4ED8"/>
        </linearGradient>
        <linearGradient id="sheen" x1="64" y1="16" x2="64" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0"/>
        </linearGradient>
        <filter id="contrastShadow" x="12" y="12" width="104" height="104" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
        </filter>
      </defs>

      <!-- 96x96 square with rounded corners at (16, 16) - gives exact 16px transparent padding on all 4 sides -->
      <rect x="16" y="16" width="96" height="96" rx="22" fill="url(#iconGrad)" filter="url(#contrastShadow)"/>
      <!-- Subtle white/light-blue contrast edge for dark mode visibility -->
      <rect x="16.5" y="16.5" width="95" height="95" rx="21.5" stroke="#93C5FD" stroke-opacity="0.45" stroke-width="1"/>
      
      <!-- Top sheen highlight -->
      <rect x="17" y="17" width="94" height="42" rx="21" fill="url(#sheen)"/>

      <!-- Target / Lens aperture ring -->
      <circle cx="68" cy="56" r="22" stroke="#38BDF8" stroke-width="3" stroke-opacity="0.85" stroke-dasharray="7 3.5"/>

      <!-- Pure White 'P' Monogram -->
      <path d="M46 36 H68 C76.8 36 84 43.2 84 52 C84 60.8 76.8 68 68 68 H58 V92 H46 Z M58 46 V58 H68 C71.3 58 74 55.3 74 52 C74 48.7 71.3 46 68 46 Z" fill="#FFFFFF"/>

      <!-- Cyan Focus Core -->
      <circle cx="68" cy="52" r="4.5" fill="#38BDF8"/>
    </svg>
  `;

  // SVG Template for 48x48
  const svg48 = `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g48" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2563EB"/>
          <stop offset="100%" stop-color="#1D4ED8"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="10" fill="url(#g48)"/>
      <rect x="2.5" y="2.5" width="43" height="43" rx="9.5" stroke="#93C5FD" stroke-opacity="0.5" stroke-width="1"/>
      <path d="M16 12 H26 C30.4 12 34 15.6 34 20 C34 24.4 30.4 28 26 28 H22 V36 H16 Z M22 17 V23 H26 C27.7 23 29 21.7 29 20 C29 18.3 27.7 17 26 17 Z" fill="#FFFFFF"/>
      <circle cx="26" cy="20" r="2.5" fill="#38BDF8"/>
    </svg>
  `;

  // SVG Template for 32x32
  const svg32 = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g32" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2563EB"/>
          <stop offset="100%" stop-color="#1D4ED8"/>
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="7" fill="url(#g32)"/>
      <rect x="1.5" y="1.5" width="29" height="29" rx="6.5" stroke="#93C5FD" stroke-opacity="0.5" stroke-width="1"/>
      <path d="M10 8 H17 C20.3 8 23 10.7 23 14 C23 17.3 20.3 20 17 20 H14 V25 H10 Z M14 11.5 V16.5 H17 C18.4 16.5 19.5 15.4 19.5 14 C19.5 12.6 18.4 11.5 17 11.5 Z" fill="#FFFFFF"/>
    </svg>
  `;

  // SVG Template for 16x16
  const svg16 = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="3.5" fill="#2563EB"/>
      <path d="M4 3 H9 C10.7 3 12 4.3 12 6 C12 7.7 10.7 9 9 9 H6 V13 H4 Z M6 5 V7 H9 C9.6 7 10 6.6 10 6 C10 5.4 9.6 5 9 5 Z" fill="#FFFFFF"/>
    </svg>
  `;

  const icons = [
    { size: 128, svg: svg128 },
    { size: 48, svg: svg48 },
    { size: 32, svg: svg32 },
    { size: 16, svg: svg16 }
  ];

  const publicIconsDir = path.resolve('public/icons');
  const distIconsDir = path.resolve('dist/icons');
  fs.mkdirSync(publicIconsDir, { recursive: true });
  fs.mkdirSync(distIconsDir, { recursive: true });

  for (const { size, svg } of icons) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; }
            body { background: transparent; width: ${size}px; height: ${size}px; overflow: hidden; }
          </style>
        </head>
        <body>${svg}</body>
      </html>
    `;

    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(html);

    const pngBuffer = await page.screenshot({
      omitBackground: true,
      type: 'png'
    });

    const publicPath = path.join(publicIconsDir, `icon-${size}.png`);
    const distPath = path.join(distIconsDir, `icon-${size}.png`);

    fs.writeFileSync(publicPath, pngBuffer);
    fs.writeFileSync(distPath, pngBuffer);

    console.log(`✅ Generated icon-${size}.png (${size}x${size} transparent PNG)`);
  }

  await browser.close();
  console.log('🎉 All icons successfully generated and saved to public/icons and dist/icons!');
}

generateAllIcons().catch((err) => {
  console.error('❌ Icon generation failed:', err);
  process.exit(1);
});
