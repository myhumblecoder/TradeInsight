import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User as FirebaseAuthUser,
  type Unsubscribe
} from 'firebase/auth'
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { z } from 'zod'

export const FirebaseAuthConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  authDomain: z.string().min(1, 'Auth domain is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  storageBucket: z.string().min(1, 'Storage bucket is required'),
  messagingSenderId: z.string().min(1, 'Messaging sender ID is required'),
  appId: z.string().min(1, 'App ID is required')
})

export const FirebaseUserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().url().nullable(),
  emailVerified: z.boolean()
})

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1, 'Display name cannot be empty').optional(),
  photoURL: z.string().url().optional()
}).refine(
  (data) => data.displayName !== undefined || data.photoURL !== undefined,
  { message: 'At least one field must be provided for update' }
)

export type FirebaseAuthConfig = z.infer<typeof FirebaseAuthConfigSchema>
export type FirebaseUser = {
  id: string
  email: string | null
  name: string | null
  picture: string | null
  emailVerified: boolean
}
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>

export class FirebaseAuthService {
  private app: FirebaseApp
  private auth: Auth
  private googleProvider: GoogleAuthProvider

  constructor(config: FirebaseAuthConfig) {
    try {
      FirebaseAuthConfigSchema.parse(config)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid Firebase configuration: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw error
    }

    this.app = initializeApp(config)
    this.auth = getAuth(this.app)
    this.googleProvider = new GoogleAuthProvider()
    
    // Configure Google provider
    this.googleProvider.addScope('profile')
    this.googleProvider.addScope('email')
  }

  private transformFirebaseUser(user: FirebaseAuthUser | null): FirebaseUser | null {
    if (!user) return null

    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      picture: user.photoURL,
      emailVerified: user.emailVerified
    }
  }

  private validateEmail(email: string): void {
    const emailSchema = z.string().email()
    try {
      emailSchema.parse(email)
    } catch {
      throw new Error('Invalid email format')
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    
    // Additional password strength checks can be added here
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    }
  }

  public validateFirebaseUser(user: unknown): void {
    FirebaseUserSchema.parse(user)
  }

  async signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
    try {
      this.validateEmail(email)
      
      const credential = await signInWithEmailAndPassword(this.auth, email, password)
      const user = this.transformFirebaseUser(credential.user)
      
      if (!user) {
        throw new Error('Authentication succeeded but user data is missing')
      }
      
      return user
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Authentication failed: ${error.message}`)
      }
      throw new Error('Authentication failed: Unknown error')
    }
  }

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<FirebaseUser> {
    try {
      this.validateEmail(email)
      this.validatePassword(password)
      
      const credential = await createUserWithEmailAndPassword(this.auth, email, password)
      
      // Update profile with display name if provided
      if (displayName && credential.user) {
        await updateProfile(credential.user, { displayName })
      }
      
      const user = this.transformFirebaseUser(credential.user)
      
      if (!user) {
        throw new Error('User creation succeeded but user data is missing')
      }
      
      return user
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`User creation failed: ${error.message}`)
      }
      throw new Error('User creation failed: Unknown error')
    }
  }

  async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider)
      const user = this.transformFirebaseUser(result.user)
      
      if (!user) {
        throw new Error('Google authentication succeeded but user data is missing')
      }
      
      return user
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Authentication failed: ${error.message}`)
      }
      throw new Error('Authentication failed: Unknown error')
    }
  }

  getCurrentUser(): FirebaseUser | null {
    return this.transformFirebaseUser(this.auth.currentUser)
  }

  async getIdToken(forceRefresh: boolean = false): Promise<string> {
    const user = this.auth.currentUser
    
    if (!user) {
      throw new Error('No authenticated user found')
    }
    
    try {
      return await user.getIdToken(forceRefresh)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get ID token: ${error.message}`)
      }
      throw new Error('Failed to get ID token: Unknown error')
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Sign out failed: ${error.message}`)
      }
      throw new Error('Sign out failed: Unknown error')
    }
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return onAuthStateChanged(this.auth, (user) => {
      callback(this.transformFirebaseUser(user))
    })
  }

  async updateProfile(profileData: ProfileUpdate): Promise<void> {
    const user = this.auth.currentUser
    
    if (!user) {
      throw new Error('No authenticated user found')
    }
    
    try {
      ProfileUpdateSchema.parse(profileData)
      await updateProfile(user, profileData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid profile data: ${error.errors.map(e => e.message).join(', ')}`)
      }
      if (error instanceof Error) {
        throw new Error(`Profile update failed: ${error.message}`)
      }
      throw new Error('Profile update failed: Unknown error')
    }
  }

  // Additional utility methods
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null
  }

  async waitForAuthState(): Promise<FirebaseUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe()
        resolve(this.transformFirebaseUser(user))
      })
    })
  }

  // Get Firebase Auth instance for advanced operations
  getAuth(): Auth {
    return this.auth
  }

  // Get Firebase App instance
  getApp(): FirebaseApp {
    return this.app
  }
}