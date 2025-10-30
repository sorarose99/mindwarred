'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
  onScroll?: (scrollTop: number) => void
}

export default function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)
    
    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }))

    return {
      visibleItems,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, itemHeight, scrollTop, containerHeight, overscan])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <motion.div
              key={index}
              style={{ height: itemHeight }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {renderItem(item, index)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Optimized grid virtualization
interface VirtualizedGridProps<T> {
  items: T[]
  itemWidth: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  gap?: number
}

export function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  className = '',
  gap = 0
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const { visibleItems, totalHeight, offsetY, columnsPerRow } = useMemo(() => {
    const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap))
    const rowHeight = itemHeight + gap
    const totalRows = Math.ceil(items.length / columnsPerRow)
    const visibleRows = Math.ceil(containerHeight / rowHeight)
    
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 1)
    const endRow = Math.min(totalRows - 1, startRow + visibleRows + 2)
    
    const startIndex = startRow * columnsPerRow
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columnsPerRow - 1)
    
    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }))

    return {
      visibleItems,
      totalHeight: totalRows * rowHeight,
      offsetY: startRow * rowHeight,
      columnsPerRow
    }
  }, [items, itemWidth, itemHeight, containerWidth, containerHeight, scrollTop, gap])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsPerRow}, ${itemWidth}px)`,
            gap: `${gap}px`
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <motion.div
              key={index}
              style={{ width: itemWidth, height: itemHeight }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {renderItem(item, index)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Infinite scroll list
interface InfiniteScrollListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  loadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  className?: string
  threshold?: number
}

export function InfiniteScrollList<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoading,
  className = '',
  threshold = 200
}: InfiniteScrollListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      
      if (
        scrollHeight - scrollTop - clientHeight < threshold &&
        hasMore &&
        !isLoading &&
        !isLoadingMore
      ) {
        setIsLoadingMore(true)
        try {
          await loadMore()
        } finally {
          setIsLoadingMore(false)
        }
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, isLoadingMore, loadMore, threshold])

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
      
      {(isLoading || isLoadingMore) && (
        <div className="flex justify-center py-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"
          />
        </div>
      )}
      
      {!hasMore && items.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          No more items to load
        </div>
      )}
    </div>
  )
}