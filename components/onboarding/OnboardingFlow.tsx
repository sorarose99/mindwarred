'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  CheckIcon,
  SparklesIcon,
  RocketLaunchIcon,
  EyeIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import AnimatedButton from '../ui/AnimatedButton'
import { ProgressBar } from '../ui/ProgressIndicator'

interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  icon: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

interface OnboardingFlowProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Kiro',
      description: 'Your intelligent Web Mind that learns and adapts to help you browse smarter',
      icon: <SparklesIcon className="h-8 w-8 text-blue-400" />,
      content: (
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <SparklesIcon className="h-16 w-16 text-blue-400" />
          </motion.div>
          <p className="text-gray-300 text-lg">
            Kiro is an AI-powered browser assistant that watches your web activity (with your permission), 
            learns your patterns, and provides contextual help through smart suggestions and automation.
          </p>
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>Privacy First:</strong> All AI processing happens locally on your device using Chrome's built-in AI.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'extension',
      title: 'Install Chrome Extension',
      description: 'Get the browser extension to start analyzing your web activity',
      icon: <RocketLaunchIcon className="h-8 w-8 text-green-400" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <RocketLaunchIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-6">
              The Chrome extension is the core of Kiro's functionality. It analyzes web pages, 
              detects patterns, and provides contextual assistance.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium text-white">Download Extension</h4>
                <p className="text-gray-400 text-sm">Click the button below to open Chrome Web Store</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium text-white">Grant Permissions</h4>
                <p className="text-gray-400 text-sm">Allow Kiro to read and analyze web page content</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium text-white">Start Browsing</h4>
                <p className="text-gray-400 text-sm">Kiro will begin learning from your browsing patterns</p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Install Extension',
        onClick: () => {
          window.open('chrome://extensions/', '_blank')
          setCompletedSteps(prev => new Set([...prev, currentStep]))
        }
      }
    },
    {
      id: 'features',
      title: 'Key Features',
      description: 'Discover what Kiro can do for you',
      icon: <EyeIcon className="h-8 w-8 text-purple-400" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <EyeIcon className="h-8 w-8 text-blue-400 mb-3" />
            <h4 className="font-semibold text-white mb-2">Smart Analysis</h4>
            <p className="text-gray-300 text-sm">
              Automatically analyzes web pages and understands context to provide relevant suggestions.
            </p>
          </motion.div>
          
          <motion.div
            className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <BoltIcon className="h-8 w-8 text-green-400 mb-3" />
            <h4 className="font-semibold text-white mb-2">Automation</h4>
            <p className="text-gray-300 text-sm">
              Automates repetitive tasks like form filling and creates custom workflows.
            </p>
          </motion.div>
          
          <motion.div
            className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-400 mb-3" />
            <h4 className="font-semibold text-white mb-2">AI Chat</h4>
            <p className="text-gray-300 text-sm">
              Chat with AI about any webpage or get help with research and summarization.
            </p>
          </motion.div>
          
          <motion.div
            className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <SparklesIcon className="h-8 w-8 text-yellow-400 mb-3" />
            <h4 className="font-semibold text-white mb-2">Learning</h4>
            <p className="text-gray-300 text-sm">
              Learns your preferences and browsing patterns to provide personalized assistance.
            </p>
          </motion.div>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Your data stays private and secure',
      icon: <CheckIcon className="h-8 w-8 text-green-400" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <CheckIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-6">
              Kiro is built with privacy as a core principle. Here's how we protect your data:
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckIcon className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Local AI Processing</h4>
                <p className="text-gray-400 text-sm">All AI analysis happens on your device using Chrome's built-in AI</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckIcon className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Explicit Consent</h4>
                <p className="text-gray-400 text-sm">You control what data Kiro can access and analyze</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckIcon className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Data Encryption</h4>
                <p className="text-gray-400 text-sm">All stored data is encrypted and can be deleted at any time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckIcon className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">No Tracking</h4>
                <p className="text-gray-400 text-sm">We don't track your browsing or sell your data to third parties</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start exploring Kiro\'s features',
      icon: <RocketLaunchIcon className="h-8 w-8 text-blue-400" />,
      content: (
        <div className="text-center space-y-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <RocketLaunchIcon className="h-16 w-16 text-blue-400" />
          </motion.div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to the future of browsing!</h3>
            <p className="text-gray-300">
              Kiro is now ready to help you browse smarter. Start by visiting any website 
              and look for the Kiro sidebar for contextual suggestions.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Quick Tips:</h4>
            <ul className="text-sm text-gray-300 space-y-1 text-left">
              <li>• Look for the Kiro icon in your browser toolbar</li>
              <li>• Try the AI chat feature for instant help</li>
              <li>• Check the dashboard for insights and analytics</li>
              <li>• Explore automation features to save time</li>
            </ul>
          </div>
        </div>
      )
    }
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipOnboarding = () => {
    onComplete()
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <h2 className="text-xl font-bold text-white">{currentStepData.title}</h2>
                <p className="text-gray-400 text-sm">{currentStepData.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round(progress)}% complete
              </span>
            </div>
            <ProgressBar progress={progress} color="blue" />
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-96">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.content}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <AnimatedButton
                  variant="ghost"
                  onClick={prevStep}
                  icon={<ArrowLeftIcon className="h-4 w-4" />}
                >
                  Previous
                </AnimatedButton>
              )}
              <AnimatedButton
                variant="ghost"
                onClick={skipOnboarding}
              >
                Skip Tour
              </AnimatedButton>
            </div>

            <div className="flex gap-2">
              {currentStepData.action && (
                <AnimatedButton
                  variant="secondary"
                  onClick={currentStepData.action.onClick}
                >
                  {currentStepData.action.label}
                </AnimatedButton>
              )}
              <AnimatedButton
                variant="primary"
                onClick={nextStep}
                icon={currentStep === steps.length - 1 ? 
                  <CheckIcon className="h-4 w-4" /> : 
                  <ArrowRightIcon className="h-4 w-4" />
                }
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </AnimatedButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}