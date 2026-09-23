import fs from 'fs';
import path from 'path';

// Post-build helper to ensure manifest.json and icons are correctly positioned in dist/
const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy manifest.json
fs.copyFileSync(path.join(publicDir, 'manifest.json'), path.join(distDir, 'manifest.json'));

// Copy icons
const iconsDist = path.join(distDir, 'icons');
const iconsPublic = path.join(publicDir, 'icons');
if (fs.existsSync(iconsPublic)) {
  fs.mkdirSync(iconsDist, { recursive: true });
  for (const file of fs.readdirSync(iconsPublic)) {
    fs.copyFileSync(path.join(iconsPublic, file), path.join(iconsDist, file));
  }
}

// Copy ExtPay.js library for ExtensionPay content script support
const extpaySource = path.resolve('node_modules/extpay/dist/ExtPay.js');
if (fs.existsSync(extpaySource)) {
  fs.copyFileSync(extpaySource, path.join(distDir, 'ExtPay.js'));
  fs.copyFileSync(extpaySource, path.join(publicDir, 'ExtPay.js'));
}

// Bundle contentScript as standalone IIFE classic script (no ES module imports)
const extractorDir = path.join(distDir, 'features', 'extractor');
if (!fs.existsSync(extractorDir)) {
  fs.mkdirSync(extractorDir, { recursive: true });
}

import('esbuild').then(({ buildSync }) => {
  buildSync({
    entryPoints: ['src/features/extractor/contentScript.ts'],
    bundle: true,
    format: 'iife',
    outfile: path.join(extractorDir, 'contentScript.js'),
    target: ['chrome100']
  });
  console.log('Postbuild finished: Manifest, icons, ExtPay.js, and standalone IIFE contentScript built to dist/');
});
