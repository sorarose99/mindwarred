module.exports = {
  ci: {
    collect: {
      url: [
        'https://kiro-web-mind.web.app/',
        'https://kiro-web-mind.web.app/dashboard/',
        'https://kiro-web-mind.web.app/chat/'
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      // Optional: Configure LHCI server if you have one
    }
  }
};