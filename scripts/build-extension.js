#!/usr/bin/env node

/**
 * Chrome Extension Build Script
 * Prepares the extension for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTENSION_DIR = path.join(__dirname, '../extension');
const BUILD_DIR = path.join(__dirname, '../dist/extension');
const MANIFEST_PATH = path.join(EXTENSION_DIR, 'manifest.json');

console.log('🔨 Building Chrome Extension for production...');

// Create build directory
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Copy extension files
const filesToCopy = [
  'manifest.json',
  'background.js',
  'content.js',
  'content.css',
  'popup.html',
  'popup.js',
  'sidebar.html',
  'sidebar.js'
];

filesToCopy.forEach(file => {
  const srcPath = path.join(EXTENSION_DIR, file);
  const destPath = path.join(BUILD_DIR, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

// Update manifest for production
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// Update version and permissions for production
manifest.version = process.env.EXTENSION_VERSION || '1.0.0';
manifest.name = 'Kiro Web Mind';
manifest.description = 'Your AI-powered browser assistant that learns your behavior and helps you act faster';

// Add production-specific configurations
manifest.content_security_policy = {
  "extension_pages": "script-src 'self'; object-src 'self'"
};

// Write updated manifest
fs.writeFileSync(
  path.join(BUILD_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

// Create icons directory and copy icons (if they exist)
const iconsDir = path.join(BUILD_DIR, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Generate placeholder icons if they don't exist
const iconSizes = [16, 32, 48, 128];
iconSizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon${size}.png`);
  if (!fs.existsSync(iconPath)) {
    // Create a simple SVG icon and convert to PNG (placeholder)
    const svgContent = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#6366f1"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="${size/4}">K</text>
      </svg>
    `;
    
    // For now, just create a placeholder file
    fs.writeFileSync(iconPath, `<!-- Placeholder icon ${size}x${size} -->`);
    console.log(`📦 Created placeholder icon: icon${size}.png`);
  }
});

// Minify JavaScript files (basic minification)
const jsFiles = ['background.js', 'content.js', 'popup.js', 'sidebar.js'];

jsFiles.forEach(file => {
  const filePath = path.join(BUILD_DIR, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Basic minification: remove comments and extra whitespace
    content = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    fs.writeFileSync(filePath, content);
    console.log(`🗜️  Minified ${file}`);
  }
});

// Create a build info file
const buildInfo = {
  buildTime: new Date().toISOString(),
  version: manifest.version,
  environment: 'production',
  files: filesToCopy.filter(file => fs.existsSync(path.join(BUILD_DIR, file)))
};

fs.writeFileSync(
  path.join(BUILD_DIR, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('✅ Chrome Extension build completed successfully!');
console.log(`📁 Build output: ${BUILD_DIR}`);
console.log(`📋 Version: ${manifest.version}`);
console.log(`📊 Files built: ${buildInfo.files.length}`);