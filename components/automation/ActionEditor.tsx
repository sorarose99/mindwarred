'use client'

import { useState } from 'react'
import { ActionType } from '../../lib/types'

interface ActionEditorProps {
  action: {
    type: ActionType
    config: Record<string, any>
  }
  onChange: (action: { type: ActionType; config: Record<string, any> }) => void
}

const actionTypes: { value: ActionType; label: string; description: string }[] = [
  {
    value: 'form_fill',
    label: 'Form Fill',
    description: 'Automatically fill form fields'
  },
  {
    value: 'click_element',
    label: 'Click Element',
    description: 'Click on page elements'
  },
  {
    value: 'navigate_to',
    label: 'Navigate To',
    description: 'Navigate to a specific URL'
  },
  {
    value: 'ai_summarize',
    label: 'AI Summarize',
    description: 'Generate AI summary of content'
  },
  {
    value: 'data_extraction',
    label: 'Data Extraction',
    description: 'Extract specific data from page'
  },
  {
    value: 'notification',
    label: 'Notification',
    description: 'Show notification to user'
  },
  {
    value: 'save_content',
    label: 'Save Content',
    description: 'Save page content or selection'
  },
  {
    value: 'custom_script',
    label: 'Custom Script',
    description: 'Execute custom JavaScript'
  }
]

export default function ActionEditor({ action, onChange }: ActionEditorProps) {
  const updateActionType = (type: ActionType) => {
    onChange({
      type,
      config: {} // Reset config when changing type
    })
  }

  const updateConfig = (key: string, value: any) => {
    onChange({
      ...action,
      config: {
        ...action.config,
        [key]: value
      }
    })
  }

  const renderConfigFields = () => {
    switch (action.type) {
      case 'form_fill':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Form Fields (JSON)
              </label>
              <textarea
                value={JSON.stringify(action.config.fields || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const fields = JSON.parse(e.target.value)
                    updateConfig('fields', fields)
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{\n  "email": "user@example.com",\n  "password": "***"\n}'
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requireConfirmation"
                checked={action.config.requireConfirmation || false}
                onChange={(e) => updateConfig('requireConfirmation', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="requireConfirmation" className="text-sm text-gray-300">
                Require user confirmation
              </label>
            </div>
          </div>
        )

      case 'click_element':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Element Selector
              </label>
              <input
                type="text"
                value={action.config.selector || ''}
                onChange={(e) => updateConfig('selector', e.target.value)}
                placeholder="CSS selector (e.g., #submit-button)"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Wait Time (ms)
              </label>
              <input
                type="number"
                value={action.config.waitTime || 0}
                onChange={(e) => updateConfig('waitTime', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case 'navigate_to':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Target URL
              </label>
              <input
                type="url"
                value={action.config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newTab"
                checked={action.config.newTab || false}
                onChange={(e) => updateConfig('newTab', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="newTab" className="text-sm text-gray-300">
                Open in new tab
              </label>
            </div>
          </div>
        )

      case 'ai_summarize':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Summary Length
              </label>
              <select
                value={action.config.length || 'brief'}
                onChange={(e) => updateConfig('length', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="brief">Brief</option>
                <option value="detailed">Detailed</option>
                <option value="bullet-points">Bullet Points</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveToKnowledge"
                checked={action.config.saveToKnowledge || false}
                onChange={(e) => updateConfig('saveToKnowledge', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="saveToKnowledge" className="text-sm text-gray-300">
                Save to knowledge graph
              </label>
            </div>
          </div>
        )

      case 'data_extraction':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Data Selectors (JSON)
              </label>
              <textarea
                value={JSON.stringify(action.config.selectors || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const selectors = JSON.parse(e.target.value)
                    updateConfig('selectors', selectors)
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{\n  "title": "h1",\n  "price": ".price"\n}'
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyOnChange"
                checked={action.config.notifyOnChange || false}
                onChange={(e) => updateConfig('notifyOnChange', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="notifyOnChange" className="text-sm text-gray-300">
                Notify on data changes
              </label>
            </div>
          </div>
        )

      case 'notification':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Message
              </label>
              <input
                type="text"
                value={action.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Notification message"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Type
              </label>
              <select
                value={action.config.type || 'info'}
                onChange={(e) => updateConfig('type', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        )

      case 'save_content':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Content Type
              </label>
              <select
                value={action.config.contentType || 'selection'}
                onChange={(e) => updateConfig('contentType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="selection">Selected Text</option>
                <option value="page">Full Page</option>
                <option value="article">Article Content</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={action.config.tags || ''}
                onChange={(e) => updateConfig('tags', e.target.value)}
                placeholder="research, important, work"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case 'custom_script':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                JavaScript Code
              </label>
              <textarea
                value={action.config.script || ''}
                onChange={(e) => updateConfig('script', e.target.value)}
                placeholder="// Your custom JavaScript code here\nconsole.log('Hello from automation!');"
                rows={6}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded p-2">
              ⚠️ Custom scripts run with page permissions. Use with caution.
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-4 text-gray-500">
            <p>Select an action type to configure</p>
          </div>
        )
    }
  }

  const selectedActionType = actionTypes.find(t => t.value === action.type)

  return (
    <div className="space-y-4">
      {/* Action Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Action Type
        </label>
        <select
          value={action.type}
          onChange={(e) => updateActionType(e.target.value as ActionType)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {actionTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {selectedActionType && (
          <p className="text-xs text-gray-400 mt-1">
            {selectedActionType.description}
          </p>
        )}
      </div>

      {/* Configuration Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Configuration
        </label>
        {renderConfigFields()}
      </div>
    </div>
  )
}