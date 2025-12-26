'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSession } from '@/lib/auth-client'
import StudioCall, { Participant } from '@/components/StudioCall'
import {
  LiveKitRoom,
  useParticipants,
  useRoomContext,
  RoomAudioRenderer,
} from '@livekit/components-react'
import { VideoPresets, RoomOptions } from 'livekit-client'
import '@livekit/components-styles'

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

// Component that syncs LiveKit participants to StudioCall format
function LiveKitParticipantSync({
  studioName,
  inviteCode,
  onLeave,
}: {
  studioName: string
  inviteCode?: string
  onLeave: () => void
}) {
  const participants = useParticipants()
  const room = useRoomContext()

  // Convert LiveKit participants to StudioCall format
  const mappedParticipants: Participant[] = participants
    .filter(p => !p.isLocal) // Exclude local participant (StudioCall adds "You" separately)
    .map(p => ({
      id: p.identity,
      name: p.name || p.identity,
      initials: (p.name || p.identity).slice(0, 2).toUpperCase(),
      isLocal: false,
      audioEnabled: !p.isMicrophoneEnabled ? false : true,
      videoEnabled: !p.isCameraEnabled ? false : true,
    }))

  const handleLeave = useCallback(() => {
    room?.disconnect()
    onLeave()
  }, [room, onLeave])

  return (
    <StudioCall
      participants={mappedParticipants}
      onLeave={handleLeave}
      studioName={studioName}
      inviteCode={inviteCode}
    />
  )
}

function StudioCallPageContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()

  const studioId = typeof params?.roomId === 'string' ? params.roomId : null
  const studioName = searchParams?.get('name') || 'Studio Session'

  const [token, setToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string | null>(null)
  const [isLoadingToken, setIsLoadingToken] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guestInfo, setGuestInfo] = useState<{ guestName: string; guestId: string } | null>(null)
  const [inviteCode, setInviteCode] = useState<string | undefined>(undefined)

  // Load guest info on mount
  useEffect(() => {
    const info = getGuestInfo()
    if (info) setGuestInfo(info)
  }, [])

  // Fetch studio info to get invite code
  useEffect(() => {
    if (!studioId) return

    async function fetchStudioInfo() {
      try {
        const res = await fetch(`/api/studios/${studioId}`)
        if (res.ok) {
          const data = await res.json()
          setInviteCode(data.studio.inviteCode)
        }
      } catch (error) {
        console.error('Error fetching studio info:', error)
      }
    }

    fetchStudioInfo()
  }, [studioId])

  // Redirect if no session or guest info
  useEffect(() => {
    if (!isPending && !session && !guestInfo) {
      const timer = setTimeout(() => {
        const info = getGuestInfo()
        if (!info) router.push('/auth/signin')
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isPending, session, guestInfo, router])

  // Fetch LiveKit token with retry logic
  useEffect(() => {
    if (!studioId) return
    if (!session && !guestInfo) return

    let retryCount = 0
    const maxRetries = 3

    async function fetchTokenWithRetry(): Promise<void> {
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
        setWsUrl(data.wsUrl)
      } catch (err) {
        console.error(`Token fetch attempt ${retryCount + 1} failed:`, err)

        if (retryCount < maxRetries) {
          retryCount++
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Exponential backoff, max 5s
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return fetchTokenWithRetry()
        }

        setError(err instanceof Error ? err.message : 'Failed to connect after multiple attempts')
      } finally {
        setIsLoadingToken(false)
      }
    }

    fetchTokenWithRetry()
  }, [studioId, session, guestInfo])

  const handleLeaveStudio = useCallback(() => {
    if (guestInfo) {
      sessionStorage.removeItem('guestName')
      sessionStorage.removeItem('guestId')
      localStorage.removeItem('streamside_guest')
    }
    router.push(session ? '/dashboard' : '/')
  }, [router, session, guestInfo])

  if (!studioId) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-muted-foreground">
        Invalid studio ID
      </div>
    )
  }

  // Loading states
  if (isPending && !guestInfo) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isLoadingToken) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Connecting to {studioName}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full p-8 rounded-xl text-center border bg-card">
          <div className="text-destructive mb-4 text-3xl">⚠️</div>
          <h1 className="text-base font-semibold mb-2">Connection Error</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
            >
              Retry
            </button>
            <button
              onClick={handleLeaveStudio}
              className="h-10 px-4 rounded-lg text-sm font-medium border bg-background"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!token || !wsUrl) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connectOptions={{ autoSubscribe: true }}
      options={{
        videoCaptureDefaults: {
          resolution: VideoPresets.h1080.resolution,
          facingMode: 'user',
        },
        publishDefaults: {
          videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h720, VideoPresets.h1080],
          videoCodec: 'vp9',
          dtx: true,
          red: true,
        },
        dynacast: true,
        adaptiveStream: true,
      } satisfies RoomOptions}
      video={{
        resolution: VideoPresets.h1080.resolution,
      }}
      audio={true}
      style={{ height: '100vh', width: '100vw' }}
      onDisconnected={handleLeaveStudio}
    >
      <RoomAudioRenderer />
      <LiveKitParticipantSync
        studioName={studioName}
        inviteCode={inviteCode}
        onLeave={handleLeaveStudio}
      />
    </LiveKitRoom>
  )
}

export default function StudioCallPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" /></div>}>
      <StudioCallPageContent />
    </Suspense>
  )
}
