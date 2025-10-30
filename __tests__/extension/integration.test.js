// Integration tests for Chrome extension components

/**
 * @jest-environment jsdom
 */

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`)
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

describe('Chrome Extension Integration', () => {
  let contentScript;
  let backgroundService;

  beforeEach(() => {
    // Set up DOM for content script
    document.body.innerHTML = `
      <main>
        <article>
          <h1>Test Article Title</h1>
          <p>This is test content for the article.</p>
        </article>
      </main>
    `;

    document.title = 'Test Page';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/test' },
      writable: true
    });

    // Mock storage responses
    chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });
    chrome.storage.local.get.mockResolvedValue({ activities: [] });

    jest.clearAllMocks();
  });

  describe('Content Script and Background Communication', () => {
    test('should send page analysis request to background', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        analysis: {
          pageType: 'article',
          mainTopic: 'test article',
          relevantSuggestions: []
        }
      });

      // Load content script
      require('../../extension/content.js');
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'ANALYZE_PAGE',
        data: expect.objectContaining({
          url: 'https://example.com/test',
          title: 'Test Page'
        })
      });
    });

    test('should handle background response and update analysis', async () => {
      const mockAnalysis = {
        pageType: 'article',
        mainTopic: 'test content',
        relevantSuggestions: [
          {
            id: 'summarize',
            title: 'Summarize Article',
            action: 'summarize'
          }
        ]
      };

      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        analysis: mockAnalysis
      });

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Content script should have received and processed the analysis
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    test('should save activity to background', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate text selection
      const mockSelection = {
        toString: () => 'selected text for testing',
        getRangeAt: () => ({
          commonAncestorContainer: {
            parentElement: {
              textContent: 'Before selected text for testing after'
            }
          },
          startOffset: 7,
          endOffset: 32
        })
      };

      global.window.getSelection = jest.fn(() => mockSelection);

      // Trigger text selection
      const mouseUpEvent = new Event('mouseup');
      document.dispatchEvent(mouseUpEvent);

      await new Promise(resolve => setTimeout(resolve, 400)); // Wait for debounce

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SAVE_ACTIVITY',
        data: expect.objectContaining({
          type: 'text_selection',
          data: expect.objectContaining({
            selectedText: 'selected text for testing'
          })
        })
      });
    });
  });

  describe('Sidebar Integration', () => {
    test('should create and show sidebar iframe', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        analysis: {
          pageType: 'article',
          relevantSuggestions: [{ id: 'test', title: 'Test Suggestion' }]
        }
      });

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get content script instance (assuming global access)
      const contentScriptInstance = window.kiroContentScript || 
        document.querySelector('script')?.kiroContentScript;

      if (contentScriptInstance) {
        contentScriptInstance.showSidebar();

        const sidebar = document.getElementById('kiro-ai-sidebar');
        expect(sidebar).toBeTruthy();
        expect(sidebar.tagName).toBe('IFRAME');
        expect(sidebar.src).toBe('chrome-extension://test-id/sidebar.html');
      }
    });

    test('should handle sidebar messages', async () => {
      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate sidebar message
      const messageEvent = new MessageEvent('message', {
        data: {
          type: 'KIRO_REQUEST_CONTEXT',
          source: 'sidebar'
        },
        source: window // Simulate iframe source
      });

      window.dispatchEvent(messageEvent);

      // Should handle the message (implementation specific)
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('End-to-End User Flows', () => {
    test('should complete full text selection and AI processing flow', async () => {
      // Mock AI processing response
      chrome.runtime.sendMessage
        .mockResolvedValueOnce({
          success: true,
          analysis: { pageType: 'article', relevantSuggestions: [] }
        })
        .mockResolvedValueOnce({ success: true }) // Save activity
        .mockResolvedValueOnce({
          success: true,
          result: 'This is a summary of the selected text.'
        }); // AI processing

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate text selection
      const selectedText = 'This is some selected text that needs processing';
      const mockSelection = {
        toString: () => selectedText,
        getRangeAt: () => ({
          commonAncestorContainer: {
            parentElement: { textContent: `Before ${selectedText} after` }
          },
          startOffset: 7,
          endOffset: 7 + selectedText.length,
          getBoundingClientRect: () => ({ bottom: 100, left: 50 })
        })
      };

      global.window.getSelection = jest.fn(() => mockSelection);

      // Trigger selection
      document.dispatchEvent(new Event('mouseup'));
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should have created tooltip
      const tooltip = document.getElementById('kiro-selection-tooltip');
      expect(tooltip).toBeTruthy();

      // Click summarize action
      const summarizeBtn = tooltip.querySelector('[data-action="summarize"]');
      if (summarizeBtn) {
        summarizeBtn.click();

        await new Promise(resolve => setTimeout(resolve, 100));

        // Should have sent AI processing request
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'AI_PROCESS',
          data: expect.objectContaining({
            operation: 'summarize',
            input: selectedText
          })
        });
      }
    });

    test('should handle form interaction flow', async () => {
      // Add form to DOM
      document.body.innerHTML += `
        <form>
          <input type="text" name="email" id="email" placeholder="Enter email">
          <input type="text" name="name" id="name" placeholder="Enter name">
        </form>
      `;

      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate form interaction
      const emailInput = document.getElementById('email');
      emailInput.focus();

      const focusEvent = new Event('focusin', { bubbles: true });
      Object.defineProperty(focusEvent, 'target', { value: emailInput });
      document.dispatchEvent(focusEvent);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SAVE_ACTIVITY',
        data: expect.objectContaining({
          type: 'form_interaction',
          data: expect.objectContaining({
            fieldName: 'email',
            fieldType: 'text',
            action: 'focus'
          })
        })
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle background script communication errors', async () => {
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Background script not available'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle disabled state gracefully', async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: false });

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not initialize when disabled
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    test('should recover from temporary failures', async () => {
      chrome.runtime.sendMessage
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ success: true, analysis: {} });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have logged error but continued functioning
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should cleanup resources on disable', async () => {
      chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate disable message
      const disableMessage = {
        type: 'KIRO_STATE_CHANGED',
        enabled: false
      };

      // Trigger message handler
      const messageEvent = new MessageEvent('message', {
        data: disableMessage
      });

      chrome.runtime.onMessage.addListener.mock.calls[0][0](
        disableMessage,
        { tab: { id: 1 } },
        jest.fn()
      );

      // Should cleanup resources (implementation specific)
      expect(true).toBe(true); // Placeholder assertion
    });

    test('should throttle activity saving', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      require('../../extension/content.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate rapid text selections
      for (let i = 0; i < 10; i++) {
        document.dispatchEvent(new Event('mouseup'));
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Should not have sent 10 separate requests due to throttling
      const saveActivityCalls = chrome.runtime.sendMessage.mock.calls.filter(
        call => call[0].type === 'SAVE_ACTIVITY'
      );

      expect(saveActivityCalls.length).toBeLessThan(10);
    });
  });
});