'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StudioLobbyUI from '@/components/StudioLobby';

export default function StudioLobbyPage() {
  const router = useRouter();
  const { studioId } = useParams<{ studioId: string }>();

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setCameras(devices.filter(d => d.kind === 'videoinput'));
      setMicrophones(devices.filter(d => d.kind === 'audioinput'));
      setSpeakers(devices.filter(d => d.kind === 'audiooutput'));
    });
  }, []);

  const inviteLink = `${window.location.origin}/studio/${studioId}/lobby`;

  return (
    <StudioLobbyUI
      studioId={studioId}
      studioName="Weekly Podcast"
      studioDescription="Our weekly discussion on tech trends"
      activeParticipants={2}
      videoEnabled={videoEnabled}
      audioEnabled={audioEnabled}
      cameras={cameras.map(d => ({ deviceId: d.deviceId, label: d.label || 'Camera' }))}
      microphones={microphones.map(d => ({ deviceId: d.deviceId, label: d.label || 'Microphone' }))}
      speakers={speakers.map(d => ({ deviceId: d.deviceId, label: d.label || 'Speaker' }))}
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
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      onBack={() => router.push('/dashboard')}
      onSettings={() => router.push(`/studio/${studioId}/settings`)}
      onJoin={() => router.push(`/studio/${studioId}/call`)}
    />
  );
}
