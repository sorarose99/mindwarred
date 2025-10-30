'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  ChartBarIcon,
  ShareIcon,
  BoltIcon,
  EyeIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navigation: NavigationItem[] = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Knowledge', href: '/dashboard/knowledge', icon: EyeIcon },
  { name: 'Automations', href: '/dashboard/automations', icon: BoltIcon },
  { name: 'Integrations', href: '/dashboard/integrations', icon: ShareIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon }
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  }

  const overlayVariants = {
    open: {
      opacity: 1,
      transition: { duration: 0.2 }
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar navigation={navigation} pathname={pathname} />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed inset-y-0 z-50 flex w-72 flex-col lg:hidden"
          >
            <Sidebar 
              navigation={navigation} 
              pathname={pathname} 
              onClose={() => setSidebarOpen(false)}
              mobile
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-800 lg:hidden" aria-hidden="true" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-100">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Help button */}
              <button
                type="button"
                className="rounded-lg p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                onClick={() => {
                  // This will be connected to the onboarding context
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('kiro:open-help'))
                  }
                }}
                title="Help & Support"
              >
                <QuestionMarkCircleIcon className="h-5 w-5" />
              </button>

              {/* Theme toggle */}
              {mounted && (
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-5 w-5" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  )}
                </button>
              )}

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-x-2 rounded-lg p-2 text-sm font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="hidden sm:block">Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

interface SidebarProps {
  navigation: NavigationItem[]
  pathname: string
  onClose?: () => void
  mobile?: boolean
}

function Sidebar({ navigation, pathname, onClose, mobile }: SidebarProps) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900/90 backdrop-blur-xl px-6 pb-4 ring-1 ring-white/5">
      <div className="flex h-16 shrink-0 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-sm font-bold text-white">K</span>
          </div>
          <span className="text-xl font-semibold text-white">Kiro</span>
        </Link>
        {mobile && onClose && (
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-300"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col" data-tour="sidebar-nav">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                
                return (
                  <motion.li 
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: navigation.indexOf(item) * 0.05,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={mobile ? onClose : undefined}
                      className={`
                        group flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg shadow-blue-600/10'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50 hover:shadow-md hover:shadow-black/20'
                        }
                      `}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
                          }`}
                          aria-hidden="true"
                        />
                      </motion.div>
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <motion.span 
                          className="ml-auto inline-flex items-center rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {item.badge}
                        </motion.span>
                      )}
                    </Link>
                  </motion.li>
                )
              })}
            </ul>
          </li>

          {/* Status indicator */}
          <li className="mt-auto">
            <div className="flex items-center gap-x-3 rounded-lg bg-gray-800/50 p-3">
              <div className="flex h-2 w-2 items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-white">AI Active</p>
                <p className="text-gray-400">All systems operational</p>
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  )
}