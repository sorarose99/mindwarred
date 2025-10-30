'use client'

import { motion } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { GraphFilters } from '../../lib/types/knowledge'

interface GraphControlsProps {
  filters: GraphFilters
  onFiltersChange: (filters: GraphFilters) => void
  onClose: () => void
}

export default function GraphControls({ filters, onFiltersChange, onClose }: GraphControlsProps) {
  const nodeTypeOptions = [
    { value: 'topic', label: 'Topics', color: 'bg-blue-500' },
    { value: 'website', label: 'Websites', color: 'bg-green-500' },
    { value: 'action', label: 'Actions', color: 'bg-red-500' },
    { value: 'preference', label: 'Preferences', color: 'bg-purple-500' }
  ]

  const handleNodeTypeToggle = (nodeType: string) => {
    const newNodeTypes = filters.nodeTypes.includes(nodeType)
      ? filters.nodeTypes.filter(type => type !== nodeType)
      : [...filters.nodeTypes, nodeType]
    
    onFiltersChange({ ...filters, nodeTypes: newNodeTypes })
  }

  const handleStrengthRangeChange = (index: number, value: number) => {
    const newRange: [number, number] = [...filters.strengthRange]
    newRange[index] = value / 100
    onFiltersChange({ ...filters, strengthRange: newRange })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute top-4 left-4 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 w-80 z-50"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Graph Controls</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Node Type Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Node Types
          </label>
          <div className="space-y-2">
            {nodeTypeOptions.map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.nodeTypes.includes(option.value)}
                  onChange={() => handleNodeTypeToggle(option.value)}
                  className="sr-only"
                />
                <div className={`
                  w-4 h-4 rounded border-2 transition-all duration-200
                  ${filters.nodeTypes.includes(option.value)
                    ? `${option.color} border-transparent`
                    : 'border-gray-500 bg-transparent'
                  }
                `}>
                  {filters.nodeTypes.includes(option.value) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Strength Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Connection Strength Range
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Minimum</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.strengthRange[0] * 100}
                onChange={(e) => handleStrengthRangeChange(0, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(filters.strengthRange[0] * 100)}%
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Maximum</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.strengthRange[1] * 100}
                onChange={(e) => handleStrengthRangeChange(1, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(filters.strengthRange[1] * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => onFiltersChange({
            nodeTypes: ['topic', 'website', 'action', 'preference'],
            strengthRange: [0, 1],
            searchQuery: ''
          })}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Reset Filters
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1F2937;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1F2937;
        }
      `}</style>
    </motion.div>
  )
}