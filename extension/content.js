// Kiro Web Mind - Enhanced Content Script
console.log('Kiro Web Mind content script loaded');

class KiroContentScript {
  constructor() {
    this.isInitialized = false;
    this.sidebar = null;
    this.pageContext = null;
    this.observers = [];
    this.activityBuffer = [];
    this.lastAnalysis = null;
    this.sessionId = this.generateSessionId();
    this.pageLoadTime = Date.now();
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;
    this.interactionCount = 0;
    this.init();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Check if Kiro is enabled
      const settings = await chrome.storage.sync.get(['kiroEnabled']);
      if (!settings.kiroEnabled) return;
      
      this.setupEventListeners();
      this.setupObservers();
      await this.analyzePageContext();
      this.startActivityTracking();
      this.isInitialized = true;
      
      console.log('Kiro Web Mind initialized on:', window.location.href);
    } catch (error) {
      console.error('Kiro initialization error:', error);
    }
  }

  setupEventListeners() {
    // Text selection listener with debouncing
    let selectionTimeout;
    document.addEventListener('mouseup', () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText.length > 10) {
          this.handleTextSelection(selectedText);
        }
      }, 300);
    });

    // Enhanced form interaction listener
    document.addEventListener('focusin', (event) => {
      if (this.isFormElement(event.target)) {
        this.handleFormInteraction(event.target, 'focus');
      }
    });

    document.addEventListener('input', (event) => {
      if (this.isFormElement(event.target)) {
        this.handleFormInteraction(event.target, 'input');
      }
    });

    document.addEventListener('change', (event) => {
      if (this.isFormElement(event.target)) {
        this.handleFormInteraction(event.target, 'change');
      }
    });

    // Click tracking
    document.addEventListener('click', (event) => {
      this.handleClickAction(event);
    });

    // Scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateScrollDepth();
      }, 100);
    });

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.analyzePageContext();
      } else {
        this.recordPageExit();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.recordPageExit();
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true;
    });
  }

  setupObservers() {
    // Mutation observer for dynamic content changes
    const mutationObserver = new MutationObserver((mutations) => {
      let significantChange = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if added nodes contain significant content
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && 
                (node.textContent?.length > 50 || node.querySelectorAll('img, video, iframe').length > 0)) {
              significantChange = true;
              break;
            }
          }
        }
      });
      
      if (significantChange) {
        this.debounceAnalysis();
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    this.observers.push(mutationObserver);

    // Intersection observer for content visibility tracking
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.tagName === 'IMG') {
          this.recordImageView(entry.target);
        }
      });
    });

    // Observe images for view tracking
    document.querySelectorAll('img').forEach(img => {
      intersectionObserver.observe(img);
    });

    this.observers.push(intersectionObserver);
  }

  debounceAnalysis() {
    clearTimeout(this.analysisTimeout);
    this.analysisTimeout = setTimeout(() => {
      this.analyzePageContext();
    }, 2000);
  }

  async analyzePageContext() {
    try {
      const startTime = performance.now();
      
      this.pageContext = {
        url: window.location.href,
        title: document.title,
        content: this.extractPageContent(),
        formFields: this.detectFormFields(),
        selectedText: window.getSelection().toString().trim(),
        timestamp: Date.now(),
        metadata: this.extractPageMetadata(),
        pageType: this.detectPageType(),
        readingTime: this.estimateReadingTime(),
        language: this.detectLanguage(),
        images: this.extractImages(),
        links: this.extractLinks(),
        headings: this.extractHeadings(),
        socialMedia: this.detectSocialMedia(),
        ecommerce: this.detectEcommerce()
      };

      const analysisTime = performance.now() - startTime;
      console.log(`Page analysis completed in ${analysisTime.toFixed(2)}ms`);

      // Send to background for AI analysis
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_PAGE',
        data: this.pageContext
      });

      if (response?.success) {
        this.handleAnalysisResult(response.analysis);
      }
    } catch (error) {
      console.error('Page analysis error:', error);
    }
  }

  extractPageContent() {
    // Enhanced content extraction with multiple strategies
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.story-body',
      '.post-body'
    ];

    let content = '';
    
    // Try semantic selectors first
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = this.cleanText(element.innerText);
        if (content.length > 200) {
          break;
        }
      }
    }

    // Fallback to body content with filtering
    if (content.length < 200) {
      const bodyClone = document.body.cloneNode(true);
      
      // Remove unwanted elements
      const unwantedSelectors = [
        'nav', 'header', 'footer', 'aside',
        '.navigation', '.nav', '.menu',
        '.sidebar', '.ads', '.advertisement',
        '.comments', '.social-share',
        'script', 'style', 'noscript'
      ];
      
      unwantedSelectors.forEach(selector => {
        bodyClone.querySelectorAll(selector).forEach(el => el.remove());
      });
      
      content = this.cleanText(bodyClone.innerText);
    }

    return content.slice(0, 5000); // Limit content length
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  detectFormFields() {
    const forms = document.querySelectorAll('form');
    const formFields = [];

    forms.forEach((form, formIndex) => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach((input, inputIndex) => {
        if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
          formFields.push({
            formIndex,
            inputIndex,
            type: input.type || input.tagName.toLowerCase(),
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            label: this.getFieldLabel(input),
            required: input.required,
            value: input.type === 'password' ? '[HIDDEN]' : input.value?.slice(0, 100),
            autocomplete: input.autocomplete,
            pattern: input.pattern,
            minLength: input.minLength,
            maxLength: input.maxLength
          });
        }
      });
    });

    return formFields;
  }

  getFieldLabel(input) {
    // Try multiple strategies to find the label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return this.cleanText(label.innerText);
    }

    // Look for nearby label
    const parent = input.parentElement;
    const label = parent?.querySelector('label');
    if (label) return this.cleanText(label.innerText);

    // Look for aria-label
    if (input.getAttribute('aria-label')) {
      return input.getAttribute('aria-label');
    }

    // Look for preceding text
    const prevSibling = input.previousElementSibling;
    if (prevSibling && prevSibling.tagName !== 'INPUT') {
      const text = this.cleanText(prevSibling.innerText);
      if (text.length < 50) return text;
    }

    return input.placeholder || input.name || '';
  }

  extractPageMetadata() {
    const metadata = {};
    
    // Meta tags
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });

    // Structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const structuredData = [];
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        structuredData.push(data);
      } catch (e) {
        // Ignore invalid JSON
      }
    });
    
    if (structuredData.length > 0) {
      metadata.structuredData = structuredData;
    }

    return metadata;
  }

  detectPageType() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const content = document.body.innerText.toLowerCase();

    // URL-based detection
    if (url.includes('youtube.com/watch') || url.includes('vimeo.com')) return 'video';
    if (url.includes('github.com') || url.includes('gitlab.com')) return 'code';
    if (url.includes('stackoverflow.com') || url.includes('stackexchange.com')) return 'qa';
    if (url.includes('wikipedia.org')) return 'reference';
    if (url.includes('/search') || url.includes('?q=') || url.includes('?search=')) return 'search';
    if (url.includes('shop') || url.includes('store') || url.includes('buy') || url.includes('cart')) return 'shopping';
    
    // Content-based detection
    if (document.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]')) return 'video';
    if (document.querySelector('form') && document.querySelectorAll('input').length > 3) return 'form';
    if (document.querySelector('article, .article, .post, .blog-post')) return 'article';
    if (document.querySelector('.social, .tweet, .post, .status')) return 'social';
    
    // Fallback detection
    if (title.includes('news') || content.includes('published') || content.includes('author')) return 'article';
    if (document.querySelectorAll('a').length > 50) return 'reference';
    
    return 'general';
  }

  estimateReadingTime() {
    const text = this.extractPageContent();
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  detectLanguage() {
    return document.documentElement.lang || 
           document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') || 
           'en';
  }

  extractImages() {
    const images = [];
    document.querySelectorAll('img').forEach(img => {
      if (img.src && img.width > 50 && img.height > 50) {
        images.push({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height,
          loading: img.loading
        });
      }
    });
    return images.slice(0, 10); // Limit to first 10 images
  }

  extractLinks() {
    const links = [];
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.href;
      if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        links.push({
          href,
          text: this.cleanText(link.innerText).slice(0, 100),
          title: link.title,
          external: !href.startsWith(window.location.origin)
        });
      }
    });
    return links.slice(0, 20); // Limit to first 20 links
  }

  extractHeadings() {
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
      const text = this.cleanText(heading.innerText);
      if (text.length > 0) {
        headings.push({
          level: parseInt(heading.tagName.charAt(1)),
          text: text.slice(0, 200),
          id: heading.id
        });
      }
    });
    return headings;
  }

  detectSocialMedia() {
    const socialSelectors = [
      '.social-share', '.share-buttons', '.social-media',
      '[class*="twitter"]', '[class*="facebook"]', '[class*="linkedin"]',
      '[href*="twitter.com"]', '[href*="facebook.com"]', '[href*="linkedin.com"]'
    ];
    
    return socialSelectors.some(selector => document.querySelector(selector) !== null);
  }

  detectEcommerce() {
    const ecommerceSelectors = [
      '.price', '.add-to-cart', '.buy-now', '.checkout',
      '[class*="price"]', '[class*="cart"]', '[class*="shop"]'
    ];
    
    const hasEcommerceElements = ecommerceSelectors.some(selector => 
      document.querySelector(selector) !== null
    );
    
    const hasEcommerceText = /\$\d+|\€\d+|\£\d+|price|buy|cart|checkout/i.test(document.body.innerText);
    
    return hasEcommerceElements || hasEcommerceText;
  }

  isFormElement(element) {
    return element.tagName === 'INPUT' || 
           element.tagName === 'TEXTAREA' || 
           element.tagName === 'SELECT';
  }

  async handleTextSelection(selectedText) {
    try {
      this.interactionCount++;
      
      // Get surrounding context
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer.parentElement || range.commonAncestorContainer;
      const contextBefore = container.textContent.substring(0, range.startOffset).slice(-100);
      const contextAfter = container.textContent.substring(range.endOffset).slice(0, 100);
      
      // Show quick action tooltip
      this.showSelectionTooltip(selectedText);
      
      // Save activity
      await chrome.runtime.sendMessage({
        type: 'SAVE_ACTIVITY',
        data: {
          type: 'text_selection',
          data: {
            selectedText,
            selectionLength: selectedText.length,
            pageUrl: window.location.href,
            contextBefore,
            contextAfter,
            timestamp: Date.now()
          },
          context: this.getActivityContext()
        }
      });
    } catch (error) {
      console.error('Text selection handling error:', error);
    }
  }

  async handleFormInteraction(input, action) {
    try {
      this.interactionCount++;
      
      const fieldInfo = {
        formIndex: Array.from(document.forms).indexOf(input.closest('form')),
        fieldName: input.name || input.id,
        fieldType: input.type || input.tagName.toLowerCase(),
        action,
        label: this.getFieldLabel(input),
        required: input.required,
        timestamp: Date.now()
      };
      
      // Save activity
      await chrome.runtime.sendMessage({
        type: 'SAVE_ACTIVITY',
        data: {
          type: 'form_interaction',
          data: fieldInfo,
          context: this.getActivityContext()
        }
      });
    } catch (error) {
      console.error('Form interaction handling error:', error);
    }
  }

  async handleClickAction(event) {
    try {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      
      // Only track meaningful clicks
      if (['a', 'button', 'input'].includes(tagName) || 
          target.onclick || 
          target.getAttribute('role') === 'button') {
        
        this.interactionCount++;
        
        const clickData = {
          tagName,
          text: this.cleanText(target.innerText || target.value || target.alt).slice(0, 100),
          href: target.href,
          type: target.type,
          className: target.className,
          id: target.id,
          timestamp: Date.now()
        };
        
        await chrome.runtime.sendMessage({
          type: 'SAVE_ACTIVITY',
          data: {
            type: 'click_action',
            data: clickData,
            context: this.getActivityContext()
          }
        });
      }
    } catch (error) {
      console.error('Click action handling error:', error);
    }
  }

  updateScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    this.scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
    this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth);
  }

  recordImageView(img) {
    // Record that an image came into view
    console.log('Image viewed:', img.src);
  }

  recordPageExit() {
    const timeSpent = Date.now() - this.pageLoadTime;
    
    chrome.runtime.sendMessage({
      type: 'SAVE_ACTIVITY',
      data: {
        type: 'page_visit',
        data: {
          url: window.location.href,
          title: document.title,
          timeSpent,
          scrollDepth: this.maxScrollDepth,
          interactionCount: this.interactionCount,
          exitType: 'navigation',
          timestamp: Date.now()
        },
        context: this.getActivityContext()
      }
    }).catch(() => {
      // Ignore errors during page unload
    });
  }

  getActivityContext() {
    return {
      pageContext: this.pageContext,
      deviceInfo: {
        type: this.getDeviceType(),
        os: this.getOS(),
        browser: this.getBrowser(),
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      },
      sessionId: this.sessionId,
      userAgent: navigator.userAgent
    };
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  getOS() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  getBrowser() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  startActivityTracking() {
    // Periodic activity flush
    setInterval(() => {
      if (this.activityBuffer.length > 0) {
        this.flushActivityBuffer();
      }
    }, 30000); // Every 30 seconds
  }

  flushActivityBuffer() {
    // Implementation for batching activities
    console.log('Flushing activity buffer:', this.activityBuffer.length, 'activities');
    this.activityBuffer = [];
  }

  showSelectionTooltip(selectedText) {
    // Remove existing tooltip
    const existingTooltip = document.getElementById('kiro-selection-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'kiro-selection-tooltip';
    tooltip.className = 'kiro-tooltip';
    tooltip.innerHTML = `
      <div class="kiro-tooltip-content">
        <button class="kiro-action-btn" data-action="summarize">📝 Summarize</button>
        <button class="kiro-action-btn" data-action="explain">💡 Explain</button>
        <button class="kiro-action-btn" data-action="translate">🌐 Translate</button>
        <button class="kiro-action-btn" data-action="save">💾 Save</button>
      </div>
    `;

    // Position tooltip near selection
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    tooltip.style.position = 'fixed';
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
    tooltip.style.zIndex = '10000';

    document.body.appendChild(tooltip);

    // Add event listeners
    tooltip.addEventListener('click', (event) => {
      if (event.target.classList.contains('kiro-action-btn')) {
        const action = event.target.dataset.action;
        this.handleSelectionAction(action, selectedText);
        tooltip.remove();
      }
    });

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
    }, 8000);
  }

  async handleSelectionAction(action, selectedText) {
    try {
      console.log(`Kiro action: ${action} on text:`, selectedText.slice(0, 50) + '...');
      
      // Send to background for AI processing
      const response = await chrome.runtime.sendMessage({
        type: 'AI_PROCESS',
        data: {
          operation: action,
          input: selectedText,
          context: this.pageContext
        }
      });

      if (response?.success) {
        this.showActionResult(response.result, action);
      } else {
        this.showActionResult(`Processing ${action}...`, action);
      }
    } catch (error) {
      console.error('Selection action error:', error);
      this.showActionResult(`Error processing ${action}`, action);
    }
  }

  showActionResult(result, action) {
    // Create result popup
    const popup = document.createElement('div');
    popup.className = 'kiro-result-popup';
    popup.innerHTML = `
      <div class="kiro-result-content">
        <div class="kiro-result-header">
          <span>Kiro ${action.charAt(0).toUpperCase() + action.slice(1)}</span>
          <button class="kiro-close-btn">&times;</button>
        </div>
        <div class="kiro-result-body">${result}</div>
        <div class="kiro-result-actions">
          <button class="kiro-copy-btn">📋 Copy</button>
          <button class="kiro-save-btn">💾 Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    // Add functionality
    popup.querySelector('.kiro-close-btn').addEventListener('click', () => {
      popup.remove();
    });

    popup.querySelector('.kiro-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(result).then(() => {
        popup.querySelector('.kiro-copy-btn').textContent = '✅ Copied';
      });
    });

    popup.querySelector('.kiro-save-btn').addEventListener('click', () => {
      this.saveResult(result, action);
    });

    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
      }
    }, 15000);
  }

  async saveResult(result, action) {
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_ACTIVITY',
        data: {
          type: 'content_save',
          data: {
            content: result,
            action,
            url: window.location.href,
            timestamp: Date.now()
          },
          context: this.getActivityContext()
        }
      });
      console.log('Result saved successfully');
    } catch (error) {
      console.error('Error saving result:', error);
    }
  }

  handleAnalysisResult(analysis) {
    console.log('Page analysis result:', analysis);
    
    // Store analysis for sidebar use
    this.lastAnalysis = analysis;
    
    // Show sidebar if relevant suggestions are available
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      this.maybeShowSidebar();
    }
  }

  maybeShowSidebar() {
    // Only show sidebar if user has interacted with the page and there are suggestions
    if (this.lastAnalysis && 
        this.lastAnalysis.relevantSuggestions && 
        this.lastAnalysis.relevantSuggestions.length > 0 && 
        this.interactionCount > 2) {
      
      console.log('Showing Kiro sidebar with suggestions:', this.lastAnalysis.relevantSuggestions);
      this.showSidebar();
    }
  }

  handleMessage(request, sendResponse) {
    switch (request.type) {
      case 'GET_PAGE_CONTEXT':
        sendResponse({ context: this.pageContext });
        break;
      case 'SHOW_SIDEBAR':
        this.showSidebar();
        sendResponse({ success: true });
        break;
      case 'HIDE_SIDEBAR':
        this.hideSidebar();
        sendResponse({ success: true });
        break;
      case 'KIRO_STATE_CHANGED':
        if (request.enabled) {
          this.init();
        } else {
          this.cleanup();
        }
        sendResponse({ success: true });
        break;
      case 'SUMMARIZE_PAGE':
        this.handleSelectionAction('summarize', this.extractPageContent().slice(0, 1000));
        sendResponse({ success: true });
        break;
      case 'ANALYZE_CONTENT':
        this.analyzePageContext();
        sendResponse({ success: true });
        break;
      case 'SHOW_INSIGHTS':
        if (this.lastAnalysis) {
          this.showActionResult(JSON.stringify(this.lastAnalysis, null, 2), 'insights');
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No analysis available' });
        }
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  showSidebar() {
    if (this.sidebar) {
      this.sidebar.style.display = 'block';
      return;
    }

    // Create sidebar iframe
    this.sidebar = document.createElement('iframe');
    this.sidebar.id = 'kiro-ai-sidebar';
    this.sidebar.src = chrome.runtime.getURL('sidebar.html');
    this.sidebar.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      width: 320px !important;
      height: 100vh !important;
      border: none !important;
      z-index: 2147483647 !important;
      background: transparent !important;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3) !important;
    `;

    // Add message listener for sidebar communication
    window.addEventListener('message', (event) => {
      if (event.source === this.sidebar.contentWindow) {
        this.handleSidebarMessage(event.data);
      }
    });

    document.body.appendChild(this.sidebar);

    // Send initial context after sidebar loads
    this.sidebar.onload = () => {
      this.sendContextToSidebar();
    };

    console.log('Kiro sidebar shown');
  }

  hideSidebar() {
    if (this.sidebar) {
      this.sidebar.style.display = 'none';
      console.log('Kiro sidebar hidden');
    }
  }

  removeSidebar() {
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
      console.log('Kiro sidebar removed');
    }
  }

  handleSidebarMessage(data) {
    const { type, action, suggestion, context } = data;

    switch (type) {
      case 'KIRO_REQUEST_CONTEXT':
        this.sendContextToSidebar();
        break;
        
      case 'KIRO_REQUEST_SUGGESTIONS':
        this.sendSuggestionsToSidebar();
        break;
        
      case 'KIRO_REQUEST_INSIGHTS':
        this.sendInsightsToSidebar();
        break;
        
      case 'KIRO_QUICK_ACTION':
        this.handleSidebarAction(action);
        break;
        
      case 'KIRO_SUGGESTION_ACTION':
        this.handleSuggestionFromSidebar(suggestion);
        break;
        
      case 'KIRO_SIDEBAR_CLOSED':
        this.removeSidebar();
        break;
        
      case 'KIRO_OPEN_SETTINGS':
        this.openDashboardSettings();
        break;
        
      default:
        console.log('Unknown sidebar message:', type);
    }
  }

  sendContextToSidebar() {
    if (!this.sidebar) return;

    const contextData = {
      ...this.pageContext,
      analysis: this.lastAnalysis
    };

    this.sidebar.contentWindow.postMessage({
      type: 'KIRO_CONTEXT_UPDATE',
      data: contextData
    }, '*');
  }

  sendSuggestionsToSidebar() {
    if (!this.sidebar || !this.lastAnalysis) return;

    this.sidebar.contentWindow.postMessage({
      type: 'KIRO_SUGGESTIONS_UPDATE',
      data: this.lastAnalysis.relevantSuggestions || []
    }, '*');
  }

  sendInsightsToSidebar() {
    if (!this.sidebar || !this.lastAnalysis) return;

    const insights = [
      {
        type: 'analysis',
        title: 'Page Analysis',
        description: `This ${this.lastAnalysis.pageType} page has ${this.lastAnalysis.complexity} complexity`
      },
      {
        type: 'intent',
        title: 'User Intent',
        description: `Detected intent: ${this.lastAnalysis.userIntent}`
      }
    ];

    if (this.lastAnalysis.automationOpportunities?.length > 0) {
      insights.push({
        type: 'automation',
        title: 'Automation Opportunity',
        description: this.lastAnalysis.automationOpportunities[0].description
      });
    }

    this.sidebar.contentWindow.postMessage({
      type: 'KIRO_INSIGHTS_UPDATE',
      data: insights
    }, '*');
  }

  async handleSidebarAction(action) {
    let content = '';
    
    // Get content based on action
    switch (action) {
      case 'summarize':
        content = this.extractPageContent().slice(0, 2000);
        break;
      case 'explain':
        content = window.getSelection().toString() || this.extractPageContent().slice(0, 1000);
        break;
      case 'translate':
        content = window.getSelection().toString() || this.extractPageContent().slice(0, 500);
        break;
      case 'save':
        content = window.getSelection().toString() || document.title;
        break;
    }

    if (content) {
      await this.handleSelectionAction(action, content);
    }
  }

  async handleSuggestionFromSidebar(suggestion) {
    if (!suggestion) return;

    console.log('Executing suggestion from sidebar:', suggestion);
    
    // Execute the suggestion action
    await this.handleSelectionAction(suggestion.action, this.extractPageContent().slice(0, 1000));
  }

  openDashboardSettings() {
    // Open dashboard settings in new tab
    const dashboardUrl = 'http://localhost:3000/dashboard/settings';
    window.open(dashboardUrl, '_blank');
  }

  cleanup() {
    // Clean up observers and event listeners
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
    console.log('Kiro Web Mind cleaned up');
  }
}

// Initialize Kiro when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new KiroContentScript();
  });
} else {
  new KiroContentScript();
}