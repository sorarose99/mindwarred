'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon,
  XMarkIcon,
  ArrowRightIcon,
  LightBulbIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import AnimatedButton from '../ui/AnimatedButton'

interface FeatureTip {
  id: string
  title: string
  description: string
  element: string // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    label: string
    onClick: () => void
  }
}

interface FeatureDiscoveryProps {
  tips: FeatureTip[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

export default function FeatureDiscovery({ 
  tips, 
  isActive, 
  onComplete, 
  onSkip 
}: FeatureDiscoveryProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const currentTip = tips[currentTipIndex]

  useEffect(() => {
    if (!isActive || !currentTip) return

    const element = document.querySelector(currentTip.element)
    if (element) {
      setHighlightedElement(element)
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      
      let x = 0, y = 0
      
      switch (currentTip.position) {
        case 'top':
          x = rect.left + scrollLeft + rect.width / 2
          y = rect.top + scrollTop - 10
          break
        case 'bottom':
          x = rect.left + scrollLeft + rect.width / 2
          y = rect.bottom + scrollTop + 10
          break
        case 'left':
          x = rect.left + scrollLeft - 10
          y = rect.top + scrollTop + rect.height / 2
          break
        case 'right':
          x = rect.right + scrollLeft + 10
          y = rect.top + scrollTop + rect.height / 2
          break
      }
      
      setTooltipPosition({ x, y })
      
      // Scroll element into view
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      })
    }
  }, [currentTip, isActive])

  const nextTip = () => {
    if (currentTipIndex < tips.length - 1) {
      setCurrentTipIndex(currentTipIndex + 1)
    } else {
      onComplete()
    }
  }

  const prevTip = () => {
    if (currentTipIndex > 0) {
      setCurrentTipIndex(currentTipIndex - 1)
    }
  }

  if (!isActive || !currentTip) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          onClick={onSkip}
        />

        {/* Highlight spotlight */}
        {highlightedElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute pointer-events-none"
            style={{
              left: highlightedElement.getBoundingClientRect().left + window.pageXOffset - 8,
              top: highlightedElement.getBoundingClientRect().top + window.pageYOffset - 8,
              width: highlightedElement.getBoundingClientRect().width + 16,
              height: highlightedElement.getBoundingClientRect().height + 16,
              background: 'rgba(59, 130, 246, 0.2)',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              borderRadius: '8px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              animation: 'pulse 2s infinite'
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute pointer-events-auto"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: currentTip.position === 'top' || currentTip.position === 'bottom' 
              ? 'translateX(-50%)' 
              : currentTip.position === 'left' 
              ? 'translateX(-100%)' 
              : 'translateX(0)',
            ...(currentTip.position === 'left' || currentTip.position === 'right' 
              ? { transform: 'translateY(-50%)' } 
              : {})
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl p-6 max-w-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <LightBulbIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{currentTip.title}</h3>
                  <p className="text-xs text-gray-400">
                    {currentTipIndex + 1} of {tips.length}
                  </p>
                </div>
              </div>
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <p className="text-gray-300 text-sm mb-6">
              {currentTip.description}
            </p>

            {/* Action */}
            {currentTip.action && (
              <div className="mb-4">
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={currentTip.action.onClick}
                  className="w-full"
                >
                  {currentTip.action.label}
                </AnimatedButton>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {currentTipIndex > 0 && (
                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    onClick={prevTip}
                  >
                    Previous
                  </AnimatedButton>
                )}
                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                >
                  Skip Tour
                </AnimatedButton>
              </div>

              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={nextTip}
                icon={currentTipIndex === tips.length - 1 ? 
                  <SparklesIcon className="h-4 w-4" /> : 
                  <ArrowRightIcon className="h-4 w-4" />
                }
              >
                {currentTipIndex === tips.length - 1 ? 'Finish' : 'Next'}
              </AnimatedButton>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1 mt-4">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTipIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTipIndex 
                      ? 'bg-blue-400' 
                      : index < currentTipIndex 
                      ? 'bg-green-400' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div 
            className={`absolute w-0 h-0 border-8 ${
              currentTip.position === 'top' 
                ? 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-700'
                : currentTip.position === 'bottom'
                ? 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-700'
                : currentTip.position === 'left'
                ? 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-700'
                : 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-700'
            }`}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Hook for managing feature discovery
export function useFeatureDiscovery(storageKey: string) {
  const [isActive, setIsActive] = useState(false)
  const [hasSeenTour, setHasSeenTour] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(storageKey)
    setHasSeenTour(seen === 'true')
  }, [storageKey])

  const startTour = () => {
    setIsActive(true)
  }

  const completeTour = () => {
    setIsActive(false)
    setHasSeenTour(true)
    localStorage.setItem(storageKey, 'true')
  }

  const skipTour = () => {
    setIsActive(false)
    setHasSeenTour(true)
    localStorage.setItem(storageKey, 'true')
  }

  const resetTour = () => {
    setHasSeenTour(false)
    localStorage.removeItem(storageKey)
  }

  return {
    isActive,
    hasSeenTour,
    startTour,
    completeTour,
    skipTour,
    resetTour
  }
}

// Predefined feature discovery tours
export const dashboardTour: FeatureTip[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Dashboard',
    description: 'This is your central hub for managing Kiro and viewing insights about your browsing activity.',
    element: '[data-tour="dashboard-header"]',
    position: 'bottom'
  },
  {
    id: 'stats',
    title: 'Activity Statistics',
    description: 'View real-time statistics about pages analyzed, AI suggestions generated, and time saved.',
    element: '[data-tour="stats-grid"]',
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    description: 'Access different sections like Analytics, Automations, and Settings from the sidebar.',
    element: '[data-tour="sidebar-nav"]',
    position: 'right'
  },
  {
    id: 'chat',
    title: 'AI Chat',
    description: 'Click here to start a conversation with Kiro\'s AI assistant for instant help.',
    element: '[data-tour="chat-button"]',
    position: 'top',
    action: {
      label: 'Try AI Chat',
      onClick: () => window.open('/chat', '_blank')
    }
  }
]