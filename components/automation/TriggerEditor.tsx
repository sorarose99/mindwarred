'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { AutomationRule, TriggerType, Condition } from '../../lib/types'

interface TriggerEditorProps {
  trigger: AutomationRule['trigger']
  onChange: (trigger: AutomationRule['trigger']) => void
}

const triggerTypes: { value: TriggerType; label: string; description: string }[] = [
  {
    value: 'page_load',
    label: 'Page Load',
    description: 'Trigger when a page loads'
  },
  {
    value: 'text_selection',
    label: 'Text Selection',
    description: 'Trigger when text is selected'
  },
  {
    value: 'form_interaction',
    label: 'Form Interaction',
    description: 'Trigger when interacting with forms'
  },
  {
    value: 'time_based',
    label: 'Time Based',
    description: 'Trigger at specific times'
  },
  {
    value: 'url_pattern',
    label: 'URL Pattern',
    description: 'Trigger based on URL patterns'
  },
  {
    value: 'content_change',
    label: 'Content Change',
    description: 'Trigger when page content changes'
  },
  {
    value: 'user_action',
    label: 'User Action',
    description: 'Trigger on specific user actions'
  }
]

const conditionFields = [
  { value: 'url', label: 'URL' },
  { value: 'title', label: 'Page Title' },
  { value: 'pageType', label: 'Page Type' },
  { value: 'domain', label: 'Domain' },
  { value: 'selectedText', label: 'Selected Text' },
  { value: 'formField', label: 'Form Field' },
  { value: 'timeOfDay', label: 'Time of Day' },
  { value: 'dayOfWeek', label: 'Day of Week' }
]

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'matches', label: 'Matches (Regex)' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' }
]

export default function TriggerEditor({ trigger, onChange }: TriggerEditorProps) {
  const updateTriggerType = (type: TriggerType) => {
    onChange({
      ...trigger,
      type,
      conditions: [] // Reset conditions when changing type
    })
  }

  const addCondition = () => {
    const newCondition: Condition = {
      field: 'url',
      operator: 'contains',
      value: ''
    }
    
    onChange({
      ...trigger,
      conditions: [...trigger.conditions, newCondition]
    })
  }

  const updateCondition = (index: number, condition: Condition) => {
    const updatedConditions = trigger.conditions.map((c, i) => 
      i === index ? condition : c
    )
    
    onChange({
      ...trigger,
      conditions: updatedConditions
    })
  }

  const removeCondition = (index: number) => {
    const updatedConditions = trigger.conditions.filter((_, i) => i !== index)
    
    onChange({
      ...trigger,
      conditions: updatedConditions
    })
  }

  const selectedTriggerType = triggerTypes.find(t => t.value === trigger.type)

  return (
    <div className="space-y-4">
      {/* Trigger Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trigger Type
        </label>
        <select
          value={trigger.type}
          onChange={(e) => updateTriggerType(e.target.value as TriggerType)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {triggerTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {selectedTriggerType && (
          <p className="text-sm text-gray-400 mt-1">
            {selectedTriggerType.description}
          </p>
        )}
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">
            Conditions
          </label>
          <button
            onClick={addCondition}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            <PlusIcon className="h-3 w-3" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {trigger.conditions.map((condition, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Field */}
                <div className="col-span-4">
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, {
                      ...condition,
                      field: e.target.value
                    })}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {conditionFields.map(field => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div className="col-span-3">
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, {
                      ...condition,
                      operator: e.target.value as any
                    })}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div className="col-span-4">
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, {
                      ...condition,
                      value: e.target.value
                    })}
                    placeholder="Enter value..."
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Remove Button */}
                <div className="col-span-1">
                  <button
                    onClick={() => removeCondition(index)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {trigger.conditions.length === 0 && (
            <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
              <p className="text-sm mb-2">No conditions set</p>
              <button
                onClick={addCondition}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Add your first condition
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Condition Logic */}
      {trigger.conditions.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Condition Logic
          </label>
          <select
            value={trigger.logic || 'AND'}
            onChange={(e) => onChange({
              ...trigger,
              logic: e.target.value as 'AND' | 'OR'
            })}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AND">All conditions must match (AND)</option>
            <option value="OR">Any condition can match (OR)</option>
          </select>
        </div>
      )}
    </div>
  )
}