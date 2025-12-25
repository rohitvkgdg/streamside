'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient, useSession } from '@/lib/auth-client'
import { IconVideo, IconBrandGoogle } from '@tabler/icons-react'

type AuthMode = 'signin' | 'signup'

const MIN_PASSWORD_LENGTH = 8

function getErrorMessage(error: unknown): { message: string; suggestSignup?: boolean } {
    let msg = 'Something went wrong. Please try again.'

    if (typeof error === 'string') {
        msg = error
    } else if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
            msg = error.message
        }
        if ('data' in error && error.data && typeof error.data === 'object' && 'message' in error.data) {
            const data = error.data as { message?: string }
            if (typeof data.message === 'string') msg = data.message
        }
        if ('code' in error && typeof error.code === 'string') {
            const code = error.code as string
            if (code === 'USER_NOT_FOUND' || code === 'INVALID_EMAIL_OR_PASSWORD') {
                return {
                    message: "No account found with this email. Please sign up first!",
                    suggestSignup: true
                }
            }
        }
    }

    const lowerMsg = msg.toLowerCase()
    if (lowerMsg.includes('user not found') || lowerMsg.includes('no user') || lowerMsg.includes('invalid email or password')) {
        return {
            message: "No account found with this email. Please sign up first!",
            suggestSignup: true
        }
    }

    return { message: msg }
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
    const [error, setError] = useState<{ message: string; suggestSignup?: boolean } | null>(null)
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
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-app)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin" />
                    <span style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
                </div>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: 'var(--color-bg-app)' }}
        >
            <div
                className="relative w-full max-w-sm p-8 rounded-xl"
                style={{
                    backgroundColor: 'var(--color-bg-raised)',
                    border: '1px solid var(--color-border-subtle)',
                }}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <IconVideo
                        size={28}
                        stroke={1.5}
                        style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }}
                    />
                    <h1
                        className="text-lg font-semibold mb-1"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        {mode === 'signin' ? 'Sign in' : 'Create account'}
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {mode === 'signin'
                            ? 'Continue to Streamside'
                            : 'Get started with recording'}
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div
                        className="mb-5 p-3 rounded-lg text-xs"
                        style={{
                            backgroundColor: 'rgba(255, 82, 97, 0.08)',
                            border: '1px solid rgba(255, 82, 97, 0.15)',
                            color: 'var(--color-text-danger)',
                        }}
                    >
                        <p>{error.message}</p>
                        {error.suggestSignup && mode === 'signin' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('signup')
                                    resetError()
                                }}
                                className="mt-2 font-medium underline hover:no-underline"
                                style={{ color: 'var(--color-accent-base)' }}
                            >
                                Create an account →
                            </button>
                        )}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-xs font-medium mb-1.5"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                autoComplete="name"
                                placeholder="Jane Creator"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onFocus={resetError}
                                className="w-full h-9 px-3 rounded-lg text-sm"
                                style={{
                                    backgroundColor: 'var(--color-bg-sunken)',
                                    border: '1px solid var(--color-border-subtle)',
                                    color: 'var(--color-text-primary)',
                                }}
                            />
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-medium mb-1.5"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={resetError}
                            className="w-full h-9 px-3 rounded-lg text-sm"
                            style={{
                                backgroundColor: 'var(--color-bg-sunken)',
                                border: '1px solid var(--color-border-subtle)',
                                color: 'var(--color-text-primary)',
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-medium mb-1.5"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={resetError}
                            className="w-full h-9 px-3 rounded-lg text-sm"
                            style={{
                                backgroundColor: 'var(--color-bg-sunken)',
                                border: '1px solid var(--color-border-subtle)',
                                color: 'var(--color-text-primary)',
                            }}
                        />
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                            Min. {MIN_PASSWORD_LENGTH} characters
                        </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-3.5 h-3.5 rounded"
                            style={{ accentColor: 'var(--color-accent-base)' }}
                        />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Keep me signed in
                        </span>
                    </label>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="w-full h-9 rounded-lg font-medium text-sm transition-all disabled:opacity-40"
                        style={{
                            backgroundColor: 'var(--color-accent-base)',
                            color: '#fff',
                        }}
                    >
                        {isSubmitting ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                </form>

                {/* Google OAuth */}
                {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true' && (
                    <>
                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full" style={{ borderTop: '1px solid var(--color-border-subtle)' }} />
                            </div>
                            <div className="relative flex justify-center">
                                <span
                                    className="px-2 text-xs"
                                    style={{
                                        backgroundColor: 'var(--color-bg-raised)',
                                        color: 'var(--color-text-subtle)',
                                    }}
                                >
                                    or
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isGoogleLoading}
                            className="w-full h-9 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid var(--color-border-subtle)',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            <IconBrandGoogle size={16} stroke={1.5} />
                            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                        </button>
                    </>
                )}

                {/* Toggle mode */}
                <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
                    {mode === 'signin' ? "No account?" : 'Have an account?'}{' '}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'signin' ? 'signup' : 'signin')
                            resetError()
                        }}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--color-accent-base)' }}
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
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-bg-app)' }}
        >
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin" />
                <span style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
            </div>
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
