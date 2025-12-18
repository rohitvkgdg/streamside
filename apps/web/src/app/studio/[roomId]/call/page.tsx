'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSession } from '@/lib/auth-client'
import { useStudioStore } from '@/store/studio-store'
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { IconPlayerRecord, IconPlayerStop, IconAlertTriangle, IconRefresh, IconFolderOpen } from '@tabler/icons-react'

// Guest session helpers
function getGuestInfo(): { guestName: string; guestId: string } | null {
    if (typeof window === 'undefined') return null

    let guestName = sessionStorage.getItem('guestName')
    let guestId = sessionStorage.getItem('guestId')

    if (!guestName || !guestId) {
        try {
            const stored = localStorage.getItem('streamside_guest')
            if (stored) {
                const data = JSON.parse(stored)
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    guestName = data.guestName
                    guestId = data.guestId
                    if (guestName && guestId) {
                        sessionStorage.setItem('guestName', guestName)
                        sessionStorage.setItem('guestId', guestId)
                    }
                }
            }
        } catch {
            // Ignore
        }
    }

    if (guestName && guestId) return { guestName, guestId }
    return null
}

// Check if File System Access API is supported
function supportsFileSystemAccess(): boolean {
    return 'showSaveFilePicker' in window
}

export default function StudioCallPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session, isPending } = useSession()
    const studioId = params?.studioId as string | undefined

    const { selectedCamera, selectedMicrophone, isRecording, setIsRecording } = useStudioStore()

    const [token, setToken] = useState<string | null>(null)
    const [isLoadingToken, setIsLoadingToken] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [guestInfo, setGuestInfo] = useState<{ guestName: string; guestId: string } | null>(null)
    const [isHost, setIsHost] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'choosing' | 'recording' | 'saving'>('idle')

    // Prevent duplicate fetches
    const hasFetchedToken = useRef(false)
    const hasFetchedStudio = useRef(false)

    // Local recording state
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const fileHandleRef = useRef<FileSystemFileHandle | null>(null)
    const writableRef = useRef<FileSystemWritableFileStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL

    useEffect(() => {
        const info = getGuestInfo()
        if (info) setGuestInfo(info)
    }, [])

    useEffect(() => {
        if (!isPending && !session && !guestInfo) {
            const timer = setTimeout(() => {
                const info = getGuestInfo()
                if (!info) router.push('/auth/signin')
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [isPending, session, guestInfo, router])

    useEffect(() => {
        if (!studioId || hasFetchedStudio.current) return
        if (!session && !guestInfo) return
        hasFetchedStudio.current = true

        async function fetchStudioInfo() {
            try {
                const res = await fetch(`/api/studios/${studioId}`)
                if (res.ok) {
                    const data = await res.json()
                    if (session?.user?.id && data.studio?.hostId === session.user.id) {
                        setIsHost(true)
                    }
                }
            } catch (err) {
                console.error('Failed to fetch studio info:', err)
            }
        }
        fetchStudioInfo()
    }, [studioId, session, guestInfo])

    useEffect(() => {
        if (!studioId || hasFetchedToken.current) return
        if (!session && !guestInfo) return
        hasFetchedToken.current = true

        async function fetchToken() {
            try {
                setIsLoadingToken(true)
                setError(null)
                const participantId = session?.user?.id || guestInfo?.guestId || 'anonymous'
                const participantName = session?.user?.name || guestInfo?.guestName || 'Anonymous'

                const res = await fetch('/api/livekit-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: `studio-${studioId}`,
                        participantIdentity: participantId,
                        participantName: participantName,
                    }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Failed to get access token')
                setToken(data.token)
            } catch (err) {
                console.error('Error fetching token:', err)
                setError(err instanceof Error ? err.message : 'Failed to connect')
            } finally {
                setIsLoadingToken(false)
            }
        }
        fetchToken()
    }, [studioId, session, guestInfo])

    // Start recording with file picker
    const startRecording = useCallback(async () => {
        try {
            setRecordingStatus('choosing')

            // Step 1: Request file save location
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
            const defaultFileName = `recording-${timestamp}.webm`

            let fileHandle: FileSystemFileHandle | null = null
            let writable: FileSystemWritableFileStream | null = null

            if (supportsFileSystemAccess()) {
                try {
                    fileHandle = await (window as any).showSaveFilePicker({
                        suggestedName: defaultFileName,
                        types: [{
                            description: 'WebM Video',
                            accept: { 'video/webm': ['.webm'] },
                        }],
                    })
                    fileHandleRef.current = fileHandle
                    writable = await fileHandle!.createWritable()
                    writableRef.current = writable
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        setRecordingStatus('idle')
                        return // User cancelled
                    }
                    throw err
                }
            }

            // Step 2: Get media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } },
                audio: { sampleRate: { ideal: 44100 }, channelCount: { ideal: 1 } },
            })
            streamRef.current = stream

            // Step 3: Setup MediaRecorder
            const options: MediaRecorderOptions = {
                mimeType: 'video/webm;codecs=vp8,opus',
                videoBitsPerSecond: 2000000,
                audioBitsPerSecond: 128000,
            }

            chunksRef.current = []
            const recorder = new MediaRecorder(stream, options)

            recorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    if (writable) {
                        // Progressive write to file
                        await writable.write(e.data)
                    } else {
                        // Fallback: collect chunks in memory
                        chunksRef.current.push(e.data)
                    }
                }
            }

            recorder.onstop = async () => {
                setRecordingStatus('saving')

                if (writable) {
                    await writable.close()
                    writableRef.current = null
                } else {
                    // Fallback: trigger download
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = defaultFileName
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                }

                stream.getTracks().forEach(track => track.stop())
                streamRef.current = null
                setRecordingStatus('idle')
            }

            mediaRecorderRef.current = recorder
            recorder.start(1000) // Write every 1 second
            setIsRecording(true)
            setRecordingDuration(0)
            setRecordingStatus('recording')

            timerRef.current = setInterval(() => {
                setRecordingDuration(d => d + 1)
            }, 1000)

        } catch (err) {
            console.error('Failed to start recording:', err)
            setRecordingStatus('idle')
            alert('Failed to start recording. Please allow camera/microphone access.')
        }
    }, [setIsRecording])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        setIsRecording(false)
    }, [setIsRecording])

    const formatDuration = useCallback((seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }, [])

    const handleLeaveStudio = useCallback(() => {
        stopRecording()
        if (guestInfo) {
            sessionStorage.removeItem('guestName')
            sessionStorage.removeItem('guestId')
            localStorage.removeItem('streamside_guest')
        }
        router.push(session ? '/dashboard' : '/')
    }, [router, session, guestInfo, stopRecording])

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (writableRef.current) writableRef.current.close().catch(() => { })
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
        }
    }, [])

    const connectOptions = useMemo(() => ({ autoSubscribe: true }), [])

    // Loading states
    if (isPending && !guestInfo) {
        return (
            <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-app)' }}>
                <div className="w-5 h-5 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (isLoadingToken) {
        return (
            <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-app)' }}>
                <div className="text-center">
                    <div className="w-6 h-6 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Connecting to studio...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-bg-app)' }}>
                <div className="max-w-md w-full p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--color-bg-raised)', border: '1px solid var(--color-border-subtle)' }}>
                    <IconAlertTriangle size={32} stroke={1.5} style={{ color: 'var(--color-text-danger)', margin: '0 auto 16px' }} />
                    <h1 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Connection Error</h1>
                    <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <button onClick={() => window.location.reload()} className="h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2" style={{ backgroundColor: 'var(--color-accent-base)', color: '#fff' }}>
                            <IconRefresh size={16} stroke={1.5} />Retry
                        </button>
                        <button onClick={handleLeaveStudio} className="h-10 px-4 rounded-lg text-sm font-medium" style={{ backgroundColor: 'transparent', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}>
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!token || !wsUrl) {
        return (
            <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-app)' }}>
                <div className="w-5 h-5 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--color-bg-app)' }}>
            {/* Header Bar */}
            <header
                className="shrink-0 h-14 flex items-center justify-between px-3 sm:px-5"
                style={{ backgroundColor: 'rgba(5, 6, 10, 0.95)', borderBottom: '1px solid var(--color-border-subtle)' }}
            >
                <div className="flex items-center gap-3">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Studio</span>
                    {recordingStatus === 'recording' && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(255, 82, 97, 0.15)' }}>
                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#FF5261' }} />
                            <span className="text-xs font-mono font-medium" style={{ color: '#FF5261' }}>
                                {formatDuration(recordingDuration)}
                            </span>
                        </div>
                    )}
                    {recordingStatus === 'saving' && (
                        <span className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent-base)' }}>
                            Saving...
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Recording Controls - Host Only */}
                    {isHost && recordingStatus === 'idle' && (
                        <button
                            onClick={startRecording}
                            className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                            style={{ backgroundColor: 'var(--color-bg-overlay)', border: '1px solid var(--color-border-medium)', color: 'var(--color-text-secondary)' }}
                        >
                            <IconFolderOpen size={16} stroke={1.5} />
                            <span className="hidden sm:inline">Record</span>
                        </button>
                    )}

                    {isHost && recordingStatus === 'choosing' && (
                        <button disabled className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-2 opacity-50" style={{ backgroundColor: 'var(--color-bg-overlay)', border: '1px solid var(--color-border-medium)', color: 'var(--color-text-secondary)' }}>
                            <span className="hidden sm:inline">Choose location...</span>
                        </button>
                    )}

                    {isHost && recordingStatus === 'recording' && (
                        <button
                            onClick={stopRecording}
                            className="h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                            style={{ backgroundColor: 'rgba(255, 82, 97, 0.15)', border: '1px solid rgba(255, 82, 97, 0.3)', color: '#FF5261' }}
                        >
                            <IconPlayerStop size={16} stroke={1.5} />
                            <span className="hidden sm:inline">Stop</span>
                        </button>
                    )}

                    {/* Leave Button */}
                    <button
                        onClick={handleLeaveStudio}
                        className="h-9 px-4 rounded-lg text-xs font-medium transition-colors"
                        style={{ backgroundColor: '#FF5261', color: '#fff' }}
                    >
                        Leave
                    </button>
                </div>
            </header>

            {/* Video Conference */}
            <main className="flex-1 min-h-0 relative">
                <LiveKitRoom
                    serverUrl={wsUrl}
                    token={token}
                    connectOptions={connectOptions}
                    video={!!selectedCamera}
                    audio={!!selectedMicrophone}
                    data-lk-theme="default"
                    style={{ height: '100%', width: '100%' }}
                    onDisconnected={handleLeaveStudio}
                >
                    <VideoConference />
                    <RoomAudioRenderer />
                </LiveKitRoom>
            </main>
        </div>
    )
}
