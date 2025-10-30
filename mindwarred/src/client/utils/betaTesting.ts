export interface BetaFeedback {
  id: string;
  userId: string;
  timestamp: number;
  category: 'bug' | 'feature' | 'ui' | 'performance' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  deviceInfo: DeviceInfo;
  gameState?: any;
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  devicePixelRatio: number;
  memory?: number;
  connection?: string;
  platform: string;
}

export class BetaTestingManager {
  private feedbackQueue: BetaFeedback[] = [];
  private isCollectingFeedback = true;
  private sessionId: string;

  constructor() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.initializeFeedbackCollection();
  }

  private initializeFeedbackCollection(): void {
    // Add feedback button to UI
    this.createFeedbackButton();
    
    // Collect automatic feedback on errors
    this.setupErrorTracking();
    
    // Collect performance feedback
    this.setupPerformanceTracking();
    
    // Collect user interaction feedback
    this.setupInteractionTracking();
  }

  private createFeedbackButton(): void {
    const feedbackBtn = document.createElement('button');
    feedbackBtn.id = 'beta-feedback-btn';
    feedbackBtn.className = 'beta-feedback-btn';
    feedbackBtn.innerHTML = '💬 Feedback';
    feedbackBtn.title = 'Send feedback to developers';
    
    feedbackBtn.addEventListener('click', () => {
      this.showFeedbackModal();
    });

    document.body.appendChild(feedbackBtn);
  }

  private setupErrorTracking(): void {
    // Capture JavaScript errors
    window.addEventListener('error', (event) => {
      this.submitFeedback({
        category: 'bug',
        severity: 'high',
        title: 'JavaScript Error',
        description: `Error: ${event.message}\nFile: ${event.filename}\nLine: ${event.lineno}`,
        actualBehavior: event.message,
        expectedBehavior: 'No error should occur'
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.submitFeedback({
        category: 'bug',
        severity: 'medium',
        title: 'Unhandled Promise Rejection',
        description: `Promise rejection: ${event.reason}`,
        actualBehavior: String(event.reason),
        expectedBehavior: 'Promise should be handled properly'
      });
    });
  }

  private setupPerformanceTracking(): void {
    // Track slow operations
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        // Report slow API calls
        if (duration > 5000) { // 5 seconds
          this.submitFeedback({
            category: 'performance',
            severity: 'medium',
            title: 'Slow API Response',
            description: `API call to ${args[0]} took ${duration.toFixed(0)}ms`,
            actualBehavior: `Response time: ${duration.toFixed(0)}ms`,
            expectedBehavior: 'Response time should be under 2 seconds'
          });
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.submitFeedback({
          category: 'bug',
          severity: 'high',
          title: 'API Request Failed',
          description: `Failed to fetch ${args[0]} after ${duration.toFixed(0)}ms: ${error}`,
          actualBehavior: `Request failed: ${error}`,
          expectedBehavior: 'Request should succeed'
        });
        throw error;
      }
    };
  }

  private setupInteractionTracking(): void {
    // Track user interactions that might indicate issues
    let clickCount = 0;
    let rapidClicks = 0;
    
    document.addEventListener('click', () => {
      clickCount++;
      rapidClicks++;
      
      // Reset rapid click counter after 1 second
      setTimeout(() => {
        rapidClicks = Math.max(0, rapidClicks - 1);
      }, 1000);
      
      // If user is clicking rapidly, they might be frustrated
      if (rapidClicks > 10) {
        this.submitFeedback({
          category: 'ui',
          severity: 'low',
          title: 'Rapid Clicking Detected',
          description: 'User performed many rapid clicks, possibly indicating UI responsiveness issues',
          actualBehavior: `${rapidClicks} clicks in rapid succession`,
          expectedBehavior: 'UI should respond immediately to clicks'
        });
        rapidClicks = 0; // Reset to avoid spam
      }
    });
  }

  private showFeedbackModal(): void {
    const modal = document.createElement('div');
    modal.className = 'feedback-modal';
    modal.innerHTML = `
      <div class="feedback-content">
        <h3>🚀 Beta Feedback</h3>
        <p>Help us improve Reddit Mind Wars!</p>
        
        <form id="feedback-form">
          <div class="form-group">
            <label for="feedback-category">Category:</label>
            <select id="feedback-category" required>
              <option value="">Select category...</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="feature">✨ Feature Request</option>
              <option value="ui">🎨 UI/UX Feedback</option>
              <option value="performance">⚡ Performance Issue</option>
              <option value="general">💬 General Feedback</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="feedback-severity">Severity:</label>
            <select id="feedback-severity" required>
              <option value="low">Low - Minor issue</option>
              <option value="medium">Medium - Affects gameplay</option>
              <option value="high">High - Major problem</option>
              <option value="critical">Critical - Game breaking</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="feedback-title">Title:</label>
            <input type="text" id="feedback-title" placeholder="Brief description of the issue/suggestion" required>
          </div>
          
          <div class="form-group">
            <label for="feedback-description">Description:</label>
            <textarea id="feedback-description" placeholder="Detailed description of what happened or what you'd like to see" required></textarea>
          </div>
          
          <div class="form-group">
            <label for="feedback-steps">Steps to Reproduce (for bugs):</label>
            <textarea id="feedback-steps" placeholder="1. Click on planet&#10;2. Select challenge&#10;3. Submit answer&#10;4. Error occurs"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" id="feedback-cancel">Cancel</button>
            <button type="submit" class="submit-btn">Send Feedback</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    const form = document.getElementById('feedback-form') as HTMLFormElement;
    const cancelBtn = document.getElementById('feedback-cancel');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFeedbackSubmission(form);
      modal.remove();
    });

    cancelBtn?.addEventListener('click', () => {
      modal.remove();
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    setTimeout(() => modal.classList.add('visible'), 10);
  }

  private handleFeedbackSubmission(form: HTMLFormElement): void {
    const formData = new FormData(form);
    
    this.submitFeedback({
      category: formData.get('category') as any,
      severity: formData.get('severity') as any,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      steps: formData.get('steps') ? (formData.get('steps') as string).split('\n') : undefined,
      expectedBehavior: 'As described in feedback',
      actualBehavior: 'As described in feedback'
    });

    // Show thank you message
    this.showThankYouMessage();
  }

  private showThankYouMessage(): void {
    const thankYou = document.createElement('div');
    thankYou.className = 'thank-you-message';
    thankYou.innerHTML = `
      <div class="thank-you-content">
        <h3>🙏 Thank You!</h3>
        <p>Your feedback has been submitted and will help improve the game.</p>
      </div>
    `;

    document.body.appendChild(thankYou);

    setTimeout(() => {
      thankYou.classList.add('visible');
    }, 10);

    setTimeout(() => {
      thankYou.remove();
    }, 3000);
  }

  submitFeedback(feedback: Partial<BetaFeedback>): void {
    if (!this.isCollectingFeedback) return;

    const completeFeedback: BetaFeedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.sessionId,
      timestamp: Date.now(),
      category: feedback.category || 'general',
      severity: feedback.severity || 'low',
      title: feedback.title || 'Untitled Feedback',
      description: feedback.description || '',
      steps: feedback.steps,
      expectedBehavior: feedback.expectedBehavior,
      actualBehavior: feedback.actualBehavior,
      deviceInfo: this.collectDeviceInfo(),
      gameState: this.collectGameState()
    };

    this.feedbackQueue.push(completeFeedback);
    
    // Send feedback to server
    this.sendFeedbackToServer(completeFeedback);
  }

  private collectDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      devicePixelRatio: window.devicePixelRatio,
      memory: (navigator as any).deviceMemory,
      connection: (navigator as any).connection?.effectiveType,
      platform: navigator.platform
    };
  }

  private collectGameState(): any {
    // Collect relevant game state for debugging
    return {
      url: window.location.href,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      // Add more game-specific state as needed
    };
  }

  private async sendFeedbackToServer(feedback: BetaFeedback): Promise<void> {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });
    } catch (error) {
      console.error('Failed to send feedback to server:', error);
      // Store locally as fallback
      localStorage.setItem(`feedback-${feedback.id}`, JSON.stringify(feedback));
    }
  }

  getFeedbackQueue(): BetaFeedback[] {
    return [...this.feedbackQueue];
  }

  clearFeedbackQueue(): void {
    this.feedbackQueue = [];
  }

  enableFeedbackCollection(): void {
    this.isCollectingFeedback = true;
  }

  disableFeedbackCollection(): void {
    this.isCollectingFeedback = false;
  }

  // Export feedback data for analysis
  exportFeedbackData(): string {
    const data = {
      sessionId: this.sessionId,
      feedbackCount: this.feedbackQueue.length,
      feedback: this.feedbackQueue,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }
}

export const betaTestingManager = new BetaTestingManager();