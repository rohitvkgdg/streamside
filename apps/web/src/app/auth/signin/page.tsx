'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient, useSession } from '@/lib/auth-client'

type AuthMode = 'signin' | 'signup'

const MIN_PASSWORD_LENGTH = 8

const googleIcon = (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
)

function getErrorMessage(error: unknown) {
    if (typeof error === 'string') return error
    if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
            return error.message
        }
        if ('data' in error && error.data && typeof error.data === 'object' && 'message' in error.data) {
            const data = error.data as { message?: string }
            if (typeof data.message === 'string') return data.message
        }
    }
    return 'Something went wrong. Please try again.'
}

function fallbackName(email: string) {
    if (!email.includes('@')) return 'Streamside Creator'
    return email.split('@')[0]
}

function SignInForm() {
    const [mode, setMode] = useState<AuthMode>('signin')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session, isPending } = useSession()
    const callbackUrl = searchParams?.get('callbackUrl') ?? '/dashboard'

    useEffect(() => {
        if (!isPending && session) {
            router.replace(callbackUrl)
        }
    }, [session, isPending, router, callbackUrl])

    const resetError = () => setError(null)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsSubmitting(true)
        resetError()

        try {
            if (mode === 'signin') {
                await authClient.signIn.email({
                    email,
                    password,
                    callbackURL: callbackUrl,
                    rememberMe,
                })
            } else {
                await authClient.signUp.email({
                    name: name.trim() || fallbackName(email),
                    email,
                    password,
                    callbackURL: callbackUrl,
                })
            }
            router.push(callbackUrl)
        } catch (err) {
            console.error('Email auth error:', err)
            setError(getErrorMessage(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGoogleSignIn = async () => {
        resetError()
        setIsGoogleLoading(true)
        try {
            await authClient.signIn.social({
                provider: 'google',
                callbackURL: callbackUrl,
            })
        } catch (err) {
            console.error('Google sign-in error:', err)
            setError(getErrorMessage(err))
        } finally {
            setIsGoogleLoading(false)
        }
    }

    const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH
    const canSubmit =
        !!email &&
        isPasswordValid &&
        (mode === 'signin' || !!name.trim()) &&
        !isSubmitting

    if (isPending && !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
                <p className="text-gray-700">Checking your session...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {mode === 'signin'
                            ? 'Sign in to start recording high-quality sessions'
                            : 'Spin up an account to launch your first studio'}
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                className="mt-1 appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Jane Creator"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                onFocus={resetError}
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="mt-1 appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            onFocus={resetError}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                            required
                            className="mt-1 appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="••••••••"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            onFocus={resetError}
                        />
                        <p className="mt-1 text-xs text-gray-500">Use at least {MIN_PASSWORD_LENGTH} characters.</p>
                    </div>

                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(event) => setRememberMe(event.target.checked)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <span>Keep me signed in on this device</span>
                    </label>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Working...' : mode === 'signin' ? 'Sign in with email' : 'Create account'}
                    </button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleLoading}
                            className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {googleIcon}
                            <span>{isGoogleLoading ? 'Connecting…' : 'Google'}</span>
                        </button>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-600">
                    {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}{' '}
                    <button
                        type="button"
                        onClick={() => {
                            setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
                            resetError()
                        }}
                        className="font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                        {mode === 'signin' ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
            <p className="text-gray-700">Loading...</p>
        </div>
    )
}

export default function SignIn() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <SignInForm />
        </Suspense>
    )
}
