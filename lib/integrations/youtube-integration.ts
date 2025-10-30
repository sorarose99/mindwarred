// YouTube Integration Service for Kiro Web Mind

import { ServiceIntegration } from '../types/integrations'

export interface YouTubeConfig {
  apiKey: string
  clientId?: string
  clientSecret?: string
  redirectUri?: string
}

export interface YouTubeVideo {
  id: string
  snippet: {
    title: string
    description: string
    channelTitle: string
    publishedAt: string
    thumbnails: {
      default: { url: string }
      medium: { url: string }
      high: { url: string }
    }
    tags?: string[]
    categoryId: string
  }
  statistics: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
  contentDetails: {
    duration: string
    definition: string
    caption: string
  }
}

export interface YouTubeChannel {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: {
      default: { url: string }
      medium: { url: string }
      high: { url: string }
    }
  }
  statistics: {
    subscriberCount: string
    videoCount: string
    viewCount: string
  }
}

export interface VideoContext {
  id: string
  title: string
  description: string
  duration: number
  url: string
  thumbnail: string
  channel: string
  publishedAt: string
  viewCount: number
  tags: string[]
  transcript?: string
  summary?: string
  keyMoments?: Array<{ timestamp: number; description: string }>
}

export class YouTubeIntegration implements ServiceIntegration {
  private config: YouTubeConfig
  private accessToken: string | null = null
  private baseUrl = 'https://www.googleapis.com/youtube/v3'

  constructor(config: YouTubeConfig) {
    this.config = config
  }

  async authenticate(): Promise<boolean> {
    // For YouTube, we can use API key for public data
    // OAuth is only needed for user-specific data
    if (this.config.apiKey) {
      return true
    }

    if (this.config.clientId && this.config.clientSecret) {
      try {
        const storedToken = await this.getStoredToken()
        if (storedToken) {
          this.accessToken = storedToken
          if (await this.verifyToken()) {
            return true
          }
        }

        return await this.initiateOAuthFlow()
      } catch (error) {
        console.error('YouTube authentication failed:', error)
        return false
      }
    }

    return false
  }

