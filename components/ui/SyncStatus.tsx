// Reusable sync status component
import { motion } from 'framer-motion'
import { 
  WifiIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline'
import type { SyncStatus as SyncStatusType } from '../../lib/sync/sync-manager'

interface SyncStatusProps {
  syncStatus: SyncStatusType | null
  showDetails?: boolean
  onRefresh?: () => void
}

export default function SyncStatus({ syncStatus, showDetails = false, onRefresh }: SyncStatusProps) {
  if (!syncStatus) return null

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'red'
    if (syncStatus.pendingOperations > 0 || syncStatus.unsyncedItems > 0) return 'yellow'
    return 'green'
  }

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline'
    if (syncStatus.pendingOperations > 0) return 'Syncing...'
    if (syncStatus.unsyncedItems > 0) return 'Pending sync'
    return 'Synced'
  }

  const statusColor = getStatusColor()
  const statusText = getStatusText()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2"
    >
      {/* Main Status Indicator */}
      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
        statusColor === 'green' 
          ? 'bg-green-900/30 text-green-400 border border-green-800/50' 
          : statusColor === 'yellow'
          ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
          : 'bg-red-900/30 text-red-400 border border-red-800/50'
      }`}>
        {statusColor === 'green' ? (
          <CheckCircleIcon className="h-3 w-3" />
        ) : statusColor === 'yellow' ? (
          <ArrowPathIcon className="h-3 w-3 animate-spin" />
        ) : (
          <WifiIcon className="h-3 w-3" />
        )}
        <span className="font-medium">{statusText}</span>
      </div>

      {/* Detailed Status */}
      {showDetails && (
        <>
          {/* Pending Operations */}
          {syncStatus.pendingOperations > 0 && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/50">
              <ArrowPathIcon className="h-3 w-3" />
              <span>{syncStatus.pendingOperations} pending</span>
            </div>
          )}

          {/* Unsynced Items */}
          {syncStatus.unsyncedItems > 0 && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-900/30 text-orange-400 border border-orange-800/50">
              <ExclamationTriangleIcon className="h-3 w-3" />
              <span>{syncStatus.unsyncedItems} unsynced</span>
            </div>
          )}

          {/* Last Sync Time */}
          {syncStatus.lastSyncTime && (
            <div className="text-xs text-gray-500">
              Last sync: {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
            </div>
          )}
        </>
      )}

      {/* Refresh Button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-1 rounded-md hover:bg-gray-800/50 transition-colors"
          title="Refresh data"
        >
          <ArrowPathIcon className="h-4 w-4 text-gray-400 hover:text-gray-300" />
        </button>
      )}
    </motion.div>
  )
}

// Compact version for smaller spaces
export function CompactSyncStatus({ syncStatus }: { syncStatus: SyncStatusType | null }) {
  if (!syncStatus) return null

  const isHealthy = syncStatus.isOnline && 
                   syncStatus.pendingOperations === 0 && 
                   syncStatus.unsyncedItems === 0

  return (
    <div className={`w-2 h-2 rounded-full ${
      isHealthy ? 'bg-green-400' : 'bg-yellow-400'
    }`} title={isHealthy ? 'All synced' : 'Sync in progress'} />
  )
}