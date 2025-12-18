'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession, authClient } from '@/lib/auth-client'
import { IconVideo, IconCopy, IconCheck, IconPlayerRecord, IconLogout } from '@tabler/icons-react'

interface Studio {
    id: string
    name: string
    description: string | null
    inviteCode: string
    createdAt: string
    recordings: Array<{
        id: string
        participantName: string | null
        status: string
        size: string
        createdAt: string
    }>
}

export default function Dashboard() {
    const { data: session, isPending } = useSession()
    const router = useRouter()
    const [newStudioName, setNewStudioName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [isSigningOut, setIsSigningOut] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/signin')
        }
    }, [isPending, session, router])

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['studios'],
        queryFn: async () => {
            const res = await fetch('/api/studios')
            if (!res.ok) throw new Error('Failed to fetch studios')
            return res.json()
        },
        enabled: !!session && !isPending,
    })

    const handleCreateStudio = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newStudioName.trim()) return

        setIsCreating(true)
        try {
            const res = await fetch('/api/studios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newStudioName.trim() }),
            })
            if (!res.ok) throw new Error('Failed to create studio')
            setNewStudioName('')
            refetch()
        } catch (error) {
            console.error('Error creating studio:', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleSignOut = async () => {
        setIsSigningOut(true)
        try {
            await authClient.signOut()
            router.push('/auth/signin')
        } catch (error) {
            console.error('Sign out error:', error)
            setIsSigningOut(false)
        }
    }

    const copyInviteLink = (studioId: string, inviteCode: string) => {
        const inviteUrl = `${window.location.origin}/invite/${inviteCode}`
        navigator.clipboard.writeText(inviteUrl)
        setCopiedId(studioId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const studios: Studio[] = data?.studios || []

    if (!session && !isPending) return null

    if (isPending) {
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
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-app)' }}>
            {/* Top Bar */}
            <header
                className="h-12 flex items-center justify-between px-5"
                style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                }}
            >
                <div className="flex items-center gap-2">
                    <IconVideo size={18} stroke={1.5} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        Streamside
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {session?.user?.name || session?.user?.email}
                    </span>
                    <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="h-7 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                        style={{
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-border-subtle)',
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        <IconLogout size={14} stroke={1.5} />
                        {isSigningOut ? '...' : 'Sign out'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-5 py-8">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-lg font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                        Studios
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Create and manage recording studios
                    </p>
                </div>

                {/* Create Studio Form */}
                <form
                    onSubmit={handleCreateStudio}
                    className="p-4 rounded-lg mb-6"
                    style={{
                        backgroundColor: 'var(--color-bg-raised)',
                        border: '1px solid var(--color-border-subtle)',
                    }}
                >
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="New studio name..."
                            value={newStudioName}
                            onChange={(e) => setNewStudioName(e.target.value)}
                            className="flex-1 h-8 px-3 rounded-md text-sm"
                            style={{
                                backgroundColor: 'var(--color-bg-sunken)',
                                border: '1px solid var(--color-border-subtle)',
                                color: 'var(--color-text-primary)',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isCreating || !newStudioName.trim()}
                            className="h-8 px-3 rounded-md text-xs font-medium transition-all disabled:opacity-40"
                            style={{
                                backgroundColor: 'var(--color-accent-base)',
                                color: '#fff',
                            }}
                        >
                            {isCreating ? '...' : 'Create'}
                        </button>
                    </div>
                </form>

                {/* Studios List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin" />
                            <span style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
                        </div>
                    </div>
                ) : studios.length === 0 ? (
                    <div
                        className="py-16 text-center rounded-lg"
                        style={{
                            backgroundColor: 'var(--color-bg-raised)',
                            border: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        <IconVideo size={32} stroke={1} style={{ color: 'var(--color-text-subtle)', margin: '0 auto 12px' }} />
                        <h3 className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                            No studios yet
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Create your first studio above
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {studios.map((studio) => (
                            <div
                                key={studio.id}
                                className="p-4 rounded-lg"
                                style={{
                                    backgroundColor: 'var(--color-bg-raised)',
                                    border: '1px solid var(--color-border-subtle)',
                                }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                                            {studio.name}
                                        </h3>
                                        <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                                            {new Date(studio.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span
                                        className="px-2 py-0.5 text-xs rounded"
                                        style={{
                                            backgroundColor: 'var(--color-bg-overlay)',
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        {studio.recordings.length} rec
                                    </span>
                                </div>

                                {/* Invite Link */}
                                <div
                                    className="flex items-center gap-2 p-2 rounded-md mb-3"
                                    style={{ backgroundColor: 'var(--color-bg-sunken)' }}
                                >
                                    <input
                                        type="text"
                                        readOnly
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${studio.inviteCode}`}
                                        className="flex-1 text-xs bg-transparent border-none outline-none"
                                        style={{ color: 'var(--color-text-muted)' }}
                                    />
                                    <button
                                        onClick={() => copyInviteLink(studio.id, studio.inviteCode)}
                                        className="h-6 w-6 rounded flex items-center justify-center transition-colors"
                                        style={{
                                            backgroundColor: 'var(--color-bg-overlay)',
                                            color: copiedId === studio.id ? 'var(--color-text-success)' : 'var(--color-text-muted)',
                                        }}
                                    >
                                        {copiedId === studio.id ? (
                                            <IconCheck size={14} stroke={1.5} />
                                        ) : (
                                            <IconCopy size={14} stroke={1.5} />
                                        )}
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/studio/${studio.id}/recordings`)}
                                        className="flex-1 h-8 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                                        style={{
                                            backgroundColor: 'var(--color-bg-overlay)',
                                            border: '1px solid var(--color-border-subtle)',
                                            color: 'var(--color-text-secondary)',
                                        }}
                                    >
                                        <IconPlayerRecord size={14} stroke={1.5} />
                                        Recordings
                                    </button>
                                    <button
                                        onClick={() => router.push(`/studio/${studio.id}`)}
                                        className="flex-1 h-8 rounded-md text-xs font-medium transition-all"
                                        style={{
                                            backgroundColor: 'var(--color-accent-base)',
                                            color: '#fff',
                                        }}
                                    >
                                        Enter Studio
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
