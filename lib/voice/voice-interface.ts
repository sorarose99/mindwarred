// Voice Interface Service for Kiro Web Mind
// Handles speech recognition, synthesis, and voice command processing

import { 
  VoiceSettings, 
  VoiceCommand, 
  VoiceResponse, 
  VoiceState, 
  SpeechRecognitionResult,
  VoiceIntent 
} from '../types/core'

export class VoiceInterface {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis | null = null
  private settings: VoiceSettings
  private state: VoiceState
  private listeners: Map<string, Function[]> = new Map()
  private wakeWordDetector: WakeWordDetector | null = null

  constructor(settings: VoiceSettings) {
    this.settings = settings
    this.state = {
      isListening: false,
      isProcessing: false,
      isSpeaking: false
    }
    
    this.initializeSpeechAPIs()
    this.setupWakeWordDetection()
  }

  private initializeSpeechAPIs(): void {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      
      this.recognition.continuous = this.settings.continuousListening
      this.recognition.interimResults = true
      this.recognition.lang = this.settings.language || 'en-US'
      
      this.setupRecognitionHandlers()
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
    }
  }

  private setupRecognitionHandlers(): void {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.updateState({ isListening: true, error: undefined })
      this.emit('listening-started')
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results)
      const lastResult = results[results.length - 1]
      
      if (lastResult) {
        const result: SpeechRecognitionResult = {
          transcript: lastResult[0].transcript,
          confidence: lastResult[0].confidence,
          isFinal: lastResult.isFinal,
          alternatives: Array.from(lastResult).slice(1).map(alt => ({
            transcript: alt.transcript,
            confidence: alt.confidence
          }))
        }

        this.updateState({ lastResult: result })
        this.emit('speech-result', result)

        if (result.isFinal && result.confidence > this.settings.confidenceThreshold) {
          this.processVoiceCommand(result.transcript)
        }
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.updateState({ 
        isListening: false, 
        error: `Speech recognition error: ${event.error}` 
      })
      this.emit('error', event.error)
    }

    this.recognition.onend = () => {
      this.updateState({ isListening: false })
      this.emit('listening-stopped')
    }
  }

  private setupWakeWordDetection(): void {
    if (this.settings.wakeWordEnabled) {
      this.wakeWordDetector = new WakeWordDetector(
        this.settings.wakeWord,
        () => this.startListening()
      )
    }
  }

  public async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported')
    }

    if (this.state.isListening) {
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      this.updateState({ error: `Failed to start listening: ${error}` })
      throw error
    }
  }

  public stopListening(): void {
    if (this.recognition && this.state.isListening) {
      this.recognition.stop()
    }
  }

  public async speak(text: string, options?: SpeechSynthesisUtteranceOptions): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported')
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      utterance.rate = options?.rate || this.settings.voiceSpeed || 1
      utterance.pitch = options?.pitch || this.settings.voicePitch || 1
      utterance.lang = options?.lang || this.settings.language || 'en-US'

      utterance.onstart = () => {
        this.updateState({ isSpeaking: true })
        this.emit('speaking-started', text)
      }

      utterance.onend = () => {
        this.updateState({ isSpeaking: false })
        this.emit('speaking-ended')
        resolve()
      }

      utterance.onerror = (event) => {
        this.updateState({ isSpeaking: false, error: `Speech synthesis error: ${event.error}` })
        this.emit('error', event.error)
        reject(new Error(event.error))
      }

      this.synthesis.speak(utterance)
    })
  }

  private async processVoiceCommand(transcript: string): Promise<void> {
    this.updateState({ isProcessing: true })
    
    try {
      const command = await this.parseVoiceCommand(transcript)
      this.updateState({ currentCommand: command })
      this.emit('command-recognized', command)
      
      const response = await this.executeVoiceCommand(command)
      this.emit('command-executed', { command, response })
      
      if (response.text) {
        await this.speak(response.text)
      }
    } catch (error) {
      this.updateState({ error: `Command processing failed: ${error}` })
      this.emit('error', error)
    } finally {
      this.updateState({ isProcessing: false })
    }
  }

  private async parseVoiceCommand(transcript: string): Promise<VoiceCommand> {
    const normalizedText = transcript.toLowerCase().trim()
    
    // Simple intent recognition - can be enhanced with NLP
    let intent: VoiceIntent = 'unknown'
    const parameters: Record<string, any> = {}

    if (normalizedText.includes('summarize') || normalizedText.includes('summary')) {
      intent = 'summarize'
    } else if (normalizedText.includes('explain') || normalizedText.includes('what is')) {
      intent = 'explain'
    } else if (normalizedText.includes('translate')) {
      intent = 'translate'
    } else if (normalizedText.includes('search') || normalizedText.includes('find')) {
      intent = 'search'
      const searchMatch = normalizedText.match(/(?:search|find)\s+(?:for\s+)?(.+)/)
      if (searchMatch) {
        parameters.query = searchMatch[1]
      }
    } else if (normalizedText.includes('navigate') || normalizedText.includes('go to')) {
      intent = 'navigate'
    } else if (normalizedText.includes('automate') || normalizedText.includes('create rule')) {
      intent = 'automate'
    } else if (normalizedText.includes('save') || normalizedText.includes('bookmark')) {
      intent = 'save'
    } else if (normalizedText.includes('help')) {
      intent = 'help'
    } else if (normalizedText.includes('settings') || normalizedText.includes('preferences')) {
      intent = 'settings'
    }

    return {
      id: `cmd_${Date.now()}`,
      command: transcript,
      intent,
      parameters,
      confidence: 0.8, // This would come from NLP analysis
      timestamp: Date.now()
    }
  }

  private async executeVoiceCommand(command: VoiceCommand): Promise<VoiceResponse> {
    // This would integrate with the AI service and other components
    switch (command.intent) {
      case 'summarize':
        return {
          text: "I'll summarize this page for you.",
          actions: [{ type: 'execute', target: 'ai-summarize', data: {} }]
        }
      
      case 'explain':
        return {
          text: "Let me explain this content.",
          actions: [{ type: 'execute', target: 'ai-explain', data: {} }]
        }
      
      case 'search':
        return {
          text: `Searching for ${command.parameters?.query || 'your query'}.`,
          actions: [{ type: 'execute', target: 'search', data: command.parameters }]
        }
      
      case 'help':
        return {
          text: "I can help you summarize content, search for information, create automations, and more. What would you like to do?",
          followUp: "Try saying 'summarize this page' or 'search for artificial intelligence'."
        }
      
      default:
        return {
          text: "I didn't understand that command. Try saying 'help' to see what I can do.",
          followUp: "You can ask me to summarize, explain, search, or help with automation."
        }
    }
  }

  public updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    
    if (this.recognition) {
      this.recognition.lang = this.settings.language
      this.recognition.continuous = this.settings.continuousListening
    }

    if (newSettings.wakeWordEnabled !== undefined || newSettings.wakeWord) {
      this.setupWakeWordDetection()
    }
  }

  public getState(): VoiceState {
    return { ...this.state }
  }

  public isSupported(): boolean {
    return !!(
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
      'speechSynthesis' in window
    )
  }

  private updateState(updates: Partial<VoiceState>): void {
    this.state = { ...this.state, ...updates }
    this.emit('state-changed', this.state)
  }

  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }

  public destroy(): void {
    this.stopListening()
    if (this.synthesis) {
      this.synthesis.cancel()
    }
    if (this.wakeWordDetector) {
      this.wakeWordDetector.destroy()
    }
    this.listeners.clear()
  }
}

// Wake Word Detection Class
class WakeWordDetector {
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private isActive: boolean = false

  constructor(
    private wakeWord: string,
    private onWakeWordDetected: () => void
  ) {
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)
      
      this.processor.onaudioprocess = (event) => {
        if (this.isActive) {
          this.processAudioData(event.inputBuffer)
        }
      }
      
      source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)
      this.isActive = true
    } catch (error) {
      console.error('Failed to initialize wake word detection:', error)
    }
  }

  private processAudioData(buffer: AudioBuffer): void {
    // Simple volume-based wake word detection
    // In a real implementation, this would use more sophisticated audio processing
    const data = buffer.getChannelData(0)
    let sum = 0
    
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i])
    }
    
    const average = sum / data.length
    
    // Trigger on volume threshold (simplified approach)
    if (average > 0.01) {
      this.onWakeWordDetected()
    }
  }

  public destroy(): void {
    this.isActive = false
    
    if (this.processor) {
      this.processor.disconnect()
    }
    
    if (this.audioContext) {
      this.audioContext.close()
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
    }
  }
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
    webkitAudioContext: typeof AudioContext
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechSynthesisUtteranceOptions {
  rate?: number
  pitch?: number
  lang?: string
  voice?: SpeechSynthesisVoice
}