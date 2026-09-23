import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple zip packer using native archiver or minimal zip generator
// If archiver is not installed, we can write a clean Node.js script using zip or install archiver
import { execSync } from 'child_process';

const distDir = path.resolve('dist');
const outZip = path.resolve('prospectlens-v1.0.0.zip');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

try {
  // PowerShell Compress-Archive on Windows
  if (fs.existsSync(outZip)) {
    fs.unlinkSync(outZip);
  }
  const cmd = `powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${outZip}' -Force"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`Created Chrome Web Store distribution package: ${outZip}`);
} catch (err) {
  console.error('Packaging failed:', err);
}
