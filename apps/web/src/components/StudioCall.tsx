'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Video,
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
import { Track } from 'livekit-client';

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
  const [videoQuality, setVideoQuality] = useState('auto');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // LiveKit hooks for local participant
  const { localParticipant } = useLocalParticipant();
  const allParticipants = useParticipants();

  // Get local video track
  const localVideoTrack = localParticipant?.getTrackPublication(Track.Source.Camera);
  const localScreenTrack = localParticipant?.getTrackPublication(Track.Source.ScreenShare);

  // Track toggle hooks
  const { enabled: audioEnabled, toggle: toggleAudio } = useTrackToggle({ source: Track.Source.Microphone });
  const { enabled: videoEnabled, toggle: toggleVideo } = useTrackToggle({ source: Track.Source.Camera });
  const { enabled: isScreenSharing, toggle: toggleScreenShare } = useTrackToggle({ source: Track.Source.ScreenShare });

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

  // Recording functionality

  const handleStartRecording = () => {
    // Get the current track from LiveKit
    const trackToRecord = isScreenSharing ? localScreenTrack?.track : localVideoTrack?.track;

    if (!trackToRecord?.mediaStream) {
      alert('No video stream available. Please enable your camera first.');
      return;
    }

    const currentStream = trackToRecord.mediaStream;

    // Check if stream has active tracks
    const tracks = currentStream.getTracks();
    if (tracks.length === 0) {
      alert('No active video tracks found.');
      return;
    }

    try {
      // Find the best supported format
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];

      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      if (!selectedMimeType) {
        alert('Your browser does not support video recording.');
        return;
      }

      console.log('Starting recording with mime type:', selectedMimeType);

      const mediaRecorder = new MediaRecorder(currentStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped. Total chunks:', recordedChunksRef.current.length);

        if (recordedChunksRef.current.length === 0) {
          alert('No data was recorded. Please try again.');
          return;
        }

        // Create blob as webm (the actual recorded format)
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log('Blob created, size:', blob.size);

        if (blob.size === 0) {
          alert('Recording is empty. Please try again with camera enabled.');
          return;
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const filename = `streamside-recording-${timestamp}.mkv`;

        // Use FileReader to create data URL for reliable download
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;

          // Create download link
          const link = document.createElement('a');
          link.href = dataUrl;
          link.setAttribute('download', filename);
          link.style.cssText = 'display:none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log('Download triggered:', filename);
        };
        reader.readAsDataURL(blob);

        recordedChunksRef.current = [];
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred.');
      };

      // Start recording with 100ms timeslice for frequent data collection
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log('Recording started');

    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Failed to start recording: ' + (err as Error).message);
    }
  };

  const handleStopRecording = () => {
    console.log('Stop recording called');
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

      {/* Main Content - Google Meet style layout */}
      <main className="flex-1 relative overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <div className="h-full flex items-center justify-center p-4 md:p-8">
          {/* Video Container - 16:9 aspect ratio, centered */}
          <div className={`w-full max-w-6xl ${participants.length === 0 ? 'max-w-4xl' : ''}`}>
            <div className={`grid gap-3 ${participants.length === 0
              ? 'grid-cols-1'
              : participants.length === 1
                ? 'grid-cols-1 md:grid-cols-2'
                : participants.length <= 3
                  ? 'grid-cols-2'
                  : 'grid-cols-2 md:grid-cols-3'
              }`}>
              {/* Your camera or screen share */}
              <div className="relative bg-neutral-800 dark:bg-neutral-950 rounded-xl overflow-hidden shadow-xl" style={{ aspectRatio: '16/9' }}>
                {isScreenSharing && localScreenTrack?.track ? (
                  <VideoTrack
                    trackRef={{ participant: localParticipant!, publication: localScreenTrack, source: Track.Source.ScreenShare }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : videoEnabled && localVideoTrack?.track ? (
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm md:text-base font-medium">You</p>
                      <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                        {isScreenSharing ? 'Screen' : 'Local'}
                      </Badge>
                    </div>

                    {/* Mute indicators removed by user request */}
                  </div>
                </div>
              </div>

              {/* Remote participants */}
              {allParticipants
                .filter(p => !p.isLocal)
                .map((participant) => {
                  const videoTrack = participant.getTrackPublication(Track.Source.Camera);
                  const screenTrack = participant.getTrackPublication(Track.Source.ScreenShare);
                  const trackToShow = screenTrack?.track ? screenTrack : videoTrack;

                  return (
                    <div
                      key={participant.identity}
                      className="relative bg-neutral-800 dark:bg-neutral-950 rounded-xl overflow-hidden shadow-xl"
                      style={{ aspectRatio: '16/9' }}
                    >
                      {trackToShow?.track ? (
                        <VideoTrack
                          trackRef={{
                            participant,
                            publication: trackToShow,
                            source: screenTrack?.track ? Track.Source.ScreenShare : Track.Source.Camera
                          }}
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm md:text-base font-medium">{participant.name || participant.identity}</p>
                          </div>

                          {/* Mute indicators removed by user request */}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

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
            <div className="bg-card rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Call Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Video Quality</span>
                  <select
                    className="bg-muted rounded px-2 py-1 text-sm"
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value)}
                  >
                    <option value="auto">Auto</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mirror Video</span>
                  <input
                    type="checkbox"
                    checked={mirrorVideo}
                    onChange={(e) => setMirrorVideo(e.target.checked)}
                    className="rounded"
                  />
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
