// Kiro Web Mind - Enhanced Background Service Worker
console.log('Kiro Web Mind background script loaded');

class KiroBackgroundService {
  constructor() {
    this.isInitialized = false;
    this.userPreferences = null;
    this.activityQueue = [];
    this.processingQueue = false;
    this.aiCache = new Map();
    this.rateLimiter = new Map();
    this.init();
  }

  async init() {
    if (this.isInitialized) return;

    try {
      await this.loadUserPreferences();
      this.setupEventListeners();
      this.startPeriodicTasks();
      this.isInitialized = true;
      console.log('Kiro Background Service initialized');
    } catch (error) {
      console.error('Background service initialization error:', error);
    }
  }

  async loadUserPreferences() {
    try {
      const result = await chrome.storage.sync.get([
        'kiroEnabled',
        'privacyLevel',
        'sidebarPosition',
        'voiceEnabled',
        'aiSettings',
        'automationRules'
      ]);

      this.userPreferences = {
        kiroEnabled: result.kiroEnabled !== false,
        privacyLevel: result.privacyLevel || 'standard',
        sidebarPosition: result.sidebarPosition || 'right',
        voiceEnabled: result.voiceEnabled || false,
        aiSettings: result.aiSettings || {
          summaryLength: 'brief',
          suggestionFrequency: 'medium',
          contextAwareness: true
        },
        automationRules: result.automationRules || []
      };
    } catch (error) {
      console.error('Error loading user preferences:', error);
      this.userPreferences = this.getDefaultPreferences();
    }
  }

  getDefaultPreferences() {
    return {
      kiroEnabled: true,
      privacyLevel: 'standard',
      sidebarPosition: 'right',
      voiceEnabled: false,
      aiSettings: {
        summaryLength: 'brief',
        suggestionFrequency: 'medium',
        contextAwareness: true
      },
      automationRules: []
    };
  }

