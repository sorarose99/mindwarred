export interface FeedbackAnalytics {
  timestamp: string;
  analytics: {
    todayCount: number;
    yesterdayCount: number;
    categoryBreakdown: Array<{ category: string; count: number }>;
    severityBreakdown: Array<{ severity: string; count: number }>;
    recentFeedbackCount: number;
    totalQueueSize: number;
  };
}

export class BetaDashboard {
  private isVisible = false;
  private dashboardElement: HTMLElement | null = null;
  private refreshInterval: number | null = null;

  constructor() {
    this.createDashboard();
    this.setupKeyboardShortcut();
  }

  private setupKeyboardShortcut(): void {
    // Press Ctrl+Shift+B to toggle beta dashboard
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        this.toggle();
      }
    });
  }

  private createDashboard(): void {
    this.dashboardElement = document.createElement('div');
    this.dashboardElement.className = 'beta-dashboard';
    this.dashboardElement.innerHTML = `
      <div class="beta-dashboard-content">
        <div class="beta-dashboard-header">
          <h2>🧪 Beta Testing Dashboard</h2>
          <button class="close-dashboard" id="close-beta-dashboard">×</button>
        </div>
        
        <div class="beta-dashboard-body">
          <div class="loading-indicator" id="dashboard-loading">
            <div class="spinner"></div>
            <p>Loading analytics...</p>
          </div>
          
          <div class="dashboard-content" id="dashboard-content" style="display: none;">
            <div class="stats-overview">
              <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-info">
                  <div class="stat-value" id="today-count">0</div>
                  <div class="stat-label">Today's Feedback</div>
                  <div class="stat-change" id="feedback-change">+0 from yesterday</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-info">
                  <div class="stat-value" id="queue-size">0</div>
                  <div class="stat-label">Total Queue</div>
                  <div class="stat-change" id="recent-count">0 recent items</div>
                </div>
              </div>
            </div>
            
            <div class="dashboard-sections">
              <div class="category-breakdown">
                <h3>Feedback Categories</h3>
                <div class="breakdown-chart" id="category-chart">
                  <!-- Category bars will be inserted here -->
                </div>
              </div>
              
              <div class="severity-breakdown">
                <h3>Severity Levels</h3>
                <div class="breakdown-chart" id="severity-chart">
                  <!-- Severity bars will be inserted here -->
                </div>
              </div>
            </div>
            
            <div class="dashboard-actions">
              <button class="action-btn" id="refresh-analytics">🔄 Refresh</button>
              <button class="action-btn" id="export-feedback">📥 Export Data</button>
              <button class="action-btn primary" id="view-feedback">👀 View Recent</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.dashboardElement);

    // Setup event listeners
    const closeBtn = document.getElementById('close-beta-dashboard');
    const refreshBtn = document.getElementById('refresh-analytics');
    const exportBtn = document.getElementById('export-feedback');
    const viewBtn = document.getElementById('view-feedback');

    closeBtn?.addEventListener('click', () => this.hide());
    refreshBtn?.addEventListener('click', () => this.loadAnalytics());
    exportBtn?.addEventListener('click', () => this.exportFeedbackData());
    viewBtn?.addEventListener('click', () => this.showRecentFeedback());

    // Close on background click
    this.dashboardElement.addEventListener('click', (e) => {
      if (e.target === this.dashboardElement) {
        this.hide();
      }
    });
  }

  show(): void {
    if (!this.dashboardElement) return;
    
    this.isVisible = true;
    this.dashboardElement.style.display = 'flex';
    setTimeout(() => {
      this.dashboardElement?.classList.add('visible');
    }, 10);

    this.loadAnalytics();
    this.startAutoRefresh();
  }

  hide(): void {
    if (!this.dashboardElement) return;
    
    this.isVisible = false;
    this.dashboardElement.classList.remove('visible');
    setTimeout(() => {
      if (this.dashboardElement) {
        this.dashboardElement.style.display = 'none';
      }
    }, 300);

    this.stopAutoRefresh();
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  private async loadAnalytics(): Promise<void> {
    const loadingEl = document.getElementById('dashboard-loading');
    const contentEl = document.getElementById('dashboard-content');
    
    if (loadingEl) loadingEl.style.display = 'flex';
    if (contentEl) contentEl.style.display = 'none';

    try {
      const response = await fetch('/api/feedback/analytics');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data: FeedbackAnalytics = await response.json();
      this.updateDashboard(data);
      
      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';
    } catch (error) {
      console.error('Failed to load analytics:', error);
      this.showError('Failed to load analytics data');
    }
  }

  private updateDashboard(data: FeedbackAnalytics): void {
    const { analytics } = data;
    
    // Update overview stats
    const todayCountEl = document.getElementById('today-count');
    const queueSizeEl = document.getElementById('queue-size');
    const feedbackChangeEl = document.getElementById('feedback-change');
    const recentCountEl = document.getElementById('recent-count');

    if (todayCountEl) todayCountEl.textContent = analytics.todayCount.toString();
    if (queueSizeEl) queueSizeEl.textContent = analytics.totalQueueSize.toString();
    
    const change = analytics.todayCount - analytics.yesterdayCount;
    const changeText = change >= 0 ? `+${change}` : change.toString();
    if (feedbackChangeEl) {
      feedbackChangeEl.textContent = `${changeText} from yesterday`;
      feedbackChangeEl.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (recentCountEl) recentCountEl.textContent = `${analytics.recentFeedbackCount} recent items`;

    // Update category breakdown
    this.updateBreakdownChart('category-chart', analytics.categoryBreakdown, 'category');
    
    // Update severity breakdown
    this.updateBreakdownChart('severity-chart', analytics.severityBreakdown, 'severity');
  }

  private updateBreakdownChart(
    containerId: string, 
    data: Array<{ [key: string]: string | number }>, 
    type: 'category' | 'severity'
  ): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxCount = Math.max(...data.map(item => item.count as number));
    
    container.innerHTML = data.map(item => {
      const key = type === 'category' ? item.category : item.severity;
      const count = item.count as number;
      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
      
      const emoji = this.getEmojiForType(key as string, type);
      const color = this.getColorForType(key as string, type);
      
      return `
        <div class="breakdown-item">
          <div class="breakdown-label">
            <span class="breakdown-emoji">${emoji}</span>
            <span class="breakdown-name">${key}</span>
            <span class="breakdown-count">${count}</span>
          </div>
          <div class="breakdown-bar">
            <div class="breakdown-fill" style="width: ${percentage}%; background: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  private getEmojiForType(key: string, type: 'category' | 'severity'): string {
    if (type === 'category') {
      const categoryEmojis: { [key: string]: string } = {
        bug: '🐛',
        feature: '✨',
        ui: '🎨',
        performance: '⚡',
        general: '💬'
      };
      return categoryEmojis[key] || '📝';
    } else {
      const severityEmojis: { [key: string]: string } = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴'
      };
      return severityEmojis[key] || '⚪';
    }
  }

  private getColorForType(key: string, type: 'category' | 'severity'): string {
    if (type === 'category') {
      const categoryColors: { [key: string]: string } = {
        bug: '#ff4444',
        feature: '#44ff44',
        ui: '#4444ff',
        performance: '#ffaa44',
        general: '#aa44ff'
      };
      return categoryColors[key] || '#888888';
    } else {
      const severityColors: { [key: string]: string } = {
        low: '#44ff44',
        medium: '#ffaa44',
        high: '#ff8844',
        critical: '#ff4444'
      };
      return severityColors[key] || '#888888';
    }
  }

  private showError(message: string): void {
    const loadingEl = document.getElementById('dashboard-loading');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="error-message">
          <div class="error-icon">❌</div>
          <p>${message}</p>
          <button class="retry-btn" onclick="this.closest('.beta-dashboard').querySelector('#refresh-analytics').click()">
            Retry
          </button>
        </div>
      `;
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshInterval = window.setInterval(() => {
      this.loadAnalytics();
    }, 30000); // Refresh every 30 seconds
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private exportFeedbackData(): void {
    // This would export feedback data in a real implementation
    const data = {
      exportedAt: new Date().toISOString(),
      message: 'Feedback export functionality would be implemented here',
      note: 'In production, this would download a CSV or JSON file with feedback data'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beta-feedback-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private showRecentFeedback(): void {
    // This would show recent feedback items in a real implementation
    alert('Recent feedback viewer would be implemented here.\n\nThis would show the latest feedback submissions with details for review.');
  }
}

// Add CSS styles for the beta dashboard
const betaDashboardStyles = `
.beta-dashboard {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1003;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(10px);
}

.beta-dashboard.visible {
  opacity: 1;
}

.beta-dashboard-content {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
  border: 2px solid rgba(153, 50, 204, 0.5);
  border-radius: 20px;
  padding: 30px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.beta-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(153, 50, 204, 0.3);
}

.beta-dashboard-header h2 {
  color: #9932cc;
  margin: 0;
  font-size: 1.8rem;
}

.close-dashboard {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-dashboard:hover {
  background: rgba(255, 255, 255, 0.2);
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #e0e0e0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(153, 50, 204, 0.3);
  border-top: 4px solid #9932cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.breakdown-item {
  margin-bottom: 15px;
}

.breakdown-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5px;
  color: #e0e0e0;
}

.breakdown-emoji {
  margin-right: 8px;
}

.breakdown-name {
  flex: 1;
  text-transform: capitalize;
}

.breakdown-count {
  font-weight: 600;
  color: #ffffff;
}

.breakdown-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.breakdown-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.dashboard-sections h3 {
  color: #ffffff;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.stat-change.positive {
  color: #00ff88;
}

.stat-change.negative {
  color: #ff6b35;
}

.error-message {
  text-align: center;
  color: #ff6b35;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.retry-btn {
  background: linear-gradient(135deg, #9932cc, #8a2be2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 15px;
  cursor: pointer;
  margin-top: 15px;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .beta-dashboard-content {
    padding: 20px;
    width: 95%;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .dashboard-sections {
    grid-template-columns: 1fr;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = betaDashboardStyles;
document.head.appendChild(styleSheet);

export const betaDashboard = new BetaDashboard();