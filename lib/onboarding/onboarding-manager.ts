// Onboarding and help system manager

export interface OnboardingState {
  hasCompletedInitialOnboarding: boolean
  hasSeenDashboardTour: boolean
  hasSeenFeatureTour: boolean
  hasInstalledExtension: boolean
  lastOnboardingStep: string
  onboardingVersion: string
}

export class OnboardingManager {
  private static instance: OnboardingManager
  private storageKey = 'kiro_onboarding_state'
  private currentVersion = '1.0.0'

  static getInstance(): OnboardingManager {
    if (!OnboardingManager.instance) {
      OnboardingManager.instance = new OnboardingManager()
    }
    return OnboardingManager.instance
  }

  // Get current onboarding state
  getState(): OnboardingState {
    const defaultState: OnboardingState = {
      hasCompletedInitialOnboarding: false,
      hasSeenDashboardTour: false,
      hasSeenFeatureTour: false,
      hasInstalledExtension: false,
      lastOnboardingStep: '',
      onboardingVersion: this.currentVersion
    }

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const state = JSON.parse(stored)
        // Check if we need to reset due to version change
        if (state.onboardingVersion !== this.currentVersion) {
          return { ...defaultState, hasInstalledExtension: state.hasInstalledExtension }
        }
        return { ...defaultState, ...state }
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error)
    }

    return defaultState
  }

  // Update onboarding state
  updateState(updates: Partial<OnboardingState>): void {
    const currentState = this.getState()
    const newState = { 
      ...currentState, 
      ...updates, 
      onboardingVersion: this.currentVersion 
    }
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(newState))
    } catch (error) {
      console.error('Error saving onboarding state:', error)
    }
  }

  // Check if user needs onboarding
  needsOnboarding(): boolean {
    const state = this.getState()
    return !state.hasCompletedInitialOnboarding
  }

  // Check if user needs dashboard tour
  needsDashboardTour(): boolean {
    const state = this.getState()
    return state.hasCompletedInitialOnboarding && !state.hasSeenDashboardTour
  }

  // Check if user needs feature discovery
  needsFeatureTour(): boolean {
    const state = this.getState()
    return state.hasCompletedInitialOnboarding && !state.hasSeenFeatureTour
  }

  // Mark initial onboarding as complete
  completeInitialOnboarding(): void {
    this.updateState({ 
      hasCompletedInitialOnboarding: true,
      lastOnboardingStep: 'initial_complete'
    })
  }

  // Mark dashboard tour as seen
  completeDashboardTour(): void {
    this.updateState({ 
      hasSeenDashboardTour: true,
      lastOnboardingStep: 'dashboard_tour_complete'
    })
  }

  // Mark feature tour as seen
  completeFeatureTour(): void {
    this.updateState({ 
      hasSeenFeatureTour: true,
      lastOnboardingStep: 'feature_tour_complete'
    })
  }

  // Mark extension as installed
  markExtensionInstalled(): void {
    this.updateState({ hasInstalledExtension: true })
  }

  // Reset all onboarding state
  reset(): void {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('Error resetting onboarding state:', error)
    }
  }

  // Get next recommended action
  getNextAction(): { type: string; message: string; action?: () => void } | null {
    const state = this.getState()

    if (!state.hasCompletedInitialOnboarding) {
      return {
        type: 'onboarding',
        message: 'Complete the initial setup to get started with Kiro'
      }
    }

    if (!state.hasInstalledExtension) {
      return {
        type: 'extension',
        message: 'Install the Chrome extension to start using Kiro\'s features'
      }
    }

    if (!state.hasSeenDashboardTour) {
      return {
        type: 'dashboard_tour',
        message: 'Take a quick tour of your dashboard'
      }
    }

    if (!state.hasSeenFeatureTour) {
      return {
        type: 'feature_tour',
        message: 'Discover Kiro\'s powerful features'
      }
    }

    return null
  }
}

