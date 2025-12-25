'use server'

import { prisma } from '@/lib/prisma'

/**
 * Check if a user exists with the given email
 * Note: This is used for providing better error messages
 * Security consideration: This enables account enumeration
 */
export async function checkUserExists(email: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true }
        })
        return !!user
    } catch (error) {
        console.error('Error checking user existence:', error)
        // In case of error, assume user might exist to avoid false negatives
        return true
    }
}
