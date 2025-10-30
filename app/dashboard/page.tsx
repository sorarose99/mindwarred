'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ChartBarIcon, 
  BoltIcon, 
  EyeIcon, 
  ChatBubbleLeftRightIcon,
  CogIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { StatCard, ActionCard, FeatureCard } from '../../components/ui/Card'

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          data-tour="dashboard-header"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent mb-4">
            Welcome to Kiro
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your intelligent Web Mind is ready to help you browse smarter, work faster, and learn better.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          data-tour="stats-grid"
        >
          <motion.div
            variants={{
              initial: { opacity: 0, y: 20, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 }
            }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <StatCard
              title="Pages Analyzed"
              value="0"
              description="This session"
              icon={<ChartBarIcon className="h-6 w-6 text-blue-400" />}
            />
          </motion.div>
          <motion.div
            variants={{
              initial: { opacity: 0, y: 20, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 }
            }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <StatCard
              title="AI Suggestions"
              value="0"
              description="Generated today"
              icon={<EyeIcon className="h-6 w-6 text-purple-400" />}
            />
          </motion.div>
          <motion.div
            variants={{
              initial: { opacity: 0, y: 20, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 }
            }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <StatCard
              title="Automations"
              value="0"
              description="Active rules"
              icon={<BoltIcon className="h-6 w-6 text-green-400" />}
            />
          </motion.div>
          <motion.div
            variants={{
              initial: { opacity: 0, y: 20, scale: 0.95 },
              animate: { opacity: 1, y: 0, scale: 1 }
            }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <StatCard
              title="Time Saved"
              value="0m"
              description="This week"
              icon={<RocketLaunchIcon className="h-6 w-6 text-yellow-400" />}
            />
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <ActionCard
            title="Install Chrome Extension"
            description="Get started with Kiro by installing the browser extension"
            action="Install"
            onClick={() => window.open('chrome://extensions/', '_blank')}
            icon={<RocketLaunchIcon className="h-5 w-5 text-blue-400" />}
          />
          <div data-tour="chat-button">
            <ActionCard
              title="Try Kiro Chat"
              description="Experience AI-powered conversations and get instant help"
              action="Open Chat"
              onClick={() => window.location.href = '/chat'}
              icon={<ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-400" />}
            />
          </div>
        </motion.div>

        {/* Feature Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-white">Features Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeatureCard
              title="AI Analysis"
              description="Intelligent page analysis and contextual suggestions"
              features={[
                'Real-time content analysis',
                'Smart text summarization',
                'Contextual recommendations',
                'Privacy-first processing'
              ]}
              status="active"
            />
            <FeatureCard
              title="Smart Automations"
              description="Automate repetitive tasks and workflows"
              features={[
                'Form auto-fill',
                'Custom automation rules',
                'Trigger-based actions',
                'Learning from patterns'
              ]}
              status="inactive"
            />
            <FeatureCard
              title="Knowledge Graph"
              description="Visual representation of your browsing insights"
              features={[
                'Interactive node visualization',
                'Topic relationship mapping',
                'Personal interest tracking',
                'Learning progress insights'
              ]}
              status="coming-soon"
            />
            <FeatureCard
              title="Voice Interface"
              description="Hands-free interaction with natural speech"
              features={[
                'Voice commands',
                'Speech-to-text processing',
                'Natural language understanding',
                'Audio feedback'
              ]}
              status="coming-soon"
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <Link 
              href="/dashboard/analytics" 
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
              <ChartBarIcon className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No activity yet</h3>
            <p className="text-gray-500 mb-6">
              Install the Chrome extension to start tracking your browsing insights
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Link
            href="/dashboard/analytics"
            className="flex flex-col items-center p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors group"
          >
            <ChartBarIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-400 transition-colors mb-2" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Analytics
            </span>
          </Link>
          <Link
            href="/dashboard/automations"
            className="flex flex-col items-center p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors group"
          >
            <BoltIcon className="h-8 w-8 text-gray-400 group-hover:text-green-400 transition-colors mb-2" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Automations
            </span>
          </Link>
          <Link
            href="/dashboard/knowledge"
            className="flex flex-col items-center p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors group"
          >
            <EyeIcon className="h-8 w-8 text-gray-400 group-hover:text-purple-400 transition-colors mb-2" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Knowledge
            </span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex flex-col items-center p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors group"
          >
            <CogIcon className="h-8 w-8 text-gray-400 group-hover:text-gray-300 transition-colors mb-2" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Settings
            </span>
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}