  async disconnect(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST'
        })
      }

      await this.clearStoredToken()
      this.accessToken = null
    } catch (error) {
      console.error('YouTube disconnect failed:', error)
    }
  }

  async searchVideos(query: string, maxResults: number = 10): Promise<VideoContext[]> {
    try {
      const response = await this.makeRequest('/search', {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        order: 'relevance'
      })

      const videoIds = response.items.map((item: any) => item.id.videoId).join(',')
      const detailsResponse = await this.makeRequest('/videos', {
        part: 'snippet,statistics,contentDetails',
        id: videoIds
      })

      return detailsResponse.items.map((video: YouTubeVideo) => 
        this.convertToVideoContext(video)
      )
    } catch (error) {
      console.error('Failed to search videos:', error)
      throw error
    }
  }

  async getVideoDetails(videoId: string): Promise<VideoContext> {
    try {
      const response = await this.makeRequest('/videos', {
        part: 'snippet,statistics,contentDetails',
        id: videoId
      })

      if (!response.items || response.items.length === 0) {
        throw new Error('Video not found')
      }

      return this.convertToVideoContext(response.items[0])
    } catch (error) {
      console.error('Failed to get video details:', error)
      throw error
    }
  }

  async getChannelVideos(channelId: string, maxResults: number = 20): Promise<VideoContext[]> {
    try {
      const response = await this.makeRequest('/search', {
        part: 'snippet',
        channelId,
        type: 'video',
        maxResults: maxResults.toString(),
        order: 'date'
      })

      const videoIds = response.items.map((item: any) => item.id.videoId).join(',')
      const detailsResponse = await this.makeRequest('/videos', {
        part: 'snippet,statistics,contentDetails',
        id: videoIds
      })

      return detailsResponse.items.map((video: YouTubeVideo) => 
        this.convertToVideoContext(video)
      )
    } catch (error) {
      console.error('Failed to get channel videos:', error)
      throw error
    }
  }

  async getTrendingVideos(regionCode: string = 'US', maxResults: number = 20): Promise<VideoContext[]> {
    try {
      const response = await this.makeRequest('/videos', {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        regionCode,
        maxResults: maxResults.toString()
      })

      return response.items.map((video: YouTubeVideo) => 
        this.convertToVideoContext(video)
      )
    } catch (error) {
      console.error('Failed to get trending videos:', error)
      throw error
    }
  }

  async getVideoTranscript(videoId: string): Promise<string | null> {
    // Note: YouTube API doesn't provide transcript access directly
    // This would require using youtube-transcript library or similar
    // For now, return null and suggest using third-party solutions
    console.warn('Video transcript not available through YouTube API')
    return null
  }

  async analyzeVideo(videoId: string): Promise<{
    summary: string
    keyTopics: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
    category: string
    recommendedFor: string[]
  }> {
    try {
      const video = await this.getVideoDetails(videoId)
      
      // Basic analysis based on title, description, and tags
      const text = `${video.title} ${video.description}`.toLowerCase()
      const keyTopics = this.extractKeywords(text)
      const sentiment = this.analyzeSentiment(text)
      const category = this.categorizeContent(video)
      
      // Generate summary from description
      const sentences = video.description.split(/[.!?]+/).filter(s => s.trim().length > 20)
      const summary = sentences.slice(0, 2).join('. ') + '.'
      
      // Generate recommendations based on content
      const recommendedFor = this.generateRecommendations(video, keyTopics)
      
      return {
        summary: summary || video.title,
        keyTopics,
        sentiment,
        category,
        recommendedFor
      }
    } catch (error) {
      console.error('Failed to analyze video:', error)
      throw error
    }
  }

  async getRelatedVideos(videoId: string, maxResults: number = 10): Promise<VideoContext[]> {
    try {
      // Get video details first to extract tags and category
      const video = await this.getVideoDetails(videoId)
      
      // Search for related videos using tags and title keywords
      const searchTerms = video.tags.slice(0, 3).join(' ') || video.title.split(' ').slice(0, 3).join(' ')
      
      return await this.searchVideos(searchTerms, maxResults)
    } catch (error) {
      console.error('Failed to get related videos:', error)
      throw error
    }
  }

  async getUserWatchHistory(): Promise<VideoContext[]> {
    // Requires OAuth authentication
    if (!this.accessToken) {
      throw new Error('OAuth authentication required for watch history')
    }

    try {
      // Note: YouTube API has limited access to watch history
      // This would require specific permissions and may not be available
      console.warn('Watch history access is limited by YouTube API')
      return []
    } catch (error) {
      console.error('Failed to get watch history:', error)
      throw error
    }
  }

  private convertToVideoContext(video: YouTubeVideo): VideoContext {
    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      duration: this.parseDuration(video.contentDetails.duration),
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      channel: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount) || 0,
      tags: video.snippet.tags || []
    }
  }

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration (PT4M13S -> 253 seconds)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    
    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    const seconds = parseInt(match[3]) || 0
    
    return hours * 3600 + minutes * 60 + seconds
  }

  private extractKeywords(text: string): string[] {
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
      .slice(0, 8)
      .map(([word]) => word)
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'best', 'perfect']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing']
    
    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(w => positiveWords.includes(w)).length
    const negativeCount = words.filter(w => negativeWords.includes(w)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private categorizeContent(video: VideoContext): string {
    const title = video.title.toLowerCase()
    const description = video.description.toLowerCase()
    const text = `${title} ${description}`
    
    const categories = {
      'Education': ['tutorial', 'learn', 'education', 'course', 'lesson', 'guide', 'how to'],
      'Entertainment': ['funny', 'comedy', 'entertainment', 'fun', 'joke', 'laugh'],
      'Technology': ['tech', 'technology', 'programming', 'code', 'software', 'computer'],
      'Music': ['music', 'song', 'album', 'artist', 'band', 'concert'],
      'Gaming': ['game', 'gaming', 'gameplay', 'player', 'stream'],
      'News': ['news', 'breaking', 'update', 'report', 'current'],
      'Lifestyle': ['lifestyle', 'vlog', 'daily', 'life', 'personal']
    }
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category
      }
    }
    
    return 'General'
  }

  private generateRecommendations(video: VideoContext, keyTopics: string[]): string[] {
    const recommendations: string[] = []
    
    // Based on duration
    if (video.duration < 300) { // < 5 minutes
      recommendations.push('Quick learners', 'Busy professionals')
    } else if (video.duration > 1800) { // > 30 minutes
      recommendations.push('Deep dive learners', 'Students')
    }
    
    // Based on content
    if (keyTopics.some(topic => ['tutorial', 'guide', 'learn'].includes(topic))) {
      recommendations.push('Beginners', 'Self-learners')
    }
    
    if (keyTopics.some(topic => ['advanced', 'expert', 'professional'].includes(topic))) {
      recommendations.push('Advanced users', 'Professionals')
    }
    
    // Based on view count
    if (video.viewCount > 1000000) {
      recommendations.push('Popular content seekers')
    }
    
    return recommendations.length > 0 ? recommendations : ['General audience']
  }

  private async makeRequest(endpoint: string, params: Record<string, string>): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Add API key or access token
    if (this.accessToken) {
      url.searchParams.append('access_token', this.accessToken)
    } else if (this.config.apiKey) {
      url.searchParams.append('key', this.config.apiKey)
    } else {
      throw new Error('No API key or access token available')
    }
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString())

    if (response.status === 401) {
      if (this.accessToken && await this.refreshAccessToken()) {
        return await this.makeRequest(endpoint, params)
      } else {
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private async initiateOAuthFlow(): Promise<boolean> {
    if (!this.config.clientId || !this.config.redirectUri) {
      return false
    }

    const authUrl = this.buildAuthUrl()
    
    if (typeof chrome !== 'undefined' && chrome.identity) {
      return await this.chromeOAuthFlow(authUrl)
    } else {
      return await this.webOAuthFlow(authUrl)
    }
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId!,
      redirect_uri: this.config.redirectUri!,
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      response_type: 'code',
      access_type: 'offline'
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
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
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId!,
          client_secret: this.config.clientSecret!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri!
        })
      })

      if (!response.ok) throw new Error('Token exchange failed')

      const tokens = await response.json()
      this.accessToken = tokens.access_token

      await this.storeToken(tokens.access_token)
      return true
    } catch (error) {
      console.error('Token exchange failed:', error)
      return false
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    // YouTube tokens don't typically need refresh for API key usage
    return false
  }

  private async verifyToken(): Promise<boolean> {
    if (!this.accessToken) return false

    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${this.accessToken}`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  private async storeToken(token: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ youtube_access_token: token })
    } else {
      localStorage.setItem('youtube_access_token', token)
    }
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['youtube_access_token'])
        return result.youtube_access_token || null
      } else {
        return localStorage.getItem('youtube_access_token')
      }
    } catch (error) {
      console.error('Failed to get stored token:', error)
      return null
    }
  }

  private async clearStoredToken(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove(['youtube_access_token'])
      } else {
        localStorage.removeItem('youtube_access_token')
      }
    } catch (error) {
      console.error('Failed to clear stored token:', error)
    }
  }

  // ServiceIntegration interface methods
  async isConnected(): Promise<boolean> {
    return this.config.apiKey !== undefined || (this.accessToken !== null && await this.verifyToken())
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
    return 'YouTube'
  }

  getServiceIcon(): string {
    return '📺'
  }
}