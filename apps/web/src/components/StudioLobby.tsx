'use client';

import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Settings,
  ArrowLeft,
  Users,
  Copy,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type Device = { deviceId: string; label: string };

type StudioLobbyUIProps = {
  studioId: string;
  studioName: string;
  studioDescription: string;
  activeParticipants: number;

  videoEnabled: boolean;
  audioEnabled: boolean;

  cameras: Device[];
  microphones: Device[];
  speakers: Device[];

  selectedCamera: string | null;
  selectedMicrophone: string | null;
  selectedSpeaker: string | null;

  inviteLink: string;
  copied: boolean;

  onToggleVideo: () => void;
  onToggleAudio: () => void;

  onCameraChange: (id: string) => void;
  onMicrophoneChange: (id: string) => void;
  onSpeakerChange: (id: string) => void;

  onCopyInvite: () => void;
  onBack: () => void;
  onSettings: () => void;
  onJoin: () => void;
};

export default function StudioLobbyUI(props: StudioLobbyUIProps) {
  const {
    studioName,
    studioDescription,
    activeParticipants,
    videoEnabled,
    audioEnabled,
    cameras,
    microphones,
    speakers,
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    inviteLink,
    copied,
    onToggleVideo,
    onToggleAudio,
    onCameraChange,
    onMicrophoneChange,
    onSpeakerChange,
    onCopyInvite,
    onBack,
    onSettings,
    onJoin,
  } = props;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <Video className="size-6 text-primary" />
            <span className="text-lg">{studioName}</span>
          </div>

          <Button variant="ghost" size="icon" onClick={onSettings}>
            <Settings className="size-5" />
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-muted relative">
                {videoEnabled ? (
                  <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Video className="size-24 text-primary/40" />
                    <div className="absolute bottom-4 left-4 bg-background/80 px-3 py-1.5 rounded-lg">
                      You
                    </div>
                  </div>
                ) : (
                  <div className="size-full flex items-center justify-center">
                    <VideoOff className="size-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="p-4 flex justify-center gap-4">
                <Button
                  variant={audioEnabled ? 'default' : 'destructive'}
                  size="lg"
                  className="rounded-full size-14"
                  onClick={onToggleAudio}
                >
                  {audioEnabled ? <Mic /> : <MicOff />}
                </Button>

                <Button
                  variant={videoEnabled ? 'default' : 'destructive'}
                  size="lg"
                  className="rounded-full size-14"
                  onClick={onToggleVideo}
                >
                  {videoEnabled ? <Video /> : <VideoOff />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Devices */}
          <Card>
            <CardHeader>
              <CardTitle>Device Settings</CardTitle>
              <CardDescription>Configure your devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Camera</Label>
                <Select value={selectedCamera ?? ''} onValueChange={onCameraChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cameras.map(c => (
                      <SelectItem key={c.deviceId} value={c.deviceId}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Microphone</Label>
                <Select value={selectedMicrophone ?? ''} onValueChange={onMicrophoneChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {microphones.map(m => (
                      <SelectItem key={m.deviceId} value={m.deviceId}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Speakers</Label>
                <Select value={selectedSpeaker ?? ''} onValueChange={onSpeakerChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {speakers.map(s => (
                      <SelectItem key={s.deviceId} value={s.deviceId}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Studio Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Studio Name</Label>
                <p>{studioName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{studioDescription}</p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span className="text-sm">{activeParticipants} participants</span>
                <Badge variant="secondary" className="ml-auto">Live</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invite Others</CardTitle>
              <CardDescription>Share this link</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm truncate">
                {inviteLink}
              </div>
              <Button variant="outline" size="icon" onClick={onCopyInvite}>
                {copied ? <Check /> : <Copy />}
              </Button>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={onJoin}>
            Join Studio
          </Button>
        </div>
      </main>
    </div>
  );
}
