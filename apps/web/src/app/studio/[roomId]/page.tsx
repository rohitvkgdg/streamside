'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import StudioLobby from '@/components/StudioLobby'

export default function StudioLobbyPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = typeof params?.roomId === 'string' ? params.roomId : ''
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([])

  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(null)
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null)

  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  // Studio name/description state
  const [studioName, setStudioName] = useState('')
  const [studioDescription, setStudioDescription] = useState('')
  const [showNameModal, setShowNameModal] = useState(false) // Default to false, will show only if studio doesn't exist
  const [nameError, setNameError] = useState('')
  const [studioId, setStudioId] = useState<string | null>(null)
  const [inviteCodeGenerated, setInviteCodeGenerated] = useState<string | null>(null)
  const [isLoadingStudio, setIsLoadingStudio] = useState(true)

  // Check if this is an existing studio in the database
  useEffect(() => {
    if (!roomId) return

    async function fetchStudioInfo() {
      try {
        setIsLoadingStudio(true)
        const res = await fetch(`/api/studios/${roomId}`)

        if (res.ok) {
          const data = await res.json()
          // Studio exists - pre-fill the info and skip the modal
          setStudioId(data.studio.id)
          setStudioName(data.studio.name)
          setStudioDescription(data.studio.description || '')
          setInviteCodeGenerated(data.studio.inviteCode)
          setInviteLink(`${window.location.origin}/invite/${data.studio.inviteCode}`)
          setShowNameModal(false) // Don't show modal for existing studios
        } else if (res.status === 404) {
          // Studio doesn't exist - show the create modal
          setShowNameModal(true)
        } else {
          console.error('Error fetching studio:', await res.text())
          setShowNameModal(true)
        }
      } catch (error) {
        console.error('Error fetching studio:', error)
        setShowNameModal(true)
      } finally {
        setIsLoadingStudio(false)
      }
    }

    fetchStudioInfo()
  }, [roomId])

  const handleSetStudioInfo = async () => {
    if (!studioName.trim()) {
      setNameError('Studio name is required')
      return
    }
    setNameError('')

    try {
      // Create studio in database
      const res = await fetch('/api/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studioName.trim(),
          description: studioDescription.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setNameError(data.error || 'Failed to create studio')
        return
      }

      const data = await res.json()
      setStudioId(data.studio.id)
      setInviteCodeGenerated(data.studio.inviteCode)

      // Set invite link with the actual invite code
      setInviteLink(`${window.location.origin}/invite/${data.studio.inviteCode}`)
      setShowNameModal(false)
    } catch (error) {
      console.error('Error creating studio:', error)
      setNameError('Failed to create studio. Please try again.')
    }
  }

  /* ✅ client-only invite link fallback (for when modal is skipped) */
  useEffect(() => {
    if (!roomId || inviteCodeGenerated) return
    // Fallback invite link if studio not created yet
    setInviteLink(`${window.location.origin}/studio/${roomId}/lobby`)
  }, [roomId, inviteCodeGenerated])

  /* ✅ permission warmup + safe device enumeration */
  useEffect(() => {
    let mounted = true

    async function initDevices() {
      try {
        // 1️⃣ Ask permissions SEPARATELY - so if one fails, the other still works
        // This is important when devices are missing (e.g., no microphone)

        // Try to get video permission
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          videoStream.getTracks().forEach(t => t.stop())
        } catch (videoErr) {
          console.warn('Video permission failed:', videoErr)
        }

        // Try to get audio permission (non-fatal if it fails)
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          audioStream.getTracks().forEach(t => t.stop())
        } catch (audioErr) {
          console.warn('Audio permission failed (no microphone?):', audioErr)
        }

        if (!mounted) return

        // 2️⃣ Enumerate devices - this will now work even if only video or audio permission was granted
        const devices = await navigator.mediaDevices.enumerateDevices()

        const cams = devices.filter(d => d.kind === 'videoinput')
        const mics = devices.filter(d => d.kind === 'audioinput')
        const spks = devices.filter(d => d.kind === 'audiooutput')

        setCameras(cams)
        setMicrophones(mics)
        setSpeakers(spks)

        // 3️⃣ Only auto-select if nothing chosen yet
        setSelectedCamera(prev => prev ?? cams[0]?.deviceId ?? null)
        setSelectedMicrophone(prev => prev ?? mics[0]?.deviceId ?? null)
        setSelectedSpeaker(prev => prev ?? spks[0]?.deviceId ?? null)
      } catch (err) {
        console.error('Device init failed:', err)
      }
    }

    initDevices()

    // 5️⃣ Hot-plug support (USB cam / mic)
    navigator.mediaDevices.addEventListener('devicechange', initDevices)

    return () => {
      mounted = false
      navigator.mediaDevices.removeEventListener('devicechange', initDevices)
    }
  }, [])

  return (
    <>
      {/* Studio Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-96 shadow-xl relative">
            <button
              onClick={() => router.push('/dashboard')}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2 className="text-xl font-semibold mb-4">Create Your Studio</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Studio Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={studioName}
                  onChange={(e) => {
                    setStudioName(e.target.value)
                    if (e.target.value.trim()) setNameError('')
                  }}
                  placeholder="e.g. Weekly Podcast"
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                {nameError && (
                  <p className="text-destructive text-sm mt-1">{nameError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  value={studioDescription}
                  onChange={(e) => setStudioDescription(e.target.value)}
                  placeholder="Describe your studio..."
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <button
                onClick={handleSetStudioInfo}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <StudioLobby
        studioId={roomId}
        studioName={studioName || 'Untitled Studio'}
        studioDescription={studioDescription || 'No description'}
        activeParticipants={0}

        videoEnabled={videoEnabled}
        audioEnabled={audioEnabled}

        cameras={cameras
          .filter(d => d.deviceId && d.deviceId.length > 0)
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || 'Camera',
          }))}

        microphones={microphones
          .filter(d => d.deviceId && d.deviceId.length > 0)
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || 'Microphone',
          }))}

        speakers={speakers
          .filter(d => d.deviceId && d.deviceId.length > 0)
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || 'Speaker',
          }))}

        selectedCamera={selectedCamera}
        selectedMicrophone={selectedMicrophone}
        selectedSpeaker={selectedSpeaker}

        inviteLink={inviteLink}
        copied={copied}

        onToggleVideo={() => setVideoEnabled(v => !v)}
        onToggleAudio={() => setAudioEnabled(a => !a)}

        onCameraChange={setSelectedCamera}
        onMicrophoneChange={setSelectedMicrophone}
        onSpeakerChange={setSelectedSpeaker}

        onCopyInvite={() => {
          navigator.clipboard.writeText(inviteLink)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}

        onBack={() => router.push('/dashboard')}
        onSettings={() => router.push(`/studio/${studioId || roomId}/settings`)}
        onJoin={() => router.push(`/studio/${studioId || roomId}/call?name=${encodeURIComponent(studioName)}`)}
      />
    </>
  )
}
