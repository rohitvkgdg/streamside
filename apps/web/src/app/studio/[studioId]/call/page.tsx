'use client'

/**
 * STUDIO CALL PAGE - THE CORE OF THE APPLICATION
 * 
 * This component manages TWO PARALLEL MEDIA STREAMS:
 * 
 * 1. LiveKit Stream (Real-time video call):
 *    - Used for the "Google Meet-like" experience
 *    - Adaptive bitrate, optimized for real-time
 *    - Lower quality but responsive
 *    - Handles: participant video/audio tracks, room connection, mute/unmute
 * 
 * 2. Local Recording Stream (High-quality recording):
 *    - Captured via MediaRecorder API
 *    - Highest possible quality (4K video, 48kHz audio)
 *    - Uploaded progressively in chunks (every 10 seconds)
 *    - If browser crashes, only last 10 seconds are lost
 *    - Completely independent from LiveKit
 * 
 * Why two streams?
 * - The live call needs to be responsive (LiveKit handles this)
 * - The final recording needs to be high quality (MediaRecorder handles this)
 * - Network issues may affect LiveKit, but local recording continues
 */

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useSession, type Session } from '@/lib/auth-client'
import { useStudioStore } from '@/store/studio-store'
import { Room, RoomEvent, Track } from 'livekit-client'
import {
    LiveKitRoom,
    VideoConference,
    useParticipants,
    useTracks,
    ParticipantTile,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { MediaRecorderService } from '@/services/MediaRecorderService'
import { io, Socket } from 'socket.io-client'

export default function StudioCall() {
    const params = useParams()
    const router = useRouter()
    const { data: session, isPending } = useSession() as {
        data: Session | null
        isPending: boolean
    }
    const studioId = params?.studioId as string | undefined

    const {
        isRecording,
        setIsRecording,
        chunksUploaded,
        incrementChunksUploaded,
        selectedCamera,
        selectedMicrophone,
        setStudioMetadata,
    } = useStudioStore()

    const [livekitToken, setLivekitToken] = useState<string | null>(null)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isHost, setIsHost] = useState(false)
    const mediaRecorderService = useRef<MediaRecorderService | null>(null)

    const participantId = session?.user?.id ?? `guest-${Math.random().toString(36).substring(2, 11)}`

    // Redirect if not authenticated
    useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/signin')
        }
    }, [isPending, session, router])

    // Initialize LiveKit token
    useEffect(() => {
        if (!session || !studioId) return

        async function fetchToken() {
            try {
                const res = await fetch('/api/livekit-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: studioId,
                        participantIdentity: participantId,
                        participantName: session?.user?.name || 'Anonymous',
                    }),
                })

                const data = await res.json()
                setLivekitToken(data.token)
                setStudioMetadata(studioId!, participantId)
            } catch (error) {
                console.error('Failed to fetch LiveKit token:', error)
            }
        }

        fetchToken()
    }, [session, studioId, participantId, setStudioMetadata])

    // Initialize Socket.io for signaling
    useEffect(() => {
        if (!studioId) return

        const socketInstance = io({
            path: '/api/socket/io',
        })

        socketInstance.on('connect', () => {
            console.log('✅ Socket.io connected')
            socketInstance.emit('join-studio', studioId)
        })

        socketInstance.on('recording-state', ({ isRecording: newState }: { isRecording: boolean }) => {
            console.log(`🔴 Recording state changed: ${newState}`)
            setIsRecording(newState)

            // Start or stop local recording
            if (newState) {
                startLocalRecording()
            } else {
                stopLocalRecording()
            }
        })

        setSocket(socketInstance)

        return () => {
            socketInstance.emit('leave-studio', studioId)
            socketInstance.disconnect()
        }
    }, [studioId, setIsRecording])

    // Initialize MediaRecorder service
    useEffect(() => {
        if (!studioId) return

        if (!mediaRecorderService.current) {
            mediaRecorderService.current = new MediaRecorderService(studioId, participantId, {
                onChunkUploaded: (chunkIndex) => {
                    console.log(`✅ Chunk ${chunkIndex} uploaded`)
                    incrementChunksUploaded()

                    // Notify server via Socket.io
                    socket?.emit('chunk-uploaded', { studioId, participantId, chunkIndex })
                },
                onError: (error) => {
                    console.error('❌ MediaRecorder error:', error)
                    alert(`Recording error: ${error.message}`)
                },
            })
        }

        return () => {
            mediaRecorderService.current?.cleanup()
        }
    }, [studioId, participantId])

    // Start local high-quality recording
    const startLocalRecording = async () => {
        try {
            await mediaRecorderService.current?.startRecording(10000) // 10-second chunks
            console.log('🎥 Local recording started')
        } catch (error) {
            console.error('Failed to start local recording:', error)
        }
    }

    // Stop local recording
    const stopLocalRecording = () => {
        mediaRecorderService.current?.stopRecording()
        console.log('⏹️ Local recording stopped')
    }

    // Toggle recording (host only)
    const toggleRecording = () => {
        const newState = !isRecording
        socket?.emit('recording-state', { studioId, isRecording: newState })
    }

    // Early returns after all hooks
    if (!session && !isPending) {
        return null
    }

    if (isPending) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <p className="text-white text-lg">Loading...</p>
            </div>
        )
    }

    if (!livekitToken) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <p className="text-white text-lg">Connecting to studio...</p>
            </div>
        )
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            {/* Header with controls */}
            <header className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-white text-xl font-semibold">Studio: {studioId?.slice(0, 8) ?? 'Unknown'}...</h1>
                        {isRecording && (
                            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full animate-pulse-slow">
                                <div className="w-3 h-3 bg-white rounded-full" />
                                <span className="text-white text-sm font-semibold">REC</span>
                            </div>
                        )}
                        {chunksUploaded > 0 && (
                            <span className="text-gray-400 text-sm">
                                {chunksUploaded} chunk{chunksUploaded !== 1 ? 's' : ''} uploaded
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {isHost && (
                            <button
                                onClick={toggleRecording}
                                className={`px-6 py-2 rounded-md font-semibold transition-colors ${isRecording
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                            >
                                {isRecording ? 'Stop Recording' : 'Start Recording'}
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
                        >
                            Leave Studio
                        </button>
                    </div>
                </div>
            </header>

            {/* LiveKit Video Conference */}
            <main className="flex-1 overflow-hidden">
                <LiveKitRoom
                    token={livekitToken}
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || 'ws://localhost:7880'}
                    connect={true}
                    audio={{ deviceId: selectedMicrophone || undefined }}
                    video={{ deviceId: selectedCamera || undefined }}
                    onConnected={() => {
                        console.log('✅ Connected to LiveKit room')
                        // Check if current user is the host
                        // In production, you'd check this against the studio's hostId
                        setIsHost(true)
                    }}
                    onDisconnected={() => {
                        console.log('❌ Disconnected from LiveKit room')
                    }}
                >
                    <VideoConference />
                </LiveKitRoom>
            </main>

            {/* Info footer */}
            <footer className="bg-gray-800 border-t border-gray-700 p-3">
                <p className="text-center text-gray-400 text-sm">
                    💡 <strong>Tip:</strong> Your video and audio are being recorded locally in high quality
                    and uploaded progressively. The live call uses adaptive quality for smooth real-time
                    communication.
                </p>
            </footer>
        </div>
    )
}
