'use client'

import { memo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'
import { KnowledgeEdge } from '../../lib/types/knowledge'

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd
}: EdgeProps<KnowledgeEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const getEdgeColor = (type: string) => {
    const colors = {
      related: '#3B82F6',
      derived: '#10B981',
      similar: '#F59E0B',
      sequence: '#8B5CF6'
    }
    return colors[type as keyof typeof colors] || '#6B7280'
  }

  const getEdgeLabel = (type: string) => {
    const labels = {
      related: 'Related',
      derived: 'Derived',
      similar: 'Similar',
      sequence: 'Sequence'
    }
    return labels[type as keyof typeof labels] || ''
  }

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: getEdgeColor(data?.type || 'related'),
          strokeWidth: Math.max(1, (data?.strength || 0.5) * 4),
          opacity: 0.6 + ((data?.strength || 0.5) * 0.4)
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Edge Label */}
      {data && data.strength > 0.7 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded px-2 py-1 text-xs text-white">
              {getEdgeLabel(data.type)}
              <div className="text-gray-400">
                {Math.round(data.strength * 100)}%
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(CustomEdge)