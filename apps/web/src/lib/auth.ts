import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@/lib/prisma'

const betterAuthSecret = process.env.BETTER_AUTH_SECRET ?? 'build-time-placeholder-secret'
const betterAuthUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Check if Google OAuth is configured
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const isGoogleConfigured = googleClientId && googleClientSecret && googleClientId.length > 0 && googleClientSecret.length > 0

console.log('🔧 BetterAuth Configuration:')
console.log('  - baseURL:', betterAuthUrl)
console.log('  - Google OAuth configured:', isGoogleConfigured)
if (isGoogleConfigured) {
    console.log('  - Google Client ID:', googleClientId?.substring(0, 20) + '...')
    console.log('  - Redirect URI:', `${betterAuthUrl}/api/auth/callback/google`)
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    secret: betterAuthSecret,
    baseURL: betterAuthUrl,
    trustedOrigins: [
        'http://localhost:3000',
        betterAuthUrl,
    ],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        autoSignIn: true,
    },
    socialProviders: isGoogleConfigured ? {
        google: {
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
            // Use 'query' response mode (GET redirect) instead of 'form_post' (POST)
            // This avoids SameSite cookie issues that prevent PKCE state cookies from being sent
            responseMode: 'query',
        },
    } : undefined,
    advanced: {
        useSecureCookies: false, // Must be false for localhost (HTTP)
        defaultCookieAttributes: {
            sameSite: 'lax', // Required for OAuth redirects to work
            path: '/',
        },
    },
    plugins: [nextCookies()],
})

