'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { IconChevronLeft, IconVideo, IconMicrophone, IconDownload } from '@tabler/icons-react'

interface Recording {
    id: string
    participantId: string
    participantName: string | null
    status: string
    size: number
    chunkCount: number
    downloadUrl: string | null
    createdAt: string
    updatedAt: string
}

export default function RecordingsPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session, isPending } = useSession()
    const studioId = params?.studioId as string | undefined

    const [recordings, setRecordings] = useState<Recording[]>([])
    const [studioName, setStudioName] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/signin')
        }
    }, [isPending, session, router])

    useEffect(() => {
        if (!studioId || !session) return

        async function fetchRecordings() {
            try {
                setIsLoading(true)
                setError(null)

                const studioRes = await fetch(`/api/studios/${studioId}`)
                if (studioRes.ok) {
                    const studioData = await studioRes.json()
                    setStudioName(studioData.studio?.name || 'Studio')
                }

                const res = await fetch(`/api/studios/${studioId}/recordings`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to fetch recordings')
                }

                setRecordings(data.recordings || [])
            } catch (err) {
                console.error('Error fetching recordings:', err)
                setError(err instanceof Error ? err.message : 'Failed to load')
            } finally {
                setIsLoading(false)
            }
        }

        fetchRecordings()

        const interval = setInterval(fetchRecordings, 10000)
        return () => clearInterval(interval)
    }, [studioId, session])

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const getStatusStyle = (status: string) => {
        const styles: Record<string, { bg: string; color: string }> = {
            completed: { bg: 'rgba(74, 222, 128, 0.1)', color: 'var(--color-text-success)' },
            uploading: { bg: 'var(--color-accent-soft)', color: 'var(--color-accent-base)' },
            processing: { bg: 'rgba(251, 191, 36, 0.1)', color: '#FBBF24' },
            failed: { bg: 'rgba(255, 82, 97, 0.1)', color: 'var(--color-text-danger)' },
        }
        return styles[status] || styles.uploading
    }

    if (!session && !isPending) return null

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-app)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading...</span>
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
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="h-7 w-7 rounded-md flex items-center justify-center"
                        style={{
                            backgroundColor: 'var(--color-bg-overlay)',
                            border: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        <IconChevronLeft size={16} stroke={1.5} style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                    <div className="flex items-center gap-1.5 text-sm">
                        <span style={{ color: 'var(--color-text-primary)' }}>{studioName}</span>
                        <span style={{ color: 'var(--color-text-subtle)' }}>/</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>Recordings</span>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-3xl mx-auto px-5 py-8">
                <div className="mb-6">
                    <h1 className="text-lg font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                        Recordings
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Download high-quality recordings
                    </p>
                </div>

                {error ? (
                    <div
                        className="p-4 rounded-lg text-center text-xs"
                        style={{
                            backgroundColor: 'rgba(255, 82, 97, 0.08)',
                            border: '1px solid rgba(255, 82, 97, 0.15)',
                            color: 'var(--color-text-danger)',
                        }}
                    >
                        {error}
                    </div>
                ) : recordings.length === 0 ? (
                    <div
                        className="py-16 text-center rounded-lg"
                        style={{
                            backgroundColor: 'var(--color-bg-raised)',
                            border: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        <IconMicrophone size={32} stroke={1} style={{ color: 'var(--color-text-subtle)', margin: '0 auto 12px' }} />
                        <h3 className="font-medium text-sm mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                            No recordings yet
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Start a recording session
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recordings.map((recording) => {
                            const statusStyle = getStatusStyle(recording.status)
                            return (
                                <div
                                    key={recording.id}
                                    className="p-3 rounded-lg flex items-center justify-between"
                                    style={{
                                        backgroundColor: 'var(--color-bg-raised)',
                                        border: '1px solid var(--color-border-subtle)',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <IconVideo size={18} stroke={1.5} style={{ color: 'var(--color-text-muted)' }} />
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                                    {recording.participantName || 'Anonymous'}
                                                </span>
                                                <span
                                                    className="px-1.5 py-0.5 text-xs rounded"
                                                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                                                >
                                                    {recording.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                                <span>{formatFileSize(recording.size)}</span>
                                                <span>•</span>
                                                <span>{recording.chunkCount} chunks</span>
                                                <span>•</span>
                                                <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {recording.downloadUrl && (
                                        <a
                                            href={recording.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5"
                                            style={{
                                                backgroundColor: 'var(--color-accent-base)',
                                                color: '#fff',
                                            }}
                                        >
                                            <IconDownload size={14} stroke={1.5} />
                                            Download
                                        </a>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-subtle)' }}>
                    Auto-refreshes every 10s
                </p>
            </main>
        </div>
    )
}
