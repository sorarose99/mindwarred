#!/usr/bin/env node

/**
 * Chrome Extension Packaging Script
 * Creates a ZIP file ready for Chrome Web Store submission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '../dist/extension');
const PACKAGE_DIR = path.join(__dirname, '../dist/packages');
const MANIFEST_PATH = path.join(BUILD_DIR, 'manifest.json');

console.log('📦 Packaging Chrome Extension for Chrome Web Store...');

// Ensure build exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ Extension build not found. Run npm run extension:build first.');
  process.exit(1);
}

// Create package directory
if (!fs.existsSync(PACKAGE_DIR)) {
  fs.mkdirSync(PACKAGE_DIR, { recursive: true });
}

// Read manifest to get version
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const version = manifest.version;
const packageName = `kiro-web-mind-v${version}.zip`;
const packagePath = path.join(PACKAGE_DIR, packageName);

// Remove existing package if it exists
if (fs.existsSync(packagePath)) {
  fs.unlinkSync(packagePath);
  console.log(`🗑️  Removed existing package: ${packageName}`);
}

// Create ZIP package
try {
  // Use native zip command (works on macOS/Linux)
  execSync(`cd "${BUILD_DIR}" && zip -r "${packagePath}" .`, { stdio: 'inherit' });
  console.log(`✅ Package created: ${packageName}`);
} catch (error) {
  console.error('❌ Failed to create ZIP package:', error.message);
  process.exit(1);
}

// Validate package
const stats = fs.statSync(packagePath);
const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`📊 Package size: ${sizeInMB} MB`);

if (stats.size > 128 * 1024 * 1024) { // 128MB limit for Chrome Web Store
  console.warn('⚠️  Warning: Package size exceeds Chrome Web Store limit (128MB)');
}

// Create submission checklist
const checklist = {
  packageInfo: {
    name: packageName,
    version: version,
    size: `${sizeInMB} MB`,
    created: new Date().toISOString()
  },
  chromeWebStoreChecklist: {
    manifestV3: true,
    permissions: manifest.permissions || [],
    hostPermissions: manifest.host_permissions || [],
    contentSecurityPolicy: !!manifest.content_security_policy,
    icons: {
      '16': fs.existsSync(path.join(BUILD_DIR, 'icons/icon16.png')),
      '32': fs.existsSync(path.join(BUILD_DIR, 'icons/icon32.png')),
      '48': fs.existsSync(path.join(BUILD_DIR, 'icons/icon48.png')),
      '128': fs.existsSync(path.join(BUILD_DIR, 'icons/icon128.png'))
    }
  },
  submissionSteps: [
    '1. Go to Chrome Web Store Developer Dashboard',
    '2. Click "Add new item"',
    '3. Upload the ZIP file: ' + packageName,
    '4. Fill in store listing details',
    '5. Add screenshots and promotional images',
    '6. Set privacy policy and permissions justification',
    '7. Submit for review'
  ],
  requiredAssets: [
    'Store icon (128x128)',
    'Screenshots (1280x800 or 640x400)',
    'Promotional tile (440x280) - optional',
    'Marquee promotional tile (1400x560) - optional'
  ]
};

fs.writeFileSync(
  path.join(PACKAGE_DIR, `submission-checklist-v${version}.json`),
  JSON.stringify(checklist, null, 2)
);

console.log('📋 Submission checklist created');
console.log('🎯 Ready for Chrome Web Store submission!');
console.log(`📁 Package location: ${packagePath}`);

// Display next steps
console.log('\n🚀 Next Steps:');
console.log('1. Review the submission checklist');
console.log('2. Prepare store listing assets (screenshots, descriptions)');
console.log('3. Upload to Chrome Web Store Developer Dashboard');
console.log('4. Complete store listing and submit for review');