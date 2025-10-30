// Kiro AI Sidebar JavaScript
class KiroSidebar {
  constructor() {
    this.isInitialized = false;
    this.currentContext = null;
    this.suggestions = [];
    this.insights = [];
    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.loadInitialData();
    this.isInitialized = true;
    
    console.log('Kiro Sidebar initialized');
  }

  setupEventListeners() {
    // Close button
    document.getElementById('closeSidebar').addEventListener('click', () => {
      this.closeSidebar();
    });

    // Settings button
    document.getElementById('openSettings').addEventListener('click', () => {
      this.openSettings();
    });

    // Quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Listen for messages from parent window
    window.addEventListener('message', (event) => {
      this.handleMessage(event);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  async loadInitialData() {
    try {
      // Request page context from parent window
      window.parent.postMessage({
        type: 'KIRO_REQUEST_CONTEXT',
        source: 'sidebar'
      }, '*');

      // Load suggestions
      await this.loadSuggestions();
      
      // Load insights
      await this.loadInsights();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to load page data');
    }
  }

  handleMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'KIRO_CONTEXT_UPDATE':
        this.updateContext(data);
        break;
      case 'KIRO_SUGGESTIONS_UPDATE':
        this.updateSuggestions(data);
        break;
      case 'KIRO_INSIGHTS_UPDATE':
        this.updateInsights(data);
        break;
      case 'KIRO_CLOSE_SIDEBAR':
        this.closeSidebar();
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  updateContext(context) {
    this.currentContext = context;
    
    // Update context display
    document.getElementById('pageType').textContent = 
      this.formatPageType(context.pageType || 'general');
    
    document.getElementById('readingTime').textContent = 
      context.readingTime ? `${context.readingTime} min` : '-';
    
    document.getElementById('complexity').textContent = 
      this.formatComplexity(context.complexity || 'medium');
    
    document.getElementById('language').textContent = 
      context.language || 'en';
  }

  formatPageType(type) {
    const typeMap = {
      'article': '📄 Article',
      'video': '🎥 Video',
      'code': '💻 Code',
      'shopping': '🛒 Shopping',
      'social': '👥 Social',
      'form': '📝 Form',
      'search': '🔍 Search',
      'reference': '📚 Reference',
      'general': '🌐 General'
    };
    return typeMap[type] || '🌐 General';
  }

  formatComplexity(complexity) {
    const complexityMap = {
      'low': '🟢 Simple',
      'medium': '🟡 Medium',
      'high': '🔴 Complex'
    };
    return complexityMap[complexity] || '🟡 Medium';
  }

  async loadSuggestions() {
    try {
      // Request suggestions from content script
      window.parent.postMessage({
        type: 'KIRO_REQUEST_SUGGESTIONS',
        source: 'sidebar'
      }, '*');
      
    } catch (error) {
      console.error('Error loading suggestions:', error);
      this.showSuggestionsError();
    }
  }

  updateSuggestions(suggestions) {
    this.suggestions = suggestions || [];
    this.renderSuggestions();
  }

  renderSuggestions() {
    const container = document.getElementById('suggestionsContainer');
    
    if (this.suggestions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🤖</div>
          <div>No suggestions available</div>
        </div>
      `;
      return;
    }

    container.innerHTML = this.suggestions.map(suggestion => `
      <div class="suggestion-card fade-in" data-suggestion-id="${suggestion.id}">
        <div class="suggestion-title">${this.escapeHtml(suggestion.title)}</div>
        <div class="suggestion-description">${this.escapeHtml(suggestion.description)}</div>
        <div class="suggestion-confidence">
          Confidence: ${Math.round((suggestion.confidence || 0) * 100)}%
        </div>
      </div>
    `).join('');

    // Add click listeners to suggestion cards
    container.querySelectorAll('.suggestion-card').forEach(card => {
      card.addEventListener('click', () => {
        const suggestionId = card.dataset.suggestionId;
        this.handleSuggestionClick(suggestionId);
      });
    });
  }

  async loadInsights() {
    try {
      // Request insights from content script
      window.parent.postMessage({
        type: 'KIRO_REQUEST_INSIGHTS',
        source: 'sidebar'
      }, '*');
      
    } catch (error) {
      console.error('Error loading insights:', error);
      this.showInsightsError();
    }
  }

  updateInsights(insights) {
    this.insights = insights || [];
    this.renderInsights();
  }

  renderInsights() {
    const container = document.getElementById('insightsContainer');
    
    if (this.insights.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💎</div>
          <div>No insights yet</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <ul class="insights-list">
        ${this.insights.map(insight => `
          <li class="insight-item fade-in">
            <div class="insight-type">${insight.type || 'insight'}</div>
            <div>${this.escapeHtml(insight.description || insight.title)}</div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  handleQuickAction(action) {
    console.log('Quick action:', action);
    
    // Add visual feedback
    const btn = document.querySelector(`[data-action="${action}"]`);
    if (btn) {
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 150);
    }

    // Send action to parent window
    window.parent.postMessage({
      type: 'KIRO_QUICK_ACTION',
      action: action,
      context: this.currentContext,
      source: 'sidebar'
    }, '*');

    // Show processing state
    this.showProcessingState(action);
  }

  handleSuggestionClick(suggestionId) {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    console.log('Suggestion clicked:', suggestion);

    // Send suggestion action to parent window
    window.parent.postMessage({
      type: 'KIRO_SUGGESTION_ACTION',
      suggestion: suggestion,
      context: this.currentContext,
      source: 'sidebar'
    }, '*');

    // Add visual feedback
    const card = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
    if (card) {
      card.style.background = 'rgba(59, 130, 246, 0.2)';
      setTimeout(() => {
        card.style.background = '';
      }, 1000);
    }
  }

  showProcessingState(action) {
    // Create temporary processing indicator
    const indicator = document.createElement('div');
    indicator.className = 'processing-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 16px 24px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
      ">
        <div class="spinner"></div>
        <span>Processing ${action}...</span>
      </div>
    `;

    document.body.appendChild(indicator);

    // Remove after 3 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 3000);
  }

  handleKeyboard(e) {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          this.handleQuickAction('summarize');
          break;
        case 'e':
          e.preventDefault();
          this.handleQuickAction('explain');
          break;
        case 't':
          e.preventDefault();
          this.handleQuickAction('translate');
          break;
        case 'Escape':
          e.preventDefault();
          this.closeSidebar();
          break;
      }
    }
  }

  closeSidebar() {
    // Animate out
    document.querySelector('.sidebar-container').style.transform = 'translateX(100%)';
    
    // Notify parent window
    setTimeout(() => {
      window.parent.postMessage({
        type: 'KIRO_SIDEBAR_CLOSED',
        source: 'sidebar'
      }, '*');
    }, 300);
  }

  openSettings() {
    // Send settings request to parent window
    window.parent.postMessage({
      type: 'KIRO_OPEN_SETTINGS',
      source: 'sidebar'
    }, '*');
  }

  showError(message) {
    const container = document.getElementById('suggestionsContainer');
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div>${this.escapeHtml(message)}</div>
      </div>
    `;
  }

  showSuggestionsError() {
    const container = document.getElementById('suggestionsContainer');
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div>Failed to load suggestions</div>
      </div>
    `;
  }

  showInsightsError() {
    const container = document.getElementById('insightsContainer');
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div>Failed to load insights</div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public methods for external control
  refresh() {
    this.loadInitialData();
  }

  updateTheme(theme) {
    document.body.className = theme === 'light' ? 'light-theme' : '';
  }

  setPosition(position) {
    const container = document.querySelector('.sidebar-container');
    if (position === 'left') {
      container.style.borderLeft = 'none';
      container.style.borderRight = '1px solid rgba(255, 255, 255, 0.1)';
    } else {
      container.style.borderLeft = '1px solid rgba(255, 255, 255, 0.1)';
      container.style.borderRight = 'none';
    }
  }
}

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new KiroSidebar();
  });
} else {
  new KiroSidebar();
}