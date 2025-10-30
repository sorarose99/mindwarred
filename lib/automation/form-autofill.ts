// Form Auto-fill System for Kiro Web Mind

import { FormField, PageContext } from '../types/core'

export interface AutoFillProfile {
  id: string
  name: string
  isDefault: boolean
  personalInfo: PersonalInfo
  contactInfo: ContactInfo
  addressInfo: AddressInfo
  paymentInfo?: PaymentInfo
  workInfo?: WorkInfo
  preferences: AutoFillPreferences
  createdAt: number
  updatedAt: number
}

export interface PersonalInfo {
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth?: string
  gender?: string
  title?: string
  middleName?: string
}

export interface ContactInfo {
  email: string
  phone: string
  alternateEmail?: string
  alternatePhone?: string
  website?: string
  socialProfiles?: Record<string, string>
}

export interface AddressInfo {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  apartment?: string
  addressLine2?: string
}

export interface PaymentInfo {
  cardNumber: string // Encrypted
  expiryMonth: string
  expiryYear: string
  cvv: string // Encrypted
  cardholderName: string
  billingAddress?: AddressInfo
}

export interface WorkInfo {
  company: string
  jobTitle: string
  department?: string
  workEmail?: string
  workPhone?: string
  workAddress?: AddressInfo
}

export interface AutoFillPreferences {
  autoFillEnabled: boolean
  requireConfirmation: boolean
  sensitiveDataConfirmation: boolean
  excludedDomains: string[]
  fieldMappings: Record<string, string>
  customRules: AutoFillRule[]
}

export interface AutoFillRule {
  id: string
  name: string
  condition: FieldCondition
  action: FillAction
  priority: number
  enabled: boolean
}

export interface FieldCondition {
  type: 'selector' | 'attribute' | 'label' | 'placeholder' | 'name'
  value: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex'
}

export interface FillAction {
  type: 'value' | 'profile_field' | 'custom_function'
  value: string
  profileField?: keyof AutoFillProfile
  customFunction?: string
}

export interface FieldMatch {
  element: HTMLElement
  field: FormField
  confidence: number
  suggestedValue: string
  dataType: FieldDataType
  isSensitive: boolean
}

export type FieldDataType = 
  | 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone'
  | 'address' | 'city' | 'state' | 'zipCode' | 'country'
  | 'cardNumber' | 'expiryDate' | 'cvv' | 'company' | 'jobTitle'
  | 'dateOfBirth' | 'gender' | 'website' | 'unknown'

