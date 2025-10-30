'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QuestionMarkCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

interface TooltipProps {
  content: string | React.ReactNode
  title?: string
  type?: 'info' | 'help' | 'tip'
  position?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click'
  children: React.ReactNode
  className?: string
  maxWidth?: number
}

export default function ContextualTooltip({
  content,
  title,
  type = 'info',
  position = 'top',
  trigger = 'hover',
  children,
  className = '',
  maxWidth = 300
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const typeConfig = {
    info: {
      icon: <InformationCircleIcon className="h-4 w-4 text-blue-400" />,
      bgColor: 'bg-blue-600/10',
      borderColor: 'border-blue-600/20',
      textColor: 'text-blue-300'
    },
    help: {
      icon: <QuestionMarkCircleIcon className="h-4 w-4 text-purple-400" />,
      bgColor: 'bg-purple-600/10',
      borderColor: 'border-purple-600/20',
      textColor: 'text-purple-300'
    },
    tip: {
      icon: <LightBulbIcon className="h-4 w-4 text-yellow-400" />,
      bgColor: 'bg-yellow-600/10',
      borderColor: 'border-yellow-600/20',
      textColor: 'text-yellow-300'
    }
  }

  const config = typeConfig[type]

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      }

      let newPosition = position

      // Check if tooltip would go outside viewport and adjust position
      switch (position) {
        case 'top':
          if (triggerRect.top - tooltipRect.height < 10) {
            newPosition = 'bottom'
          }
          break
        case 'bottom':
          if (triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
            newPosition = 'top'
          }
          break
        case 'left':
          if (triggerRect.left - tooltipRect.width < 10) {
            newPosition = 'right'
          }
          break
        case 'right':
          if (triggerRect.right + tooltipRect.width > viewport.width - 10) {
            newPosition = 'left'
          }
          break
      }

      setActualPosition(newPosition)
    }
  }, [isVisible, position])

  const getTooltipPosition = () => {
    switch (actualPosition) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  const getArrowPosition = () => {
    switch (actualPosition) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-700'
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-700'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-700'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-700'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-700'
    }
  }

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false)
    }
  }

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible)
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (
      trigger === 'click' &&
      tooltipRef.current &&
      triggerRef.current &&
      !tooltipRef.current.contains(event.target as Node) &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsVisible(false)
    }
  }

  useEffect(() => {
    if (trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [trigger])

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-help"
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${getTooltipPosition()}`}
            style={{ maxWidth }}
          >
            <div className={`
              bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-3
              ${config.bgColor} ${config.borderColor}
            `}>
              {/* Arrow */}
              <div className={`absolute w-0 h-0 border-4 ${getArrowPosition()}`} />
              
              {/* Header */}
              {title && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
                  {config.icon}
                  <h4 className="text-sm font-medium text-white">{title}</h4>
                  {trigger === 'click' && (
                    <button
                      onClick={() => setIsVisible(false)}
                      className="ml-auto text-gray-400 hover:text-white transition-colors"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="text-sm text-gray-300">
                {typeof content === 'string' ? (
                  <p>{content}</p>
                ) : (
                  content
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Predefined tooltip components for common use cases
export function HelpTooltip({ 
  children, 
  content, 
  title = "Help" 
}: { 
  children: React.ReactNode
  content: string | React.ReactNode
  title?: string 
}) {
  return (
    <ContextualTooltip content={content} title={title} type="help" trigger="hover">
      {children}
    </ContextualTooltip>
  )
}

export function InfoTooltip({ 
  children, 
  content 
}: { 
  children: React.ReactNode
  content: string | React.ReactNode
}) {
  return (
    <ContextualTooltip content={content} type="info" trigger="hover">
      {children}
    </ContextualTooltip>
  )
}

export function TipTooltip({ 
  children, 
  content, 
  title = "Tip" 
}: { 
  children: React.ReactNode
  content: string | React.ReactNode
  title?: string 
}) {
  return (
    <ContextualTooltip content={content} title={title} type="tip" trigger="hover">
      {children}
    </ContextualTooltip>
  )
}

// Interactive help button component
export function HelpButton({ 
  content, 
  title, 
  size = 'sm' 
}: { 
  content: string | React.ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <ContextualTooltip content={content} title={title} type="help" trigger="click">
      <button className="text-gray-400 hover:text-gray-300 transition-colors">
        <QuestionMarkCircleIcon className={sizeClasses[size]} />
      </button>
    </ContextualTooltip>
  )
}