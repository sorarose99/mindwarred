'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { motion } from 'framer-motion'
import { 
  GlobeAltIcon,
  BookOpenIcon,
  BoltIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { KnowledgeNode } from '../../lib/types/knowledge'

interface CustomNodeData extends KnowledgeNode {
  onClick?: () => void
  onDoubleClick?: () => void
}

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const getIcon = (type: string) => {
    const iconProps = { className: "h-4 w-4" }
    
    switch (type) {
      case 'website':
        return <GlobeAltIcon {...iconProps} />
      case 'topic':
        return <BookOpenIcon {...iconProps} />
      case 'action':
        return <BoltIcon {...iconProps} />
      case 'preference':
        return <CogIcon {...iconProps} />
      default:
        return <BookOpenIcon {...iconProps} />
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      topic: 'text-blue-400',
      website: 'text-green-400',
      action: 'text-red-400',
      preference: 'text-purple-400'
    }
    return colors[type as keyof typeof colors] || 'text-gray-400'
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'bg-green-500'
    if (strength >= 0.6) return 'bg-yellow-500'
    if (strength >= 0.4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative bg-gray-800/90 backdrop-blur-sm border-2 rounded-xl p-3 min-w-32 cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:shadow-black/20
        ${selected 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
          : 'border-gray-600/50 hover:border-gray-500/70'
        }
      `}
      onClick={data.onClick}
      onDoubleClick={data.onDoubleClick}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-gray-600 border-2 border-gray-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-gray-600 border-2 border-gray-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-gray-600 border-2 border-gray-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-gray-600 border-2 border-gray-400"
      />

      {/* Node Content */}
      <div className="flex items-start gap-2">
        <div className={`flex-shrink-0 ${getTypeColor(data.type)}`}>
          {getIcon(data.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {data.label}
          </h4>
          
          {data.data?.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {data.data.description}
            </p>
          )}
          
          {/* Strength Indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-gray-700 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${getStrengthColor(data.strength)}`}
                style={{ width: `${data.strength * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {Math.round(data.strength * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Connection Count Badge */}
      {data.connections.length > 0 && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {data.connections.length}
        </div>
      )}

      {/* Frequency Indicator */}
      {data.data?.frequency && data.data.frequency > 5 && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
      )}
    </motion.div>
  )
}

export default memo(CustomNode)