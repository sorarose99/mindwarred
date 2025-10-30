// Gmail Integration Tests

import { GmailIntegration } from '../../lib/integrations/gmail-integration'

// Mock Chrome APIs
const mockChrome = {
  identity: {
    launchWebAuthFlow: jest.fn()
  },
  storage: {
    local: {
      set: jest.fn(),
      get: jest.fn(),
      remove: jest.fn()
    }
  }
}

// Mock fetch
global.fetch = jest.fn()

// Mock global objects
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
})

describe('GmailIntegration', () => {
  let gmailIntegration: GmailIntegration
  let mockConfig: any

  beforeEach(() => {
    mockConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost/callback',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly']
    }

    gmailIntegration = new GmailIntegration(mockConfig)
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    test('should authenticate successfully with stored tokens', async () => {
      // Mock stored tokens
      mockChrome.storage.local.get.mockResolvedValue({
        gmail_access_token: 'stored-access-token',
        gmail_refresh_token: 'stored-refresh-token'
      })

      // Mock token verification
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ scope: 'gmail' })
      })

      const result = await gmailIntegration.authenticate()
      expect(result).toBe(true)
    })

    test('should handle authentication failure gracefully', async () => {
      // Mock no stored tokens
      mockChrome.storage.local.get.mockResolvedValue({})

      // Mock OAuth flow failure
      mockChrome.identity.launchWebAuthFlow.mockImplementation((options, callback) => {
        callback(null) // Simulate failure
      })

      const result = await gmailIntegration.authenticate()
      expect(result).toBe(false)
    })

    test('should refresh expired tokens', async () => {
      // Mock stored tokens
      mockChrome.storage.local.get.mockResolvedValue({
        gmail_access_token: 'expired-token',
        gmail_refresh_token: 'refresh-token'
      })

      // Mock token verification failure, then refresh success
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false }) // Token verification fails
        .mockResolvedValueOnce({ // Token refresh succeeds
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new-access-token'
          })
        })

      const result = await gmailIntegration.authenticate()
      expect(result).toBe(true)
    })
  })

  describe('Email Operations', () => {
    beforeEach(() => {
      // Set up authenticated state
      gmailIntegration['accessToken'] = 'test-access-token'
    })

    test('should fetch recent emails successfully', async () => {
      const mockEmailsResponse = {
        messages: [
          { id: 'msg1', threadId: 'thread1' },
          { id: 'msg2', threadId: 'thread2' }
        ]
      }

      const mockMessageDetails = {
        id: 'msg1',
        threadId: 'thread1',
        payload: {
          headers: [
            { name: 'Subject', value: 'Test Email' },
            { name: 'From', value: 'test@example.com' },
            { name: 'To', value: 'user@example.com' },
            { name: 'Date', value: new Date().toISOString() }
          ],
          body: { data: btoa('Test email content') }
        },
        snippet: 'Test email snippet',
        labelIds: ['INBOX'],
        internalDate: Date.now().toString()
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ // List messages
          ok: true,
          json: () => Promise.resolve(mockEmailsResponse)
        })
        .mockResolvedValue({ // Get message details
          ok: true,
          json: () => Promise.resolve(mockMessageDetails)
        })

      const emails = await gmailIntegration.getRecentEmails(2)
      
      expect(emails).toHaveLength(2)
      expect(emails[0]).toMatchObject({
        id: 'msg1',
        subject: 'Test Email',
        from: 'test@example.com'
      })
    })

    test('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      })

      await expect(gmailIntegration.getRecentEmails()).rejects.toThrow('Gmail API error: 403 Forbidden')
    })

    test('should summarize email content', async () => {
      const mockMessage = {
        id: 'msg1',
        payload: {
          headers: [
            { name: 'Subject', value: 'Project Update' },
            { name: 'From', value: 'colleague@company.com' }
          ],
          body: { data: btoa('This is an important project update with key information about deadlines and deliverables.') }
        },
        snippet: 'Project update snippet',
        labelIds: ['INBOX', 'IMPORTANT'],
        internalDate: Date.now().toString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessage)
      })

      const summary = await gmailIntegration.summarizeEmail('msg1')
      
      expect(summary).toMatchObject({
        emailId: 'msg1',
        urgency: 'medium', // Should be medium due to IMPORTANT label
        sentiment: expect.any(String)
      })
      expect(summary.keyPoints).toBeInstanceOf(Array)
      expect(summary.actionItems).toBeInstanceOf(Array)
    })

    test('should generate smart reply suggestions', async () => {
      const mockMessage = {
        id: 'msg1',
        payload: {
          headers: [
            { name: 'Subject', value: 'Thank you for your help' }
          ],
          body: { data: btoa('Thank you so much for your assistance with the project. It was very helpful.') }
        },
        snippet: 'Thank you message',
        labelIds: ['INBOX'],
        internalDate: Date.now().toString()
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessage)
      })

      const replies = await gmailIntegration.generateSmartReply('msg1')
      
      expect(replies).toBeInstanceOf(Array)
      expect(replies.length).toBeGreaterThan(0)
      expect(replies[0]).toContain('welcome') // Should suggest "You're welcome" for thank you emails
    })

    test('should search emails by query', async () => {
      const mockSearchResponse = {
        messages: [
          { id: 'msg1', threadId: 'thread1' }
        ]
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSearchResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'msg1',
            payload: {
              headers: [
                { name: 'Subject', value: 'Meeting Notes' }
              ],
              body: { data: btoa('Meeting content') }
            },
            snippet: 'Meeting snippet',
            labelIds: ['INBOX'],
            internalDate: Date.now().toString()
          })
        })

      const results = await gmailIntegration.searchEmails('meeting')
      
      expect(results).toHaveLength(1)
      expect(results[0].subject).toBe('Meeting Notes')
    })
  })

  describe('Connection Management', () => {
    test('should report connection status correctly', async () => {
      // Test disconnected state
      expect(await gmailIntegration.getConnectionStatus()).toBe('disconnected')

      // Test connected state
      gmailIntegration['accessToken'] = 'test-token'
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
      
      expect(await gmailIntegration.getConnectionStatus()).toBe('connected')

      // Test error state
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      
      expect(await gmailIntegration.getConnectionStatus()).toBe('error')
    })

    test('should disconnect and clear tokens', async () => {
      gmailIntegration['accessToken'] = 'test-token'

      // Mock revoke token request
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })

      await gmailIntegration.disconnect()

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(['gmail_access_token', 'gmail_refresh_token'])
      expect(gmailIntegration['accessToken']).toBeNull()
    })
  })

  describe('Service Interface', () => {
    test('should return correct service information', () => {
      expect(gmailIntegration.getServiceName()).toBe('Gmail')
      expect(gmailIntegration.getServiceIcon()).toBe('📧')
    })

    test('should check connection status', async () => {
      // Not connected
      expect(await gmailIntegration.isConnected()).toBe(false)

      // Connected
      gmailIntegration['accessToken'] = 'test-token'
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
      
      expect(await gmailIntegration.isConnected()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      gmailIntegration['accessToken'] = 'test-token'
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(gmailIntegration.getRecentEmails()).rejects.toThrow()
    })

    test('should handle malformed API responses', async () => {
      gmailIntegration['accessToken'] = 'test-token'
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      })

      const emails = await gmailIntegration.getRecentEmails()
      expect(emails).toEqual([])
    })

    test('should handle authentication errors during requests', async () => {
      gmailIntegration['accessToken'] = 'expired-token'
      gmailIntegration['refreshToken'] = 'refresh-token'

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 401 }) // First request fails
        .mockResolvedValueOnce({ // Refresh token succeeds
          ok: true,
          json: () => Promise.resolve({ access_token: 'new-token' })
        })
        .mockResolvedValueOnce({ // Retry succeeds
          ok: true,
          json: () => Promise.resolve({ messages: [] })
        })

      const emails = await gmailIntegration.getRecentEmails()
      expect(emails).toEqual([])
    })
  })

  describe('Performance', () => {
    test('should handle large email lists efficiently', async () => {
      gmailIntegration['accessToken'] = 'test-token'

      // Mock large response
      const largeResponse = {
        messages: Array.from({ length: 100 }, (_, i) => ({
          id: `msg${i}`,
          threadId: `thread${i}`
        }))
      }

      const mockMessage = {
        id: 'msg0',
        payload: {
          headers: [{ name: 'Subject', value: 'Test' }],
          body: { data: btoa('content') }
        },
        snippet: 'snippet',
        labelIds: ['INBOX'],
        internalDate: Date.now().toString()
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(largeResponse)
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockMessage)
        })

      const startTime = Date.now()
      const emails = await gmailIntegration.getRecentEmails(50)
      const endTime = Date.now()

      expect(emails.length).toBeLessThanOrEqual(50)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})