'use client'

import { createAuthClient } from 'better-auth/react'

// Types for Better Auth session
interface User {
    id: string
    email: string
    name: string | null
    emailVerified: boolean
    image: string | null
    createdAt: Date
    updatedAt: Date
}

interface Session {
    id: string
    userId: string
    expiresAt: Date
    token: string
    createdAt: Date
    updatedAt: Date
    user: User
}

export const authClient = createAuthClient()

// Re-export with proper types
export const { useSession, signIn, signUp, signOut } = authClient

// Type helper for session data
export type { User, Session }
