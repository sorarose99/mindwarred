// Unit tests for Firebase authentication

import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  resetPassword,
  updateUserProfile,
  changePassword,
  getCurrentUser,
  getUserDocument
} from '../../lib/firebase/auth'

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  updatePassword: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn()
  }
}))

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }))
  }
}))

// Mock Firebase app
jest.mock('../../lib/firebase', () => ({
  auth: {
    currentUser: null
  },
  db: {}
}))

describe('Firebase Authentication', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    emailVerified: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signUpWithEmail', () => {
    it('should create user account successfully', async () => {
      const mockCreateUser = require('firebase/auth').createUserWithEmailAndPassword
      const mockUpdateProfile = require('firebase/auth').updateProfile
      const mockSendVerification = require('firebase/auth').sendEmailVerification
      const mockSetDoc = require('firebase/firestore').setDoc
      
      mockCreateUser.mockResolvedValue({ user: mockUser })
      mockUpdateProfile.mockResolvedValue(undefined)
      mockSendVerification.mockResolvedValue(undefined)
      mockSetDoc.mockResolvedValue(undefined)

      const result = await signUpWithEmail('test@example.com', 'password123', 'Test User')

      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      )
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' })
      expect(mockSendVerification).toHaveBeenCalledWith(mockUser)
      expect(mockSetDoc).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should handle authentication errors', async () => {
      const mockCreateUser = require('firebase/auth').createUserWithEmailAndPassword
      mockCreateUser.mockRejectedValue({ code: 'auth/email-already-in-use' })

      await expect(signUpWithEmail('test@example.com', 'password123'))
        .rejects.toThrow('An account with this email already exists')
    })

    it('should handle weak password error', async () => {
      const mockCreateUser = require('firebase/auth').createUserWithEmailAndPassword
      mockCreateUser.mockRejectedValue({ code: 'auth/weak-password' })

      await expect(signUpWithEmail('test@example.com', '123'))
        .rejects.toThrow('Password should be at least 6 characters')
    })
  })

  describe('signInWithEmail', () => {
    it('should sign in user successfully', async () => {
      const mockSignIn = require('firebase/auth').signInWithEmailAndPassword
      mockSignIn.mockResolvedValue({ user: mockUser })

      const result = await signInWithEmail('test@example.com', 'password123')

      expect(mockSignIn).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      )
      expect(result).toEqual(mockUser)
    })

    it('should handle invalid credentials', async () => {
      const mockSignIn = require('firebase/auth').signInWithEmailAndPassword
      mockSignIn.mockRejectedValue({ code: 'auth/wrong-password' })

      await expect(signInWithEmail('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Incorrect password')
    })

    it('should handle user not found', async () => {
      const mockSignIn = require('firebase/auth').signInWithEmailAndPassword
      mockSignIn.mockRejectedValue({ code: 'auth/user-not-found' })

      await expect(signInWithEmail('nonexistent@example.com', 'password123'))
        .rejects.toThrow('No account found with this email address')
    })
  })

  describe('signInWithGoogle', () => {
    it('should sign in with Google successfully', async () => {
      const mockSignInWithPopup = require('firebase/auth').signInWithPopup
      const mockGoogleProvider = require('firebase/auth').GoogleAuthProvider
      const mockGetDoc = require('firebase/firestore').getDoc
      
      mockGoogleProvider.mockImplementation(() => ({
        addScope: jest.fn()
      }))
      mockSignInWithPopup.mockResolvedValue({ user: mockUser })
      mockGetDoc.mockResolvedValue({ exists: () => true })

      const result = await signInWithGoogle()

      expect(mockSignInWithPopup).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should create user document for new Google users', async () => {
      const mockSignInWithPopup = require('firebase/auth').signInWithPopup
      const mockGoogleProvider = require('firebase/auth').GoogleAuthProvider
      const mockGetDoc = require('firebase/firestore').getDoc
      const mockSetDoc = require('firebase/firestore').setDoc
      
      mockGoogleProvider.mockImplementation(() => ({
        addScope: jest.fn()
      }))
      mockSignInWithPopup.mockResolvedValue({ user: mockUser })
      mockGetDoc.mockResolvedValue({ exists: () => false })
      mockSetDoc.mockResolvedValue(undefined)

      await signInWithGoogle()

      expect(mockSetDoc).toHaveBeenCalled()
    })
  })

  describe('signOutUser', () => {
    it('should sign out user successfully', async () => {
      const mockSignOut = require('firebase/auth').signOut
      mockSignOut.mockResolvedValue(undefined)

      await signOutUser()

      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      const mockResetPassword = require('firebase/auth').sendPasswordResetEmail
      mockResetPassword.mockResolvedValue(undefined)

      await resetPassword('test@example.com')

      expect(mockResetPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      )
    })

    it('should handle invalid email', async () => {
      const mockResetPassword = require('firebase/auth').sendPasswordResetEmail
      mockResetPassword.mockRejectedValue({ code: 'auth/invalid-email' })

      await expect(resetPassword('invalid-email'))
        .rejects.toThrow('Invalid email address')
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockAuth = require('../../lib/firebase').auth
      const mockUpdateProfile = require('firebase/auth').updateProfile
      const mockSetDoc = require('firebase/firestore').setDoc
      
      mockAuth.currentUser = mockUser
      mockUpdateProfile.mockResolvedValue(undefined)
      mockSetDoc.mockResolvedValue(undefined)

      await updateUserProfile({
        displayName: 'Updated Name',
        photoURL: 'https://example.com/new-photo.jpg'
      })

      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'Updated Name',
        photoURL: 'https://example.com/new-photo.jpg'
      })
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should throw error if no authenticated user', async () => {
      const mockAuth = require('../../lib/firebase').auth
      mockAuth.currentUser = null

      await expect(updateUserProfile({ displayName: 'New Name' }))
        .rejects.toThrow('No authenticated user')
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockAuth = require('../../lib/firebase').auth
      const mockReauthenticate = require('firebase/auth').reauthenticateWithCredential
      const mockUpdatePassword = require('firebase/auth').updatePassword
      const mockCredential = require('firebase/auth').EmailAuthProvider.credential
      
      mockAuth.currentUser = mockUser
      mockCredential.mockReturnValue('mock-credential')
      mockReauthenticate.mockResolvedValue(undefined)
      mockUpdatePassword.mockResolvedValue(undefined)

      await changePassword('oldpassword', 'newpassword')

      expect(mockCredential).toHaveBeenCalledWith(mockUser.email, 'oldpassword')
      expect(mockReauthenticate).toHaveBeenCalledWith(mockUser, 'mock-credential')
      expect(mockUpdatePassword).toHaveBeenCalledWith(mockUser, 'newpassword')
    })

    it('should handle wrong current password', async () => {
      const mockAuth = require('../../lib/firebase').auth
      const mockReauthenticate = require('firebase/auth').reauthenticateWithCredential
      const mockCredential = require('firebase/auth').EmailAuthProvider.credential
      
      mockAuth.currentUser = mockUser
      mockCredential.mockReturnValue('mock-credential')
      mockReauthenticate.mockRejectedValue({ code: 'auth/wrong-password' })

      await expect(changePassword('wrongpassword', 'newpassword'))
        .rejects.toThrow('Incorrect password')
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockAuth = require('../../lib/firebase').auth
      mockAuth.currentUser = mockUser

      const result = getCurrentUser()

      expect(result).toEqual(mockUser)
    })

    it('should return null if no user', () => {
      const mockAuth = require('../../lib/firebase').auth
      mockAuth.currentUser = null

      const result = getCurrentUser()

      expect(result).toBeNull()
    })
  })

  describe('getUserDocument', () => {
    it('should return user document if exists', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc
      const mockDoc = require('firebase/firestore').doc
      
      mockDoc.mockReturnValue('mock-doc-ref')
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-123',
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User'
        })
      })

      const result = await getUserDocument('user-123')

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      })
    })

    it('should return null if document does not exist', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc
      const mockDoc = require('firebase/firestore').doc
      
      mockDoc.mockReturnValue('mock-doc-ref')
      mockGetDoc.mockResolvedValue({
        exists: () => false
      })

      const result = await getUserDocument('user-123')

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const mockGetDoc = require('firebase/firestore').getDoc
      const mockDoc = require('firebase/firestore').doc
      
      mockDoc.mockReturnValue('mock-doc-ref')
      mockGetDoc.mockRejectedValue(new Error('Network error'))

      const result = await getUserDocument('user-123')

      expect(result).toBeNull()
    })
  })
})