'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import { Card } from '../../../components/ui/Card'
import AnimatedButton, { FloatingActionButton, IconButton } from '../../../components/ui/AnimatedButton'
import LoadingSpinner, { AIProcessingSpinner, ProgressSpinner } from '../../../components/ui/LoadingSpinner'
import { ProgressBar, CircularProgress, StepProgress, AIProcessingProgress } from '../../../components/ui/ProgressIndicator'
import PageTransition, { LoadingTransition, StaggeredList } from '../../../components/ui/PageTransition'
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon,
  SparklesIcon,
  RocketLaunchIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

export default function AnimationsDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(45)
  const [currentStep, setCurrentStep] = useState(1)
  const [aiStage, setAiStage] = useState(2)

  const steps = [
    'Initialize Connection',
    'Analyze Content',
    'Generate Suggestions',
    'Apply Results'
  ]

  const aiStages = [
    { name: 'Reading Content', description: 'Analyzing page structure and text' },
    { name: 'Understanding Context', description: 'Processing semantic meaning' },
    { name: 'Generating Insights', description: 'Creating personalized suggestions' },
    { name: 'Finalizing Results', description: 'Preparing recommendations' }
  ]

  const demoCards = [
    { title: 'Card 1', content: 'This is a demo card with hover animations' },
    { title: 'Card 2', content: 'Another card to show stagger effects' },
    { title: 'Card 3', content: 'Third card in the sequence' },
    { title: 'Card 4', content: 'Final card with smooth animations' }
  ]

  const simulateProgress = () => {
    setIsLoading(true)
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 10
      setProgress(currentProgress)
      if (currentProgress >= 100) {
        clearInterval(interval)
        setIsLoading(false)
        setProgress(0)
      }
    }, 200)
  }

  const nextStep = () => {
    setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : 0))
  }

  const nextAiStage = () => {
    setAiStage(prev => (prev < aiStages.length - 1 ? prev + 1 : 0))
  }

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent mb-4">
              Animation Showcase
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Demonstrating smooth animations and delightful micro-interactions
            </p>
          </motion.div>

          {/* Buttons Section */}
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Interactive Buttons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatedButton 
                variant="primary" 
                icon={<PlayIcon className="h-4 w-4" />}
                onClick={simulateProgress}
              >
                Start Demo
              </AnimatedButton>
              <AnimatedButton 
                variant="secondary" 
                icon={<PauseIcon className="h-4 w-4" />}
              >
                Pause
              </AnimatedButton>
              <AnimatedButton 
                variant="ghost" 
                icon={<ArrowPathIcon className="h-4 w-4" />}
                onClick={() => setProgress(0)}
              >
                Reset
              </AnimatedButton>
              <AnimatedButton 
                variant="danger" 
                loading={isLoading}
              >
                Loading State
              </AnimatedButton>
            </div>

            <div className="mt-6 flex gap-4">
              <IconButton onClick={nextStep}>
                <SparklesIcon className="h-5 w-5" />
              </IconButton>
              <IconButton variant="filled" onClick={nextAiStage}>
                <RocketLaunchIcon className="h-5 w-5" />
              </IconButton>
            </div>
          </Card>

          {/* Loading States */}
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Loading Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Basic Spinner</h3>
                <LoadingSpinner size="lg" text="Processing..." />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">AI Thinking</h3>
                <AIProcessingSpinner />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Progress Spinner</h3>
                <ProgressSpinner progress={progress} text="Loading data..." />
              </div>
            </div>
          </Card>

          {/* Progress Indicators */}
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Progress Indicators</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Progress Bar</h3>
                <ProgressBar progress={progress} showPercentage />
              </div>
              
              <div className="flex items-center gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">Circular Progress</h3>
                  <CircularProgress progress={progress} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-300 mb-4">Step Progress</h3>
                  <StepProgress steps={steps} currentStep={currentStep} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">AI Processing Progress</h3>
                <AIProcessingProgress stages={aiStages} currentStage={aiStage} />
              </div>
            </div>
          </Card>

          {/* Staggered Cards */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Staggered Animations</h2>
            <StaggeredList className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {demoCards.map((card, index) => (
                <Card key={index} hover gradient>
                  <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-gray-400">{card.content}</p>
                </Card>
              ))}
            </StaggeredList>
          </div>

          {/* Loading Transition Demo */}
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Loading Transitions</h2>
            <LoadingTransition isLoading={isLoading}>
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="inline-block mb-4"
                >
                  <SparklesIcon className="h-12 w-12 text-blue-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-2">Content Loaded!</h3>
                <p className="text-gray-400">This content appears after loading completes</p>
              </div>
            </LoadingTransition>
          </Card>

          {/* Micro-interactions */}
          <Card>
            <h2 className="text-2xl font-bold text-white mb-6">Micro-interactions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                className="p-6 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 cursor-pointer"
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">Hover & Tap</h3>
                <p className="text-gray-300">Interactive card with spring animations</p>
              </motion.div>

              <motion.div
                className="p-6 rounded-lg bg-gradient-to-br from-green-600/20 to-blue-600/20 border border-green-500/30"
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(34, 197, 94, 0.2)',
                    '0 0 40px rgba(34, 197, 94, 0.4)',
                    '0 0 20px rgba(34, 197, 94, 0.2)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">Pulsing Glow</h3>
                <p className="text-gray-300">Continuous glow animation</p>
              </motion.div>

              <motion.div
                className="p-6 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">Floating</h3>
                <p className="text-gray-300">Gentle floating motion</p>
              </motion.div>
            </div>
          </Card>

          {/* Floating Action Button */}
          <FloatingActionButton pulse>
            <HeartIcon className="h-6 w-6" />
          </FloatingActionButton>
        </div>
      </PageTransition>
    </DashboardLayout>
  )
}