// Slack Integration Service for Kiro Web Mind

import { ServiceIntegration } from '../types/integrations'

export interface SlackConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface SlackMessage {
  type: string
  user: string
  text: string
  ts: string
  channel: string
  thread_ts?: string
  reactions?: Array<{
    name: string
    count: number
    users: string[]
  }>
  files?: Array<{
    id: string
    name: string
    mimetype: string
    url_private: string
  }>
}

export interface SlackChannel {
  id: string
  name: string
  is_channel: boolean
  is_group: boolean
  is_im: boolean
  is_mpim: boolean
  is_private: boolean
  created: number
  creator: string
  is_archived: boolean
  is_general: boolean
  unlinked: number
  name_normalized: string
  is_shared: boolean
  is_ext_shared: boolean
  is_org_shared: boolean
  pending_shared: string[]
  is_pending_ext_shared: boolean
  is_member: boolean
  is_open: boolean
  topic: {
    value: string
    creator: string
    last_set: number
  }
  purpose: {
    value: string
    creator: string
    last_set: number
  }
  num_members: number
}

export interface SlackUser {
  id: string
  team_id: string
  name: string
  deleted: boolean
  color: string
  real_name: string
  tz: string
  tz_label: string
  tz_offset: number
  profile: {
    title: string
    phone: string
    skype: string
    real_name: string
    real_name_normalized: string
    display_name: string
    display_name_normalized: string
    fields: any
    status_text: string
    status_emoji: string
    status_expiration: number
    avatar_hash: string
    image_original: string
    is_custom_image: boolean
    email: string
    first_name: string
    last_name: string
    image_24: string
    image_32: string
    image_48: string
    image_72: string
    image_192: string
    image_512: string
    image_1024: string
    status_text_canonical: string
    team: string
  }
  is_admin: boolean
  is_owner: boolean
  is_primary_owner: boolean
  is_restricted: boolean
  is_ultra_restricted: boolean
  is_bot: boolean
  is_app_user: boolean
  updated: number
  is_email_confirmed: boolean
  who_can_share_contact_card: string
}

export interface MessageContext {
  id: string
  channelId: string
  channelName: string
  author: string
  content: string
  timestamp: string
  reactions: Array<{ emoji: string; count: number }>
  mentions: string[]
  attachments: Array<{ name: string; url: string; type: string }>
  isDirectMessage: boolean
  threadId?: string
}

export class SlackIntegration implements ServiceIntegration {
  private accessToken: string | null = null
  private config: SlackConfig
  private baseUrl = 'https://slack.com/api'
  private users: Map<string, SlackUser> = new Map()
  private channels: Map<string, SlackChannel> = new Map()

  constructor(config: SlackConfig) {
    this.config = config
  }

  async authenticate(): Promise<boolean> {
    try {
      const storedToken = await this.getStoredToken()
      if (storedToken) {
        this.accessToken = storedToken
        
        if (await this.verifyToken()) {
          await this.loadWorkspaceData()
          return true
        }
      }

      return await this.initiateOAuthFlow()
    } catch (error) {
      console.error('Slack authentication failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Slack doesn't have a revoke endpoint, just clear stored token
      await this.clearStoredToken()
      this.accessToken = null
      this.users.clear()
      this.channels.clear()
    } catch (error) {
      console.error('Slack disconnect failed:', error)
    }
  }

  async getRecentMessages(channelId?: string, limit: number = 20): Promise<MessageContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Slack')
    }

