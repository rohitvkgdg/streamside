'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/lib/auth-client'
import { useStudioStore } from '@/store/studio-store'
import { IconChevronLeft, IconVideo, IconMicrophone } from '@tabler/icons-react'

// Guest session helpers - check both localStorage and sessionStorage
function getGuestInfo(): { guestName: string; guestId: string } | null {
    if (typeof window === 'undefined') return null

    // First check sessionStorage
    let guestName = sessionStorage.getItem('guestName')
    let guestId = sessionStorage.getItem('guestId')

    // Fallback to localStorage if session was lost
    if (!guestName || !guestId) {
        try {
            const stored = localStorage.getItem('streamside_guest')
            if (stored) {
                const data = JSON.parse(stored)
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    guestName = data.guestName
                    guestId = data.guestId
                    // Restore to sessionStorage
                    if (guestName && guestId) {
                        sessionStorage.setItem('guestName', guestName)
                        sessionStorage.setItem('guestId', guestId)
                    }
                }
            }
        } catch {
            // Ignore parse errors
        }
    }

    if (guestName && guestId) {
        return { guestName, guestId }
    }
    return null
}

export default function StudioLobby() {
    const params = useParams()
    const router = useRouter()
    const { data: session, isPending } = useSession()
    const studioId = params?.studioId as string | undefined

    const { setSelectedCamera, setSelectedMicrophone, setDevices, selectedCamera, selectedMicrophone, cameras, microphones } =
        useStudioStore()

    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [guestInfo, setGuestInfo] = useState<{ guestName: string; guestId: string } | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Initialize guest info on mount
    useEffect(() => {
        const info = getGuestInfo()
        if (info) {
            setGuestInfo(info)
        }
        setIsLoading(false)
    }, [])

    // Redirect to signin only if: not pending, no session, AND no guest info
    useEffect(() => {
        // Wait for auth to finish loading
        if (isPending) return

        // Already has a session, no redirect needed
        if (session) return

        // Check for guest info with a slight delay to ensure state is set
        const timer = setTimeout(() => {
            const info = getGuestInfo()
            if (!info && !guestInfo) {
                router.push('/auth/signin')
            } else if (info && !guestInfo) {
                // State wasn't set yet, set it now
                setGuestInfo(info)
            }
        }, 300) // Increased delay for state to settle

        return () => clearTimeout(timer)
    }, [isPending, session, guestInfo, router])

    useEffect(() => {
        if (!session && !guestInfo) return

        async function enumerateDevices() {
            try {
                // Check if we're in a secure context (HTTPS or localhost)
                // getUserMedia requires secure context on non-localhost
                const isSecure = window.isSecureContext ||
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1'

                if (!isSecure || !navigator.mediaDevices?.getUserMedia) {
                    console.warn('Media devices not available (requires HTTPS or localhost)')
                    setIsLoading(false)
                    return
                }

                await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                const devices = await navigator.mediaDevices.enumerateDevices()

                const videoDevices = devices.filter(d => d.kind === 'videoinput')
                const audioDevices = devices.filter(d => d.kind === 'audioinput')

                setDevices(videoDevices, audioDevices)

                if (videoDevices.length > 0 && !selectedCamera) {
                    setSelectedCamera(videoDevices[0].deviceId)
                }
                if (audioDevices.length > 0 && !selectedMicrophone) {
                    setSelectedMicrophone(audioDevices[0].deviceId)
                }

                setIsLoading(false)
            } catch (error) {
                console.error('Error enumerating devices:', error)
                setIsLoading(false)
            }
        }

        enumerateDevices()
    }, [session, guestInfo, setDevices, setSelectedCamera, setSelectedMicrophone, selectedCamera, selectedMicrophone])

    const startPreview = useCallback(async () => {
        if (!selectedCamera) return

        if (previewStream) {
            previewStream.getTracks().forEach(track => track.stop())
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: selectedCamera },
                audio: selectedMicrophone ? { deviceId: selectedMicrophone } : false,
            })
            setPreviewStream(stream)
        } catch (error) {
            console.error('Error starting preview:', error)
        }
    }, [selectedCamera, selectedMicrophone, previewStream])

    useEffect(() => {
        if (selectedCamera) {
            startPreview()
        }

        return () => {
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop())
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCamera, selectedMicrophone])

    useEffect(() => {
        if (videoRef.current && previewStream) {
            videoRef.current.srcObject = previewStream
        }
    }, [previewStream])

    const handleJoinStudio = () => {
        if (previewStream) {
            previewStream.getTracks().forEach(track => track.stop())
        }
        router.push(`/studio/${studioId}/call`)
    }

    if (!session && !guestInfo && !isPending) return null

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-app)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Preparing...</span>
                </div>
            </div>
        )
    }

    const userName = session?.user?.name || guestInfo?.guestName || 'Guest'

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
                    <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        Studio Lobby
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {userName}
                    </span>
                    {guestInfo && (
                        <span
                            className="px-1.5 py-0.5 text-xs rounded"
                            style={{
                                backgroundColor: 'var(--color-bg-overlay)',
                                color: 'var(--color-text-muted)',
                            }}
                        >
                            Guest
                        </span>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-5 py-10">
                <div className="text-center mb-6">
                    <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        Ready to join?
                    </h1>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Check your camera and microphone
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Video Preview */}
                    <div
                        className="rounded-lg overflow-hidden aspect-video relative"
                        style={{
                            backgroundColor: 'var(--color-bg-sunken)',
                            border: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        {previewStream ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <IconVideo size={32} stroke={1} style={{ color: 'var(--color-text-subtle)' }} />
                            </div>
                        )}

                        {/* Name overlay */}
                        <div
                            className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'var(--color-text-primary)',
                            }}
                        >
                            {userName}
                        </div>
                    </div>

                    {/* Device Selection */}
                    <div
                        className="p-5 rounded-lg space-y-5"
                        style={{
                            backgroundColor: 'var(--color-bg-raised)',
                            border: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        {/* Camera */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                                <IconVideo size={14} stroke={1.5} />
                                Camera
                            </label>
                            <select
                                value={selectedCamera || ''}
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                className="w-full h-9 px-3 rounded-md text-sm cursor-pointer"
                                style={{
                                    backgroundColor: 'var(--color-bg-sunken)',
                                    border: '1px solid var(--color-border-subtle)',
                                    color: 'var(--color-text-primary)',
                                }}
                            >
                                <option value="">Select camera</option>
                                {cameras.map((camera) => (
                                    <option key={camera.deviceId} value={camera.deviceId}>
                                        {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Microphone */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                                <IconMicrophone size={14} stroke={1.5} />
                                Microphone
                            </label>
                            <select
                                value={selectedMicrophone || ''}
                                onChange={(e) => setSelectedMicrophone(e.target.value)}
                                className="w-full h-9 px-3 rounded-md text-sm cursor-pointer"
                                style={{
                                    backgroundColor: 'var(--color-bg-sunken)',
                                    border: '1px solid var(--color-border-subtle)',
                                    color: 'var(--color-text-primary)',
                                }}
                            >
                                <option value="">Select microphone</option>
                                {microphones.map((mic) => (
                                    <option key={mic.deviceId} value={mic.deviceId}>
                                        {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Join */}
                        <button
                            onClick={handleJoinStudio}
                            disabled={!selectedCamera}
                            className="w-full h-10 rounded-md font-medium text-sm transition-all disabled:opacity-40"
                            style={{
                                backgroundColor: 'var(--color-accent-base)',
                                color: '#fff',
                            }}
                        >
                            Join Studio
                        </button>

                        <p className="text-center text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                            High-quality local recording enabled
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
