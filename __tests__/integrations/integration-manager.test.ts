// Integration Manager Tests

import { GmailIntegration } from '../../lib/integrations/gmail-integration'
import { DriveIntegration } from '../../lib/integrations/drive-integration'
import { NotionIntegration } from '../../lib/integrations/notion-integration'
import { YouTubeIntegration } from '../../lib/integrations/youtube-integration'
import { SlackIntegration } from '../../lib/integrations/slack-integration'

// Mock all integrations
jest.mock('../../lib/integrations/gmail-integration')
jest.mock('../../lib/integrations/drive-integration')
jest.mock('../../lib/integrations/notion-integration')
jest.mock('../../lib/integrations/youtube-integration')
jest.mock('../../lib/integrations/slack-integration')

// Integration Manager class for testing
class IntegrationManager {
  private integrations: Map<string, any> = new Map()

  constructor() {
    // Initialize integrations with mock configs
    this.integrations.set('gmail', new GmailIntegration({
      clientId: 'test-gmail-client',
      clientSecret: 'test-gmail-secret',
      redirectUri: 'http://localhost/gmail/callback',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly']
    }))

    this.integrations.set('drive', new DriveIntegration({
      clientId: 'test-drive-client',
      clientSecret: 'test-drive-secret',
      redirectUri: 'http://localhost/drive/callback',
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    }))

    this.integrations.set('notion', new NotionIntegration({
      clientId: 'test-notion-client',
      clientSecret: 'test-notion-secret',
      redirectUri: 'http://localhost/notion/callback'
    }))

    this.integrations.set('youtube', new YouTubeIntegration({
      apiKey: 'test-youtube-key',
      clientId: 'test-youtube-client',
      clientSecret: 'test-youtube-secret',
      redirectUri: 'http://localhost/youtube/callback'
    }))

    this.integrations.set('slack', new SlackIntegration({
      clientId: 'test-slack-client',
      clientSecret: 'test-slack-secret',
      redirectUri: 'http://localhost/slack/callback',
      scopes: ['channels:read', 'chat:write']
    }))
  }

  getIntegration(service: string) {
    return this.integrations.get(service)
  }

  async connectService(service: string): Promise<boolean> {
    const integration = this.integrations.get(service)
    if (!integration) {
      throw new Error(`Unknown service: ${service}`)
    }
    return await integration.authenticate()
  }

  async disconnectService(service: string): Promise<void> {
    const integration = this.integrations.get(service)
    if (!integration) {
      throw new Error(`Unknown service: ${service}`)
    }
    await integration.disconnect()
  }

  async getConnectionStatuses(): Promise<Record<string, string>> {
    const statuses: Record<string, string> = {}
    
    for (const [service, integration] of this.integrations) {
      try {
        statuses[service] = await integration.getConnectionStatus()
      } catch (error) {
        statuses[service] = 'error'
      }
    }
    
    return statuses
  }

  async syncAllServices(): Promise<{
    emails: any[]
    documents: any[]
    videos: any[]
    messages: any[]
  }> {
    const results = {
      emails: [],
      documents: [],
      videos: [],
      messages: []
    }

    // Sync Gmail
    const gmail = this.integrations.get('gmail')
    if (await gmail.isConnected()) {
      try {
        results.emails = await gmail.getRecentEmails(20)
      } catch (error) {
        console.error('Gmail sync failed:', error)
      }
    }

    // Sync Drive
    const drive = this.integrations.get('drive')
    if (await drive.isConnected()) {
      try {
        results.documents.push(...await drive.getRecentDocuments(20))
      } catch (error) {
        console.error('Drive sync failed:', error)
      }
    }

    // Sync Notion
    const notion = this.integrations.get('notion')
    if (await notion.isConnected()) {
      try {
        results.documents.push(...await notion.getRecentPages(20))
      } catch (error) {
        console.error('Notion sync failed:', error)
      }
    }

    // Sync YouTube
    const youtube = this.integrations.get('youtube')
    if (await youtube.isConnected()) {
      try {
        results.videos = await youtube.getTrendingVideos('US', 10)
      } catch (error) {
        console.error('YouTube sync failed:', error)
      }
    }

    // Sync Slack
    const slack = this.integrations.get('slack')
    if (await slack.isConnected()) {
      try {
        results.messages = await slack.getRecentMessages(undefined, 20)
      } catch (error) {
        console.error('Slack sync failed:', error)
      }
    }

    return results
  }

