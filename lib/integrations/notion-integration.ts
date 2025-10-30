// Notion Integration Service for Kiro Web Mind

import { ServiceIntegration, DocumentContext } from '../types/integrations'

export interface NotionConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface NotionPage {
  id: string
  created_time: string
  last_edited_time: string
  created_by: { id: string }
  last_edited_by: { id: string }
  cover?: { type: string; url?: string }
  icon?: { type: string; emoji?: string; url?: string }
  parent: { type: string; database_id?: string; page_id?: string }
  archived: boolean
  properties: Record<string, any>
  url: string
}

export interface NotionDatabase {
  id: string
  title: Array<{ plain_text: string }>
  description: Array<{ plain_text: string }>
  created_time: string
  last_edited_time: string
  properties: Record<string, any>
  url: string
}

export interface NotionBlock {
  id: string
  type: string
  created_time: string
  last_edited_time: string
  has_children: boolean
  [key: string]: any // Block-specific properties
}

export class NotionIntegration implements ServiceIntegration {
  private accessToken: string | null = null
  private config: NotionConfig
  private baseUrl = 'https://api.notion.com/v1'
  private version = '2022-06-28'

  constructor(config: NotionConfig) {
    this.config = config
  }

  async authenticate(): Promise<boolean> {
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
      console.error('Notion authentication failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Notion doesn't have a revoke endpoint, just clear stored token
      await this.clearStoredToken()
      this.accessToken = null
    } catch (error) {
      console.error('Notion disconnect failed:', error)
    }
  }

