import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Firestore,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
  type Query,
  type CollectionReference,
  type DocumentReference
} from 'firebase/firestore'
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { z } from 'zod'

export const FirestoreConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  authDomain: z.string().min(1, 'Auth domain is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  storageBucket: z.string().min(1, 'Storage bucket is required'),
  messagingSenderId: z.string().min(1, 'Messaging sender ID is required'),
  appId: z.string().min(1, 'App ID is required')
})

export const FirestoreUserRoleSchema = z.enum(['user', 'admin', 'owner', 'member'])
export const SubscriptionStatusSchema = z.enum(['active', 'canceled', 'past_due', 'incomplete'])
export const SubscriptionPlanSchema = z.enum(['monthly', 'annual', 'enterprise'])
export const OrganizationPlanSchema = z.enum(['team', 'enterprise'])

export const FirestoreSubscriptionSchema = z.object({
  stripeId: z.string().min(1),
  status: SubscriptionStatusSchema,
  plan: SubscriptionPlanSchema,
  currentPeriodEnd: z.date()
})

export const CustomBrandingSchema = z.object({
  logo: z.string().url(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  name: z.string().min(1)
})

export const FirestoreUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable(),
  picture: z.string().url().nullable(),
  organizationId: z.string().nullable(),
  role: FirestoreUserRoleSchema,
  subscription: FirestoreSubscriptionSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const FirestoreOrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  plan: OrganizationPlanSchema,
  memberCount: z.number().min(0),
  apiAccess: z.boolean(),
  customBranding: CustomBrandingSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type FirestoreConfig = z.infer<typeof FirestoreConfigSchema>
export type FirestoreUserRole = z.infer<typeof FirestoreUserRoleSchema>
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>
export type OrganizationPlan = z.infer<typeof OrganizationPlanSchema>
export type FirestoreSubscription = z.infer<typeof FirestoreSubscriptionSchema>
export type CustomBranding = z.infer<typeof CustomBrandingSchema>
export type FirestoreUser = z.infer<typeof FirestoreUserSchema>
export type FirestoreOrganization = z.infer<typeof FirestoreOrganizationSchema>

// Input types for operations
export type CreateUserInput = {
  email: string
  name: string | null
  picture: string | null
  role: FirestoreUserRole
}

export type UpdateUserInput = Partial<Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>>

export type CreateOrganizationInput = {
  name: string
  plan: OrganizationPlan
  memberCount: number
  apiAccess: boolean
  customBranding?: CustomBranding | null
}

export type UpdateOrganizationInput = Partial<Omit<FirestoreOrganization, 'id' | 'createdAt' | 'updatedAt'>>

export type PaginationOptions = {
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  startAfter?: any
}

export type UsersResult = {
  users: FirestoreUser[]
  hasMore: boolean
  lastDoc?: any
}

export class FirebaseFirestoreService {
  private app: FirebaseApp
  private db: Firestore

  constructor(config: FirestoreConfig) {
    try {
      FirestoreConfigSchema.parse(config)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid Firestore configuration: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw error
    }

    this.app = initializeApp(config)
    this.db = getFirestore(this.app)
  }

  // Data transformation utilities
  private transformTimestamp(timestamp: any): Date {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate()
    }
    if (timestamp instanceof Date) {
      return timestamp
    }
    return new Date(timestamp)
  }

  private transformDocumentData<T>(data: any, id: string): T {
    const transformed = { ...data, id }
    
    // Transform Firestore timestamps to Date objects
    if (transformed.createdAt) {
      transformed.createdAt = this.transformTimestamp(transformed.createdAt)
    }
    if (transformed.updatedAt) {
      transformed.updatedAt = this.transformTimestamp(transformed.updatedAt)
    }
    if (transformed.subscription?.currentPeriodEnd) {
      transformed.subscription.currentPeriodEnd = this.transformTimestamp(transformed.subscription.currentPeriodEnd)
    }

    return transformed as T
  }

  // Validation methods
  public validateUser(user: unknown): void {
    try {
      FirestoreUserSchema.parse(user)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid user data: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw error
    }
  }

  public validateSubscription(subscription: unknown): void {
    try {
      FirestoreSubscriptionSchema.parse(subscription)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid subscription data: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw error
    }
  }

  public validateOrganization(organization: unknown): void {
    try {
      FirestoreOrganizationSchema.parse(organization)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid organization data: ${error.errors.map(e => e.message).join(', ')}`)
      }
      throw error
    }
  }

  // User operations
  async createUser(userId: string, userData: CreateUserInput): Promise<void> {
    try {
      // Validate input data
      const userToCreate = {
        id: userId,
        ...userData,
        organizationId: null,
        subscription: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.validateUser(userToCreate)

      const userRef = doc(this.db, 'users', userId)
      await setDoc(userRef, {
        ...userToCreate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create user: ${error.message}`)
      }
      throw new Error('Failed to create user: Unknown error')
    }
  }

  async getUser(userId: string): Promise<FirestoreUser | null> {
    try {
      const userRef = doc(this.db, 'users', userId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        return null
      }

      return this.transformDocumentData<FirestoreUser>(userSnap.data(), userSnap.id)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get user: ${error.message}`)
      }
      throw new Error('Failed to get user: Unknown error')
    }
  }

  async updateUser(userId: string, updates: UpdateUserInput): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update user: ${error.message}`)
      }
      throw new Error('Failed to update user: Unknown error')
    }
  }

  async getUserByEmail(email: string): Promise<FirestoreUser | null> {
    try {
      const usersRef = collection(this.db, 'users')
      const q = query(usersRef, where('email', '==', email), limit(1))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      return this.transformDocumentData<FirestoreUser>(doc.data(), doc.id)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get user by email: ${error.message}`)
      }
      throw new Error('Failed to get user by email: Unknown error')
    }
  }

  // Subscription operations
  async updateUserSubscription(userId: string, subscription: FirestoreSubscription): Promise<void> {
    try {
      this.validateSubscription(subscription)

      const userRef = doc(this.db, 'users', userId)
      await updateDoc(userRef, {
        subscription: {
          ...subscription,
          currentPeriodEnd: Timestamp.fromDate(subscription.currentPeriodEnd)
        },
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update user subscription: ${error.message}`)
      }
      throw new Error('Failed to update user subscription: Unknown error')
    }
  }

  async cancelUserSubscription(userId: string): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId)
      await updateDoc(userRef, {
        subscription: null,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to cancel user subscription: ${error.message}`)
      }
      throw new Error('Failed to cancel user subscription: Unknown error')
    }
  }

  async getUsersBySubscriptionStatus(status: SubscriptionStatus): Promise<FirestoreUser[]> {
    try {
      const usersRef = collection(this.db, 'users')
      const q = query(usersRef, where('subscription.status', '==', status))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => 
        this.transformDocumentData<FirestoreUser>(doc.data(), doc.id)
      )
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get users by subscription status: ${error.message}`)
      }
      throw new Error('Failed to get users by subscription status: Unknown error')
    }
  }

  // Organization operations
  async createOrganization(orgData: CreateOrganizationInput): Promise<string> {
    try {
      const orgToCreate = {
        ...orgData,
        customBranding: orgData.customBranding || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.validateOrganization({ ...orgToCreate, id: 'temp' })

      const orgsRef = collection(this.db, 'organizations')
      const docRef = await addDoc(orgsRef, {
        ...orgToCreate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      return docRef.id
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create organization: ${error.message}`)
      }
      throw new Error('Failed to create organization: Unknown error')
    }
  }

  async getOrganization(orgId: string): Promise<FirestoreOrganization | null> {
    try {
      const orgRef = doc(this.db, 'organizations', orgId)
      const orgSnap = await getDoc(orgRef)

      if (!orgSnap.exists()) {
        return null
      }

      return this.transformDocumentData<FirestoreOrganization>(orgSnap.data(), orgSnap.id)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get organization: ${error.message}`)
      }
      throw new Error('Failed to get organization: Unknown error')
    }
  }

  async updateOrganization(orgId: string, updates: UpdateOrganizationInput): Promise<void> {
    try {
      const orgRef = doc(this.db, 'organizations', orgId)
      await updateDoc(orgRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update organization: ${error.message}`)
      }
      throw new Error('Failed to update organization: Unknown error')
    }
  }

  async addUserToOrganization(userId: string, orgId: string, role: FirestoreUserRole): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId)
      await updateDoc(userRef, {
        organizationId: orgId,
        role,
        updatedAt: serverTimestamp()
      })

      // Update organization member count
      const orgRef = doc(this.db, 'organizations', orgId)
      const orgSnap = await getDoc(orgRef)
      if (orgSnap.exists()) {
        const orgData = orgSnap.data() as FirestoreOrganization
        await updateDoc(orgRef, {
          memberCount: orgData.memberCount + 1,
          updatedAt: serverTimestamp()
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to add user to organization: ${error.message}`)
      }
      throw new Error('Failed to add user to organization: Unknown error')
    }
  }

  async getOrganizationMembers(orgId: string): Promise<FirestoreUser[]> {
    try {
      const usersRef = collection(this.db, 'users')
      const q = query(usersRef, where('organizationId', '==', orgId))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => 
        this.transformDocumentData<FirestoreUser>(doc.data(), doc.id)
      )
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get organization members: ${error.message}`)
      }
      throw new Error('Failed to get organization members: Unknown error')
    }
  }

  // Real-time subscriptions
  subscribeToUser(userId: string, callback: (user: FirestoreUser | null) => void): Unsubscribe {
    const userRef = doc(this.db, 'users', userId)
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const user = this.transformDocumentData<FirestoreUser>(doc.data(), doc.id)
        callback(user)
      } else {
        callback(null)
      }
    })
  }

  subscribeToOrganizationMembers(orgId: string, callback: (members: FirestoreUser[]) => void): Unsubscribe {
    const usersRef = collection(this.db, 'users')
    const q = query(usersRef, where('organizationId', '==', orgId))
    
    return onSnapshot(q, (querySnapshot) => {
      const members = querySnapshot.docs.map(doc => 
        this.transformDocumentData<FirestoreUser>(doc.data(), doc.id)
      )
      callback(members)
    })
  }

  // Query operations with pagination
  async getUsers(options: PaginationOptions = {}): Promise<UsersResult> {
    try {
      const usersRef = collection(this.db, 'users')
      let q: Query = usersRef

      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.orderDirection || 'asc'))
      }

      if (options.startAfter) {
        q = query(q, options.startAfter)
      }

      if (options.limit) {
        q = query(q, limit(options.limit + 1)) // Get one extra to check if there are more
      }

      const querySnapshot = await getDocs(q)
      const docs = querySnapshot.docs
      
      let users: FirestoreUser[]
      let hasMore = false

      if (options.limit && docs.length > options.limit) {
        users = docs.slice(0, options.limit).map(doc => 
          this.transformDocumentData<FirestoreUser>(doc.data(), doc.id)
        )
        hasMore = true
      } else {
        users = docs.map(doc => 
          this.transformDocumentData<FirestoreUser>(doc.data(), doc.id)
        )
        hasMore = false
      }

      return {
        users,
        hasMore,
        lastDoc: users.length > 0 ? docs[users.length - 1] : undefined
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get users: ${error.message}`)
      }
      throw new Error('Failed to get users: Unknown error')
    }
  }

  async searchUsers(searchTerm: string): Promise<FirestoreUser[]> {
    try {
      const usersRef = collection(this.db, 'users')
      const q = query(
        usersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        limit(10)
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => 
        this.transformDocumentData<FirestoreUser>(doc.data(), doc.id)
      )
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search users: ${error.message}`)
      }
      throw new Error('Failed to search users: Unknown error')
    }
  }

  async getOrganizations(filters: { plan?: OrganizationPlan } = {}): Promise<FirestoreOrganization[]> {
    try {
      const orgsRef = collection(this.db, 'organizations')
      let q: Query = orgsRef

      if (filters.plan) {
        q = query(q, where('plan', '==', filters.plan))
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => 
        this.transformDocumentData<FirestoreOrganization>(doc.data(), doc.id)
      )
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get organizations: ${error.message}`)
      }
      throw new Error('Failed to get organizations: Unknown error')
    }
  }

  // Batch operations
  async batchUpdateUsers(updates: Array<{ id: string; updates: UpdateUserInput }>): Promise<void> {
    try {
      const promises = updates.map(({ id, updates: userUpdates }) => 
        this.updateUser(id, userUpdates)
      )
      
      await Promise.all(promises)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Batch update failed: ${error.message}`)
      }
      throw new Error('Batch update failed: Unknown error')
    }
  }

  // Utility methods
  getFirestore(): Firestore {
    return this.db
  }

  getApp(): FirebaseApp {
    return this.app
  }
}