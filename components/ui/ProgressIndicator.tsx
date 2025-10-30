'use client'

import { motion } from 'framer-motion'
import { progressVariants } from '../../lib/animations/motion-variants'

interface ProgressBarProps {
  progress: number
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  animated?: boolean
  className?: string
}

export function ProgressBar({
  progress,
  color = 'blue',
  size = 'md',
  showPercentage = false,
  animated = true,
  className = ''
}: ProgressBarProps) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">Progress</span>
          <span className="text-sm font-medium text-gray-300">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-800 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {animated ? (
          <motion.div
            className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
            variants={progressVariants}
            initial="initial"
            animate="animate"
            custom={clampedProgress}
          />
        ) : (
          <div
            className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${clampedProgress}%` }}
          />
        )}
      </div>
    </div>
  )
}

// Circular progress indicator
export function CircularProgress({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'blue',
  showPercentage = true,
  className = ''
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  showPercentage?: boolean
  className?: string
}) {
  const colorClasses = {
    blue: 'stroke-blue-400',
    green: 'stroke-green-400',
    purple: 'stroke-purple-400',
    yellow: 'stroke-yellow-400',
    red: 'stroke-red-400'
  }

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colorClasses[color]}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-sm font-medium text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(clampedProgress)}%
          </motion.span>
        </div>
      )}
    </div>
  )
}

// Step progress indicator
export function StepProgress({
  steps,
  currentStep,
  className = ''
}: {
  steps: string[]
  currentStep: number
  className?: string
}) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <div key={index} className="flex items-center">
              {/* Step circle */}
              <motion.div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted 
                    ? 'bg-green-600 text-white' 
                    : isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-400'
                  }
                `}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {isCompleted ? (
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                ) : (
                  index + 1
                )}
              </motion.div>

              {/* Step label */}
              <motion.div
                className="ml-3 flex-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.1 }}
              >
                <p className={`text-sm font-medium ${
                  isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                }`}>
                  {step}
                </p>
              </motion.div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-700 relative overflow-hidden">
                    <motion.div
                      className="h-full bg-green-600"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isCompleted ? 1 : 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                      style={{ originX: 0 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// AI Processing progress with stages
export function AIProcessingProgress({
  stages,
  currentStage,
  className = ''
}: {
  stages: { name: string; description: string }[]
  currentStage: number
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
        <span className="text-sm text-blue-400 font-medium">
          AI Processing in progress...
        </span>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStage
          const isCurrent = index === currentStage
          const isUpcoming = index > currentStage

          return (
            <motion.div
              key={index}
              className={`
                flex items-start gap-3 p-3 rounded-lg transition-colors
                ${isCurrent ? 'bg-blue-600/10 border border-blue-600/20' : ''}
              `}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5
                ${isCompleted 
                  ? 'bg-green-600 text-white' 
                  : isCurrent 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <motion.svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${
                  isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                }`}>
                  {stage.name}
                </h4>
                <p className={`text-xs mt-1 ${
                  isCompleted || isCurrent ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {stage.description}
                </p>
              </div>
              {isCurrent && (
                <motion.div
                  className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}