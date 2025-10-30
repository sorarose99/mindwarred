'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PerformanceMonitor, MemoryMonitor } from '../../lib/utils/performance'
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface PerformanceStats {
  [key: string]: {
    avg: number
    min: number
    max: number
    count: number
  }
}

export default function PerformanceMonitorComponent() {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState<PerformanceStats>({})
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    const monitor = PerformanceMonitor.getInstance()
    
    const updateStats = () => {
      setStats(monitor.getAllStats())
      setMemoryInfo(MemoryMonitor.getMemoryUsage())
    }

    // Update stats every 2 seconds
    const interval = setInterval(updateStats, 2000)
    updateStats() // Initial update

    return () => clearInterval(interval)
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') return null

  const formatBytes = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)} MB`
  }

  const formatTime = (ms: number) => {
    return `${ms.toFixed(2)}ms`
  }

  return (
    <>
      {/* Toggle button */}
      <motion.button
        className="fixed bottom-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
        onClick={() => setIsVisible(!isVisible)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChartBarIcon className="h-5 w-5" />
      </motion.button>

      {/* Performance panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-4 left-4 z-40 w-80 max-h-96 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Performance Monitor</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-80">
              {/* Memory Usage */}
              {memoryInfo && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Memory Usage</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used:</span>
                      <span className="text-white">{formatBytes(memoryInfo.usedJSHeapSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-white">{formatBytes(memoryInfo.totalJSHeapSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Limit:</span>
                      <span className="text-white">{formatBytes(memoryInfo.jsHeapSizeLimit)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Performance Metrics</h4>
                {Object.keys(stats).length === 0 ? (
                  <p className="text-xs text-gray-500">No metrics recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats).map(([name, stat]) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800/50 rounded p-2"
                      >
                        <div className="text-xs font-medium text-white mb-1">
                          {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Avg:</span>
                            <span className="text-green-400 ml-1">{formatTime(stat.avg)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Count:</span>
                            <span className="text-blue-400 ml-1">{stat.count}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Min:</span>
                            <span className="text-yellow-400 ml-1">{formatTime(stat.min)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Max:</span>
                            <span className="text-red-400 ml-1">{formatTime(stat.max)}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    PerformanceMonitor.getInstance().clear()
                    setStats({})
                  }}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs py-2 px-3 rounded transition-colors"
                >
                  Clear Metrics
                </button>
                <button
                  onClick={() => {
                    console.log('Performance Stats:', stats)
                    console.log('Memory Info:', memoryInfo)
                  }}
                  className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs py-2 px-3 rounded transition-colors"
                >
                  Log to Console
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Hook for component performance monitoring
export function useComponentPerformance(componentName: string) {
  const monitor = PerformanceMonitor.getInstance()

  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      monitor.recordMetric(`component_${componentName}_mount`, endTime - startTime)
    }
  }, [componentName, monitor])

  const measureRender = (renderFn: () => void) => {
    monitor.measureRender(componentName, renderFn)
  }

  const measureAsync = async <T>(operationName: string, operation: () => Promise<T>) => {
    return monitor.measureAsync(`${componentName}_${operationName}`, operation)
  }

  return { measureRender, measureAsync }
}