// Help system manager
export class HelpSystemManager {
  private static instance: HelpSystemManager
  private viewedArticles: Set<string> = new Set()
  private storageKey = 'kiro_help_viewed_articles'

  static getInstance(): HelpSystemManager {
    if (!HelpSystemManager.instance) {
      HelpSystemManager.instance = new HelpSystemManager()
      HelpSystemManager.instance.loadViewedArticles()
    }
    return HelpSystemManager.instance
  }

  private loadViewedArticles(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.viewedArticles = new Set(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading viewed articles:', error)
    }
  }

  private saveViewedArticles(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.viewedArticles]))
    } catch (error) {
      console.error('Error saving viewed articles:', error)
    }
  }

  // Mark article as viewed
  markArticleViewed(articleId: string): void {
    this.viewedArticles.add(articleId)
    this.saveViewedArticles()
  }

  // Check if article has been viewed
  hasViewedArticle(articleId: string): boolean {
    return this.viewedArticles.has(articleId)
  }

  // Get contextual help suggestions based on current page
  getContextualHelp(pathname: string): string[] {
    const suggestions: Record<string, string[]> = {
      '/dashboard': [
        'dashboard-overview',
        'stats-explanation',
        'navigation-guide'
      ],
      '/dashboard/automations': [
        'automation-setup',
        'creating-rules',
        'automation-troubleshooting'
      ],
      '/dashboard/knowledge': [
        'knowledge-graph-guide',
        'understanding-connections',
        'privacy-knowledge'
      ],
      '/chat': [
        'ai-chat-guide',
        'chat-commands',
        'ai-limitations'
      ]
    }

    return suggestions[pathname] || ['getting-started-guide']
  }

  // Track help system usage
  trackHelpUsage(action: string, context?: any): void {
    // In a real app, this would send analytics
    console.log('Help system usage:', { action, context, timestamp: Date.now() })
  }
}

// Feature announcement system
export interface FeatureAnnouncement {
  id: string
  title: string
  description: string
  type: 'new_feature' | 'improvement' | 'tip'
  version: string
  dismissible: boolean
  actionLabel?: string
  actionUrl?: string
}

export class FeatureAnnouncementManager {
  private static instance: FeatureAnnouncementManager
  private dismissedAnnouncements: Set<string> = new Set()
  private storageKey = 'kiro_dismissed_announcements'

  static getInstance(): FeatureAnnouncementManager {
    if (!FeatureAnnouncementManager.instance) {
      FeatureAnnouncementManager.instance = new FeatureAnnouncementManager()
      FeatureAnnouncementManager.instance.loadDismissedAnnouncements()
    }
    return FeatureAnnouncementManager.instance
  }

  private loadDismissedAnnouncements(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.dismissedAnnouncements = new Set(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading dismissed announcements:', error)
    }
  }

  private saveDismissedAnnouncements(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.dismissedAnnouncements]))
    } catch (error) {
      console.error('Error saving dismissed announcements:', error)
    }
  }

  // Get active announcements
  getActiveAnnouncements(): FeatureAnnouncement[] {
    const allAnnouncements: FeatureAnnouncement[] = [
      {
        id: 'welcome-v1',
        title: 'Welcome to Kiro!',
        description: 'Your intelligent Web Mind is ready to help you browse smarter.',
        type: 'new_feature',
        version: '1.0.0',
        dismissible: true,
        actionLabel: 'Get Started',
        actionUrl: '/dashboard'
      }
      // Add more announcements here
    ]

    return allAnnouncements.filter(
      announcement => !this.dismissedAnnouncements.has(announcement.id)
    )
  }

  // Dismiss an announcement
  dismissAnnouncement(announcementId: string): void {
    this.dismissedAnnouncements.add(announcementId)
    this.saveDismissedAnnouncements()
  }

  // Check if there are new announcements
  hasNewAnnouncements(): boolean {
    return this.getActiveAnnouncements().length > 0
  }
}