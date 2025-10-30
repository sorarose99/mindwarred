'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PlayIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { AutomationRule, TriggerType, ActionType } from '../../lib/types'
import TriggerEditor from './TriggerEditor'
import ActionEditor from './ActionEditor'
import RuleTester from './RuleTester'

interface AutomationBuilderProps {
  automation?: AutomationRule | null
  onSave: (automation: AutomationRule) => void
  onCancel: () => void
}

export default function AutomationBuilder({ automation, onSave, onCancel }: AutomationBuilderProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [trigger, setTrigger] = useState<AutomationRule['trigger']>({
    type: 'page_load',
    conditions: []
  })
  const [actions, setActions] = useState<AutomationRule['actions']>([])
  const [showTester, setShowTester] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (automation) {
      setName(automation.name)
      setDescription(automation.description)
      setIsActive(automation.isActive)
      setTrigger(automation.trigger)
      setActions(automation.actions)
    }
  }, [automation])

  useEffect(() => {
    // Validate the automation rule
    const valid = name.trim() !== '' && 
                  description.trim() !== '' && 
                  trigger.conditions.length > 0 && 
                  actions.length > 0
    setIsValid(valid)
  }, [name, description, trigger, actions])

  const handleSave = () => {
    if (!isValid) return

    const automationRule: AutomationRule = {
      id: automation?.id || '',
      name: name.trim(),
      description: description.trim(),
      isActive,
      trigger,
      actions,
      createdAt: automation?.createdAt || new Date(),
      updatedAt: new Date(),
      executionCount: automation?.executionCount || 0,
      successRate: automation?.successRate || 0
    }

    onSave(automationRule)
  }

  const addAction = () => {
    setActions(prev => [...prev, {
      type: 'form_fill',
      config: {}
    }])
  }

  const updateAction = (index: number, action: AutomationRule['actions'][0]) => {
    setActions(prev => prev.map((a, i) => i === index ? action : a))
  }

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">
          {automation ? 'Edit Automation' : 'Create New Automation'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTester(!showTester)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            <PlayIcon className="h-4 w-4" />
            Test Rule
          </button>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Info & Trigger */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rule Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter automation name..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this automation does..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-300">
                Enable this automation rule
              </label>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Trigger Conditions</h3>
            <TriggerEditor
              trigger={trigger}
              onChange={setTrigger}
            />
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Actions</h3>
            <button
              onClick={addAction}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <PlusIcon className="h-4 w-4" />
              Add Action
            </button>
          </div>

          <div className="space-y-4">
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">
                    Action {index + 1}
                  </span>
                  <button
                    onClick={() => removeAction(index)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <ActionEditor
                  action={action}
                  onChange={(updatedAction) => updateAction(index, updatedAction)}
                />
              </motion.div>
            ))}

            {actions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No actions configured yet</p>
                <button
                  onClick={addAction}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Add your first action
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rule Tester */}
      {showTester && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 pt-6 border-t border-gray-700"
        >
          <RuleTester
            trigger={trigger}
            actions={actions}
          />
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${isValid
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <CheckIcon className="h-4 w-4" />
          {automation ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </div>
  )
}