  async searchAcrossServices(query: string): Promise<{
    emails: any[]
    documents: any[]
    videos: any[]
    messages: any[]
  }> {
    const results = {
      emails: [],
      documents: [],
      videos: [],
      messages: []
    }

    const searchPromises = []

    // Search Gmail
    const gmail = this.integrations.get('gmail')
    if (await gmail.isConnected()) {
      searchPromises.push(
        gmail.searchEmails(query, 10).then((emails: any[]) => {
          results.emails = emails
        }).catch((error: any) => {
          console.error('Gmail search failed:', error)
        })
      )
    }

    // Search Drive
    const drive = this.integrations.get('drive')
    if (await drive.isConnected()) {
      searchPromises.push(
        drive.searchDocuments(query, 10).then((docs: any[]) => {
          results.documents.push(...docs)
        }).catch((error: any) => {
          console.error('Drive search failed:', error)
        })
      )
    }

    // Search Notion
    const notion = this.integrations.get('notion')
    if (await notion.isConnected()) {
      searchPromises.push(
        notion.searchPages(query, 10).then((pages: any[]) => {
          results.documents.push(...pages)
        }).catch((error: any) => {
          console.error('Notion search failed:', error)
        })
      )
    }

    // Search YouTube
    const youtube = this.integrations.get('youtube')
    if (await youtube.isConnected()) {
      searchPromises.push(
        youtube.searchVideos(query, 10).then((videos: any[]) => {
          results.videos = videos
        }).catch((error: any) => {
          console.error('YouTube search failed:', error)
        })
      )
    }

    // Search Slack
    const slack = this.integrations.get('slack')
    if (await slack.isConnected()) {
      searchPromises.push(
        slack.searchMessages(query, 10).then((messages: any[]) => {
          results.messages = messages
        }).catch((error: any) => {
          console.error('Slack search failed:', error)
        })
      )
    }

    await Promise.all(searchPromises)
    return results
  }
}

