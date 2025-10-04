import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  FirebaseFirestoreService,
  type FirestoreUser,
  type FirestoreSubscription,
  type FirestoreOrganization,
  type FirestoreConfig,
} from '../firebase-firestore'

// Mock Firestore
const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(),
    fromDate: vi.fn(),
  },
}

const mockCollectionRef = {
  doc: vi.fn(),
  add: vi.fn(),
  get: vi.fn(),
}

const mockDocumentRef = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  onSnapshot: vi.fn(),
}

const mockDocumentSnapshot = {
  exists: vi.fn(),
  data: vi.fn(),
  id: 'test-doc-id',
}

const mockQuerySnapshot = {
  docs: [mockDocumentSnapshot],
  size: 1,
  empty: false,
  forEach: vi.fn(),
}

vi.mock('firebase/firestore', () => ({
  getFirestore: () => mockFirestore,
  collection: (...args: unknown[]) => {
    mockFirestore.collection(...args)
    return mockCollectionRef
  },
  doc: (...args: unknown[]) => {
    mockFirestore.doc(...args)
    return mockDocumentRef
  },
  getDoc: (...args: unknown[]) => mockFirestore.getDoc(...args),
  getDocs: (...args: unknown[]) => mockFirestore.getDocs(...args),
  addDoc: (...args: unknown[]) => mockFirestore.addDoc(...args),
  setDoc: (...args: unknown[]) => mockFirestore.setDoc(...args),
  updateDoc: (...args: unknown[]) => mockFirestore.updateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockFirestore.deleteDoc(...args),
  query: (...args: unknown[]) => mockFirestore.query(...args),
  where: (...args: unknown[]) => mockFirestore.where(...args),
  orderBy: (...args: unknown[]) => mockFirestore.orderBy(...args),
  limit: (...args: unknown[]) => mockFirestore.limit(...args),
  onSnapshot: (...args: unknown[]) => mockFirestore.onSnapshot(...args),
  serverTimestamp: () => mockFirestore.serverTimestamp(),
  Timestamp: mockFirestore.Timestamp,
}))

