// Google Drive Integration Service for Kiro Web Mind

import { ServiceIntegration, DocumentContext } from '../types/integrations'

export interface DriveConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  parents?: string[]
  createdTime: string
  modifiedTime: string
  size?: string
  webViewLink: string
  webContentLink?: string
  owners: Array<{ displayName: string; emailAddress: string }>
  permissions?: Array<{ role: string; type: string; emailAddress?: string }>
  description?: string
  starred: boolean
  trashed: boolean
}

export class DriveIntegration implements ServiceIntegration {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private config: DriveConfig
  private baseUrl = 'https://www.googleapis.com/drive/v3'

  constructor(config: DriveConfig) {
    this.config = config
  }

  async authenticate(): Promise<boolean> {
    try {
      const storedTokens = await this.getStoredTokens()
      if (storedTokens.accessToken && storedTokens.refreshToken) {
        this.accessToken = storedTokens.accessToken
        this.refreshToken = storedTokens.refreshToken
        
        if (await this.verifyToken()) {
          return true
        }
      }

      return await this.initiateOAuthFlow()
    } catch (error) {
      console.error('Drive authentication failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST'
        })
      }

      await this.clearStoredTokens()
      this.accessToken = null
      this.refreshToken = null
    } catch (error) {
      console.error('Drive disconnect failed:', error)
    }
  }

  async getRecentDocuments(maxResults: number = 20): Promise<DocumentContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive')
    }

    try {
      const query = "mimeType='application/vnd.google-apps.document' or " +
                   "mimeType='application/vnd.google-apps.spreadsheet' or " +
                   "mimeType='application/vnd.google-apps.presentation' or " +
                   "mimeType='application/pdf' or " +
                   "mimeType contains 'text/'"

      const response = await this.makeAuthenticatedRequest(
        `/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&pageSize=${maxResults}&fields=files(id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,size,description,starred)`
      )

      const documents: DocumentContext[] = []
      for (const file of response.files || []) {
        const docContext = await this.convertToDocumentContext(file)
        if (docContext) {
          documents.push(docContext)
        }
      }

      return documents
    } catch (error) {
      console.error('Failed to get recent documents:', error)
      throw error
    }
  }

  async searchDocuments(query: string, maxResults: number = 10): Promise<DocumentContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive')
    }

    try {
      const searchQuery = `fullText contains '${query}' and (mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.google-apps.presentation')`
      
      const response = await this.makeAuthenticatedRequest(
        `/files?q=${encodeURIComponent(searchQuery)}&pageSize=${maxResults}&fields=files(id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,size,description)`
      )

      const documents: DocumentContext[] = []
      for (const file of response.files || []) {
        const docContext = await this.convertToDocumentContext(file)
        if (docContext) {
          documents.push(docContext)
        }
      }

      return documents
    } catch (error) {
      console.error('Failed to search documents:', error)
      throw error
    }
  }

  async getDocumentContent(fileId: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive')
    }

    try {
      // Get file metadata first
      const fileInfo = await this.makeAuthenticatedRequest(`/files/${fileId}?fields=mimeType,name`)
      
      let exportMimeType = 'text/plain'
      if (fileInfo.mimeType === 'application/vnd.google-apps.document') {
        exportMimeType = 'text/plain'
      } else if (fileInfo.mimeType === 'application/vnd.google-apps.spreadsheet') {
        exportMimeType = 'text/csv'
      } else if (fileInfo.mimeType === 'application/vnd.google-apps.presentation') {
        exportMimeType = 'text/plain'
      }

      // Export the content
      const response = await fetch(
        `${this.baseUrl}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to export document: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.error('Failed to get document content:', error)
      throw error
    }
  }

  async analyzeDocument(fileId: string): Promise<{
    summary: string
    keyTopics: string[]
    wordCount: number
    readingTime: number
  }> {
    try {
      const content = await this.getDocumentContent(fileId)
      
      // Basic analysis
      const words = content.split(/\s+/).filter(word => word.length > 0)
      const wordCount = words.length
      const readingTime = Math.ceil(wordCount / 200) // 200 words per minute
      
      // Extract key topics (simple keyword extraction)
      const keyTopics = this.extractKeywords(content)
      
      // Generate summary (first few sentences)
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
      const summary = sentences.slice(0, 3).join('. ') + '.'
      
      return {
        summary,
        keyTopics,
        wordCount,
        readingTime
      }
    } catch (error) {
      console.error('Failed to analyze document:', error)
      throw error
    }
  }

  async getFolderContents(folderId: string): Promise<DocumentContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive')
    }

    try {
      const response = await this.makeAuthenticatedRequest(
        `/files?q='${folderId}' in parents&fields=files(id,name,mimeType,modifiedTime,createdTime,owners,webViewLink,size,description)`
      )

      const documents: DocumentContext[] = []
      for (const file of response.files || []) {
        const docContext = await this.convertToDocumentContext(file)
        if (docContext) {
          documents.push(docContext)
        }
      }

      return documents
    } catch (error) {
      console.error('Failed to get folder contents:', error)
      throw error
    }
  }

  private async convertToDocumentContext(file: DriveFile): Promise<DocumentContext | null> {
    try {
      let type: DocumentContext['type'] = 'document'
      
      switch (file.mimeType) {
        case 'application/vnd.google-apps.document':
          type = 'document'
          break
        case 'application/vnd.google-apps.spreadsheet':
          type = 'spreadsheet'
          break
        case 'application/vnd.google-apps.presentation':
          type = 'presentation'
          break
        default:
          type = 'document'
      }

      // Get content preview for analysis
      let content = ''
      try {
        content = await this.getDocumentContent(file.id)
      } catch (error) {
        // If we can't get content, use description or name
        content = file.description || file.name
      }

      return {
        id: file.id,
        title: file.name,
        content: content.substring(0, 5000), // Limit content size
        type,
        source: 'drive',
        url: file.webViewLink,
        lastModified: file.modifiedTime,
        author: file.owners?.[0]?.displayName || 'Unknown',
        tags: this.extractTags(file.name, content),
        metadata: {
          mimeType: file.mimeType,
          size: file.size,
          starred: file.starred,
          createdTime: file.createdTime,
          owners: file.owners
        }
      }
    } catch (error) {
      console.error('Failed to convert Drive file:', error)
      return null
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    // Count word frequency
    const wordCount: Record<string, number> = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    // Get top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private extractTags(filename: string, content: string): string[] {
    const tags: string[] = []
    
    // Extract from filename
    const filenameParts = filename.toLowerCase().split(/[\s\-_\.]+/)
    tags.push(...filenameParts.filter(part => part.length > 2))
    
    // Extract from content (simple approach)
    const contentWords = content.toLowerCase().match(/\b\w{4,}\b/g) || []
    const commonWords = contentWords
      .reduce((acc: Record<string, number>, word) => {
        acc[word] = (acc[word] || 0) + 1
        return acc
      }, {})
    
    const topWords = Object.entries(commonWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
    
    tags.push(...topWords)
    
    return [...new Set(tags)].slice(0, 10) // Remove duplicates and limit
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
      if (await this.refreshAccessToken()) {
        return await this.makeAuthenticatedRequest(endpoint)
      } else {
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      throw new Error(`Drive API error: ${response.status} ${response.statusText}`)
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
        { url: authUrl, interactive: true },
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
    window.location.href = authUrl
    return false
  }

  private extractCodeFromUrl(url: string): string | null {
    const urlParams = new URLSearchParams(new URL(url).search)
    return urlParams.get('code')
  }

  private async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri
        })
      })

      if (!response.ok) throw new Error('Token exchange failed')

      const tokens = await response.json()
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token

      await this.storeTokens(tokens)
      return true
    } catch (error) {
      console.error('Token exchange failed:', error)
      return false
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) throw new Error('Token refresh failed')

      const tokens = await response.json()
      this.accessToken = tokens.access_token
      
      await this.storeTokens({ ...tokens, refresh_token: this.refreshToken })
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
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

  private async storeTokens(tokens: any): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        drive_access_token: tokens.access_token,
        drive_refresh_token: tokens.refresh_token
      })
    } else {
      localStorage.setItem('drive_tokens', JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      }))
    }
  }

  private async getStoredTokens(): Promise<{ accessToken?: string; refreshToken?: string }> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['drive_access_token', 'drive_refresh_token'])
        return {
          accessToken: result.drive_access_token,
          refreshToken: result.drive_refresh_token
        }
      } else {
        const stored = localStorage.getItem('drive_tokens')
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
        await chrome.storage.local.remove(['drive_access_token', 'drive_refresh_token'])
      } else {
        localStorage.removeItem('drive_tokens')
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
    return 'Google Drive'
  }

  getServiceIcon(): string {
    return '📁'
  }
}