  setupEventListeners() {
    // Extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Message handling from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Tab events
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    // Storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.handleStorageChanged(changes, namespace);
    });

    // Alarm events for periodic tasks
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });
  }

  async handleInstallation(details) {
    console.log('Kiro Web Mind installed:', details.reason);

    if (details.reason === 'install') {
      // Set default preferences
      await chrome.storage.sync.set(this.getDefaultPreferences());
      
      // Initialize local storage
      await chrome.storage.local.set({
        activities: [],
        stats: {
          pagesAnalyzed: 0,
          suggestionsMade: 0,
          automationsTriggered: 0,
          timesSaved: 0
        },
        cache: {},
        lastSync: Date.now()
      });

      // Create welcome notification
      this.showNotification({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Welcome to Kiro!',
        message: 'Your AI web assistant is ready. Click to get started.'
      });
    } else if (details.reason === 'update') {
      // Handle updates
      await this.handleUpdate(details.previousVersion);
    }
  }

  async handleUpdate(previousVersion) {
    console.log(`Kiro updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    
    // Migrate data if needed
    await this.migrateData(previousVersion);
    
    // Show update notification
    this.showNotification({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Kiro Updated!',
      message: 'New features and improvements are now available.'
    });
  }

  async migrateData(previousVersion) {
    // Handle data migration between versions
    try {
      const result = await chrome.storage.local.get(['activities', 'stats']);
      
      // Example migration logic
      if (previousVersion < '1.1.0') {
        // Migrate old activity format
        if (result.activities) {
          const migratedActivities = result.activities.map(activity => ({
            ...activity,
            version: '1.1.0',
            migrated: true
          }));
          await chrome.storage.local.set({ activities: migratedActivities });
        }
      }
    } catch (error) {
      console.error('Data migration error:', error);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      const startTime = performance.now();
      
      switch (request.type) {
        case 'ANALYZE_PAGE':
          await this.handlePageAnalysis(request.data, sendResponse);
          break;
          
        case 'GET_SUGGESTIONS':
          await this.handleGetSuggestions(request.data, sendResponse);
          break;
          
        case 'SAVE_ACTIVITY':
          await this.handleSaveActivity(request.data, sendResponse);
          break;
          
        case 'AI_PROCESS':
          await this.handleAIProcess(request.data, sendResponse);
          break;
          
        case 'GET_STATS':
          await this.handleGetStats(sendResponse);
          break;
          
        case 'TRIGGER_AUTOMATION':
          await this.handleTriggerAutomation(request.data, sendResponse);
          break;
          
        case 'UPDATE_PREFERENCES':
          await this.handleUpdatePreferences(request.data, sendResponse);
          break;
          
        case 'EXPORT_DATA':
          await this.handleExportData(sendResponse);
          break;
          
        case 'CLEAR_DATA':
          await this.handleClearData(request.data, sendResponse);
          break;
          
        default:
          sendResponse({ error: 'Unknown message type', type: request.type });
      }
      
      const processingTime = performance.now() - startTime;
      console.log(`Message ${request.type} processed in ${processingTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ error: error.message });
    }
  }

  async handlePageAnalysis(pageData, sendResponse) {
    try {
      // Check rate limiting
      if (!this.checkRateLimit('page_analysis', 100, 60000)) { // 100 per minute
        sendResponse({ error: 'Rate limit exceeded' });
        return;
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey('analysis', pageData.url, pageData.content?.slice(0, 100));
      
      // Check cache first
      if (this.aiCache.has(cacheKey)) {
        const cachedResult = this.aiCache.get(cacheKey);
        sendResponse({ success: true, analysis: cachedResult, cached: true });
        return;
      }

      // Perform analysis
      const analysis = await this.analyzePageContent(pageData);
      
      // Cache result
      this.aiCache.set(cacheKey, analysis);
      
      // Update stats
      await this.updateStats({ pagesAnalyzed: 1 });
      
      sendResponse({ success: true, analysis });
      
    } catch (error) {
      console.error('Page analysis error:', error);
      sendResponse({ error: error.message });
    }
  }

  async analyzePageContent(pageData) {
    const analysis = {
      pageType: this.detectPageType(pageData),
      mainTopic: this.extractMainTopic(pageData.title, pageData.content),
      keyEntities: this.extractKeyEntities(pageData.content),
      userIntent: this.inferUserIntent(pageData),
      confidence: 0.8,
      relevantSuggestions: [],
      automationOpportunities: [],
      sentiment: this.analyzeSentiment(pageData.content),
      complexity: this.assessComplexity(pageData.content),
      readingTime: pageData.readingTime || this.estimateReadingTime(pageData.content)
    };

    // Generate contextual suggestions
    analysis.relevantSuggestions = await this.generateSuggestions(pageData, analysis);
    
    // Detect automation opportunities
    analysis.automationOpportunities = await this.detectAutomationOpportunities(pageData, analysis);
    
    return analysis;
  }

  detectPageType(pageData) {
    const url = pageData.url.toLowerCase();
    const title = pageData.title.toLowerCase();
    const content = pageData.content?.toLowerCase() || '';

    // Enhanced page type detection
    const patterns = {
      video: [
        /youtube\.com\/watch/,
        /vimeo\.com/,
        /twitch\.tv/,
        /netflix\.com/,
        /video/,
        /watch/
      ],
      code: [
        /github\.com/,
        /gitlab\.com/,
        /bitbucket\.org/,
        /stackoverflow\.com/,
        /codepen\.io/,
        /jsfiddle\.net/
      ],
      shopping: [
        /amazon\./,
        /ebay\./,
        /shop/,
        /store/,
        /buy/,
        /cart/,
        /checkout/,
        /product/
      ],
      social: [
        /twitter\.com/,
        /facebook\.com/,
        /instagram\.com/,
        /linkedin\.com/,
        /reddit\.com/,
        /tiktok\.com/
      ],
      news: [
        /news/,
        /cnn\.com/,
        /bbc\.com/,
        /reuters\.com/,
        /ap\.org/
      ],
      reference: [
        /wikipedia\.org/,
        /dictionary\./,
        /encyclopedia/,
        /reference/
      ]
    };

    for (const [type, typePatterns] of Object.entries(patterns)) {
      if (typePatterns.some(pattern => pattern.test(url) || pattern.test(title))) {
        return type;
      }
    }

    // Content-based detection
    if (pageData.formFields && pageData.formFields.length > 3) return 'form';
    if (content.includes('article') || content.includes('blog')) return 'article';
    if (content.includes('search') || content.includes('results')) return 'search';
    
    return 'general';
  }

  extractMainTopic(title, content) {
    // Simple topic extraction (would be enhanced with NLP in production)
    const words = (title + ' ' + (content || '')).toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);
    
    return sortedWords.join(' ');
  }

  extractKeyEntities(content) {
    if (!content) return [];
    
    // Simple entity extraction (would use NLP in production)
    const entities = [];
    
    // Extract potential company names (capitalized words)
    const companyPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const companies = content.match(companyPattern) || [];
    entities.push(...companies.slice(0, 5));
    
    // Extract URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlPattern) || [];
    entities.push(...urls.slice(0, 3));
    
    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = content.match(emailPattern) || [];
    entities.push(...emails.slice(0, 2));
    
    return [...new Set(entities)]; // Remove duplicates
  }

  inferUserIntent(pageData) {
    const url = pageData.url.toLowerCase();
    const formFields = pageData.formFields || [];
    const selectedText = pageData.selectedText;
    
    if (selectedText && selectedText.length > 50) return 'researching';
    if (formFields.length > 0) return 'filling_form';
    if (url.includes('shop') || url.includes('buy')) return 'shopping';
    if (url.includes('learn') || url.includes('tutorial')) return 'learning';
    if (url.includes('work') || url.includes('dashboard')) return 'working';
    if (url.includes('social') || url.includes('feed')) return 'social';
    if (url.includes('video') || url.includes('watch')) return 'entertainment';
    
    return 'browsing';
  }

  analyzeSentiment(content) {
    if (!content) return 'neutral';
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'poor'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount * 1.5) return 'positive';
    if (negativeCount > positiveCount * 1.5) return 'negative';
    return 'neutral';
  }

  assessComplexity(content) {
    if (!content) return 'low';
    
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence > 20) return 'high';
    if (avgWordsPerSentence > 12) return 'medium';
    return 'low';
  }

  estimateReadingTime(content) {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  async generateSuggestions(pageData, analysis) {
    const suggestions = [];
    
    // Content-based suggestions
    if (analysis.pageType === 'article' && pageData.content && pageData.content.length > 1000) {
      suggestions.push({
        id: 'summarize_article',
        title: 'Summarize this article',
        description: 'Get a quick summary of the main points',
        action: 'summarize',
        confidence: 0.9,
        category: 'productivity'
      });
    }
    
    if (pageData.selectedText && pageData.selectedText.length > 50) {
      suggestions.push({
        id: 'explain_selection',
        title: 'Explain selected text',
        description: 'Get a detailed explanation of the selected content',
        action: 'explain',
        confidence: 0.8,
        category: 'learning'
      });
    }
    
    if (analysis.pageType === 'form' && pageData.formFields.length > 3) {
      suggestions.push({
        id: 'autofill_form',
        title: 'Auto-fill form',
        description: 'Fill form fields with your saved information',
        action: 'automate',
        confidence: 0.7,
        category: 'productivity'
      });
    }
    
    if (analysis.pageType === 'shopping') {
      suggestions.push({
        id: 'price_track',
        title: 'Track price changes',
        description: 'Get notified when the price drops',
        action: 'save',
        confidence: 0.6,
        category: 'productivity'
      });
    }
    
    // Update suggestion stats
    if (suggestions.length > 0) {
      await this.updateStats({ suggestionsMade: suggestions.length });
    }
    
    return suggestions;
  }

  async detectAutomationOpportunities(pageData, analysis) {
    const opportunities = [];
    
    // Form automation opportunities
    if (pageData.formFields && pageData.formFields.length > 0) {
      const commonFields = pageData.formFields.filter(field => 
        ['name', 'email', 'phone', 'address'].some(common => 
          field.name.toLowerCase().includes(common) || 
          field.label.toLowerCase().includes(common)
        )
      );
      
      if (commonFields.length > 0) {
        opportunities.push({
          id: 'form_autofill',
          type: 'form_fill',
          description: 'Auto-fill common form fields',
          confidence: 0.8,
          estimatedTimeSaved: 30, // seconds
          complexity: 'low'
        });
      }
    }
    
    // Navigation automation
    if (analysis.pageType === 'search' && pageData.url.includes('google.com')) {
      opportunities.push({
        id: 'search_enhancement',
        type: 'navigation',
        description: 'Enhance search results with AI insights',
        confidence: 0.6,
        estimatedTimeSaved: 60,
        complexity: 'medium'
      });
    }
    
    return opportunities;
  }

  async handleGetSuggestions(context, sendResponse) {
    try {
      const suggestions = await this.generateSuggestions(context, { pageType: 'general' });
      sendResponse({ success: true, suggestions });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async handleSaveActivity(activityData, sendResponse) {
    try {
      // Validate activity data
      if (!activityData.type || !activityData.data) {
        throw new Error('Invalid activity data');
      }
      
      // Add to queue for batch processing
      this.activityQueue.push({
        ...activityData,
        timestamp: Date.now(),
        id: this.generateActivityId()
      });
      
      // Process queue if it's getting full
      if (this.activityQueue.length >= 10) {
        this.processActivityQueue();
      }
      
      sendResponse({ success: true });
      
    } catch (error) {
      console.error('Save activity error:', error);
      sendResponse({ error: error.message });
    }
  }

  async processActivityQueue() {
    if (this.processingQueue || this.activityQueue.length === 0) return;
    
    this.processingQueue = true;
    
    try {
      // Get existing activities
      const result = await chrome.storage.local.get(['activities']);
      const activities = result.activities || [];
      
      // Add new activities
      activities.push(...this.activityQueue);
      
      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }
      
      // Save to storage
      await chrome.storage.local.set({ activities });
      
      // Clear queue
      this.activityQueue = [];
      
      console.log(`Processed ${this.activityQueue.length} activities`);
      
    } catch (error) {
      console.error('Activity queue processing error:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  generateActivityId() {
    return 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async handleAIProcess(data, sendResponse) {
    try {
      const { operation, input, context } = data;
      
      // Check rate limiting
      if (!this.checkRateLimit('ai_process', 50, 60000)) { // 50 per minute
        sendResponse({ error: 'AI processing rate limit exceeded' });
        return;
      }
      
      let result;
      
      switch (operation) {
        case 'summarize':
          result = await this.summarizeText(input);
          break;
        case 'explain':
          result = await this.explainText(input);
          break;
        case 'translate':
          result = await this.translateText(input);
          break;
        case 'extract':
          result = await this.extractKeyPoints(input);
          break;
        default:
          throw new Error(`Unknown AI operation: ${operation}`);
      }
      
      sendResponse({ success: true, result });
      
    } catch (error) {
      console.error('AI processing error:', error);
      sendResponse({ error: error.message });
    }
  }

  async summarizeText(text) {
    // Mock summarization (would use actual AI in production)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, Math.min(3, Math.ceil(sentences.length / 3))).join('. ');
    return `Summary: ${summary}${summary.endsWith('.') ? '' : '.'}`;
  }

  async explainText(text) {
    // Mock explanation (would use actual AI in production)
    return `This text discusses: ${text.slice(0, 100)}... The main concepts include various topics that would benefit from further analysis.`;
  }

  async translateText(text) {
    // Mock translation (would use actual translation service in production)
    return `[Translation of: ${text.slice(0, 50)}...]`;
  }

  async extractKeyPoints(text) {
    // Mock key point extraction
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keyPoints = sentences.slice(0, 3).map((sentence, index) => `${index + 1}. ${sentence.trim()}`);
    return `Key Points:\n${keyPoints.join('\n')}`;
  }

  checkRateLimit(operation, limit, windowMs) {
    const now = Date.now();
    const key = operation;
    
    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    const limiter = this.rateLimiter.get(key);
    
    if (now > limiter.resetTime) {
      limiter.count = 1;
      limiter.resetTime = now + windowMs;
      return true;
    }
    
    if (limiter.count >= limit) {
      return false;
    }
    
    limiter.count++;
    return true;
  }

  generateCacheKey(...parts) {
    return parts.join('|').replace(/[^\w\-]/g, '').slice(0, 100);
  }

  async handleGetStats(sendResponse) {
    try {
      const result = await chrome.storage.local.get(['stats', 'activities']);
      const stats = result.stats || {};
      const activities = result.activities || [];
      
      const enhancedStats = {
        ...stats,
        totalActivities: activities.length,
        todayActivities: activities.filter(a => 
          new Date(a.timestamp).toDateString() === new Date().toDateString()
        ).length,
        cacheSize: this.aiCache.size,
        queueSize: this.activityQueue.length
      };
      
      sendResponse({ success: true, stats: enhancedStats });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async updateStats(updates) {
    try {
      const result = await chrome.storage.local.get(['stats']);
      const currentStats = result.stats || {};
      
      const newStats = { ...currentStats };
      for (const [key, value] of Object.entries(updates)) {
        newStats[key] = (newStats[key] || 0) + value;
      }
      
      await chrome.storage.local.set({ stats: newStats });
    } catch (error) {
      console.error('Stats update error:', error);
    }
  }

  async handleUpdatePreferences(preferences, sendResponse) {
    try {
      await chrome.storage.sync.set(preferences);
      this.userPreferences = { ...this.userPreferences, ...preferences };
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async handleExportData(sendResponse) {
    try {
      const syncData = await chrome.storage.sync.get();
      const localData = await chrome.storage.local.get();
      
      const exportData = {
        version: chrome.runtime.getManifest().version,
        exportDate: new Date().toISOString(),
        preferences: syncData,
        activities: localData.activities || [],
        stats: localData.stats || {}
      };
      
      sendResponse({ success: true, data: exportData });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async handleClearData(options, sendResponse) {
    try {
      if (options.activities) {
        await chrome.storage.local.set({ activities: [] });
      }
      
      if (options.stats) {
        await chrome.storage.local.set({ stats: {} });
      }
      
      if (options.cache) {
        this.aiCache.clear();
        await chrome.storage.local.set({ cache: {} });
      }
      
      if (options.preferences) {
        await chrome.storage.sync.clear();
        await chrome.storage.sync.set(this.getDefaultPreferences());
      }
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  handleTabActivated(activeInfo) {
    // Track tab switching for context awareness
    console.log('Tab activated:', activeInfo.tabId);
  }

  handleTabUpdated(tabId, changeInfo, tab) {
    // Track page navigation
    if (changeInfo.status === 'complete' && tab.url) {
      console.log('Page loaded:', tab.url);
    }
  }

  handleStorageChanged(changes, namespace) {
    // React to preference changes
    if (namespace === 'sync') {
      this.loadUserPreferences();
    }
  }

  startPeriodicTasks() {
    // Set up periodic tasks
    chrome.alarms.create('processQueue', { periodInMinutes: 1 });
    chrome.alarms.create('cleanupCache', { periodInMinutes: 30 });
    chrome.alarms.create('syncData', { periodInMinutes: 60 });
  }

  handleAlarm(alarm) {
    switch (alarm.name) {
      case 'processQueue':
        this.processActivityQueue();
        break;
      case 'cleanupCache':
        this.cleanupCache();
        break;
      case 'syncData':
        this.syncDataToCloud();
        break;
    }
  }

  cleanupCache() {
    // Remove old cache entries
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    
    for (const [key, value] of this.aiCache.entries()) {
      if (value.timestamp && now - value.timestamp > maxAge) {
        this.aiCache.delete(key);
      }
    }
    
    console.log(`Cache cleaned up, ${this.aiCache.size} entries remaining`);
  }

  async syncDataToCloud() {
    // Placeholder for cloud sync functionality
    console.log('Cloud sync placeholder');
  }

  showNotification(options) {
    if (chrome.notifications) {
      chrome.notifications.create(options);
    }
  }
}

// Initialize the background service
const kiroBackground = new KiroBackgroundService();