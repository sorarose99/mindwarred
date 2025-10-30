// Chrome extension performance optimization utilities

export class ExtensionPerformanceOptimizer {
  private static instance: ExtensionPerformanceOptimizer
  private memoryThreshold = 50 * 1024 * 1024 // 50MB
  private cleanupInterval: NodeJS.Timeout | null = null

  static getInstance(): ExtensionPerformanceOptimizer {
    if (!ExtensionPerformanceOptimizer.instance) {
      ExtensionPerformanceOptimizer.instance = new ExtensionPerformanceOptimizer()
    }
    return ExtensionPerformanceOptimizer.instance
  }

  // Initialize performance monitoring
  initialize(): void {
    this.startMemoryMonitoring()
    this.optimizeEventListeners()
    this.setupIdleDetection()
  }

  // Monitor memory usage and cleanup when needed
  private startMemoryMonitoring(): void {
    this.cleanupInterval = setInterval(() => {
      if (typeof chrome !== 'undefined' && chrome.system?.memory) {
        chrome.system.memory.getInfo((info) => {
          const usedMemory = info.capacity - info.availableCapacity
          if (usedMemory > this.memoryThreshold) {
            this.performCleanup()
          }
        })
      }
    }, 30000) // Check every 30 seconds
  }

  // Cleanup unused resources
  private performCleanup(): void {
    // Clear old cached data
    this.clearOldCache()
    
    // Remove unused DOM elements
    this.cleanupDOMElements()
    
    // Force garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc()
    }
  }

  // Clear old cached data
  private clearOldCache(): void {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      chrome.storage.local.get(null, (items) => {
        const keysToRemove: string[] = []
        
        Object.entries(items).forEach(([key, value]) => {
          if (typeof value === 'object' && value.timestamp && value.timestamp < oneWeekAgo) {
            keysToRemove.push(key)
          }
        })
        
        if (keysToRemove.length > 0) {
          chrome.storage.local.remove(keysToRemove)
        }
      })
    }
  }

  // Remove unused DOM elements
  private cleanupDOMElements(): void {
    // Remove hidden or unused Kiro elements
    const kiroElements = document.querySelectorAll('[data-kiro]')
    kiroElements.forEach((element) => {
      if (!element.isConnected || element.getAttribute('data-kiro-cleanup') === 'true') {
        element.remove()
      }
    })
  }

  // Optimize event listeners
  private optimizeEventListeners(): void {
    // Use passive listeners for better performance
    const passiveEvents = ['scroll', 'wheel', 'touchstart', 'touchmove']
    
    passiveEvents.forEach(eventType => {
      const originalAddEventListener = EventTarget.prototype.addEventListener
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (passiveEvents.includes(type) && typeof options !== 'object') {
          options = { passive: true }
        } else if (typeof options === 'object' && !options.hasOwnProperty('passive')) {
          options.passive = true
        }
        return originalAddEventListener.call(this, type, listener, options)
      }
    })
  }

  // Setup idle detection to reduce resource usage
  private setupIdleDetection(): void {
    if (typeof chrome !== 'undefined' && chrome.idle) {
      chrome.idle.setDetectionInterval(60) // 1 minute
      
      chrome.idle.onStateChanged.addListener((state) => {
        if (state === 'idle' || state === 'locked') {
          this.enterIdleMode()
        } else if (state === 'active') {
          this.exitIdleMode()
        }
      })
    }
  }

  // Reduce resource usage when idle
  private enterIdleMode(): void {
    // Pause non-critical operations
    this.pauseBackgroundTasks()
    
    // Reduce update frequency
    this.reduceUpdateFrequency()
  }

  // Resume normal operation when active
  private exitIdleMode(): void {
    // Resume background tasks
    this.resumeBackgroundTasks()
    
    // Restore normal update frequency
    this.restoreUpdateFrequency()
  }

  private pauseBackgroundTasks(): void {
    // Implementation for pausing background tasks
    document.dispatchEvent(new CustomEvent('kiro:pause-background-tasks'))
  }

  private resumeBackgroundTasks(): void {
    // Implementation for resuming background tasks
    document.dispatchEvent(new CustomEvent('kiro:resume-background-tasks'))
  }

  private reduceUpdateFrequency(): void {
    // Implementation for reducing update frequency
    document.dispatchEvent(new CustomEvent('kiro:reduce-updates'))
  }

  private restoreUpdateFrequency(): void {
    // Implementation for restoring update frequency
    document.dispatchEvent(new CustomEvent('kiro:restore-updates'))
  }

  // Cleanup on extension unload
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Debounced function factory for extension use
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

// Throttled function factory for extension use
export function createThrottledFunction<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Efficient DOM observer for extension
export class EfficientDOMObserver {
  private observer: MutationObserver | null = null
  private callbacks: Map<string, (mutations: MutationRecord[]) => void> = new Map()
  
  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this))
  }

  observe(target: Node, options: MutationObserverInit = {}): void {
    if (this.observer) {
      const defaultOptions: MutationObserverInit = {
        childList: true,
        subtree: true,
        attributes: false,
        attributeOldValue: false,
        characterData: false,
        characterDataOldValue: false,
        ...options
      }
      
      this.observer.observe(target, defaultOptions)
    }
  }

  addCallback(id: string, callback: (mutations: MutationRecord[]) => void): void {
    this.callbacks.set(id, callback)
  }

  removeCallback(id: string): void {
    this.callbacks.delete(id)
  }

  private handleMutations(mutations: MutationRecord[]): void {
    // Batch process mutations for better performance
    const batchedMutations = this.batchMutations(mutations)
    
    this.callbacks.forEach((callback) => {
      try {
        callback(batchedMutations)
      } catch (error) {
        console.error('Error in DOM observer callback:', error)
      }
    })
  }

  private batchMutations(mutations: MutationRecord[]): MutationRecord[] {
    // Remove duplicate mutations and optimize
    const uniqueMutations = new Map<string, MutationRecord>()
    
    mutations.forEach((mutation) => {
      const key = `${mutation.type}-${mutation.target}`
      if (!uniqueMutations.has(key)) {
        uniqueMutations.set(key, mutation)
      }
    })
    
    return Array.from(uniqueMutations.values())
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.callbacks.clear()
    }
  }
}

// Resource preloader for extension
export class ResourcePreloader {
  private preloadedResources: Set<string> = new Set()
  
  preloadScript(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = src
      link.onload = () => {
        this.preloadedResources.add(src)
        resolve()
      }
      link.onerror = reject
      document.head.appendChild(link)
    })
  }
  
  preloadStyle(href: string): Promise<void> {
    if (this.preloadedResources.has(href)) {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = href
      link.onload = () => {
        this.preloadedResources.add(href)
        resolve()
      }
      link.onerror = reject
      document.head.appendChild(link)
    })
  }
}