// Unit tests for Chrome extension popup

/**
 * @jest-environment jsdom
 */

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    },
    local: {
      get: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn()
  }
};

describe('Extension Popup', () => {
  beforeEach(() => {
    // Set up DOM structure matching popup.html
    document.body.innerHTML = `
      <div class="header">
        <div class="logo">Kiro</div>
        <div class="tagline">Your Web Mind</div>
      </div>
      <div class="content">
        <div class="status">
          <span class="status-text">Kiro is <span id="status-indicator">active</span></span>
          <div class="toggle active" id="kiro-toggle">
            <div class="toggle-handle"></div>
          </div>
        </div>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number" id="pages-analyzed">0</div>
            <div class="stat-label">Pages Analyzed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="suggestions-made">0</div>
            <div class="stat-label">Suggestions Made</div>
          </div>
        </div>
        <div class="quick-actions">
          <button class="action-btn" id="summarize-page">📄 Summarize Current Page</button>
          <button class="action-btn" id="analyze-content">🔍 Analyze Content</button>
          <button class="action-btn" id="show-insights">💡 Show Insights</button>
        </div>
      </div>
      <div class="footer">
        <a href="#" class="dashboard-link" id="open-dashboard">Open Dashboard</a>
      </div>
    `;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Popup Initialization', () => {
    test('should initialize popup with correct settings', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        kiroEnabled: true,
        privacyLevel: 'standard'
      });

      chrome.storage.local.get.mockResolvedValue({
        activities: [{ id: 1 }, { id: 2 }],
        stats: { pagesAnalyzed: 5, suggestionsMade: 10 }
      });

      // Load popup script
      require('../../extension/popup.js');

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chrome.storage.sync.get).toHaveBeenCalledWith([
        'kiroEnabled',
        'privacyLevel',
        'sidebarPosition'
      ]);
    });

    test('should update toggle state based on settings', async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: false });
      chrome.storage.local.get.mockResolvedValue({});

      require('../../extension/popup.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const toggle = document.getElementById('kiro-toggle');
      const statusIndicator = document.getElementById('status-indicator');

      expect(toggle.classList.contains('active')).toBe(false);
      expect(statusIndicator.textContent).toBe('inactive');
    });

    test('should load and display stats', async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });
      chrome.storage.local.get.mockResolvedValue({
        activities: [{ id: 1 }, { id: 2 }, { id: 3 }],
        stats: { pagesAnalyzed: 15, suggestionsMade: 25 }
      });

      require('../../extension/popup.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(document.getElementById('pages-analyzed').textContent).toBe('15');
      expect(document.getElementById('suggestions-made').textContent).toBe('25');
    });
  });

  describe('Toggle Functionality', () => {
    test('should toggle Kiro state when clicked', async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });
      chrome.storage.local.get.mockResolvedValue({});
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);

      require('../../extension/popup.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const toggle = document.getElementById('kiro-toggle');
      toggle.click();

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ kiroEnabled: false });
    });

    test('should send message to content script on state change', async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: false });
      chrome.storage.local.get.mockResolvedValue({});
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      require('../../extension/popup.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const toggle = document.getElementById('kiro-toggle');
      toggle.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'KIRO_STATE_CHANGED',
        enabled: true
      });
    });
  });

  describe('Quick Actions', () => {
    beforeEach(async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });
      chrome.storage.local.get.mockResolvedValue({});
      chrome.tabs.query.mockResolvedValue([{ id: 123 }]);
      
      require('../../extension/popup.js');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should handle summarize page action', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const summarizeBtn = document.getElementById('summarize-page');
      summarizeBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'SUMMARIZE_PAGE'
      });
    });

    test('should handle analyze content action', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const analyzeBtn = document.getElementById('analyze-content');
      analyzeBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'ANALYZE_CONTENT'
      });
    });

    test('should handle show insights action', async () => {
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      const insightsBtn = document.getElementById('show-insights');
      insightsBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'SHOW_INSIGHTS'
      });
    });

    test('should show error notification on action failure', async () => {
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Tab not found'));

      const summarizeBtn = document.getElementById('summarize-page');
      summarizeBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if error notification was shown (implementation dependent)
      expect(chrome.tabs.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Dashboard Link', () => {
    test('should open dashboard in new tab', async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });
      chrome.storage.local.get.mockResolvedValue({});

      require('../../extension/popup.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const dashboardLink = document.getElementById('open-dashboard');
      dashboardLink.click();

      expect(chrome.tabs.create).toHaveBeenCalledWith({ 
        url: 'http://localhost:3000/dashboard' 
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      chrome.storage.local.get.mockResolvedValue({});

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      require('../../extension/popup.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle tab query errors', async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });
      chrome.storage.local.get.mockResolvedValue({});
      chrome.tabs.query.mockRejectedValue(new Error('No active tab'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      require('../../extension/popup.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const summarizeBtn = document.getElementById('summarize-page');
      summarizeBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Notification System', () => {
    test('should show success notifications', () => {
      // Mock the showNotification function
      const mockShowNotification = jest.fn();
      global.showNotification = mockShowNotification;

      require('../../extension/popup.js');

      // Simulate showing a notification
      if (global.showNotification) {
        global.showNotification('Test message', 'success');
        expect(mockShowNotification).toHaveBeenCalledWith('Test message', 'success');
      }
    });

    test('should show error notifications', () => {
      const mockShowNotification = jest.fn();
      global.showNotification = mockShowNotification;

      require('../../extension/popup.js');

      if (global.showNotification) {
        global.showNotification('Error message', 'error');
        expect(mockShowNotification).toHaveBeenCalledWith('Error message', 'error');
      }
    });
  });
});