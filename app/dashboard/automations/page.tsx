'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import AutomationBuilder from '../../../components/automation/AutomationBuilder'
import AutomationList from '../../../components/automation/AutomationList'
import { useAutomationRules } from '../../../lib/hooks/use-real-time-sync'
import { AutomationRule } from '../../../lib/types'
import { 
  BoltIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function AutomationsPage() {
  const {
    data: automations,
    isLoading,
    error,
    syncStatus,
    create,
    update,
    delete: deleteAutomation
  } = useAutomationRules()

  const [showBuilder, setShowBuilder] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<AutomationRule | null>(null)

  const handleCreateAutomation = () => {
    setEditingAutomation(null)
    setShowBuilder(true)
  }

  const handleEditAutomation = (automation: AutomationRule) => {
    setEditingAutomation(automation)
    setShowBuilder(true)
  }

  const handleSaveAutomation = async (automation: AutomationRule) => {
    try {
      if (editingAutomation) {
        // Update existing automation
        await update(automation.id, automation)
      } else {
        // Create new automation
        const newAutomation = {
          ...automation,
          createdAt: new Date(),
          updatedAt: new Date(),
          executionCount: 0,
          successRate: 0
        }
        await create(newAutomation)
      }
      setShowBuilder(false)
      setEditingAutomation(null)
    } catch (error) {
      console.error('Failed to save automation:', error)
    }
  }

  const handleToggleAutomation = async (id: string) => {
    try {
      const automation = automations.find(a => a.id === id)
      if (automation) {
        await update(id, { isActive: !automation.isActive })
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error)
    }
  }

  const handleDeleteAutomation = async (id: string) => {
    try {
      await deleteAutomation(id)
    } catch (error) {
      console.error('Failed to delete automation:', error)
    }
  }

  const activeAutomations = automations.filter(a => a.isActive)
  const totalExecutions = automations.reduce((sum, a) => sum + (a.executionCount || 0), 0)
  const averageSuccessRate = automations.length > 0 
    ? automations.reduce((sum, a) => sum + (a.successRate || 0), 0) / automations.length 
    : 0

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Cog6ToothIcon className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading automations...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Automation Hub</h1>
            <p className="text-gray-400">
              Create and manage intelligent automation rules for your browsing workflow
            </p>
            
            {/* Sync Status Indicator */}
            {syncStatus && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  syncStatus.isOnline 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  <WifiIcon className="h-3 w-3" />
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </div>
                
                {syncStatus.pendingOperations > 0 && (
                  <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400">
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    {syncStatus.pendingOperations} pending
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={handleCreateAutomation}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Create Automation
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <BoltIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Rules</p>
                <p className="text-xl font-bold text-white">{automations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <PlayIcon className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Rules</p>
                <p className="text-xl font-bold text-white">{activeAutomations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Executions</p>
                <p className="text-xl font-bold text-white">{totalExecutions}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600/20 rounded-lg">
                <Cog6ToothIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-xl font-bold text-white">
                  {Math.round(averageSuccessRate * 100)}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Automation Builder */}
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AutomationBuilder
              automation={editingAutomation}
              onSave={handleSaveAutomation}
              onCancel={() => {
                setShowBuilder(false)
                setEditingAutomation(null)
              }}
            />
          </motion.div>
        )}

        {/* Automation List */}
        {!showBuilder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AutomationList
              automations={automations}
              onEdit={handleEditAutomation}
              onToggle={handleToggleAutomation}
              onDelete={handleDeleteAutomation}
            />
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/30 backdrop-blur-sm rounded-xl border border-red-800/50 p-6"
          >
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              <div>
                <h3 className="text-lg font-medium text-red-300">Sync Error</h3>
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!showBuilder && !isLoading && automations.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-12 text-center"
          >
            <BoltIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No automations yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first automation rule to start automating repetitive tasks
            </p>
            <button
              onClick={handleCreateAutomation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Create Your First Automation
            </button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}