export class FormAutoFillSystem {
  private profiles: Map<string, AutoFillProfile> = new Map()
  private defaultProfile: AutoFillProfile | null = null
  private fieldDetectors: Map<FieldDataType, RegExp[]> = new Map()
  private encryptionKey: string

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey
    this.initializeFieldDetectors()
  }

  private initializeFieldDetectors(): void {
    this.fieldDetectors.set('firstName', [
      /first.*name/i,
      /given.*name/i,
      /fname/i,
      /f_name/i
    ])

    this.fieldDetectors.set('lastName', [
      /last.*name/i,
      /family.*name/i,
      /surname/i,
      /lname/i,
      /l_name/i
    ])

    this.fieldDetectors.set('fullName', [
      /^name$/i,
      /full.*name/i,
      /complete.*name/i,
      /your.*name/i
    ])

    this.fieldDetectors.set('email', [
      /email/i,
      /e-mail/i,
      /mail/i,
      /@/
    ])

    this.fieldDetectors.set('phone', [
      /phone/i,
      /tel/i,
      /mobile/i,
      /cell/i,
      /number/i
    ])

    this.fieldDetectors.set('address', [
      /address/i,
      /street/i,
      /addr/i,
      /location/i
    ])

    this.fieldDetectors.set('city', [
      /city/i,
      /town/i,
      /locality/i
    ])

    this.fieldDetectors.set('state', [
      /state/i,
      /province/i,
      /region/i
    ])

    this.fieldDetectors.set('zipCode', [
      /zip/i,
      /postal/i,
      /postcode/i,
      /zip.*code/i
    ])

    this.fieldDetectors.set('country', [
      /country/i,
      /nation/i
    ])

    this.fieldDetectors.set('cardNumber', [
      /card.*number/i,
      /credit.*card/i,
      /debit.*card/i,
      /cc.*number/i
    ])

    this.fieldDetectors.set('expiryDate', [
      /expir/i,
      /exp.*date/i,
      /valid.*thru/i,
      /mm.*yy/i
    ])

    this.fieldDetectors.set('cvv', [
      /cvv/i,
      /cvc/i,
      /security.*code/i,
      /card.*code/i
    ])

    this.fieldDetectors.set('company', [
      /company/i,
      /organization/i,
      /employer/i,
      /business/i
    ])

    this.fieldDetectors.set('jobTitle', [
      /job.*title/i,
      /position/i,
      /role/i,
      /title/i
    ])
  }

  async createProfile(profileData: Omit<AutoFillProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutoFillProfile> {
    const profile: AutoFillProfile = {
      ...profileData,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Encrypt sensitive data
    if (profile.paymentInfo) {
      profile.paymentInfo = await this.encryptPaymentInfo(profile.paymentInfo)
    }

    this.profiles.set(profile.id, profile)

    if (profile.isDefault) {
      this.setDefaultProfile(profile.id)
    }

    await this.saveProfiles()
    return profile
  }

  async updateProfile(profileId: string, updates: Partial<AutoFillProfile>): Promise<AutoFillProfile> {
    const profile = this.profiles.get(profileId)
    if (!profile) {
      throw new Error('Profile not found')
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: Date.now()
    }

    // Encrypt sensitive data if updated
    if (updates.paymentInfo) {
      updatedProfile.paymentInfo = await this.encryptPaymentInfo(updates.paymentInfo)
    }

    this.profiles.set(profileId, updatedProfile)

    if (updatedProfile.isDefault) {
      this.setDefaultProfile(profileId)
    }

    await this.saveProfiles()
    return updatedProfile
  }

  async deleteProfile(profileId: string): Promise<void> {
    const profile = this.profiles.get(profileId)
    if (!profile) {
      throw new Error('Profile not found')
    }

    this.profiles.delete(profileId)

    if (this.defaultProfile?.id === profileId) {
      this.defaultProfile = null
      // Set another profile as default if available
      const remainingProfiles = Array.from(this.profiles.values())
      if (remainingProfiles.length > 0) {
        this.setDefaultProfile(remainingProfiles[0].id)
      }
    }

    await this.saveProfiles()
  }

  setDefaultProfile(profileId: string): void {
    const profile = this.profiles.get(profileId)
    if (!profile) {
      throw new Error('Profile not found')
    }

    // Unset previous default
    if (this.defaultProfile) {
      this.defaultProfile.isDefault = false
      this.profiles.set(this.defaultProfile.id, this.defaultProfile)
    }

    // Set new default
    profile.isDefault = true
    this.defaultProfile = profile
    this.profiles.set(profileId, profile)
  }

  async analyzeForm(pageContext: PageContext): Promise<FieldMatch[]> {
    const formFields = pageContext.formFields || []
    const matches: FieldMatch[] = []

    for (const field of formFields) {
      const match = await this.analyzeField(field)
      if (match) {
        matches.push(match)
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  private async analyzeField(field: FormField): Promise<FieldMatch | null> {
    // Get the actual DOM element
    const element = document.getElementById(field.id) || 
                   document.querySelector(`[name="${field.name}"]`) as HTMLElement

    if (!element) {
      return null
    }

    // Analyze field to determine data type
    const dataType = this.detectFieldType(field)
    const confidence = this.calculateConfidence(field, dataType)

    if (confidence < 0.3) {
      return null // Too low confidence
    }

    // Get suggested value from default profile
    const suggestedValue = this.getSuggestedValue(dataType)
    const isSensitive = this.isSensitiveField(dataType)

    return {
      element,
      field,
      confidence,
      suggestedValue,
      dataType,
      isSensitive
    }
  }

  private detectFieldType(field: FormField): FieldDataType {
    const searchText = `${field.name} ${field.id} ${field.label || ''} ${field.placeholder || ''}`.toLowerCase()

    // Check each field type
    for (const [dataType, patterns] of this.fieldDetectors.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(searchText)) {
          return dataType
        }
      }
    }

    // Check input type
    if (field.type === 'email') return 'email'
    if (field.type === 'tel') return 'phone'

    return 'unknown'
  }

  private calculateConfidence(field: FormField, dataType: FieldDataType): number {
    let confidence = 0

    // Base confidence from field type detection
    if (dataType !== 'unknown') {
      confidence += 0.5
    }

    // Boost confidence based on input type match
    const typeMatches: Record<string, FieldDataType[]> = {
      'email': ['email'],
      'tel': ['phone'],
      'text': ['firstName', 'lastName', 'fullName', 'address', 'city', 'company'],
      'password': [], // Never auto-fill passwords
      'number': ['phone', 'zipCode', 'cardNumber', 'cvv']
    }

    if (typeMatches[field.type]?.includes(dataType)) {
      confidence += 0.3
    }

    // Boost confidence for exact matches
    const exactMatches = [
      { pattern: /^email$/i, type: 'email' },
      { pattern: /^phone$/i, type: 'phone' },
      { pattern: /^firstname$/i, type: 'firstName' },
      { pattern: /^lastname$/i, type: 'lastName' }
    ]

    for (const match of exactMatches) {
      if (match.pattern.test(field.name) && dataType === match.type) {
        confidence += 0.2
      }
    }

    return Math.min(confidence, 1.0)
  }

  private getSuggestedValue(dataType: FieldDataType): string {
    if (!this.defaultProfile) {
      return ''
    }

    const profile = this.defaultProfile

    switch (dataType) {
      case 'firstName':
        return profile.personalInfo.firstName
      case 'lastName':
        return profile.personalInfo.lastName
      case 'fullName':
        return profile.personalInfo.fullName
      case 'email':
        return profile.contactInfo.email
      case 'phone':
        return profile.contactInfo.phone
      case 'address':
        return profile.addressInfo.street
      case 'city':
        return profile.addressInfo.city
      case 'state':
        return profile.addressInfo.state
      case 'zipCode':
        return profile.addressInfo.zipCode
      case 'country':
        return profile.addressInfo.country
      case 'company':
        return profile.workInfo?.company || ''
      case 'jobTitle':
        return profile.workInfo?.jobTitle || ''
      case 'dateOfBirth':
        return profile.personalInfo.dateOfBirth || ''
      case 'website':
        return profile.contactInfo.website || ''
      default:
        return ''
    }
  }

  private isSensitiveField(dataType: FieldDataType): boolean {
    const sensitiveTypes: FieldDataType[] = [
      'cardNumber', 'expiryDate', 'cvv', 'dateOfBirth'
    ]
    return sensitiveTypes.includes(dataType)
  }

  async fillForm(matches: FieldMatch[], profileId?: string): Promise<{
    filled: number
    skipped: number
    errors: string[]
  }> {
    const profile = profileId ? this.profiles.get(profileId) : this.defaultProfile
    if (!profile) {
      throw new Error('No profile available for auto-fill')
    }

    let filled = 0
    let skipped = 0
    const errors: string[] = []

    for (const match of matches) {
      try {
        // Check if user confirmation is required
        if (this.requiresConfirmation(match, profile)) {
          const confirmed = await this.requestUserConfirmation(match)
          if (!confirmed) {
            skipped++
            continue
          }
        }

        // Fill the field
        await this.fillField(match.element, match.suggestedValue)
        filled++
      } catch (error) {
        errors.push(`Failed to fill ${match.field.name}: ${error}`)
        skipped++
      }
    }

    return { filled, skipped, errors }
  }

  private requiresConfirmation(match: FieldMatch, profile: AutoFillProfile): boolean {
    if (!profile.preferences.autoFillEnabled) {
      return true
    }

    if (profile.preferences.requireConfirmation) {
      return true
    }

    if (match.isSensitive && profile.preferences.sensitiveDataConfirmation) {
      return true
    }

    return false
  }

  private async requestUserConfirmation(match: FieldMatch): Promise<boolean> {
    // In a real implementation, this would show a UI confirmation dialog
    // For now, return true for non-sensitive fields, false for sensitive
    return !match.isSensitive
  }

  private async fillField(element: HTMLElement, value: string): Promise<void> {
    if (!element || !value) {
      return
    }

    const inputElement = element as HTMLInputElement

    // Set the value
    inputElement.value = value

    // Trigger events to notify the page
    const events = ['input', 'change', 'blur']
    for (const eventType of events) {
      const event = new Event(eventType, { bubbles: true })
      inputElement.dispatchEvent(event)
    }

    // For React and other frameworks, also set the value property directly
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
    if (descriptor && descriptor.set) {
      descriptor.set.call(inputElement, value)
    }
  }

  async learnFromUserInput(pageContext: PageContext): Promise<void> {
    // Analyze user's manual input to improve field detection
    const formFields = pageContext.formFields || []
    
    for (const field of formFields) {
      if (field.value) {
        const dataType = this.detectFieldType(field)
        if (dataType !== 'unknown') {
          // Store this pattern for future improvement
          await this.storeFieldPattern(field, dataType)
        }
      }
    }
  }

  private async storeFieldPattern(field: FormField, dataType: FieldDataType): Promise<void> {
    // In a real implementation, this would store patterns to improve detection
    // For now, we'll just log the learning opportunity
    console.log(`Learned pattern: ${field.name} -> ${dataType}`)
  }

  private async encryptPaymentInfo(paymentInfo: PaymentInfo): Promise<PaymentInfo> {
    // In a real implementation, use proper encryption
    // This is a placeholder
    return {
      ...paymentInfo,
      cardNumber: this.encrypt(paymentInfo.cardNumber),
      cvv: this.encrypt(paymentInfo.cvv)
    }
  }

  private encrypt(data: string): string {
    // Placeholder encryption - use proper crypto in production
    return btoa(data)
  }

  private decrypt(encryptedData: string): string {
    // Placeholder decryption - use proper crypto in production
    return atob(encryptedData)
  }

  private generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async saveProfiles(): Promise<void> {
    // Save profiles to storage
    const profilesData = Array.from(this.profiles.values())
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        autofill_profiles: profilesData,
        default_profile_id: this.defaultProfile?.id
      })
    } else {
      localStorage.setItem('autofill_profiles', JSON.stringify(profilesData))
      if (this.defaultProfile) {
        localStorage.setItem('default_profile_id', this.defaultProfile.id)
      }
    }
  }

  async loadProfiles(): Promise<void> {
    try {
      let profilesData: AutoFillProfile[] = []
      let defaultProfileId: string | null = null

      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['autofill_profiles', 'default_profile_id'])
        profilesData = result.autofill_profiles || []
        defaultProfileId = result.default_profile_id
      } else {
        const stored = localStorage.getItem('autofill_profiles')
        if (stored) {
          profilesData = JSON.parse(stored)
        }
        defaultProfileId = localStorage.getItem('default_profile_id')
      }

      // Load profiles into memory
      this.profiles.clear()
      for (const profile of profilesData) {
        this.profiles.set(profile.id, profile)
        if (profile.id === defaultProfileId) {
          this.defaultProfile = profile
        }
      }
    } catch (error) {
      console.error('Failed to load auto-fill profiles:', error)
    }
  }

  getProfiles(): AutoFillProfile[] {
    return Array.from(this.profiles.values())
  }

  getProfile(profileId: string): AutoFillProfile | null {
    return this.profiles.get(profileId) || null
  }

  getDefaultProfile(): AutoFillProfile | null {
    return this.defaultProfile
  }

  isEnabled(): boolean {
    return this.defaultProfile?.preferences.autoFillEnabled || false
  }

  isDomainExcluded(domain: string): boolean {
    if (!this.defaultProfile) {
      return false
    }

    return this.defaultProfile.preferences.excludedDomains.some(excluded => 
      domain.includes(excluded) || excluded.includes(domain)
    )
  }
}