describe('IntegrationManager', () => {
  let manager: IntegrationManager

  beforeEach(() => {
    manager = new IntegrationManager()
    jest.clearAllMocks()
  })

  describe('Service Management', () => {
    test('should initialize all integrations', () => {
      expect(manager.getIntegration('gmail')).toBeInstanceOf(GmailIntegration)
      expect(manager.getIntegration('drive')).toBeInstanceOf(DriveIntegration)
      expect(manager.getIntegration('notion')).toBeInstanceOf(NotionIntegration)
      expect(manager.getIntegration('youtube')).toBeInstanceOf(YouTubeIntegration)
      expect(manager.getIntegration('slack')).toBeInstanceOf(SlackIntegration)
    })

    test('should connect to services successfully', async () => {
      const mockGmail = manager.getIntegration('gmail')
      mockGmail.authenticate.mockResolvedValue(true)

      const result = await manager.connectService('gmail')
      expect(result).toBe(true)
      expect(mockGmail.authenticate).toHaveBeenCalled()
    })

    test('should handle connection failures', async () => {
      const mockGmail = manager.getIntegration('gmail')
      mockGmail.authenticate.mockResolvedValue(false)

      const result = await manager.connectService('gmail')
      expect(result).toBe(false)
    })

    test('should disconnect from services', async () => {
      const mockGmail = manager.getIntegration('gmail')
      mockGmail.disconnect.mockResolvedValue(undefined)

      await manager.disconnectService('gmail')
      expect(mockGmail.disconnect).toHaveBeenCalled()
    })

    test('should handle unknown services', async () => {
      await expect(manager.connectService('unknown')).rejects.toThrow('Unknown service: unknown')
    })
  })

  describe('Connection Status', () => {
    test('should get connection statuses for all services', async () => {
      // Mock connection statuses
      const mockGmail = manager.getIntegration('gmail')
      const mockDrive = manager.getIntegration('drive')
      const mockNotion = manager.getIntegration('notion')
      const mockYoutube = manager.getIntegration('youtube')
      const mockSlack = manager.getIntegration('slack')

      mockGmail.getConnectionStatus.mockResolvedValue('connected')
      mockDrive.getConnectionStatus.mockResolvedValue('disconnected')
      mockNotion.getConnectionStatus.mockResolvedValue('connected')
      mockYoutube.getConnectionStatus.mockResolvedValue('connected')
      mockSlack.getConnectionStatus.mockResolvedValue('error')

      const statuses = await manager.getConnectionStatuses()

      expect(statuses).toEqual({
        gmail: 'connected',
        drive: 'disconnected',
        notion: 'connected',
        youtube: 'connected',
        slack: 'error'
      })
    })

    test('should handle errors when getting connection status', async () => {
      const mockGmail = manager.getIntegration('gmail')
      mockGmail.getConnectionStatus.mockRejectedValue(new Error('Network error'))

      const statuses = await manager.getConnectionStatuses()
      expect(statuses.gmail).toBe('error')
    })
  })

  describe('Data Synchronization', () => {
    test('should sync data from all connected services', async () => {
      // Mock all services as connected
      const mockGmail = manager.getIntegration('gmail')
      const mockDrive = manager.getIntegration('drive')
      const mockNotion = manager.getIntegration('notion')
      const mockYoutube = manager.getIntegration('youtube')
      const mockSlack = manager.getIntegration('slack')

      mockGmail.isConnected.mockResolvedValue(true)
      mockDrive.isConnected.mockResolvedValue(true)
      mockNotion.isConnected.mockResolvedValue(true)
      mockYoutube.isConnected.mockResolvedValue(true)
      mockSlack.isConnected.mockResolvedValue(true)

      // Mock data responses
      mockGmail.getRecentEmails.mockResolvedValue([{ id: 'email1', subject: 'Test Email' }])
      mockDrive.getRecentDocuments.mockResolvedValue([{ id: 'doc1', title: 'Test Doc' }])
      mockNotion.getRecentPages.mockResolvedValue([{ id: 'page1', title: 'Test Page' }])
      mockYoutube.getTrendingVideos.mockResolvedValue([{ id: 'video1', title: 'Test Video' }])
      mockSlack.getRecentMessages.mockResolvedValue([{ id: 'msg1', content: 'Test Message' }])

      const results = await manager.syncAllServices()

      expect(results.emails).toHaveLength(1)
      expect(results.documents).toHaveLength(2) // Drive + Notion
      expect(results.videos).toHaveLength(1)
      expect(results.messages).toHaveLength(1)
    })

    test('should handle sync failures gracefully', async () => {
      const mockGmail = manager.getIntegration('gmail')
      mockGmail.isConnected.mockResolvedValue(true)
      mockGmail.getRecentEmails.mockRejectedValue(new Error('API error'))

      // Other services disconnected
      const mockDrive = manager.getIntegration('drive')
      mockDrive.isConnected.mockResolvedValue(false)

      const results = await manager.syncAllServices()

      expect(results.emails).toEqual([])
      expect(results.documents).toEqual([])
    })
  })

  describe('Cross-Service Search', () => {
    test('should search across all connected services', async () => {
      // Mock all services as connected
      const mockGmail = manager.getIntegration('gmail')
      const mockDrive = manager.getIntegration('drive')
      const mockNotion = manager.getIntegration('notion')
      const mockYoutube = manager.getIntegration('youtube')
      const mockSlack = manager.getIntegration('slack')

      mockGmail.isConnected.mockResolvedValue(true)
      mockDrive.isConnected.mockResolvedValue(true)
      mockNotion.isConnected.mockResolvedValue(true)
      mockYoutube.isConnected.mockResolvedValue(true)
      mockSlack.isConnected.mockResolvedValue(true)

      // Mock search responses
      mockGmail.searchEmails.mockResolvedValue([{ id: 'email1', subject: 'AI Research' }])
      mockDrive.searchDocuments.mockResolvedValue([{ id: 'doc1', title: 'AI Paper' }])
      mockNotion.searchPages.mockResolvedValue([{ id: 'page1', title: 'AI Notes' }])
      mockYoutube.searchVideos.mockResolvedValue([{ id: 'video1', title: 'AI Tutorial' }])
      mockSlack.searchMessages.mockResolvedValue([{ id: 'msg1', content: 'AI discussion' }])

      const results = await manager.searchAcrossServices('AI')

      expect(results.emails).toHaveLength(1)
      expect(results.documents).toHaveLength(2) // Drive + Notion
      expect(results.videos).toHaveLength(1)
      expect(results.messages).toHaveLength(1)

      expect(mockGmail.searchEmails).toHaveBeenCalledWith('AI', 10)
      expect(mockDrive.searchDocuments).toHaveBeenCalledWith('AI', 10)
      expect(mockNotion.searchPages).toHaveBeenCalledWith('AI', 10)
      expect(mockYoutube.searchVideos).toHaveBeenCalledWith('AI', 10)
      expect(mockSlack.searchMessages).toHaveBeenCalledWith('AI', 10)
    })

    test('should handle search failures gracefully', async () => {
      const mockGmail = manager.getIntegration('gmail')
      mockGmail.isConnected.mockResolvedValue(true)
      mockGmail.searchEmails.mockRejectedValue(new Error('Search failed'))

      // Other services disconnected
      const mockDrive = manager.getIntegration('drive')
      mockDrive.isConnected.mockResolvedValue(false)

      const results = await manager.searchAcrossServices('test query')

      expect(results.emails).toEqual([])
      expect(results.documents).toEqual([])
    })
  })

  describe('Performance', () => {
    test('should handle concurrent operations efficiently', async () => {
      // Mock all services as connected with delayed responses
      const mockGmail = manager.getIntegration('gmail')
      const mockDrive = manager.getIntegration('drive')
      const mockNotion = manager.getIntegration('notion')

      mockGmail.isConnected.mockResolvedValue(true)
      mockDrive.isConnected.mockResolvedValue(true)
      mockNotion.isConnected.mockResolvedValue(true)

      // Add delays to simulate real API calls
      mockGmail.searchEmails.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      )
      mockDrive.searchDocuments.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 150))
      )
      mockNotion.searchPages.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 120))
      )

      const startTime = Date.now()
      await manager.searchAcrossServices('test')
      const endTime = Date.now()

      // Should complete in roughly the time of the slowest operation (150ms)
      // Plus some overhead, but much faster than sequential (370ms)
      expect(endTime - startTime).toBeLessThan(300)
    })

    test('should handle large result sets efficiently', async () => {
      const mockGmail = manager.getIntegration('gmail')
      mockGmail.isConnected.mockResolvedValue(true)

      // Mock large result set
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `email${i}`,
        subject: `Email ${i}`
      }))

      mockGmail.getRecentEmails.mockResolvedValue(largeResultSet)

      const startTime = Date.now()
      const results = await manager.syncAllServices()
      const endTime = Date.now()

      expect(results.emails).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should handle large sets quickly
    })
  })

  describe('Error Recovery', () => {
    test('should continue operation when some services fail', async () => {
      const mockGmail = manager.getIntegration('gmail')
      const mockDrive = manager.getIntegration('drive')

      mockGmail.isConnected.mockResolvedValue(true)
      mockDrive.isConnected.mockResolvedValue(true)

      // Gmail fails, Drive succeeds
      mockGmail.getRecentEmails.mockRejectedValue(new Error('Gmail API error'))
      mockDrive.getRecentDocuments.mockResolvedValue([{ id: 'doc1', title: 'Success' }])

      const results = await manager.syncAllServices()

      expect(results.emails).toEqual([])
      expect(results.documents).toHaveLength(1)
    })

    test('should handle network timeouts gracefully', async () => {
      const mockGmail = manager.getIntegration('gmail')
      mockGmail.isConnected.mockResolvedValue(true)

      // Simulate timeout
      mockGmail.getRecentEmails.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      const results = await manager.syncAllServices()
      expect(results.emails).toEqual([])
    })
  })
})