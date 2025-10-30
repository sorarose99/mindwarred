#!/usr/bin/env node

/**
 * Production Deployment Script for Kiro Web Mind
 * Handles deployment of both web app and Chrome extension
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const deployTarget = args[0] || 'all'; // 'web', 'extension', or 'all'

console.log('🚀 Starting Kiro Web Mind deployment...');
console.log(`📋 Deploy target: ${deployTarget}`);

// Deployment configuration
const config = {
  web: {
    buildCommand: 'npm run build:production',
    deployCommand: 'firebase deploy --only hosting,functions,firestore',
    testCommand: 'npm run test:ci'
  },
  extension: {
    buildCommand: 'npm run extension:build',
    packageCommand: 'npm run extension:package'
  }
};

// Pre-deployment checks
function runPreDeploymentChecks() {
  console.log('🔍 Running pre-deployment checks...');
  
  // Check if required environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_API_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('Please set these variables in your .env.production file');
    process.exit(1);
  }
  
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI is installed');
  } catch (error) {
    console.error('❌ Firebase CLI not found. Install with: npm install -g firebase-tools');
    process.exit(1);
  }
  
  // Check if user is logged in to Firebase
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
    console.log('✅ Firebase authentication verified');
  } catch (error) {
    console.error('❌ Not logged in to Firebase. Run: firebase login');
    process.exit(1);
  }
  
  console.log('✅ Pre-deployment checks passed');
}

// Deploy web application
function deployWeb() {
  console.log('🌐 Deploying web application...');
  
  try {
    // Run tests
    console.log('🧪 Running tests...');
    execSync(config.web.testCommand, { stdio: 'inherit' });
    
    // Build application
    console.log('🔨 Building application...');
    execSync(config.web.buildCommand, { stdio: 'inherit' });
    
    // Deploy to Firebase
    console.log('☁️  Deploying to Firebase...');
    execSync(config.web.deployCommand, { stdio: 'inherit' });
    
    console.log('✅ Web application deployed successfully!');
    
    // Get deployment URL
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const deploymentUrl = `https://${projectId}.web.app`;
      console.log(`🔗 Deployment URL: ${deploymentUrl}`);
    } catch (error) {
      console.log('ℹ️  Check Firebase console for deployment URL');
    }
    
  } catch (error) {
    console.error('❌ Web deployment failed:', error.message);
    process.exit(1);
  }
}

// Deploy Chrome extension
function deployExtension() {
  console.log('🧩 Preparing Chrome extension...');
  
  try {
    // Build extension
    console.log('🔨 Building extension...');
    execSync(config.extension.buildCommand, { stdio: 'inherit' });
    
    // Package extension
    console.log('📦 Packaging extension...');
    execSync(config.extension.packageCommand, { stdio: 'inherit' });
    
    console.log('✅ Chrome extension packaged successfully!');
    console.log('📋 Manual steps required:');
    console.log('   1. Go to Chrome Web Store Developer Dashboard');
    console.log('   2. Upload the generated ZIP file');
    console.log('   3. Complete store listing and submit for review');
    
  } catch (error) {
    console.error('❌ Extension packaging failed:', error.message);
    process.exit(1);
  }
}

// Generate deployment report
function generateDeploymentReport() {
  const report = {
    timestamp: new Date().toISOString(),
    deployTarget: deployTarget,
    version: require('../package.json').version,
    environment: 'production',
    components: {
      webApp: deployTarget === 'web' || deployTarget === 'all',
      chromeExtension: deployTarget === 'extension' || deployTarget === 'all'
    },
    urls: {
      webApp: process.env.NEXT_PUBLIC_APP_URL || 'Check Firebase console',
      chromeWebStore: 'Manual upload required'
    },
    nextSteps: []
  };
  
  if (report.components.webApp) {
    report.nextSteps.push('Verify web application is working correctly');
    report.nextSteps.push('Run smoke tests on production environment');
  }
  
  if (report.components.chromeExtension) {
    report.nextSteps.push('Upload extension to Chrome Web Store');
    report.nextSteps.push('Complete store listing with screenshots and descriptions');
    report.nextSteps.push('Submit extension for review');
  }
  
  const reportPath = path.join(__dirname, '../dist/deployment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📊 Deployment report generated');
  console.log(`📁 Report location: ${reportPath}`);
  
  return report;
}

// Main deployment function
function main() {
  try {
    runPreDeploymentChecks();
    
    switch (deployTarget) {
      case 'web':
        deployWeb();
        break;
      case 'extension':
        deployExtension();
        break;
      case 'all':
        deployWeb();
        deployExtension();
        break;
      default:
        console.error('❌ Invalid deploy target. Use: web, extension, or all');
        process.exit(1);
    }
    
    const report = generateDeploymentReport();
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Next Steps:');
    report.nextSteps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
main();