    try {
      let messages: MessageContext[] = []

      if (channelId) {
        // Get messages from specific channel
        const channelMessages = await this.getChannelMessages(channelId, limit)
        messages = channelMessages
      } else {
        // Get messages from all channels
        const channels = await this.getChannels()
        for (const channel of channels.slice(0, 5)) { // Limit to 5 channels
          try {
            const channelMessages = await this.getChannelMessages(channel.id, Math.ceil(limit / 5))
            messages.push(...channelMessages)
          } catch (error) {
            console.warn(`Failed to get messages from channel ${channel.name}:`, error)
          }
        }
      }

      // Sort by timestamp and limit
      return messages
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Failed to get recent messages:', error)
      throw error
    }
  }

  async searchMessages(query: string, limit: number = 10): Promise<MessageContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Slack')
    }

    try {
      const response = await this.makeRequest('/search.messages', {
        query,
        count: limit.toString(),
        sort: 'timestamp'
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`)
      }

      const messages: MessageContext[] = []
      for (const match of response.messages?.matches || []) {
        const messageContext = await this.convertToMessageContext(match)
        if (messageContext) {
          messages.push(messageContext)
        }
      }

      return messages
    } catch (error) {
      console.error('Failed to search messages:', error)
      throw error
    }
  }

  async getChannelMessages(channelId: string, limit: number = 20): Promise<MessageContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Slack')
    }

    try {
      const response = await this.makeRequest('/conversations.history', {
        channel: channelId,
        limit: limit.toString()
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`)
      }

      const messages: MessageContext[] = []
      for (const message of response.messages || []) {
        const messageContext = await this.convertToMessageContext(message, channelId)
        if (messageContext) {
          messages.push(messageContext)
        }
      }

      return messages
    } catch (error) {
      console.error('Failed to get channel messages:', error)
      throw error
    }
  }

  async getChannels(): Promise<SlackChannel[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Slack')
    }

    try {
      const response = await this.makeRequest('/conversations.list', {
        types: 'public_channel,private_channel,mpim,im',
        exclude_archived: 'true'
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`)
      }

      // Cache channels
      response.channels?.forEach((channel: SlackChannel) => {
        this.channels.set(channel.id, channel)
      })

      return response.channels || []
    } catch (error) {
      console.error('Failed to get channels:', error)
      throw error
    }
  }

  async getUsers(): Promise<SlackUser[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Slack')
    }

    try {
      const response = await this.makeRequest('/users.list')

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`)
      }

      // Cache users
      response.members?.forEach((user: SlackUser) => {
        this.users.set(user.id, user)
      })

      return response.members || []
    } catch (error) {
      console.error('Failed to get users:', error)
      throw error
    }
  }

  async analyzeChannelActivity(channelId: string, days: number = 7): Promise<{
    messageCount: number
    activeUsers: string[]
    topTopics: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
    peakHours: number[]
  }> {
    try {
      const messages = await this.getChannelMessages(channelId, 100)
      
      // Filter messages from last N days
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const recentMessages = messages.filter(msg => 
        new Date(msg.timestamp) > cutoffDate
      )

      // Analyze activity
      const messageCount = recentMessages.length
      const activeUsers = [...new Set(recentMessages.map(msg => msg.author))]
      const topTopics = this.extractTopics(recentMessages.map(msg => msg.content).join(' '))
      const sentiment = this.analyzeSentiment(recentMessages.map(msg => msg.content).join(' '))
      const peakHours = this.analyzePeakHours(recentMessages)

      return {
        messageCount,
        activeUsers,
        topTopics,
        sentiment,
        peakHours
      }
    } catch (error) {
      console.error('Failed to analyze channel activity:', error)
      throw error
    }
  }

  async getUserActivity(userId: string, days: number = 7): Promise<{
    messageCount: number
    channelsActive: string[]
    topKeywords: string[]
    responseTime: number // average in minutes
  }> {
    try {
      // This would require searching across all channels the user is in
      // For now, return basic analysis
      const channels = await this.getChannels()
      let totalMessages = 0
      const activeChannels: string[] = []
      const allContent: string[] = []

      for (const channel of channels.slice(0, 10)) { // Limit for performance
        try {
          const messages = await this.getChannelMessages(channel.id, 50)
          const userMessages = messages.filter(msg => msg.author === userId)
          
          if (userMessages.length > 0) {
            totalMessages += userMessages.length
            activeChannels.push(channel.name)
            allContent.push(...userMessages.map(msg => msg.content))
          }
        } catch (error) {
          // Skip channels we can't access
        }
      }

      const topKeywords = this.extractTopics(allContent.join(' '))
      
      return {
        messageCount: totalMessages,
        channelsActive: activeChannels,
        topKeywords,
        responseTime: 30 // Placeholder - would need more complex analysis
      }
    } catch (error) {
      console.error('Failed to analyze user activity:', error)
      throw error
    }
  }

  private async convertToMessageContext(message: SlackMessage, channelId?: string): Promise<MessageContext | null> {
    try {
      // Get user info
      const user = this.users.get(message.user) || await this.getUser(message.user)
      const userName = user?.real_name || user?.name || message.user

      // Get channel info
      let channelName = 'Unknown'
      let isDirectMessage = false
      
      if (channelId || message.channel) {
        const channel = this.channels.get(channelId || message.channel)
        if (channel) {
          channelName = channel.name
          isDirectMessage = channel.is_im || channel.is_mpim
        }
      }

      // Extract mentions
      const mentions = this.extractMentions(message.text)

      // Convert reactions
      const reactions = (message.reactions || []).map(reaction => ({
        emoji: reaction.name,
        count: reaction.count
      }))

      // Convert attachments
      const attachments = (message.files || []).map(file => ({
        name: file.name,
        url: file.url_private,
        type: file.mimetype
      }))

      return {
        id: message.ts,
        channelId: channelId || message.channel,
        channelName,
        author: userName,
        content: message.text,
        timestamp: new Date(parseFloat(message.ts) * 1000).toISOString(),
        reactions,
        mentions,
        attachments,
        isDirectMessage,
        threadId: message.thread_ts
      }
    } catch (error) {
      console.error('Failed to convert Slack message:', error)
      return null
    }
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /<@([A-Z0-9]+)>/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      const userId = match[1]
      const user = this.users.get(userId)
      if (user) {
        mentions.push(user.real_name || user.name)
      }
    }

    return mentions
  }

  private extractTopics(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    const wordCount: Record<string, number> = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'thanks', 'awesome', 'love', 'perfect', 'amazing']
    const negativeWords = ['bad', 'terrible', 'problem', 'issue', 'error', 'wrong', 'hate', 'awful']
    
    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(w => positiveWords.includes(w)).length
    const negativeCount = words.filter(w => negativeWords.includes(w)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private analyzePeakHours(messages: MessageContext[]): number[] {
    const hourCounts: Record<number, number> = {}
    
    messages.forEach(message => {
      const hour = new Date(message.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))
  }

  private async getUser(userId: string): Promise<SlackUser | null> {
    try {
      const response = await this.makeRequest('/users.info', { user: userId })
      
      if (response.ok && response.user) {
        this.users.set(userId, response.user)
        return response.user
      }
    } catch (error) {
      console.error('Failed to get user info:', error)
    }
    
    return null
  }

  private async loadWorkspaceData(): Promise<void> {
    try {
      // Load users and channels for caching
      await Promise.all([
        this.getUsers(),
        this.getChannels()
      ])
    } catch (error) {
      console.warn('Failed to load workspace data:', error)
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    const url = new URL(`${this.baseUrl}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private async initiateOAuthFlow(): Promise<boolean> {
    const authUrl = this.buildAuthUrl()
    
    if (typeof chrome !== 'undefined' && chrome.identity) {
      return await this.chromeOAuthFlow(authUrl)
    } else {
      return await this.webOAuthFlow(authUrl)
    }
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(','),
      redirect_uri: this.config.redirectUri,
      response_type: 'code'
    })
    
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`
  }

  private async chromeOAuthFlow(authUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        async (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            resolve(false)
            return
          }
          
          const code = this.extractCodeFromUrl(responseUrl)
          if (code) {
            const success = await this.exchangeCodeForToken(code)
            resolve(success)
          } else {
            resolve(false)
          }
        }
      )
    })
  }

  private async webOAuthFlow(authUrl: string): Promise<boolean> {
    window.location.href = authUrl
    return false
  }

  private extractCodeFromUrl(url: string): string | null {
    const urlParams = new URLSearchParams(new URL(url).search)
    return urlParams.get('code')
  }

  private async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri
        })
      })

      if (!response.ok) throw new Error('Token exchange failed')

      const tokenData = await response.json()
      
      if (!tokenData.ok) {
        throw new Error(`Slack OAuth error: ${tokenData.error}`)
      }

      this.accessToken = tokenData.access_token

      await this.storeToken(tokenData.access_token)
      await this.loadWorkspaceData()
      
      return true
    } catch (error) {
      console.error('Token exchange failed:', error)
      return false
    }
  }

  private async verifyToken(): Promise<boolean> {
    if (!this.accessToken) return false

    try {
      const response = await this.makeRequest('/auth.test')
      return response.ok
    } catch (error) {
      return false
    }
  }

  private async storeToken(token: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ slack_access_token: token })
    } else {
      localStorage.setItem('slack_access_token', token)
    }
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['slack_access_token'])
        return result.slack_access_token || null
      } else {
        return localStorage.getItem('slack_access_token')
      }
    } catch (error) {
      console.error('Failed to get stored token:', error)
      return null
    }
  }

  private async clearStoredToken(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove(['slack_access_token'])
      } else {
        localStorage.removeItem('slack_access_token')
      }
    } catch (error) {
      console.error('Failed to clear stored token:', error)
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
    return 'Slack'
  }

  getServiceIcon(): string {
    return '💬'
  }
}