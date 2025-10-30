// Unit tests for Chrome extension content script

/**
 * @jest-environment jsdom
 */

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  storage: {
    sync: {
      get: jest.fn()
    }
  }
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock Intl API
global.Intl = {
  DateTimeFormat: jest.fn(() => ({
    resolvedOptions: () => ({ timeZone: 'UTC' })
  }))
};

// Load the content script
require('../../extension/content.js');

describe('KiroContentScript', () => {
  let contentScript;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock chrome.storage.sync.get to return enabled state
    global.chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: true });
    
    // Create a new instance
    contentScript = new KiroContentScript();
  });

  afterEach(() => {
    if (contentScript && contentScript.cleanup) {
      contentScript.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should generate unique session ID', () => {
      const sessionId1 = contentScript.generateSessionId();
      const sessionId2 = contentScript.generateSessionId();
      
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(sessionId2).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(sessionId1).not.toBe(sessionId2);
    });

    test('should not initialize if Kiro is disabled', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({ kiroEnabled: false });
      
      const newContentScript = new KiroContentScript();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async init
      
      expect(newContentScript.isInitialized).toBe(false);
    });
  });

  describe('Page Analysis', () => {
    beforeEach(() => {
      // Set up a basic HTML structure
      document.body.innerHTML = `
        <header>
          <nav>Navigation</nav>
        </header>
        <main>
          <article>
            <h1>Test Article Title</h1>
            <p>This is the main content of the article. It contains several sentences to test content extraction.</p>
            <p>Another paragraph with more content for testing purposes.</p>
          </article>
        </main>
        <aside>Sidebar content</aside>
        <footer>Footer content</footer>
      `;
      
      document.title = 'Test Page Title';
      Object.defineProperty(window, 'location', {
        value: { href: 'https://example.com/test-page' },
        writable: true
      });
    });

    test('should extract page content correctly', () => {
      const content = contentScript.extractPageContent();
      
      expect(content).toContain('Test Article Title');
      expect(content).toContain('main content of the article');
      expect(content).not.toContain('Navigation');
      expect(content).not.toContain('Footer content');
    });

    test('should detect page type correctly', () => {
      // Test article detection
      expect(contentScript.detectPageType()).toBe('article');
      
      // Test video detection
      Object.defineProperty(window, 'location', {
        value: { href: 'https://youtube.com/watch?v=123' },
        writable: true
      });
      expect(contentScript.detectPageType()).toBe('video');
      
      // Test code detection
      Object.defineProperty(window, 'location', {
        value: { href: 'https://github.com/user/repo' },
        writable: true
      });
      expect(contentScript.detectPageType()).toBe('code');
    });

    test('should estimate reading time', () => {
      const readingTime = contentScript.estimateReadingTime();
      expect(readingTime).toBeGreaterThan(0);
      expect(typeof readingTime).toBe('number');
    });

    test('should detect language', () => {
      document.documentElement.lang = 'en-US';
      expect(contentScript.detectLanguage()).toBe('en-US');
      
      document.documentElement.lang = '';
      expect(contentScript.detectLanguage()).toBe('en'); // fallback
    });

    test('should extract headings', () => {
      const headings = contentScript.extractHeadings();
      
      expect(headings).toHaveLength(1);
      expect(headings[0]).toEqual({
        level: 1,
        text: 'Test Article Title',
        id: ''
      });
    });

    test('should extract images', () => {
      document.body.innerHTML += `
        <img src="https://example.com/image1.jpg" alt="Test Image 1" width="200" height="150">
        <img src="https://example.com/image2.jpg" alt="Test Image 2" width="100" height="75">
        <img src="https://example.com/small.jpg" alt="Small Image" width="20" height="20">
      `;
      
      const images = contentScript.extractImages();
      
      expect(images).toHaveLength(2); // Should exclude small image
      expect(images[0]).toEqual({
        src: 'https://example.com/image1.jpg',
        alt: 'Test Image 1',
        width: 200,
        height: 150,
        loading: undefined
      });
    });

    test('should extract links', () => {
      document.body.innerHTML += `
        <a href="https://example.com/page1">External Link</a>
        <a href="/internal-page">Internal Link</a>
        <a href="javascript:void(0)">JavaScript Link</a>
        <a href="#section">Anchor Link</a>
      `;
      
      const links = contentScript.extractLinks();
      
      expect(links).toHaveLength(2); // Should exclude javascript and anchor links
      expect(links[0].external).toBe(true);
      expect(links[1].external).toBe(false);
    });
  });

  describe('Form Detection', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <form id="test-form">
          <label for="name">Name:</label>
          <input type="text" id="name" name="name" placeholder="Enter your name" required>
          
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" placeholder="Enter your email">
          
          <textarea name="message" placeholder="Your message"></textarea>
          
          <select name="country">
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
          </select>
          
          <input type="hidden" name="csrf_token" value="abc123">
          <input type="submit" value="Submit">
        </form>
      `;
    });

    test('should detect form fields correctly', () => {
      const formFields = contentScript.detectFormFields();
      
      expect(formFields).toHaveLength(4); // Should exclude hidden and submit inputs
      
      const nameField = formFields.find(field => field.name === 'name');
      expect(nameField).toEqual({
        formIndex: 0,
        inputIndex: 0,
        type: 'text',
        name: 'name',
        id: 'name',
        placeholder: 'Enter your name',
        label: 'Name:',
        required: true,
        value: '',
        autocomplete: '',
        pattern: '',
        minLength: -1,
        maxLength: -1
      });
    });

    test('should get field labels correctly', () => {
      const nameInput = document.getElementById('name');
      const label = contentScript.getFieldLabel(nameInput);
      expect(label).toBe('Name:');
    });
  });

  describe('Activity Context', () => {
    test('should generate activity context', () => {
      contentScript.pageContext = {
        url: 'https://example.com',
        title: 'Test Page'
      };
      
      const context = contentScript.getActivityContext();
      
      expect(context).toHaveProperty('pageContext');
      expect(context).toHaveProperty('deviceInfo');
      expect(context).toHaveProperty('sessionId');
      expect(context).toHaveProperty('userAgent');
      
      expect(context.deviceInfo).toHaveProperty('type');
      expect(context.deviceInfo).toHaveProperty('os');
      expect(context.deviceInfo).toHaveProperty('browser');
    });

    test('should detect device type correctly', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      expect(contentScript.getDeviceType()).toBe('desktop');
      
      window.innerWidth = 800;
      expect(contentScript.getDeviceType()).toBe('tablet');
      
      window.innerWidth = 400;
      expect(contentScript.getDeviceType()).toBe('mobile');
    });

    test('should detect OS correctly', () => {
      // Mock navigator.userAgent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
      expect(contentScript.getOS()).toBe('macOS');
      
      navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      expect(contentScript.getBrowser()).toBe('Chrome');
    });
  });

  describe('Text Selection Handling', () => {
    test('should handle text selection', async () => {
      const selectedText = 'This is selected text for testing';
      
      // Mock window.getSelection
      const mockSelection = {
        toString: () => selectedText,
        getRangeAt: () => ({
          commonAncestorContainer: {
            parentElement: {
              textContent: `Before text. ${selectedText}. After text.`
            }
          },
          startOffset: 13,
          endOffset: 13 + selectedText.length
        })
      };
      
      global.window.getSelection = jest.fn(() => mockSelection);
      
      await contentScript.handleTextSelection(selectedText);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SAVE_ACTIVITY',
        data: expect.objectContaining({
          type: 'text_selection',
          data: expect.objectContaining({
            selectedText,
            selectionLength: selectedText.length
          })
        })
      });
    });
  });

  describe('Message Handling', () => {
    test('should handle GET_PAGE_CONTEXT message', () => {
      const mockSendResponse = jest.fn();
      contentScript.pageContext = { url: 'https://example.com' };
      
      contentScript.handleMessage({ type: 'GET_PAGE_CONTEXT' }, mockSendResponse);
      
      expect(mockSendResponse).toHaveBeenCalledWith({
        context: { url: 'https://example.com' }
      });
    });

    test('should handle KIRO_STATE_CHANGED message', () => {
      const mockSendResponse = jest.fn();
      const initSpy = jest.spyOn(contentScript, 'init');
      
      contentScript.handleMessage({ 
        type: 'KIRO_STATE_CHANGED', 
        enabled: true 
      }, mockSendResponse);
      
      expect(initSpy).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should handle unknown message type', () => {
      const mockSendResponse = jest.fn();
      
      contentScript.handleMessage({ type: 'UNKNOWN_TYPE' }, mockSendResponse);
      
      expect(mockSendResponse).toHaveBeenCalledWith({ 
        error: 'Unknown message type' 
      });
    });
  });

  describe('Utility Functions', () => {
    test('should clean text correctly', () => {
      const dirtyText = '  This   has    extra\n\n\nspaces  \n  ';
      const cleanText = contentScript.cleanText(dirtyText);
      
      expect(cleanText).toBe('This has extra\nspaces');
    });

    test('should identify form elements', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const select = document.createElement('select');
      const div = document.createElement('div');
      
      expect(contentScript.isFormElement(input)).toBe(true);
      expect(contentScript.isFormElement(textarea)).toBe(true);
      expect(contentScript.isFormElement(select)).toBe(true);
      expect(contentScript.isFormElement(div)).toBe(false);
    });

    test('should detect social media elements', () => {
      document.body.innerHTML = '<div class="social-share">Share</div>';
      expect(contentScript.detectSocialMedia()).toBe(true);
      
      document.body.innerHTML = '<div>No social media</div>';
      expect(contentScript.detectSocialMedia()).toBe(false);
    });

    test('should detect ecommerce elements', () => {
      document.body.innerHTML = '<div class="price">$19.99</div>';
      expect(contentScript.detectEcommerce()).toBe(true);
      
      document.body.innerHTML = '<div>Regular content</div>';
      expect(contentScript.detectEcommerce()).toBe(false);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup observers and reset state', () => {
      contentScript.isInitialized = true;
      contentScript.observers = [
        { disconnect: jest.fn() },
        { disconnect: jest.fn() }
      ];
      
      contentScript.cleanup();
      
      expect(contentScript.isInitialized).toBe(false);
      expect(contentScript.observers).toHaveLength(0);
      contentScript.observers.forEach(observer => {
        expect(observer.disconnect).toHaveBeenCalled();
      });
    });
  });
});