  async getRecentPages(maxResults: number = 20): Promise<DocumentContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Notion')
    }

    try {
      const response = await this.makeAuthenticatedRequest('/search', {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            value: 'page',
            property: 'object'
          },
          sort: {
            direction: 'descending',
            timestamp: 'last_edited_time'
          },
          page_size: maxResults
        })
      })

      const documents: DocumentContext[] = []
      for (const page of response.results || []) {
        const docContext = await this.convertPageToDocumentContext(page)
        if (docContext) {
          documents.push(docContext)
        }
      }

      return documents
    } catch (error) {
      console.error('Failed to get recent pages:', error)
      throw error
    }
  }

  async searchPages(query: string, maxResults: number = 10): Promise<DocumentContext[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Notion')
    }

    try {
      const response = await this.makeAuthenticatedRequest('/search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          filter: {
            value: 'page',
            property: 'object'
          },
          page_size: maxResults
        })
      })

      const documents: DocumentContext[] = []
      for (const page of response.results || []) {
        const docContext = await this.convertPageToDocumentContext(page)
        if (docContext) {
          documents.push(docContext)
        }
      }

      return documents
    } catch (error) {
      console.error('Failed to search pages:', error)
      throw error
    }
  }

  async getPageContent(pageId: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Notion')
    }

    try {
      const blocks = await this.getPageBlocks(pageId)
      return this.blocksToText(blocks)
    } catch (error) {
      console.error('Failed to get page content:', error)
      throw error
    }
  }

  async getPageBlocks(pageId: string): Promise<NotionBlock[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Notion')
    }

    try {
      const response = await this.makeAuthenticatedRequest(`/blocks/${pageId}/children`)
      return response.results || []
    } catch (error) {
      console.error('Failed to get page blocks:', error)
      throw error
    }
  }

  async getDatabases(): Promise<NotionDatabase[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Notion')
    }

    try {
      const response = await this.makeAuthenticatedRequest('/search', {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            value: 'database',
            property: 'object'
          }
        })
      })

      return response.results || []
    } catch (error) {
      console.error('Failed to get databases:', error)
      throw error
    }
  }

  async queryDatabase(databaseId: string, filter?: any, sorts?: any[]): Promise<NotionPage[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Notion')
    }

    try {
      const body: any = {}
      if (filter) body.filter = filter
      if (sorts) body.sorts = sorts

      const response = await this.makeAuthenticatedRequest(`/databases/${databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify(body)
      })

      return response.results || []
    } catch (error) {
      console.error('Failed to query database:', error)
      throw error
    }
  }

  async analyzePage(pageId: string): Promise<{
    summary: string
    keyTopics: string[]
    wordCount: number
    readingTime: number
    structure: string[]
  }> {
    try {
      const content = await this.getPageContent(pageId)
      const blocks = await this.getPageBlocks(pageId)
      
      // Basic analysis
      const words = content.split(/\s+/).filter(word => word.length > 0)
      const wordCount = words.length
      const readingTime = Math.ceil(wordCount / 200)
      
      // Extract key topics
      const keyTopics = this.extractKeywords(content)
      
      // Analyze structure
      const structure = this.analyzePageStructure(blocks)
      
      // Generate summary
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
      const summary = sentences.slice(0, 3).join('. ') + '.'
      
      return {
        summary,
        keyTopics,
        wordCount,
        readingTime,
        structure
      }
    } catch (error) {
      console.error('Failed to analyze page:', error)
      throw error
    }
  }

  private async convertPageToDocumentContext(page: NotionPage): Promise<DocumentContext | null> {
    try {
      // Extract title from properties
      let title = 'Untitled'
      const titleProperty = Object.values(page.properties).find(
        (prop: any) => prop.type === 'title'
      ) as any
      
      if (titleProperty?.title?.[0]?.plain_text) {
        title = titleProperty.title[0].plain_text
      }

      // Get page content
      let content = ''
      try {
        content = await this.getPageContent(page.id)
      } catch (error) {
        // If we can't get content, use title
        content = title
      }

      // Extract tags from properties
      const tags = this.extractTagsFromProperties(page.properties)

      return {
        id: page.id,
        title,
        content: content.substring(0, 5000), // Limit content size
        type: 'note',
        source: 'notion',
        url: page.url,
        lastModified: page.last_edited_time,
        author: 'Notion User', // Notion API doesn't provide user names easily
        tags,
        metadata: {
          created_time: page.created_time,
          archived: page.archived,
          icon: page.icon,
          cover: page.cover,
          parent: page.parent,
          properties: page.properties
        }
      }
    } catch (error) {
      console.error('Failed to convert Notion page:', error)
      return null
    }
  }

  private blocksToText(blocks: NotionBlock[]): string {
    let text = ''
    
    for (const block of blocks) {
      switch (block.type) {
        case 'paragraph':
          text += this.richTextToPlainText(block.paragraph?.rich_text || []) + '\n\n'
          break
        case 'heading_1':
          text += '# ' + this.richTextToPlainText(block.heading_1?.rich_text || []) + '\n\n'
          break
        case 'heading_2':
          text += '## ' + this.richTextToPlainText(block.heading_2?.rich_text || []) + '\n\n'
          break
        case 'heading_3':
          text += '### ' + this.richTextToPlainText(block.heading_3?.rich_text || []) + '\n\n'
          break
        case 'bulleted_list_item':
          text += '• ' + this.richTextToPlainText(block.bulleted_list_item?.rich_text || []) + '\n'
          break
        case 'numbered_list_item':
          text += '1. ' + this.richTextToPlainText(block.numbered_list_item?.rich_text || []) + '\n'
          break
        case 'to_do':
          const checked = block.to_do?.checked ? '[x]' : '[ ]'
          text += `${checked} ${this.richTextToPlainText(block.to_do?.rich_text || [])}\n`
          break
        case 'quote':
          text += '> ' + this.richTextToPlainText(block.quote?.rich_text || []) + '\n\n'
          break
        case 'code':
          text += '```\n' + this.richTextToPlainText(block.code?.rich_text || []) + '\n```\n\n'
          break
        case 'callout':
          text += '💡 ' + this.richTextToPlainText(block.callout?.rich_text || []) + '\n\n'
          break
        default:
          // Handle other block types generically
          if (block[block.type]?.rich_text) {
            text += this.richTextToPlainText(block[block.type].rich_text) + '\n'
          }
      }
    }
    
    return text.trim()
  }

  private richTextToPlainText(richText: any[]): string {
    return richText.map(text => text.plain_text || '').join('')
  }

  private extractTagsFromProperties(properties: Record<string, any>): string[] {
    const tags: string[] = []
    
    for (const [key, property] of Object.entries(properties)) {
      if (property.type === 'multi_select') {
        tags.push(...property.multi_select.map((option: any) => option.name))
      } else if (property.type === 'select' && property.select) {
        tags.push(property.select.name)
      } else if (property.type === 'rich_text' && property.rich_text.length > 0) {
        // Use property name as tag if it has content
        tags.push(key.toLowerCase())
      }
    }
    
    return tags
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
      .slice(0, 10)
      .map(([word]) => word)
  }

  private analyzePageStructure(blocks: NotionBlock[]): string[] {
    const structure: string[] = []
    
    for (const block of blocks) {
      switch (block.type) {
        case 'heading_1':
          structure.push('H1: ' + this.richTextToPlainText(block.heading_1?.rich_text || []))
          break
        case 'heading_2':
          structure.push('H2: ' + this.richTextToPlainText(block.heading_2?.rich_text || []))
          break
        case 'heading_3':
          structure.push('H3: ' + this.richTextToPlainText(block.heading_3?.rich_text || []))
          break
        case 'database':
          structure.push('Database')
          break
        case 'table':
          structure.push('Table')
          break
        case 'image':
          structure.push('Image')
          break
        case 'video':
          structure.push('Video')
          break
        case 'file':
          structure.push('File')
          break
      }
    }
    
    return structure
  }

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': this.version,
        ...options.headers
      }
    })

    if (response.status === 401) {
      throw new Error('Authentication failed - token may be expired')
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notion API error: ${response.status} ${response.statusText} - ${errorText}`)
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
      response_type: 'code',
      owner: 'user'
    })
    
    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`
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
      const response = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri
        })
      })

      if (!response.ok) {
        throw new Error('Token exchange failed')
      }

      const tokenData = await response.json()
      this.accessToken = tokenData.access_token

      await this.storeToken(tokenData.access_token)
      return true
    } catch (error) {
      console.error('Token exchange failed:', error)
      return false
    }
  }

  private async verifyToken(): Promise<boolean> {
    if (!this.accessToken) return false

    try {
      const response = await this.makeAuthenticatedRequest('/users/me')
      return response.id !== undefined
    } catch (error) {
      return false
    }
  }

  private async storeToken(token: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ notion_access_token: token })
    } else {
      localStorage.setItem('notion_access_token', token)
    }
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['notion_access_token'])
        return result.notion_access_token || null
      } else {
        return localStorage.getItem('notion_access_token')
      }
    } catch (error) {
      console.error('Failed to get stored token:', error)
      return null
    }
  }

  private async clearStoredToken(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove(['notion_access_token'])
      } else {
        localStorage.removeItem('notion_access_token')
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
    return 'Notion'
  }

  getServiceIcon(): string {
    return '📝'
  }
}