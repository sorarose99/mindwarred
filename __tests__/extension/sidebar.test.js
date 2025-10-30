// Unit tests for Kiro AI Sidebar

/**
 * @jest-environment jsdom
 */

// Mock Chrome runtime API
global.chrome = {
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`)
  }
};

describe('KiroSidebar', () => {
  let sidebar;
  let mockPostMessage;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="sidebar-container">
        <div class="sidebar-header">
          <button id="closeSidebar">&times;</button>
        </div>
        <div class="sidebar-content">
          <button class="quick-action-btn" data-action="summarize">Summarize</button>
          <button class="quick-action-btn" data-action="explain">Explain</button>
          <div id="suggestionsContainer"></div>
          <div id="insightsContainer"></div>
          <div id="pageType">-</div>
          <div id="readingTime">-</div>
          <div id="complexity">-</div>
          <div id="language">-</div>
        </div>
        <div class="sidebar-footer">
          <button id="openSettings">⚙️</button>
        </div>
      </div>
    `;

    // Mock window.parent.postMessage
    mockPostMessage = jest.fn();
    Object.defineProperty(window, 'parent', {
      value: { postMessage: mockPostMessage },
      writable: true
    });

    // Load the sidebar script
    require('../../extension/sidebar.js');
    
    // Get the sidebar instance (assuming it's globally available)
    sidebar = new KiroSidebar();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize sidebar correctly', () => {
      expect(sidebar.isInitialized).toBe(true);
      expect(sidebar.currentContext).toBeNull();
      expect(sidebar.suggestions).toEqual([]);
      expect(sidebar.insights).toEqual([]);
    });

    test('should set up event listeners', () => {
      const closeBtnSpy = jest.spyOn(document.getElementById('closeSidebar'), 'addEventListener');
      const settingsBtnSpy = jest.spyOn(document.getElementById('openSettings'), 'addEventListener');
      
      sidebar.setupEventListeners();
      
      expect(closeBtnSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(settingsBtnSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('Context Updates', () => {
    test('should update context display', () => {
      const mockContext = {
        pageType: 'article',
        readingTime: 5,
        complexity: 'medium',
        language: 'en'
      };

      sidebar.updateContext(mockContext);

      expect(document.getElementById('pageType').textContent).toBe('📄 Article');
      expect(document.getElementById('readingTime').textContent).toBe('5 min');
      expect(document.getElementById('complexity').textContent).toBe('🟡 Medium');
      expect(document.getElementById('language').textContent).toBe('en');
    });

    test('should format page types correctly', () => {
      expect(sidebar.formatPageType('article')).toBe('📄 Article');
      expect(sidebar.formatPageType('video')).toBe('🎥 Video');
      expect(sidebar.formatPageType('code')).toBe('💻 Code');
      expect(sidebar.formatPageType('unknown')).toBe('🌐 General');
    });

    test('should format complexity correctly', () => {
      expect(sidebar.formatComplexity('low')).toBe('🟢 Simple');
      expect(sidebar.formatComplexity('medium')).toBe('🟡 Medium');
      expect(sidebar.formatComplexity('high')).toBe('🔴 Complex');
    });
  });

  describe('Suggestions Management', () => {
    test('should render suggestions correctly', () => {
      const mockSuggestions = [
        {
          id: 'suggest1',
          title: 'Summarize Article',
          description: 'Get a quick summary',
          confidence: 0.9
        },
        {
          id: 'suggest2',
          title: 'Extract Key Points',
          description: 'Find important information',
          confidence: 0.8
        }
      ];

      sidebar.updateSuggestions(mockSuggestions);

      const container = document.getElementById('suggestionsContainer');
      expect(container.children).toHaveLength(2);
      expect(container.textContent).toContain('Summarize Article');
      expect(container.textContent).toContain('Confidence: 90%');
    });

    test('should show empty state when no suggestions', () => {
      sidebar.updateSuggestions([]);

      const container = document.getElementById('suggestionsContainer');
      expect(container.textContent).toContain('No suggestions available');
    });

    test('should handle suggestion clicks', () => {
      const mockSuggestions = [
        {
          id: 'suggest1',
          title: 'Test Suggestion',
          description: 'Test description',
          confidence: 0.9
        }
      ];

      sidebar.updateSuggestions(mockSuggestions);
      
      const suggestionCard = document.querySelector('.suggestion-card');
      suggestionCard.click();

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'KIRO_SUGGESTION_ACTION',
        suggestion: mockSuggestions[0],
        context: sidebar.currentContext,
        source: 'sidebar'
      }, '*');
    });
  });

  describe('Insights Management', () => {
    test('should render insights correctly', () => {
      const mockInsights = [
        {
          type: 'analysis',
          title: 'Page Analysis',
          description: 'This is an article page'
        },
        {
          type: 'automation',
          title: 'Automation Opportunity',
          description: 'Form can be auto-filled'
        }
      ];

      sidebar.updateInsights(mockInsights);

      const container = document.getElementById('insightsContainer');
      expect(container.textContent).toContain('Page Analysis');
      expect(container.textContent).toContain('This is an article page');
      expect(container.textContent).toContain('ANALYSIS');
    });

    test('should show empty state when no insights', () => {
      sidebar.updateInsights([]);

      const container = document.getElementById('insightsContainer');
      expect(container.textContent).toContain('No insights yet');
    });
  });

  describe('Quick Actions', () => {
    test('should handle quick action clicks', () => {
      const summarizeBtn = document.querySelector('[data-action="summarize"]');
      summarizeBtn.click();

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'KIRO_QUICK_ACTION',
        action: 'summarize',
        context: sidebar.currentContext,
        source: 'sidebar'
      }, '*');
    });

    test('should provide visual feedback for actions', () => {
      const explainBtn = document.querySelector('[data-action="explain"]');
      
      sidebar.handleQuickAction('explain');
      
      expect(explainBtn.style.transform).toBe('scale(0.95)');
    });
  });

  describe('Message Handling', () => {
    test('should handle context update messages', () => {
      const mockContext = {
        pageType: 'video',
        readingTime: 3,
        complexity: 'low',
        language: 'es'
      };

      sidebar.handleMessage({
        data: {
          type: 'KIRO_CONTEXT_UPDATE',
          data: mockContext
        }
      });

      expect(sidebar.currentContext).toEqual(mockContext);
      expect(document.getElementById('pageType').textContent).toBe('🎥 Video');
    });

    test('should handle suggestions update messages', () => {
      const mockSuggestions = [{ id: 'test', title: 'Test' }];

      sidebar.handleMessage({
        data: {
          type: 'KIRO_SUGGESTIONS_UPDATE',
          data: mockSuggestions
        }
      });

      expect(sidebar.suggestions).toEqual(mockSuggestions);
    });

    test('should handle close sidebar messages', () => {
      const closeSpy = jest.spyOn(sidebar, 'closeSidebar');

      sidebar.handleMessage({
        data: {
          type: 'KIRO_CLOSE_SIDEBAR'
        }
      });

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Sidebar Controls', () => {
    test('should close sidebar when close button clicked', () => {
      const closeBtn = document.getElementById('closeSidebar');
      closeBtn.click();

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'KIRO_SIDEBAR_CLOSED',
        source: 'sidebar'
      }, '*');
    });

    test('should open settings when settings button clicked', () => {
      const settingsBtn = document.getElementById('openSettings');
      settingsBtn.click();

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'KIRO_OPEN_SETTINGS',
        source: 'sidebar'
      }, '*');
    });
  });

  describe('Utility Functions', () => {
    test('should escape HTML correctly', () => {
      const unsafeText = '<script>alert("xss")</script>';
      const safeText = sidebar.escapeHtml(unsafeText);
      
      expect(safeText).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    test('should show error messages', () => {
      sidebar.showError('Test error message');

      const container = document.getElementById('suggestionsContainer');
      expect(container.textContent).toContain('Test error message');
    });
  });

  describe('Theme and Position', () => {
    test('should update theme', () => {
      sidebar.updateTheme('light');
      expect(document.body.className).toBe('light-theme');

      sidebar.updateTheme('dark');
      expect(document.body.className).toBe('');
    });

    test('should set position', () => {
      const container = document.querySelector('.sidebar-container');
      
      sidebar.setPosition('left');
      expect(container.style.borderLeft).toBe('none');
      expect(container.style.borderRight).toBe('1px solid rgba(255, 255, 255, 0.1)');

      sidebar.setPosition('right');
      expect(container.style.borderLeft).toBe('1px solid rgba(255, 255, 255, 0.1)');
      expect(container.style.borderRight).toBe('none');
    });
  });
});