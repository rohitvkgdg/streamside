'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Video,
  AlertTriangle,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  Settings,
  Phone,
  Radio,
  Users,
  MessageSquare,
  MoreVertical,
  X,
  Send,
  UserPlus,
  Copy,
  Check,
  Link2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  useLocalParticipant,
  useTrackToggle,
  VideoTrack,
  useParticipants,
} from '@livekit/components-react';
import { Track, VideoPresets, RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

export interface Participant {
  id: string;
  name: string;
  initials: string;
  isLocal: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface StudioCallProps {
  participants: Participant[];
  onLeave: () => void;
  studioName?: string;
  inviteCode?: string;
}

export default function StudioCall({
  participants,
  onLeave,
  studioName = 'Studio Session',
  inviteCode,
}: StudioCallProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number; name: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p' | '1080p60'>('1080p60');
  const [videoBitrate, setVideoBitrate] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // LiveKit hooks for local participant
  const { localParticipant } = useLocalParticipant();
  const allParticipants = useParticipants();
  const room = useRoomContext();

  // Get local video track
  const localVideoTrack = localParticipant?.getTrackPublication(Track.Source.Camera);
  const localScreenTrack = localParticipant?.getTrackPublication(Track.Source.ScreenShare);

  // Track toggle hooks
  const { enabled: audioEnabled, toggle: toggleAudio } = useTrackToggle({ source: Track.Source.Microphone });
  const { enabled: videoEnabled, toggle: toggleVideo } = useTrackToggle({ source: Track.Source.Camera });
  const { enabled: isScreenSharing, toggle: toggleScreenShare } = useTrackToggle({ source: Track.Source.ScreenShare });

  // Video quality presets with bitrates
  const qualityPresets = {
    '720p': { width: 1280, height: 720, frameRate: 30, bitrate: 1_500_000 },
    '1080p': { width: 1920, height: 1080, frameRate: 30, bitrate: 3_000_000 },
    '1080p60': { width: 1920, height: 1080, frameRate: 60, bitrate: 4_500_000 },
  };

  const bitrateMultipliers = {
    low: 0.5,
    medium: 0.75,
    high: 1.0,
    ultra: 1.5,
  };

  // Apply video quality settings when changed
  useEffect(() => {
    const applyQualitySettings = async () => {
      if (!localParticipant) return;

      const cameraTrack = localParticipant.getTrackPublication(Track.Source.Camera)?.track;
      if (!cameraTrack) return;

      const preset = qualityPresets[videoQuality];
      const multiplier = bitrateMultipliers[videoBitrate];
      const targetBitrate = Math.round(preset.bitrate * multiplier);

      try {
        // Update constraints for the track
        const mediaStreamTrack = cameraTrack.mediaStreamTrack;
        if (mediaStreamTrack && 'applyConstraints' in mediaStreamTrack) {
          await mediaStreamTrack.applyConstraints({
            width: { ideal: preset.width },
            height: { ideal: preset.height },
            frameRate: { ideal: preset.frameRate },
          });
        }

        console.log(`Video quality set to ${videoQuality} at ${targetBitrate / 1_000_000}Mbps`);
      } catch (err) {
        console.error('Failed to apply video quality:', err);
      }
    };

    applyQualitySettings();
  }, [videoQuality, videoBitrate, localParticipant]);

  // Monitor connection quality
  useEffect(() => {
    if (!room) return;

    const handleConnectionQualityChange = () => {
      const quality = localParticipant?.connectionQuality;
      // ConnectionQuality enum: Unknown=0, Poor=1, Good=2, Excellent=3
      if (quality === 'excellent') setConnectionQuality('excellent');
      else if (quality === 'good') setConnectionQuality('good');
      else if (quality === 'poor') setConnectionQuality('poor');
      else setConnectionQuality('unknown');
    };

    room.on(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChange);
    handleConnectionQualityChange(); // Initial check

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleConnectionQualityChange);
    };
  }, [room, localParticipant]);

  // Generate invite link from code
  const inviteLink = inviteCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}` : '';


  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleToggleScreenShare = useCallback(async () => {
    try {
      await toggleScreenShare();
    } catch (err) {
      console.error('Screen share toggle failed:', err);
    }
  }, [toggleScreenShare]);

  const handleToggleAudio = useCallback(async () => {
    try {
      await toggleAudio();
    } catch (err) {
      console.error('Audio toggle failed:', err);
    }
  }, [toggleAudio]);

  const handleToggleVideo = useCallback(async () => {
    try {
      await toggleVideo();
    } catch (err) {
      console.error('Video toggle failed:', err);
    }
  }, [toggleVideo]);

  // Recording functionality - Canvas compositing for all participants
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileWriterRef = useRef<FileSystemWritableFileStream | null>(null);

  const handleStartRecording = async () => {
    try {
      // Try to use File System Access API for direct file saving
      let fileHandle: FileSystemFileHandle | null = null;

      if ('showSaveFilePicker' in window) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        try {
          fileHandle = await (window as Window & { showSaveFilePicker: (options: { suggestedName: string; types: { accept: Record<string, string[]> }[] }) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
            suggestedName: `streamside-recording-${timestamp}.webm`,
            types: [{ accept: { 'video/webm': ['.webm'] } }]
          });
          fileWriterRef.current = await fileHandle.createWritable();
        } catch (err) {
          // User cancelled or API not supported - fall back to blob download
          console.log('File System API not available, using blob download');
        }
      }

      // Create offscreen canvas for compositing
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      canvasRef.current = canvas;

      if (!ctx) {
        alert('Failed to create canvas context');
        return;
      }

      // Get all video elements from participants
      const drawFrame = () => {
        if (!ctx || !canvasRef.current) return;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 1920, 1080);

        // Get all participants with video tracks
        const participantsWithVideo = [
          { participant: localParticipant, isLocal: true },
          ...allParticipants.filter(p => !p.isLocal).map(p => ({ participant: p, isLocal: false }))
        ].filter(({ participant }) => {
          const track = participant?.getTrackPublication(Track.Source.Camera)?.track;
          return track?.mediaStreamTrack?.readyState === 'live';
        });

        // Check for screen share
        const screenSharer = isScreenSharing
          ? localParticipant
          : allParticipants.find(p => !p.isLocal && p.getTrackPublication(Track.Source.ScreenShare)?.track);

        if (screenSharer) {
          // Screen share layout: main screen + small camera thumbnails
          const screenTrack = screenSharer.getTrackPublication(Track.Source.ScreenShare)?.track;
          if (screenTrack) {
            const videoEl = document.querySelector(`video[data-participant-id="${screenSharer.identity}"][data-source="screen_share"]`) as HTMLVideoElement;
            if (videoEl && videoEl.readyState >= 2) {
              // Draw screen share to fill most of the canvas
              ctx.drawImage(videoEl, 0, 0, 1920, 810);
            }
          }

          // Draw camera thumbnails at bottom
          const thumbWidth = 320;
          const thumbHeight = 180;
          const thumbY = 830;
          let thumbX = 20;

          participantsWithVideo.forEach(({ participant }) => {
            const track = participant?.getTrackPublication(Track.Source.Camera)?.track;
            if (track) {
              const videoEl = document.querySelector(`video[data-participant-id="${participant?.identity}"]`) as HTMLVideoElement;
              if (videoEl && videoEl.readyState >= 2) {
                ctx.drawImage(videoEl, thumbX, thumbY, thumbWidth, thumbHeight);
                thumbX += thumbWidth + 10;
              }
            }
          });
        } else {
          // Grid layout for cameras only
          const numParticipants = participantsWithVideo.length;
          const cols = numParticipants <= 2 ? numParticipants : numParticipants <= 4 ? 2 : 3;
          const rows = Math.ceil(numParticipants / cols);
          const cellWidth = 1920 / cols;
          const cellHeight = 1080 / rows;

          participantsWithVideo.forEach(({ participant }, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = col * cellWidth;
            const y = row * cellHeight;

            const track = participant?.getTrackPublication(Track.Source.Camera)?.track;
            if (track) {
              // Try to find the video element
              const videoEl = document.querySelector(`video[data-participant-id="${participant?.identity}"]`) as HTMLVideoElement;
              if (videoEl && videoEl.readyState >= 2) {
                // Maintain aspect ratio
                const videoRatio = videoEl.videoWidth / videoEl.videoHeight;
                const cellRatio = cellWidth / cellHeight;

                let drawWidth = cellWidth;
                let drawHeight = cellHeight;
                let drawX = x;
                let drawY = y;

                if (videoRatio > cellRatio) {
                  drawHeight = cellWidth / videoRatio;
                  drawY = y + (cellHeight - drawHeight) / 2;
                } else {
                  drawWidth = cellHeight * videoRatio;
                  drawX = x + (cellWidth - drawWidth) / 2;
                }

                ctx.drawImage(videoEl, drawX, drawY, drawWidth, drawHeight);
              }
            }
          });
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };

      // Start drawing frames
      drawFrame();

      // Create stream from canvas
      const canvasStream = canvas.captureStream(30); // 30 fps

      // Mix audio from all participants
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Add local audio
      const localAudioTrack = localParticipant?.getTrackPublication(Track.Source.Microphone)?.track;
      if (localAudioTrack?.mediaStream) {
        const source = audioContext.createMediaStreamSource(localAudioTrack.mediaStream);
        source.connect(destination);
      }

      // Add remote audio
      allParticipants.filter(p => !p.isLocal).forEach(participant => {
        const audioTrack = participant.getTrackPublication(Track.Source.Microphone)?.track;
        if (audioTrack?.mediaStream) {
          const source = audioContext.createMediaStreamSource(audioTrack.mediaStream);
          source.connect(destination);
        }
      });

      // Combine video and audio
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);

      // Find supported format
      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 8_000_000 // 8 Mbps for high quality
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          if (fileWriterRef.current) {
            // Write directly to file
            await fileWriterRef.current.write(event.data);
          } else {
            // Collect chunks for blob download
            recordedChunksRef.current.push(event.data);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop canvas animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        canvasRef.current = null;

        if (fileWriterRef.current) {
          // Close file writer
          await fileWriterRef.current.close();
          fileWriterRef.current = null;
          console.log('Recording saved directly to file');
        } else if (recordedChunksRef.current.length > 0) {
          // Fall back to blob download
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
          const filename = `streamside-recording-${timestamp}.webm`;

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }

        recordedChunksRef.current = [];
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred.');
      };

      // Start recording with 1s timeslice
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log('Multi-participant recording started');

    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Failed to start recording: ' + (err as Error).message);
    }
  };

  const handleStopRecording = () => {
    console.log('Stop recording called');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage = {
      id: Date.now(),
      name: 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
  };

  const handleLeaveCall = () => {
    if (isRecording) {
      const confirmed = window.confirm(
        'Recording is in progress. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    onLeave();
  };

  return (
    <div className="h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold">{studioName}</h2>
              <p className="text-xs text-muted-foreground">Studio Session</p>
            </div>

            {isRecording && (
              <div className="ml-2 flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-destructive animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Invite Button */}
            {inviteCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus className="size-4 mr-2" />
                Invite
              </Button>
            )}

            <Button
              variant={showParticipants ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="size-4 mr-2" />
              {participants.length + 1} {/* +1 for you (local) */}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {inviteCode && (
                  <>
                    <DropdownMenuItem onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="size-4 mr-2" />
                      Invite Participants
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="size-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowChat(!showChat)}>
                  <MessageSquare className="size-4 mr-2" />
                  {showChat ? 'Hide Chat' : 'Show Chat'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleLeaveCall}
                >
                  <Phone className="size-4 mr-2 rotate-135" />
                  Leave Studio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content - Google Meet style layout with PiP support */}
      <main className="flex-1 relative overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        {(() => {
          // Check if anyone is screen sharing
          const remoteScreenSharer = allParticipants.find(p => !p.isLocal && p.getTrackPublication(Track.Source.ScreenShare)?.track);
          const anyoneScreenSharing = isScreenSharing || remoteScreenSharer;

          // PiP Layout: Screen share is active
          if (anyoneScreenSharing) {
            const screenShareParticipant = isScreenSharing ? localParticipant : remoteScreenSharer;
            const screenTrack = isScreenSharing
              ? localScreenTrack
              : remoteScreenSharer?.getTrackPublication(Track.Source.ScreenShare);

            return (
              <div className="h-full flex flex-col p-4">
                {/* Main Screen Share View */}
                <div className="flex-1 relative bg-neutral-800 dark:bg-neutral-950 rounded-xl overflow-hidden shadow-xl">
                  {screenTrack?.track && screenShareParticipant && (
                    <VideoTrack
                      trackRef={{
                        participant: screenShareParticipant,
                        publication: screenTrack,
                        source: Track.Source.ScreenShare
                      }}
                      className="absolute inset-0 w-full h-full object-contain bg-black"
                    />
                  )}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 rounded-lg">
                    <p className="text-white text-sm font-medium">
                      {isScreenSharing ? 'You are sharing your screen' : `${remoteScreenSharer?.name || remoteScreenSharer?.identity} is sharing`}
                    </p>
                  </div>
                </div>

                {/* PiP Thumbnails - Bottom right */}
                <div className="absolute bottom-20 right-4 flex gap-2 z-10">
                  {/* Your camera (even while screen sharing) */}
                  {videoEnabled && localVideoTrack?.track && (
                    <div className="relative w-40 h-24 bg-neutral-800 rounded-lg overflow-hidden shadow-xl border-2 border-white/20">
                      <VideoTrack
                        trackRef={{ participant: localParticipant!, publication: localVideoTrack, source: Track.Source.Camera }}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={mirrorVideo ? { transform: 'scaleX(-1)' } : {}}
                      />
                      <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                        You
                      </div>
                    </div>
                  )}

                  {/* Remote participants cameras */}
                  {allParticipants
                    .filter(p => !p.isLocal)
                    .map((participant) => {
                      const videoTrack = participant.getTrackPublication(Track.Source.Camera);
                      if (!videoTrack?.track) return null;

                      return (
                        <div
                          key={participant.identity}
                          className="relative w-40 h-24 bg-neutral-800 rounded-lg overflow-hidden shadow-xl border-2 border-white/20"
                        >
                          <VideoTrack
                            trackRef={{ participant, publication: videoTrack, source: Track.Source.Camera }}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                            {participant.name || participant.identity}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          }

          // Normal Grid Layout: No screen share active
          return (
            <div className="h-full flex items-center justify-center p-4 md:p-8">
              <div className={`w-full max-w-6xl ${allParticipants.filter(p => !p.isLocal).length === 0 ? 'max-w-4xl' : ''}`}>
                <div className={`grid gap-3 ${allParticipants.filter(p => !p.isLocal).length === 0
                  ? 'grid-cols-1'
                  : allParticipants.filter(p => !p.isLocal).length === 1
                    ? 'grid-cols-1 md:grid-cols-2'
                    : allParticipants.filter(p => !p.isLocal).length <= 3
                      ? 'grid-cols-2'
                      : 'grid-cols-2 md:grid-cols-3'
                  }`}>
                  {/* Your camera */}
                  <div className="relative bg-neutral-800 dark:bg-neutral-950 rounded-xl overflow-hidden shadow-xl" style={{ aspectRatio: '16/9' }}>
                    {videoEnabled && localVideoTrack?.track ? (
                      <VideoTrack
                        trackRef={{ participant: localParticipant!, publication: localVideoTrack, source: Track.Source.Camera }}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={mirrorVideo ? { transform: 'scaleX(-1)' } : {}}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-700 dark:bg-neutral-800">
                        <Avatar className="size-24 md:size-32">
                          <AvatarFallback className="text-3xl md:text-4xl bg-neutral-600 text-white">You</AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm md:text-base font-medium">You</p>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">Local</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Remote participants */}
                  {allParticipants
                    .filter(p => !p.isLocal)
                    .map((participant) => {
                      const videoTrack = participant.getTrackPublication(Track.Source.Camera);

                      return (
                        <div
                          key={participant.identity}
                          className="relative bg-neutral-800 dark:bg-neutral-950 rounded-xl overflow-hidden shadow-xl"
                          style={{ aspectRatio: '16/9' }}
                        >
                          {videoTrack?.track ? (
                            <VideoTrack
                              trackRef={{ participant, publication: videoTrack, source: Track.Source.Camera }}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-700 dark:bg-neutral-800">
                              <Avatar className="size-24 md:size-32">
                                <AvatarFallback className="text-3xl md:text-4xl bg-neutral-600 text-white">
                                  {(participant.name || participant.identity).slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/70 to-transparent">
                            <div className="flex items-center gap-2">
                              <p className="text-white text-sm md:text-base font-medium">{participant.name || participant.identity}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })()}


        {showParticipants && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-border p-4">
            <h3 className="mb-4">
              Participants ({participants.length + 1})
            </h3>
            <div className="space-y-2">
              {/* You (local user) - always shown first */}
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">You</p>
                    <p className="text-xs text-muted-foreground">(Host)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {audioEnabled ? (
                    <Mic className="size-4 text-muted-foreground" />
                  ) : (
                    <MicOff className="size-4 text-destructive" />
                  )}
                  {videoEnabled ? (
                    <Video className="size-4 text-muted-foreground" />
                  ) : (
                    <VideoOff className="size-4 text-destructive" />
                  )}
                </div>
              </div>

              {/* Remote participants */}
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {participant.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">{participant.name}</p>
                      {participant.isLocal && (
                        <p className="text-xs text-muted-foreground">
                          (You)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.audioEnabled ? (
                      <Mic className="size-4 text-muted-foreground" />
                    ) : (
                      <MicOff className="size-4 text-destructive" />
                    )}
                    {participant.videoEnabled ? (
                      <Video className="size-4 text-muted-foreground" />
                    ) : (
                      <VideoOff className="size-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3>Chat</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{msg.name}</span>
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-sm bg-muted rounded-lg p-2">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
            <div className="bg-card rounded-lg p-6 w-[420px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Call Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="size-4" />
                </Button>
              </div>

              {/* Connection Quality Indicator */}
              {connectionQuality === 'poor' && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="size-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">Poor Connection</p>
                    <p className="text-xs text-muted-foreground">Consider lowering video quality or bitrate</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Video Resolution */}
                <div>
                  <label className="block text-sm font-medium mb-2">Video Resolution</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['720p', '1080p', '1080p60'] as const).map((quality) => (
                      <button
                        key={quality}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${videoQuality === quality
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                          }`}
                        onClick={() => setVideoQuality(quality)}
                      >
                        {quality === '1080p60' ? '1080p 60fps' : quality}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher resolution requires more bandwidth and CPU
                  </p>
                </div>

                {/* Bitrate */}
                <div>
                  <label className="block text-sm font-medium mb-2">Video Bitrate</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'ultra'] as const).map((rate) => (
                      <button
                        key={rate}
                        className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${videoBitrate === rate
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                          }`}
                        onClick={() => setVideoBitrate(rate)}
                      >
                        {rate}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {videoBitrate === 'low' && '~1.5 Mbps - Best for slow connections'}
                    {videoBitrate === 'medium' && '~2.5 Mbps - Balanced quality'}
                    {videoBitrate === 'high' && '~4 Mbps - High quality (recommended)'}
                    {videoBitrate === 'ultra' && '~6 Mbps - Maximum quality (requires fast upload)'}
                  </p>
                </div>

                {/* Mirror Video */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Mirror Video</span>
                    <p className="text-xs text-muted-foreground">Flip your video horizontally</p>
                  </div>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors ${mirrorVideo ? 'bg-primary' : 'bg-muted'
                      }`}
                    onClick={() => setMirrorVideo(!mirrorVideo)}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${mirrorVideo ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                  </button>
                </div>

                {/* Connection Status */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${connectionQuality === 'excellent' ? 'bg-green-500' :
                        connectionQuality === 'good' ? 'bg-yellow-500' :
                          connectionQuality === 'poor' ? 'bg-red-500' :
                            'bg-gray-400'
                        }`} />
                      <span className="text-sm capitalize">{connectionQuality}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowSettings(false)}>Done</Button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && inviteCode && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
            <div className="bg-card rounded-lg p-6 w-[420px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Invite Participants</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowInviteModal(false)}>
                  <X className="size-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Share this link or code with others to invite them to your studio.
              </p>

              <div className="space-y-4">
                {/* Invite Link */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Link2 className="size-4 inline mr-1" />
                    Invite Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border-0 focus:outline-none"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyInviteLink}
                      className="flex-shrink-0"
                    >
                      {inviteCopied ? (
                        <>
                          <Check className="size-4 mr-1 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="size-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Meeting Code */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meeting Code
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg font-mono tracking-wider">
                      {inviteCode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                      className="flex-shrink-0"
                    >
                      {codeCopied ? (
                        <>
                          <Check className="size-4 mr-1 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="size-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowInviteModal(false)}>Done</Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Controls Footer */}
      <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="size-14 rounded-full" onClick={() => setShowSettings(true)}>
              <Settings className="size-6" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={audioEnabled ? 'outline' : 'destructive'}
              size="icon"
              className="size-14 rounded-full"
              onClick={handleToggleAudio}
            >
              {audioEnabled ? (
                <Mic className="size-6" />
              ) : (
                <MicOff className="size-6" />
              )}
            </Button>

            <Button
              variant={videoEnabled ? 'outline' : 'destructive'}
              size="icon"
              className="size-14 rounded-full"
              onClick={handleToggleVideo}
            >
              {videoEnabled ? (
                <Video className="size-6" />
              ) : (
                <VideoOff className="size-6" />
              )}
            </Button>

            <Button
              variant={isScreenSharing ? 'default' : 'outline'}
              size="icon"
              className="size-14 rounded-full"
              onClick={handleToggleScreenShare}
            >
              <Monitor className="size-6" />
            </Button>

            {isRecording ? (
              <Button
                variant="destructive"
                size="lg"
                className="px-6"
                onClick={handleStopRecording}
              >
                <Radio className="size-5 mr-2" />
                Stop Recording
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="px-6"
                onClick={handleStartRecording}
              >
                <Radio className="size-5 mr-2" />
                Record
              </Button>
            )}

            <Button
              variant="destructive"
              size="icon"
              className="size-14 rounded-full transition-colors"
              onClick={handleLeaveCall}
            >
              <Phone className="size-6 rotate-135" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showChat ? 'default' : 'outline'}
              size="icon"
              className="size-14 rounded-full"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="size-6" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