describe('FirebaseFirestoreService', () => {
  let firestoreService: FirebaseFirestoreService
  const mockConfig: FirestoreConfig = {
    apiKey: 'test-api-key',
    authDomain: 'test-domain.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test-bucket',
    messagingSenderId: '123456789',
    appId: 'test-app-id',
  }

  const mockUser: FirestoreUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/photo.jpg',
    organizationId: null,
    role: 'user',
    subscription: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockSubscription: FirestoreSubscription = {
    stripeId: 'sub_123',
    status: 'active',
    plan: 'monthly',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    firestoreService = new FirebaseFirestoreService(mockConfig)

    // Setup default mock returns
    mockFirestore.serverTimestamp.mockReturnValue({
      seconds: Date.now() / 1000,
    })
    mockFirestore.Timestamp.now.mockReturnValue({ seconds: Date.now() / 1000 })
    mockDocumentSnapshot.exists.mockReturnValue(true)
    mockDocumentSnapshot.data.mockReturnValue(mockUser)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(firestoreService).toBeInstanceOf(FirebaseFirestoreService)
    })

    it('should throw error with invalid configuration', () => {
      const invalidConfig = { ...mockConfig, projectId: '' }
      expect(() => new FirebaseFirestoreService(invalidConfig)).toThrow()
    })
  })

  describe('user operations', () => {
    it('should create user successfully', async () => {
      const newUser = {
        email: 'new@example.com',
        name: 'New User',
        picture: null,
        role: 'user' as const,
      }

      mockFirestore.setDoc.mockResolvedValue(void 0)

      await firestoreService.createUser('user-456', newUser)

      expect(mockFirestore.setDoc).toHaveBeenCalledWith(
        mockDocumentRef,
        expect.objectContaining({
          id: 'user-456',
          email: newUser.email,
          name: newUser.name,
          picture: newUser.picture,
          role: newUser.role,
          organizationId: null,
          subscription: null,
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      )
    })

    it('should get user by ID successfully', async () => {
      mockFirestore.getDoc.mockResolvedValue(mockDocumentSnapshot)

      const user = await firestoreService.getUser('user-123')

      expect(mockFirestore.getDoc).toHaveBeenCalled()
      expect(user).toEqual(mockUser)
    })

    it('should return null for non-existent user', async () => {
      mockDocumentSnapshot.exists.mockReturnValue(false)
      mockFirestore.getDoc.mockResolvedValue(mockDocumentSnapshot)

      const user = await firestoreService.getUser('non-existent')

      expect(user).toBeNull()
    })

    it('should update user successfully', async () => {
      const updates = {
        name: 'Updated Name',
        picture: 'https://example.com/new-photo.jpg',
      }

      mockFirestore.updateDoc.mockResolvedValue(void 0)

      await firestoreService.updateUser('user-123', updates)

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        mockDocumentRef,
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Object),
        })
      )
    })

    it('should get user by email successfully', async () => {
      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot)

      const user = await firestoreService.getUserByEmail('test@example.com')

      expect(mockFirestore.getDocs).toHaveBeenCalled()
      expect(user).toEqual(mockUser)
    })

    it('should validate user data before creation', async () => {
      const invalidUser = {
        email: 'invalid-email',
        name: '',
        picture: null,
        role: 'invalid-role' as any,
      }

      await expect(
        firestoreService.createUser('user-456', invalidUser)
      ).rejects.toThrow('Invalid user data')
    })
  })

  describe('subscription operations', () => {
    it('should update user subscription successfully', async () => {
      mockFirestore.updateDoc.mockResolvedValue(void 0)

      await firestoreService.updateUserSubscription(
        'user-123',
        mockSubscription
      )

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        mockDocumentRef,
        expect.objectContaining({
          subscription: mockSubscription,
          updatedAt: expect.any(Object),
        })
      )
    })

    it('should cancel user subscription', async () => {
      mockFirestore.updateDoc.mockResolvedValue(void 0)

      await firestoreService.cancelUserSubscription('user-123')

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        mockDocumentRef,
        expect.objectContaining({
          subscription: null,
          updatedAt: expect.any(Object),
        })
      )
    })

    it('should get users by subscription status', async () => {
      const activeUsers = [mockUser]
      mockQuerySnapshot.docs = activeUsers.map((user) => ({
        id: user.id,
        data: () => user,
        exists: () => true,
      }))
      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot)

      const users =
        await firestoreService.getUsersBySubscriptionStatus('active')

      expect(mockFirestore.getDocs).toHaveBeenCalled()
      expect(users).toHaveLength(1)
    })

    it('should validate subscription data', async () => {
      const invalidSubscription = {
        stripeId: '',
        status: 'invalid-status' as any,
        plan: 'invalid-plan' as any,
        currentPeriodEnd: 'invalid-date' as any,
      }

      await expect(
        firestoreService.updateUserSubscription('user-123', invalidSubscription)
      ).rejects.toThrow('Invalid subscription data')
    })
  })

  describe('organization operations', () => {
    const mockOrganization: FirestoreOrganization = {
      id: 'org-123',
      name: 'Test Organization',
      plan: 'team',
      memberCount: 5,
      apiAccess: true,
      customBranding: {
        logo: 'https://example.com/logo.png',
        primaryColor: '#000000',
        name: 'Custom Brand',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create organization successfully', async () => {
      const orgData = {
        name: 'New Organization',
        plan: 'team' as const,
        memberCount: 1,
        apiAccess: false,
      }

      mockFirestore.addDoc.mockResolvedValue({ id: 'org-456' })

      const orgId = await firestoreService.createOrganization(orgData)

      expect(mockFirestore.addDoc).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.objectContaining({
          ...orgData,
          customBranding: null,
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      )
      expect(orgId).toBe('org-456')
    })

    it('should get organization by ID', async () => {
      mockDocumentSnapshot.data.mockReturnValue(mockOrganization)
      mockFirestore.getDoc.mockResolvedValue(mockDocumentSnapshot)

      const organization = await firestoreService.getOrganization('org-123')

      expect(organization).toEqual(mockOrganization)
    })

    it('should update organization', async () => {
      const updates = {
        name: 'Updated Organization',
        memberCount: 10,
      }

      mockFirestore.updateDoc.mockResolvedValue(void 0)

      await firestoreService.updateOrganization('org-123', updates)

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        mockDocumentRef,
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Object),
        })
      )
    })

    it('should add user to organization', async () => {
      mockFirestore.updateDoc.mockResolvedValue(void 0)

      await firestoreService.addUserToOrganization(
        'user-123',
        'org-123',
        'member'
      )

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        mockDocumentRef,
        expect.objectContaining({
          organizationId: 'org-123',
          role: 'member',
          updatedAt: expect.any(Object),
        })
      )
    })

    it('should get organization members', async () => {
      const members = [mockUser]
      mockQuerySnapshot.docs = members.map((user) => ({
        id: user.id,
        data: () => user,
        exists: () => true,
      }))
      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot)

      const orgMembers =
        await firestoreService.getOrganizationMembers('org-123')

      expect(orgMembers).toHaveLength(1)
      expect(orgMembers[0]).toEqual(mockUser)
    })
  })

  describe('real-time subscriptions', () => {
    it('should setup user subscription listener', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()
      mockFirestore.onSnapshot.mockReturnValue(mockUnsubscribe)

      const unsubscribe = firestoreService.subscribeToUser(
        'user-123',
        mockCallback
      )

      expect(mockFirestore.onSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it('should call callback with user data on update', () => {
      const mockCallback = vi.fn()
      let snapshotCallback: (snapshot: any) => void

      mockFirestore.onSnapshot.mockImplementation((ref, callback) => {
        snapshotCallback = callback
        return vi.fn()
      })

      firestoreService.subscribeToUser('user-123', mockCallback)

      // Simulate snapshot update
      snapshotCallback(mockDocumentSnapshot)

      expect(mockCallback).toHaveBeenCalledWith(mockUser)
    })

    it('should handle user deletion in subscription', () => {
      const mockCallback = vi.fn()
      let snapshotCallback: (snapshot: any) => void

      mockDocumentSnapshot.exists.mockReturnValue(false)
      mockFirestore.onSnapshot.mockImplementation((ref, callback) => {
        snapshotCallback = callback
        return vi.fn()
      })

      firestoreService.subscribeToUser('user-123', mockCallback)

      // Simulate user deletion
      snapshotCallback(mockDocumentSnapshot)

      expect(mockCallback).toHaveBeenCalledWith(null)
    })

    it('should setup organization members subscription', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()
      mockFirestore.onSnapshot.mockReturnValue(mockUnsubscribe)

      const unsubscribe = firestoreService.subscribeToOrganizationMembers(
        'org-123',
        mockCallback
      )

      expect(mockFirestore.onSnapshot).toHaveBeenCalled()
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })

  describe('query operations', () => {
    it('should get users with pagination', async () => {
      const users = [mockUser]
      mockQuerySnapshot.docs = users.map((user) => ({
        id: user.id,
        data: () => user,
        exists: () => true,
      }))
      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot)

      const result = await firestoreService.getUsers({
        limit: 10,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      })

      expect(result.users).toHaveLength(1)
      expect(result.hasMore).toBe(false)
    })

    it('should search users by name', async () => {
      const users = [mockUser]
      mockQuerySnapshot.docs = users.map((user) => ({
        id: user.id,
        data: () => user,
        exists: () => true,
      }))
      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot)

      const searchResults = await firestoreService.searchUsers('Test')

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0]).toEqual(mockUser)
    })

    it('should get organizations with filters', async () => {
      const organizations = [mockOrganization]
      mockQuerySnapshot.docs = organizations.map((org) => ({
        id: org.id,
        data: () => org,
        exists: () => true,
      }))
      mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot)

      const result = await firestoreService.getOrganizations({
        plan: 'team',
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockOrganization)
    })
  })

  describe('batch operations', () => {
    it('should perform batch user updates', async () => {
      const userUpdates = [
        { id: 'user-1', updates: { name: 'User 1' } },
        { id: 'user-2', updates: { name: 'User 2' } },
      ]

      mockFirestore.updateDoc.mockResolvedValue(void 0)

      await firestoreService.batchUpdateUsers(userUpdates)

      expect(mockFirestore.updateDoc).toHaveBeenCalledTimes(2)
    })

    it('should handle batch operation errors', async () => {
      const userUpdates = [{ id: 'user-1', updates: { name: 'User 1' } }]

      mockFirestore.updateDoc.mockRejectedValue(
        new Error('Batch operation failed')
      )

      await expect(
        firestoreService.batchUpdateUsers(userUpdates)
      ).rejects.toThrow('Batch update failed')
    })
  })

  describe('error handling', () => {
    it('should handle Firestore errors appropriately', async () => {
      const firestoreError = new Error('Firestore: Permission denied')
      mockFirestore.getDoc.mockRejectedValue(firestoreError)

      await expect(firestoreService.getUser('user-123')).rejects.toThrow(
        'Failed to get user: Firestore: Permission denied'
      )
    })

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed')
      mockFirestore.setDoc.mockRejectedValue(networkError)

      await expect(
        firestoreService.createUser('user-123', {
          email: 'test@example.com',
          name: 'Test',
          picture: null,
          role: 'user',
        })
      ).rejects.toThrow('Failed to create user: Network request failed')
    })
  })

  describe('data validation', () => {
    it('should validate user data with schema', () => {
      const validUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: null,
        organizationId: null,
        role: 'user',
        subscription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() => firestoreService.validateUser(validUser)).not.toThrow()
    })

    it('should reject invalid user data', () => {
      const invalidUser = {
        id: '',
        email: 'invalid-email',
        name: null,
        role: 'invalid-role',
      }

      expect(() => firestoreService.validateUser(invalidUser)).toThrow()
    })

    it('should validate subscription data', () => {
      const validSubscription = {
        stripeId: 'sub_123',
        status: 'active',
        plan: 'monthly',
        currentPeriodEnd: new Date(),
      }

      expect(() =>
        firestoreService.validateSubscription(validSubscription)
      ).not.toThrow()
    })

    it('should validate organization data', () => {
      const validOrganization = {
        id: 'org-123',
        name: 'Test Org',
        plan: 'team',
        memberCount: 5,
        apiAccess: true,
        customBranding: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(() =>
        firestoreService.validateOrganization(validOrganization)
      ).not.toThrow()
    })
  })
})
