'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto"
      >
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent"
        >
          Meet <span className="text-blue-400">Kiro</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Your intelligent Web Mind that learns how you browse, understands your context, 
          and helps you act faster with AI-powered summarization, suggestions, and automation.
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-gray-400 max-w-lg mx-auto mb-10"
        >
          Powered by Gemini Nano and Chrome AI, built for seamless flow.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex gap-4 justify-center"
        >
          <Link 
            href="/dashboard" 
            className="glass px-8 py-4 rounded-xl text-white font-semibold hover:bg-blue-600/20 transition-all duration-300 hover:scale-105"
          >
            Launch Dashboard
          </Link>
          <Link 
            href="/chat" 
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105"
          >
            Try Kiro Chat
          </Link>
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 text-gray-500 text-sm"
      >
        Chrome Extension + AI Dashboard • Privacy-First • Local Processing
      </motion.div>
    </main>
  )
}