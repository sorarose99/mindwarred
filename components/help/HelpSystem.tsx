'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QuestionMarkCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'
import AnimatedButton from '../ui/AnimatedButton'

interface HelpArticle {
  id: string
  title: string
  category: string
  content: string
  tags: string[]
  type: 'article' | 'video' | 'faq'
  url?: string
}

interface HelpSystemProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export default function HelpSystem({ isOpen, onClose, initialQuery = '' }: HelpSystemProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpenIcon },
    { id: 'getting-started', name: 'Getting Started', icon: RocketLaunchIcon },
    { id: 'features', name: 'Features', icon: SparklesIcon },
    { id: 'privacy', name: 'Privacy & Security', icon: ShieldCheckIcon },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: WrenchScrewdriverIcon },
    { id: 'automation', name: 'Automation', icon: BoltIcon }
  ]

  const helpArticles: HelpArticle[] = [
    {
      id: 'install-extension',
      title: 'How to Install the Chrome Extension',
      category: 'getting-started',
      content: `
        <h3>Installing Kiro Chrome Extension</h3>
        <ol>
          <li>Open Chrome Web Store</li>
          <li>Search for "Kiro Web Mind"</li>
          <li>Click "Add to Chrome"</li>
          <li>Grant necessary permissions</li>
          <li>Look for the Kiro icon in your toolbar</li>
        </ol>
        <p>The extension will automatically start analyzing web pages once installed.</p>
      `,
      tags: ['installation', 'chrome', 'extension', 'setup'],
      type: 'article'
    },
    {
      id: 'ai-sidebar',
      title: 'Using the AI Sidebar',
      category: 'features',
      content: `
        <h3>AI Sidebar Features</h3>
        <p>The AI sidebar appears on web pages to provide contextual assistance:</p>
        <ul>
          <li><strong>Smart Suggestions:</strong> Get relevant actions based on page content</li>
          <li><strong>Quick Summarization:</strong> Summarize long articles instantly</li>
          <li><strong>Form Assistance:</strong> Auto-fill forms with your saved data</li>
          <li><strong>Research Help:</strong> Find related information and sources</li>
        </ul>
        <p>Click the Kiro icon or use the keyboard shortcut Ctrl+Shift+K to toggle the sidebar.</p>
      `,
      tags: ['sidebar', 'ai', 'suggestions', 'features'],
      type: 'article'
    },
    {
      id: 'privacy-settings',
      title: 'Managing Privacy Settings',
      category: 'privacy',
      content: `
        <h3>Your Privacy Controls</h3>
        <p>Kiro gives you complete control over your data:</p>
        <ul>
          <li><strong>Data Collection:</strong> Choose what information Kiro can access</li>
          <li><strong>Local Processing:</strong> AI analysis happens on your device</li>
          <li><strong>Data Deletion:</strong> Delete your data at any time</li>
          <li><strong>Permissions:</strong> Granular control over website access</li>
        </ul>
        <p>Access privacy settings from the dashboard or extension popup.</p>
      `,
      tags: ['privacy', 'settings', 'data', 'permissions'],
      type: 'article'
    },
    {
      id: 'automation-setup',
      title: 'Setting Up Automations',
      category: 'automation',
      content: `
        <h3>Creating Custom Automations</h3>
        <p>Automate repetitive tasks with Kiro's automation engine:</p>
        <ol>
          <li>Go to Dashboard > Automations</li>
          <li>Click "Create New Rule"</li>
          <li>Define trigger conditions (URL patterns, page elements, etc.)</li>
          <li>Set up actions (form filling, clicking, navigation)</li>
          <li>Test and activate your automation</li>
        </ol>
        <p>Kiro can also suggest automations based on your browsing patterns.</p>
      `,
      tags: ['automation', 'rules', 'triggers', 'actions'],
      type: 'article'
    },
    {
      id: 'troubleshooting-common',
      title: 'Common Issues and Solutions',
      category: 'troubleshooting',
      content: `
        <h3>Troubleshooting Guide</h3>
        <h4>Extension Not Working</h4>
        <ul>
          <li>Check if extension is enabled in chrome://extensions/</li>
          <li>Refresh the webpage</li>
          <li>Check permissions in extension settings</li>
        </ul>
        <h4>AI Not Responding</h4>
        <ul>
          <li>Ensure Chrome AI is available (Chrome 127+)</li>
          <li>Check internet connection for cloud features</li>
          <li>Clear extension cache and reload</li>
        </ul>
        <h4>Performance Issues</h4>
        <ul>
          <li>Disable unused features in settings</li>
          <li>Clear old data from storage</li>
          <li>Update to latest version</li>
        </ul>
      `,
      tags: ['troubleshooting', 'issues', 'performance', 'bugs'],
      type: 'article'
    }
  ]

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    let filtered = helpArticles

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    setFilteredArticles(filtered)
  }, [searchQuery, selectedCategory])

  const handleArticleClick = (article: HelpArticle) => {
    if (article.url) {
      window.open(article.url, '_blank')
    } else {
      setSelectedArticle(article)
    }
  }

  const getArticleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoCameraIcon className="h-5 w-5 text-red-400" />
      case 'faq':
        return <QuestionMarkCircleIcon className="h-5 w-5 text-yellow-400" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-blue-400" />
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex"
        >
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-700 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Help Center</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${selectedCategory === category.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                      }
                    `}
                  >
                    <category.icon className="h-5 w-5" />
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                    onClick={() => window.open('/chat', '_blank')}
                    className="w-full justify-start"
                  >
                    Ask AI Assistant
                  </AnimatedButton>
                  <AnimatedButton
                    variant="ghost"
                    size="sm"
                    icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                    onClick={() => window.open('mailto:support@kiro.ai', '_blank')}
                    className="w-full justify-start"
                  >
                    Contact Support
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {selectedArticle ? (
              /* Article View */
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 border-b border-gray-700">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-blue-400 hover:text-blue-300 text-sm mb-4"
                  >
                    ← Back to articles
                  </button>
                  <div className="flex items-start gap-3">
                    {getArticleIcon(selectedArticle.type)}
                    <div>
                      <h1 className="text-2xl font-bold text-white">{selectedArticle.title}</h1>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-400 capitalize">{selectedArticle.category.replace('-', ' ')}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-sm text-gray-400 capitalize">{selectedArticle.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Articles List */
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {selectedCategory === 'all' ? 'All Help Articles' : 
                     categories.find(c => c.id === selectedCategory)?.name}
                  </h1>
                  <p className="text-gray-400">
                    {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
                    {searchQuery && ` for "${searchQuery}"`}
                  </p>
                </div>

                {filteredArticles.length === 0 ? (
                  <div className="text-center py-12">
                    <QuestionMarkCircleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No articles found</h3>
                    <p className="text-gray-500 mb-6">
                      Try adjusting your search or browse different categories
                    </p>
                    <AnimatedButton
                      variant="primary"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCategory('all')
                      }}
                    >
                      Show All Articles
                    </AnimatedButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredArticles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          hover 
                          onClick={() => handleArticleClick(article)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            {getArticleIcon(article.type)}
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">{article.title}</h3>
                              <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                {article.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 capitalize">
                                  {article.category.replace('-', ' ')}
                                </span>
                                {article.url && (
                                  <ArrowTopRightOnSquareIcon className="h-3 w-3 text-gray-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Import missing icons
import { 
  RocketLaunchIcon,
  SparklesIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  BoltIcon
} from '@heroicons/react/24/outline'