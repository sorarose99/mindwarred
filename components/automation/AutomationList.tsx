'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { AutomationRule } from '../../lib/types'

interface AutomationListProps {
  automations: AutomationRule[]
  onEdit: (automation: AutomationRule) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function AutomationList({ automations, onEdit, onToggle, onDelete }: AutomationListProps) {
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'executions' | 'success'>('created')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredAndSortedAutomations = automations
    .filter(automation => {
      if (filterStatus === 'active') return automation.isActive
      if (filterStatus === 'inactive') return !automation.isActive
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'executions':
          return (b.executionCount || 0) - (a.executionCount || 0)
        case 'success':
          return (b.successRate || 0) - (a.successRate || 0)
        default:
          return 0
      }
    })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.9) return 'text-green-400'
    if (rate >= 0.7) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getTriggerDescription = (automation: AutomationRule) => {
    const triggerLabels = {
      page_load: 'Page Load',
      text_selection: 'Text Selection',
      form_interaction: 'Form Interaction',
      time_based: 'Time Based',
      url_pattern: 'URL Pattern',
      content_change: 'Content Change',
      user_action: 'User Action'
    }
    
    const triggerType = triggerLabels[automation.trigger.type] || automation.trigger.type
    const conditionCount = automation.trigger.conditions.length
    
    return `${triggerType} (${conditionCount} condition${conditionCount !== 1 ? 's' : ''})`
  }

  const getActionsSummary = (automation: AutomationRule) => {
    const actionTypes = automation.actions.map(action => {
      const labels = {
        form_fill: 'Fill Form',
        click_element: 'Click',
        navigate_to: 'Navigate',
        ai_summarize: 'Summarize',
        data_extraction: 'Extract Data',
        notification: 'Notify',
        save_content: 'Save',
        custom_script: 'Script'
      }
      return labels[action.type] || action.type
    })
    
    return actionTypes.slice(0, 2).join(', ') + (actionTypes.length > 2 ? ` +${actionTypes.length - 2}` : '')
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="created">Created Date</option>
              <option value="name">Name</option>
              <option value="executions">Executions</option>
              <option value="success">Success Rate</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Rules</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-400">
          {filteredAndSortedAutomations.length} of {automations.length} rules
        </div>
      </div>

      {/* Automation Cards */}
      <div className="space-y-3">
        {filteredAndSortedAutomations.map((automation, index) => (
          <motion.div
            key={automation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              bg-gray-900/30 backdrop-blur-sm rounded-xl border p-6 transition-all duration-200
              ${automation.isActive 
                ? 'border-gray-800/50 hover:border-gray-700/50' 
                : 'border-gray-800/30 opacity-75'
              }
            `}
          >
            <div className="flex items-start justify-between">
              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {automation.name}
                  </h3>
                  
                  {/* Status Badge */}
                  <div className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                    ${automation.isActive
                      ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                      : 'bg-gray-700/30 text-gray-400 border border-gray-600/50'
                    }
                  `}>
                    {automation.isActive ? (
                      <>
                        <CheckCircleIcon className="h-3 w-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <PauseIcon className="h-3 w-3" />
                        Inactive
                      </>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 mb-4 line-clamp-2">
                  {automation.description}
                </p>

                {/* Rule Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Trigger</div>
                    <div className="text-sm text-gray-300">
                      {getTriggerDescription(automation)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Actions</div>
                    <div className="text-sm text-gray-300">
                      {getActionsSummary(automation)}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>{automation.executionCount || 0} executions</span>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${getSuccessRateColor(automation.successRate || 0)}`}>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>{Math.round((automation.successRate || 0) * 100)}% success</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-400">
                    <ClockIcon className="h-4 w-4" />
                    <span>Created {formatDate(automation.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onToggle(automation.id)}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${automation.isActive
                      ? 'text-yellow-400 hover:bg-yellow-400/10'
                      : 'text-green-400 hover:bg-green-400/10'
                    }
                  `}
                  title={automation.isActive ? 'Pause automation' : 'Activate automation'}
                >
                  {automation.isActive ? (
                    <PauseIcon className="h-4 w-4" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={() => onEdit(automation)}
                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  title="Edit automation"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onDelete(automation.id)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Delete automation"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Performance Indicator */}
            {automation.executionCount && automation.executionCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Performance</span>
                  <span>{Math.round((automation.successRate || 0) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className={`
                      h-1.5 rounded-full transition-all duration-300
                      ${automation.successRate && automation.successRate >= 0.9
                        ? 'bg-green-500'
                        : automation.successRate && automation.successRate >= 0.7
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                      }
                    `}
                    style={{ width: `${(automation.successRate || 0) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedAutomations.length === 0 && automations.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>No automations match the current filter</p>
        </div>
      )}
    </div>
  )
}