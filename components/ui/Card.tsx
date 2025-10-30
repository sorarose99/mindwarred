'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cardHover } from '../../lib/animations/motion-variants'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
  onClick?: () => void
  delay?: number
}

export function Card({ children, className = '', hover = false, gradient = false, onClick, delay = 0 }: CardProps) {
  const baseClasses = `
    rounded-xl border border-gray-800/50 p-6 transition-all duration-300
    ${gradient 
      ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/30' 
      : 'bg-gray-900/30'
    }
    backdrop-blur-sm
    ${hover ? 'hover:border-gray-700/50 hover:bg-gray-800/40 hover:shadow-xl hover:shadow-black/25' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `

  const cardContent = (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  )

  if (hover || onClick) {
    return (
      <motion.div
        variants={cardHover}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        animate="rest"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {cardContent}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {cardContent}
    </motion.div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: ReactNode
  description?: string
}

export function StatCard({ title, value, change, icon, description }: StatCardProps) {
  return (
    <Card hover gradient>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <motion.p 
            className="text-sm font-medium text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {title}
          </motion.p>
          <motion.p 
            className="text-2xl font-bold text-white mt-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.p>
          {description && (
            <motion.p 
              className="text-xs text-gray-500 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {description}
            </motion.p>
          )}
          {change && (
            <motion.div 
              className="flex items-center mt-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span
                className={`text-xs font-medium ${
                  change.type === 'increase' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </motion.div>
          )}
        </div>
        {icon && (
          <motion.div 
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </Card>
  )
}

interface ActionCardProps {
  title: string
  description: string
  action: string
  onClick: () => void
  icon?: ReactNode
  disabled?: boolean
}

export function ActionCard({ title, description, action, onClick, icon, disabled }: ActionCardProps) {
  return (
    <Card hover={!disabled} onClick={disabled ? undefined : onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-x-3">
            {icon && (
              <motion.div 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {icon}
              </motion.div>
            )}
            <div>
              <motion.h3 
                className="text-sm font-semibold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {title}
              </motion.h3>
              <motion.p 
                className="text-sm text-gray-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {description}
              </motion.p>
            </div>
          </div>
        </div>
        <motion.button
          onClick={onClick}
          disabled={disabled}
          className={`
            rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200
            ${disabled
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25'
            }
          `}
          whileHover={disabled ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {action}
        </motion.button>
      </div>
    </Card>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  features: string[]
  status: 'active' | 'inactive' | 'coming-soon'
  onToggle?: () => void
}

export function FeatureCard({ title, description, features, status, onToggle }: FeatureCardProps) {
  const statusConfig = {
    active: { color: 'text-green-400', bg: 'bg-green-400/20', label: 'Active' },
    inactive: { color: 'text-gray-400', bg: 'bg-gray-400/20', label: 'Inactive' },
    'coming-soon': { color: 'text-yellow-400', bg: 'bg-yellow-400/20', label: 'Coming Soon' }
  }

  const config = statusConfig[status]

  return (
    <Card hover={status !== 'coming-soon'}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-x-2">
            <div className={`h-2 w-2 rounded-full ${config.bg}`} />
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>

        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-x-2 text-sm text-gray-300">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {feature}
            </li>
          ))}
        </ul>

        {onToggle && status !== 'coming-soon' && (
          <button
            onClick={onToggle}
            className={`
              w-full rounded-lg py-2 text-sm font-medium transition-colors
              ${status === 'active'
                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
              }
            `}
          >
            {status === 'active' ? 'Disable' : 'Enable'}
          </button>
        )}
      </div>
    </Card>
  )
}