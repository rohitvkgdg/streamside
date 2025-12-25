'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { IconVideo, IconAlertTriangle } from '@tabler/icons-react'

interface StudioInfo {
    id: string
    name: string
    hostName: string
}

interface GuestData {
    guestName: string
    guestId: string
    studioId: string
    timestamp: number
}

// Guest session helpers using localStorage for persistence across tab switches
const GUEST_STORAGE_KEY = 'streamside_guest'
const GUEST_SESSION_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getStoredGuest(): GuestData | null {
    if (typeof window === 'undefined') return null
    try {
        const stored = localStorage.getItem(GUEST_STORAGE_KEY)
        if (!stored) return null
        const data = JSON.parse(stored) as GuestData
        // Check if session is still valid
        if (Date.now() - data.timestamp > GUEST_SESSION_TTL) {
            localStorage.removeItem(GUEST_STORAGE_KEY)
            return null
        }
        return data
    } catch {
        return null
    }
}

function storeGuest(name: string, studioId: string): GuestData {
    const data: GuestData = {
        guestName: name,
        guestId: `guest-${Math.random().toString(36).substring(2, 11)}`,
        studioId,
        timestamp: Date.now(),
    }
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data))
    // Also set in sessionStorage for compatibility
    sessionStorage.setItem('guestName', data.guestName)
    sessionStorage.setItem('guestId', data.guestId)
    return data
}

export default function InvitePage() {
    const params = useParams()
    const router = useRouter()
    const inviteCode = params?.code as string | undefined

    const [studioInfo, setStudioInfo] = useState<StudioInfo | null>(null)
    const [guestName, setGuestName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Track if we've already fetched to prevent double-fetching
    const hasFetched = useRef(false)

    useEffect(() => {
        if (!inviteCode || hasFetched.current) return
        hasFetched.current = true

        async function lookupStudio() {
            try {
                setIsLoading(true)
                setError(null)

                const res = await fetch('/api/studios/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inviteCode }),
                })

                const data = await res.json()

                if (!res.ok) {
                    setError(data.error || 'Failed to find studio')
                    return
                }

                setStudioInfo(data.studio)

                // Check if we have a valid stored guest session for this studio
                const storedGuest = getStoredGuest()
                if (storedGuest && storedGuest.studioId === data.studio.id) {
                    // Auto-rejoin with existing guest session
                    sessionStorage.setItem('guestName', storedGuest.guestName)
                    sessionStorage.setItem('guestId', storedGuest.guestId)
                    router.push(`/studio/${data.studio.id}`)
                    return
                }
            } catch (err) {
                setError('Failed to connect. Please try again.')
                console.error('Error looking up studio:', err)
            } finally {
                setIsLoading(false)
            }
        }

        lookupStudio()
    }, [inviteCode, router])

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!studioInfo || !guestName.trim()) return

        setIsJoining(true)

        // Store guest data with persistence
        storeGuest(guestName.trim(), studioInfo.id)

        router.push(`/studio/${studioInfo.id}`)
    }

    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-bg-app)' }}
            >
                <div className="text-center">
                    <div className="w-5 h-5 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Finding studio...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ backgroundColor: 'var(--color-bg-app)' }}
            >
                <div
                    className="max-w-sm w-full p-6 rounded-lg text-center"
                    style={{
                        backgroundColor: 'var(--color-bg-raised)',
                        border: '1px solid var(--color-border-subtle)',
                    }}
                >
                    <IconAlertTriangle size={28} stroke={1.5} style={{ color: 'var(--color-text-danger)', margin: '0 auto 12px' }} />
                    <h1 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        Studio Not Found
                    </h1>
                    <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
                        {error}
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="h-8 px-4 rounded-md text-xs font-medium"
                        style={{
                            backgroundColor: 'var(--color-bg-overlay)',
                            border: '1px solid var(--color-border-subtle)',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        Go Home
                    </button>
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
                className="max-w-sm w-full p-6 rounded-lg"
                style={{
                    backgroundColor: 'var(--color-bg-raised)',
                    border: '1px solid var(--color-border-subtle)',
                }}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <IconVideo size={28} stroke={1.5} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
                    <h1 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                        Join {studioInfo?.name}
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Hosted by {studioInfo?.hostName}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label
                            htmlFor="guestName"
                            className="block text-xs font-medium mb-1.5"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Your Name
                        </label>
                        <input
                            id="guestName"
                            type="text"
                            placeholder="Enter your name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            required
                            autoFocus
                            className="w-full h-9 px-3 rounded-md text-sm"
                            style={{
                                backgroundColor: 'var(--color-bg-sunken)',
                                border: '1px solid var(--color-border-subtle)',
                                color: 'var(--color-text-primary)',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isJoining || !guestName.trim()}
                        className="w-full h-9 rounded-md font-medium text-xs transition-all disabled:opacity-40"
                        style={{
                            backgroundColor: 'var(--color-accent-base)',
                            color: '#fff',
                        }}
                    >
                        {isJoining ? 'Joining...' : 'Join Studio'}
                    </button>
                </form>

                <p className="text-center text-xs mt-5" style={{ color: 'var(--color-text-subtle)' }}>
                    Your video will be recorded in high quality
                </p>
            </div>
        </div>
    )
}
