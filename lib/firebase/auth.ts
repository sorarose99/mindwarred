// Firebase authentication helpers

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { UserPreferences, UserDocument } from '../types'

// Auth state management
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile with display name
    if (displayName) {
      await updateProfile(user, { displayName })
    }

    // Send email verification
    await sendEmailVerification(user)

    // Create user document in Firestore
    await createUserDocument(user)

    return user
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Check if this is a new user and create document if needed
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    if (!userDoc.exists()) {
      await createUserDocument(user)
    }

    return user
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error('Failed to sign out')
  }
}

// Password reset
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

// Update user profile
export const updateUserProfile = async (updates: {
  displayName?: string
  photoURL?: string
}): Promise<void> => {
  const user = getCurrentUser()
  if (!user) throw new Error('No authenticated user')

  try {
    await updateProfile(user, updates)
    
    // Update user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      displayName: updates.displayName || user.displayName,
      photoURL: updates.photoURL || user.photoURL,
      updatedAt: Timestamp.now()
    }, { merge: true })
  } catch (error: any) {
    throw new Error('Failed to update profile')
  }
}

// Change password
export const changePassword = async (
  currentPassword: string, 
  newPassword: string
): Promise<void> => {
  const user = getCurrentUser()
  if (!user || !user.email) throw new Error('No authenticated user')

  try {
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    
    // Update password
    await updatePassword(user, newPassword)
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

// Delete user account
export const deleteUserAccount = async (password: string): Promise<void> => {
  const user = getCurrentUser()
  if (!user || !user.email) throw new Error('No authenticated user')

  try {
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)
    
    // Delete user data from Firestore (this should be done via Cloud Function)
    // For now, we'll just mark the user as deleted
    await setDoc(doc(db, 'users', user.uid), {
      deleted: true,
      deletedAt: Timestamp.now()
    }, { merge: true })
    
    // Delete the user account
    await user.delete()
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

// Create user document in Firestore
const createUserDocument = async (user: User): Promise<void> => {
  const userDoc = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
    isActive: true,
    automationRuleCount: 0,
    knowledgeNodeCount: 0,
    totalActivities: 0
  }

  await setDoc(doc(db, 'users', user.uid), userDoc)
}

// Get user document from Firestore
export const getUserDocument = async (userId: string): Promise<UserDocument | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserDocument
    }
    return null
  } catch (error) {
    console.error('Error fetching user document:', error)
    return null
  }
}

// Update last login timestamp
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', userId), {
      lastLoginAt: Timestamp.now()
    }, { merge: true })
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

// Auth error message mapping
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address'
    case 'auth/wrong-password':
      return 'Incorrect password'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/user-disabled':
      return 'This account has been disabled'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection'
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed'
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled'
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action'
    default:
      return 'An error occurred during authentication'
  }
}

// Auth state hook for React components
export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      
      if (user) {
        updateLastLogin(user.uid)
      }
    })

    return unsubscribe
  }, [])

  return { user, loading }
}

// Check if user has required permissions
export const hasPermission = async (userId: string, permission: string): Promise<boolean> => {
  try {
    const userDoc = await getUserDocument(userId)
    return userDoc?.permissions?.includes(permission) || false
  } catch (error) {
    console.error('Error checking permissions:', error)
    return false
  }
}

// Add required imports for React hooks
import { useState, useEffect } from 'react'