'use client'

import { motion } from 'framer-motion'
import { spinnerVariants } from '../../lib/animations/motion-variants'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'purple' | 'green' | 'white'
  text?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    white: 'text-white'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        variants={spinnerVariants}
        animate="animate"
        className={`${sizeClasses[size]} ${colorClasses[color]}`}
      >
        <svg
          className="animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-sm ${colorClasses[color]} font-medium`}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// AI Processing specific spinner with thinking animation
export function AIProcessingSpinner({ text = "AI is thinking..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-600/10 border border-blue-600/20">
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
      <span className="text-sm text-blue-400 font-medium">{text}</span>
    </div>
  )
}

// Progress indicator for longer operations
export function ProgressSpinner({ 
  progress, 
  text, 
  color = 'blue' 
}: { 
  progress: number
  text?: string
  color?: 'blue' | 'purple' | 'green'
}) {
  const colorClasses = {
    blue: 'stroke-blue-400',
    purple: 'stroke-purple-400',
    green: 'stroke-green-400'
  }

  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-gray-700"
          />
          <motion.circle
            cx="25"
            cy="25"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            className={colorClasses[color]}
            style={{
              strokeDasharray,
              strokeDashoffset
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-300">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      {text && (
        <p className="text-sm text-gray-400 font-medium text-center max-w-xs">
          {text}
        </p>
      )}
    </div>
  )
}