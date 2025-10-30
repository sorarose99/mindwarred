// Gmail Integration Service for Kiro Web Mind

import { ServiceIntegration, EmailContext, EmailSummary } from '../types/integrations'

export interface GmailConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body: { data?: string; size: number }
    parts?: Array<{ body: { data?: string; size: number } }>
  }
  internalDate: string
  historyId: string
  sizeEstimate: number
}

export interface GmailThread {
  id: string
  historyId: string
  messages: GmailMessage[]
}

export class GmailIntegration implements ServiceIntegration {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private config: GmailConfig
  private baseUrl = 'https://gmail.googleapis.com/gmail/v1'

  constructor(config: GmailConfig) {
    this.config = config
  }

  async authenticate(): Promise<boolean> {
    try {
      // Check if we have stored tokens
      const storedTokens = await this.getStoredTokens()
      if (storedTokens.accessToken && storedTokens.refreshToken) {
        this.accessToken = storedTokens.accessToken
        this.refreshToken = storedTokens.refreshToken
        
        // Verify token is still valid
        if (await this.verifyToken()) {
          return true
        }
      }

      // Start OAuth flow
      return await this.initiateOAuthFlow()
    } catch (error) {
      console.error('Gmail authentication failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Revoke tokens
      if (this.accessToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST'
        })
      }

      // Clear stored tokens
      await this.clearStoredTokens()
      this.accessToken = null
      this.refreshToken = null
    } catch (error) {
      console.error('Gmail disconnect failed:', error)
    }
  }

  async getRecentEmails(maxResults: number = 20): Promise<EmailContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Gmail')
    }

    try {
      // Get list of messages
      const listResponse = await this.makeAuthenticatedRequest(
        `/users/me/messages?maxResults=${maxResults}&q=in:inbox`
      )

      if (!listResponse.messages) {
        return []
      }

      // Get full message details
      const emails: EmailContext[] = []
      for (const messageRef of listResponse.messages.slice(0, maxResults)) {
        try {
          const message = await this.getMessage(messageRef.id)
          const emailContext = this.convertToEmailContext(message)
          if (emailContext) {
            emails.push(emailContext)
          }
        } catch (error) {
          console.warn(`Failed to fetch message ${messageRef.id}:`, error)
        }
      }

      return emails
    } catch (error) {
      console.error('Failed to get recent emails:', error)
      throw error
    }
  }

  async summarizeEmail(emailId: string): Promise<EmailSummary> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Gmail')
    }

    try {
      const message = await this.getMessage(emailId)
      const emailContext = this.convertToEmailContext(message)
      
      if (!emailContext) {
        throw new Error('Failed to parse email')
      }

      // Use AI service to generate summary
      const summary = await this.generateEmailSummary(emailContext)
      return summary
    } catch (error) {
      console.error('Failed to summarize email:', error)
      throw error
    }
  }

  async generateSmartReply(emailId: string, context?: string): Promise<string[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Gmail')
    }

    try {
      const message = await this.getMessage(emailId)
      const emailContext = this.convertToEmailContext(message)
      
      if (!emailContext) {
        throw new Error('Failed to parse email')
      }

      // Generate smart reply suggestions
      const replies = await this.generateReplySuggestions(emailContext, context)
      return replies
    } catch (error) {
      console.error('Failed to generate smart reply:', error)
      throw error
    }
  }

  async searchEmails(query: string, maxResults: number = 10): Promise<EmailContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Gmail')
    }

    try {
      const encodedQuery = encodeURIComponent(query)
      const listResponse = await this.makeAuthenticatedRequest(
        `/users/me/messages?maxResults=${maxResults}&q=${encodedQuery}`
      )

      if (!listResponse.messages) {
        return []
      }

      const emails: EmailContext[] = []
      for (const messageRef of listResponse.messages) {
        try {
          const message = await this.getMessage(messageRef.id)
          const emailContext = this.convertToEmailContext(message)
          if (emailContext) {
            emails.push(emailContext)
          }
        } catch (error) {
          console.warn(`Failed to fetch message ${messageRef.id}:`, error)
        }
      }

      return emails
    } catch (error) {
      console.error('Failed to search emails:', error)
      throw error
    }
  }

  async getEmailThread(threadId: string): Promise<EmailContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Gmail')
    }

    try {
      const thread = await this.makeAuthenticatedRequest(`/users/me/threads/${threadId}`)
      
      const emails: EmailContext[] = []
      for (const message of thread.messages) {
        const emailContext = this.convertToEmailContext(message)
        if (emailContext) {
          emails.push(emailContext)
        }
      }

      return emails
    } catch (error) {
      console.error('Failed to get email thread:', error)
      throw error
    }
  }

  private async getMessage(messageId: string): Promise<GmailMessage> {
    return await this.makeAuthenticatedRequest(`/users/me/messages/${messageId}`)
  }

  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 401) {
      // Token expired, try to refresh
      if (await this.refreshAccessToken()) {
        // Retry the request
        return await this.makeAuthenticatedRequest(endpoint)
      } else {
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private convertToEmailContext(message: GmailMessage): EmailContext | null {
    try {
      const headers = message.payload.headers
      const getHeader = (name: string) => 
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const to = getHeader('To')
      const date = getHeader('Date')
      
      // Extract email body
      let body = ''
      if (message.payload.body.data) {
        body = this.decodeBase64Url(message.payload.body.data)
      } else if (message.payload.parts) {
        // Multi-part message, find text/plain part
        const textPart = message.payload.parts.find(part => 
          part.body.data && part.body.size > 0
        )
        if (textPart?.body.data) {
          body = this.decodeBase64Url(textPart.body.data)
        }
      }

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date: new Date(date).toISOString(),
        body: body || message.snippet,
        snippet: message.snippet,
        labels: message.labelIds || [],
        isRead: !message.labelIds.includes('UNREAD'),
        isImportant: message.labelIds.includes('IMPORTANT'),
        timestamp: parseInt(message.internalDate)
      }
    } catch (error) {
      console.error('Failed to convert Gmail message:', error)
      return null
    }
  }

  private decodeBase64Url(data: string): string {
    try {
      // Convert base64url to base64
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
      // Decode base64
      return atob(base64)
    } catch (error) {
      console.error('Failed to decode base64url:', error)
      return ''
    }
  }

  private async generateEmailSummary(email: EmailContext): Promise<EmailSummary> {
    // This would integrate with the AI service
    // For now, return a basic summary
    const wordCount = email.body.split(' ').length
    const readingTime = Math.ceil(wordCount / 200) // Assume 200 words per minute
    
    return {
      id: `summary_${email.id}`,
      emailId: email.id,
      summary: email.snippet || email.body.substring(0, 200) + '...',
      keyPoints: this.extractKeyPoints(email.body),
      sentiment: this.analyzeSentiment(email.body),
      urgency: this.assessUrgency(email),
      actionItems: this.extractActionItems(email.body),
      readingTime,
      confidence: 0.8,
      timestamp: Date.now()
    }
  }

  private extractKeyPoints(text: string): string[] {
    // Simple key point extraction
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
    return sentences.slice(0, 3).map(s => s.trim())
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'thank', 'please', 'appreciate']
    const negativeWords = ['bad', 'terrible', 'urgent', 'problem', 'issue', 'error']
    
    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(w => positiveWords.includes(w)).length
    const negativeCount = words.filter(w => negativeWords.includes(w)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private assessUrgency(email: EmailContext): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'emergency']
    const text = (email.subject + ' ' + email.body).toLowerCase()
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      return 'high'
    }
    
    if (email.isImportant) {
      return 'medium'
    }
    
    return 'low'
  }

  private extractActionItems(text: string): string[] {
    // Simple action item extraction
    const actionPatterns = [
      /please\s+([^.!?]+)/gi,
      /can\s+you\s+([^.!?]+)/gi,
      /need\s+to\s+([^.!?]+)/gi,
      /should\s+([^.!?]+)/gi
    ]
    
    const actionItems: string[] = []
    for (const pattern of actionPatterns) {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 5) {
          actionItems.push(match[1].trim())
        }
      }
    }
    
    return actionItems.slice(0, 5) // Limit to 5 action items
  }

  private async generateReplySuggestions(email: EmailContext, context?: string): Promise<string[]> {
    // Simple reply generation based on email content
    const suggestions: string[] = []
    
    // Analyze email content for appropriate responses
    const text = email.body.toLowerCase()
    
    if (text.includes('thank')) {
      suggestions.push("You're welcome! Let me know if you need anything else.")
    }
    
    if (text.includes('question') || text.includes('?')) {
      suggestions.push("Thanks for your question. I'll look into this and get back to you.")
    }
    
    if (text.includes('meeting') || text.includes('schedule')) {
      suggestions.push("I'll check my calendar and confirm the meeting time.")
    }
    
    if (text.includes('urgent') || text.includes('asap')) {
      suggestions.push("I understand this is urgent. I'll prioritize this and respond shortly.")
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        "Thanks for your email. I'll review this and get back to you.",
        "I appreciate you reaching out. Let me look into this.",
        "Thank you for the information. I'll follow up soon."
      )
    }
    
    return suggestions.slice(0, 3)
  }

  private async initiateOAuthFlow(): Promise<boolean> {
    const authUrl = this.buildAuthUrl()
    
    // In a Chrome extension, we'd use chrome.identity.launchWebAuthFlow
    // For web app, we'd redirect to the auth URL
    if (typeof chrome !== 'undefined' && chrome.identity) {
      return await this.chromeOAuthFlow(authUrl)
    } else {
      return await this.webOAuthFlow(authUrl)
    }
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  private async chromeOAuthFlow(authUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true
        },
        async (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            resolve(false)
            return
          }
          
          const code = this.extractCodeFromUrl(responseUrl)
          if (code) {
            const success = await this.exchangeCodeForTokens(code)
            resolve(success)
          } else {
            resolve(false)
          }
        }
      )
    })
  }

  private async webOAuthFlow(authUrl: string): Promise<boolean> {
    // For web applications, redirect to auth URL
    window.location.href = authUrl
    return false // Will complete after redirect
  }

  private extractCodeFromUrl(url: string): string | null {
    const urlParams = new URLSearchParams(new URL(url).search)
    return urlParams.get('code')
  }

  private async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri
        })
      })

      if (!response.ok) {
        throw new Error('Token exchange failed')
      }

      const tokens = await response.json()
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token

      // Store tokens securely
      await this.storeTokens(tokens)
      
      return true
    } catch (error) {
      console.error('Token exchange failed:', error)
      return false
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const tokens = await response.json()
      this.accessToken = tokens.access_token
      
      // Update stored tokens
      await this.storeTokens({ ...tokens, refresh_token: this.refreshToken })
      
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  private async verifyToken(): Promise<boolean> {
    if (!this.accessToken) {
      return false
    }

    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${this.accessToken}`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  private async storeTokens(tokens: any): Promise<void> {
    // Store tokens securely (implementation depends on environment)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token
      })
    } else {
      // For web app, use secure storage
      localStorage.setItem('gmail_tokens', JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      }))
    }
  }

  private async getStoredTokens(): Promise<{ accessToken?: string; refreshToken?: string }> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['gmail_access_token', 'gmail_refresh_token'])
        return {
          accessToken: result.gmail_access_token,
          refreshToken: result.gmail_refresh_token
        }
      } else {
        const stored = localStorage.getItem('gmail_tokens')
        if (stored) {
          const tokens = JSON.parse(stored)
          return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token
          }
        }
      }
    } catch (error) {
      console.error('Failed to get stored tokens:', error)
    }
    
    return {}
  }

  private async clearStoredTokens(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove(['gmail_access_token', 'gmail_refresh_token'])
      } else {
        localStorage.removeItem('gmail_tokens')
      }
    } catch (error) {
      console.error('Failed to clear stored tokens:', error)
    }
  }

  // ServiceIntegration interface methods
  async isConnected(): Promise<boolean> {
    return this.accessToken !== null && await this.verifyToken()
  }

  async getConnectionStatus(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      if (await this.isConnected()) {
        return 'connected'
      } else {
        return 'disconnected'
      }
    } catch (error) {
      return 'error'
    }
  }

  getServiceName(): string {
    return 'Gmail'
  }

  getServiceIcon(): string {
    return '📧'
  }
}