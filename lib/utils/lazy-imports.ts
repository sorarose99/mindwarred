// Lazy loading utilities for better performance
import { lazy } from 'react'

// Dashboard components
export const KnowledgeGraph = lazy(() => import('../../components/knowledge/KnowledgeGraph'))
export const AutomationBuilder = lazy(() => import('../../components/automation/AutomationBuilder'))
export const AutomationList = lazy(() => import('../../components/automation/AutomationList'))
export const VoiceInterface = lazy(() => import('../../components/voice/VoiceInterface'))

// Dashboard pages
export const AnalyticsPage = lazy(() => import('../../app/dashboard/analytics/page'))
export const KnowledgePage = lazy(() => import('../../app/dashboard/knowledge/page'))
export const AutomationsPage = lazy(() => import('../../app/dashboard/automations/page'))

// Heavy components that should be loaded on demand
export const AnimationsDemo = lazy(() => import('../../app/demo/animations/page'))

// Utility function to create a loading wrapper
export function createLoadingWrapper<T extends Record<string, any>>(
  Component: React.LazyExoticComponent<React.ComponentType<T>>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <React.Suspense fallback={fallback || <div>Loading...</div>}>
        <Component {...props} />
      </React.Suspense>
    )
  }
}

// Pre-defined loading components for different use cases
export const ComponentLoadingFallback = () => (
  <div className="flex items-center justify-center py-8">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  </div>
)

export const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="flex gap-1 justify-center mb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <p className="text-gray-400">Loading page...</p>
    </div>
  </div>
)

export const CardLoadingFallback = () => (
  <div className="rounded-xl border border-gray-800/50 p-6 bg-gray-900/30 backdrop-blur-sm">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
)