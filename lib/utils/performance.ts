// Performance monitoring and optimization utilities

// Performance metrics collection
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void): void {
    const start = performance.now()
    renderFn()
    const end = performance.now()
    this.recordMetric(`render_${componentName}`, end - start)
  }

  // Measure async operations
  async measureAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await operation()
      const end = performance.now()
      this.recordMetric(operationName, end - start)
      return result
    } catch (error) {
      const end = performance.now()
      this.recordMetric(`${operationName}_error`, end - start)
      throw error
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 100 measurements to prevent memory leaks
    if (values.length > 100) {
      values.shift()
    }
  }

  // Get performance statistics
  getStats(metricName: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(metricName)
    if (!values || values.length === 0) return null

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg, min, max, count: values.length }
  }

  // Get all metrics
  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, any> = {}
    for (const [name] of this.metrics) {
      const stat = this.getStats(name)
      if (stat) {
        stats[name] = stat
      }
    }
    return stats
  }

  // Clear metrics
  clear(): void {
    this.metrics.clear()
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory
    }
    return null
  }

  static logMemoryUsage(label: string): void {
    const memory = this.getMemoryUsage()
    if (memory) {
      console.log(`[${label}] Memory Usage:`, {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
      })
    }
  }

  static isMemoryPressureHigh(): boolean {
    const memory = this.getMemoryUsage()
    if (!memory) return false
    
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit
    return usageRatio > 0.8 // Consider high if using more than 80% of available memory
  }
}

// Image optimization utilities
export function optimizeImageLoading(img: HTMLImageElement): void {
  // Add loading="lazy" for better performance
  img.loading = 'lazy'
  
  // Add decoding="async" for non-blocking image decoding
  img.decoding = 'async'
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Bundle size analyzer (development only)
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    // Log loaded modules for bundle analysis
    const modules = Object.keys(require.cache || {})
    console.log('Loaded modules:', modules.length)
    
    // Group by directory for better analysis
    const modulesByDir = modules.reduce((acc, module) => {
      const dir = module.split('/').slice(0, -1).join('/')
      if (!acc[dir]) acc[dir] = 0
      acc[dir]++
      return acc
    }, {} as Record<string, number>)
    
    console.table(modulesByDir)
  }
}

// Performance timing utilities
export function measurePageLoad(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      console.log('Page Load Performance:', {
        'DNS Lookup': `${navigation.domainLookupEnd - navigation.domainLookupStart}ms`,
        'TCP Connection': `${navigation.connectEnd - navigation.connectStart}ms`,
        'Request/Response': `${navigation.responseEnd - navigation.requestStart}ms`,
        'DOM Processing': `${navigation.domContentLoadedEventEnd - navigation.responseEnd}ms`,
        'Total Load Time': `${navigation.loadEventEnd - navigation.navigationStart}ms`
      })
    })
  }
}

// React performance hooks
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    measureRender: (renderFn: () => void) => monitor.measureRender(componentName, renderFn),
    measureAsync: <T>(operationName: string, operation: () => Promise<T>) => 
      monitor.measureAsync(`${componentName}_${operationName}`, operation),
    getStats: () => monitor.getStats(`render_${componentName}`)
  }
}