'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { buttonVariants } from '../../lib/animations/motion-variants'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = '',
  type = 'button'
}: AnimatedButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg shadow-blue-600/25',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-800/50 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-lg shadow-red-600/25'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  }

  const disabledClasses = 'opacity-50 cursor-not-allowed'

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? disabledClasses : ''}
    ${className}
  `

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={disabled || loading ? undefined : onClick}
      variants={buttonVariants}
      initial="rest"
      whileHover={disabled || loading ? "rest" : "hover"}
      whileTap={disabled || loading ? "rest" : "tap"}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4"
          >
            <svg
              className="w-full h-full"
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
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && (
            <motion.div
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}
          {children}
        </>
      )}
    </motion.button>
  )
}

// Floating Action Button with pulse animation
export function FloatingActionButton({
  children,
  onClick,
  className = '',
  pulse = false
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  pulse?: boolean
}) {
  return (
    <motion.button
      className={`
        fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 
        text-white rounded-full shadow-lg shadow-blue-600/25 
        flex items-center justify-center z-50 transition-colors
        ${className}
      `}
      onClick={onClick}
      variants={buttonVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      animate={pulse ? {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 10px 25px rgba(59, 130, 246, 0.25)',
          '0 15px 35px rgba(59, 130, 246, 0.4)',
          '0 10px 25px rgba(59, 130, 246, 0.25)'
        ]
      } : {}}
      transition={pulse ? {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      } : {}}
    >
      {children}
    </motion.button>
  )
}

// Icon button with ripple effect
export function IconButton({
  children,
  onClick,
  variant = 'ghost',
  size = 'md',
  className = ''
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'filled'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const variantClasses = {
    ghost: 'hover:bg-gray-800/50 text-gray-400 hover:text-white',
    filled: 'bg-gray-700 hover:bg-gray-600 text-white'
  }

  return (
    <motion.button
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg flex items-center justify-center transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
        ${className}
      `}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  )
}