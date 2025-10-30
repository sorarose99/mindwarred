'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { OnboardingManager, HelpSystemManager, FeatureAnnouncementManager } from '../../lib/onboarding/onboarding-manager'
import OnboardingFlow from '../onboarding/OnboardingFlow'
import HelpSystem from '../help/HelpSystem'
import FeatureDiscovery, { useFeatureDiscovery, dashboardTour } from '../help/FeatureDiscovery'
import { usePathname } from 'next/navigation'

interface OnboardingContextType {
  // Onboarding state
  needsOnboarding: boolean
  needsDashboardTour: boolean
  needsFeatureTour: boolean
  
  // Actions
  startOnboarding: () => void
  completeOnboarding: () => void
  startDashboardTour: () => void
  startFeatureTour: () => void
  
  // Help system
  openHelp: (query?: string) => void
  closeHelp: () => void
  isHelpOpen: boolean
  
  // Feature discovery
  startFeatureDiscovery: () => void
  
  // Announcements
  hasNewAnnouncements: boolean
  dismissAnnouncement: (id: string) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}

interface OnboardingProviderProps {
  children: ReactNode
}

export default function OnboardingProvider({ children }: OnboardingProviderProps) {
  const pathname = usePathname()
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [helpQuery, setHelpQuery] = useState('')
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [needsDashboardTour, setNeedsDashboardTour] = useState(false)
  const [needsFeatureTour, setNeedsFeatureTour] = useState(false)
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false)

  // Feature discovery hooks
  const dashboardDiscovery = useFeatureDiscovery('dashboard_tour_seen')

  // Managers
  const onboardingManager = OnboardingManager.getInstance()
  const helpManager = HelpSystemManager.getInstance()
  const announcementManager = FeatureAnnouncementManager.getInstance()

  // Initialize onboarding state
  useEffect(() => {
    const checkOnboardingState = () => {
      setNeedsOnboarding(onboardingManager.needsOnboarding())
      setNeedsDashboardTour(onboardingManager.needsDashboardTour())
      setNeedsFeatureTour(onboardingManager.needsFeatureTour())
      setHasNewAnnouncements(announcementManager.hasNewAnnouncements())
    }

    checkOnboardingState()

    // Auto-start onboarding for new users
    if (onboardingManager.needsOnboarding()) {
      setTimeout(() => setIsOnboardingOpen(true), 1000)
    }
  }, [])

  // Auto-start dashboard tour when user first visits dashboard
  useEffect(() => {
    if (pathname === '/dashboard' && needsDashboardTour && !dashboardDiscovery.hasSeenTour) {
      setTimeout(() => {
        if (!dashboardDiscovery.isActive) {
          dashboardDiscovery.startTour()
        }
      }, 2000)
    }
  }, [pathname, needsDashboardTour, dashboardDiscovery])

  const startOnboarding = () => {
    setIsOnboardingOpen(true)
  }

  const completeOnboarding = () => {
    setIsOnboardingOpen(false)
    onboardingManager.completeInitialOnboarding()
    setNeedsOnboarding(false)
    setNeedsDashboardTour(true)
    
    // Auto-start dashboard tour after onboarding
    if (pathname === '/dashboard') {
      setTimeout(() => dashboardDiscovery.startTour(), 1000)
    }
  }

  const startDashboardTour = () => {
    if (pathname === '/dashboard') {
      dashboardDiscovery.startTour()
    } else {
      // Navigate to dashboard first
      window.location.href = '/dashboard'
    }
  }

  const completeDashboardTour = () => {
    onboardingManager.completeDashboardTour()
    setNeedsDashboardTour(false)
    setNeedsFeatureTour(true)
  }

  const startFeatureTour = () => {
    // Implementation for feature tour
    onboardingManager.completeFeatureTour()
    setNeedsFeatureTour(false)
  }

  const openHelp = (query = '') => {
    setHelpQuery(query)
    setIsHelpOpen(true)
    helpManager.trackHelpUsage('open_help', { query, pathname })
  }

  const closeHelp = () => {
    setIsHelpOpen(false)
    setHelpQuery('')
  }

  const startFeatureDiscovery = () => {
    if (pathname === '/dashboard') {
      dashboardDiscovery.startTour()
    }
  }

  const dismissAnnouncement = (id: string) => {
    announcementManager.dismissAnnouncement(id)
    setHasNewAnnouncements(announcementManager.hasNewAnnouncements())
  }

  const contextValue: OnboardingContextType = {
    needsOnboarding,
    needsDashboardTour,
    needsFeatureTour,
    startOnboarding,
    completeOnboarding,
    startDashboardTour,
    startFeatureTour,
    openHelp,
    closeHelp,
    isHelpOpen,
    startFeatureDiscovery,
    hasNewAnnouncements,
    dismissAnnouncement
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      
      {/* Onboarding Flow */}
      <OnboardingFlow
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={completeOnboarding}
      />
      
      {/* Help System */}
      <HelpSystem
        isOpen={isHelpOpen}
        onClose={closeHelp}
        initialQuery={helpQuery}
      />
      
      {/* Feature Discovery */}
      <FeatureDiscovery
        tips={dashboardTour}
        isActive={dashboardDiscovery.isActive}
        onComplete={() => {
          dashboardDiscovery.completeTour()
          completeDashboardTour()
        }}
        onSkip={() => {
          dashboardDiscovery.skipTour()
          completeDashboardTour()
        }}
      />
    </OnboardingContext.Provider>
  )
}

// Hook for contextual help suggestions
export function useContextualHelp() {
  const pathname = usePathname()
  const helpManager = HelpSystemManager.getInstance()
  
  const getSuggestions = () => {
    return helpManager.getContextualHelp(pathname)
  }
  
  const markArticleViewed = (articleId: string) => {
    helpManager.markArticleViewed(articleId)
  }
  
  const hasViewedArticle = (articleId: string) => {
    return helpManager.hasViewedArticle(articleId)
  }
  
  return {
    getSuggestions,
    markArticleViewed,
    hasViewedArticle
  }
}