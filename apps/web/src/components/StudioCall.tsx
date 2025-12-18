import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  Settings,
  PhoneOff,
  Radio,
  Users,
  MessageSquare,
  MoreVertical,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Participant {
  id: string;
  name: string;
  initials: string;
  isLocal: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export default function StudioCall() {
  const { studioId } = useParams();
  const navigate = useNavigate();
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState('00:00:00');
  const [showParticipants, setShowParticipants] = useState(false);

  const [participants] = useState<Participant[]>([
    {
      id: '1',
      name: 'You',
      initials: 'JD',
      isLocal: true,
      audioEnabled: true,
      videoEnabled: true,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      initials: 'SJ',
      isLocal: false,
      audioEnabled: true,
      videoEnabled: true,
    },
    {
      id: '3',
      name: 'Mike Chen',
      initials: 'MC',
      isLocal: false,
      audioEnabled: true,
      videoEnabled: false,
    },
  ]);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Start recording logic here
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Stop recording logic here
  };

  const handleLeaveCall = () => {
    if (isRecording) {
      const confirmed = window.confirm('Recording is in progress. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate(`/studio/${studioId}`);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="size-6 text-primary" />
            <div>
              <h2 className="text-sm">Weekly Podcast</h2>
              <p className="text-xs text-muted-foreground">Studio Session</p>
            </div>
            {/* Recording indicator - minimal red dot */}
            {isRecording && (
              <div className="ml-2 flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-destructive animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={showParticipants ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="size-4 mr-2" />
              {participants.length}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="size-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="size-4 mr-2" />
                  Chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLeaveCall}>
                  <PhoneOff className="size-4 mr-2" />
                  Leave Studio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Participants Grid */}
        <div className="h-full p-4">
          <div className={`grid gap-4 h-full ${
            participants.length === 1 ? 'grid-cols-1' :
            participants.length === 2 ? 'grid-cols-2' :
            participants.length <= 4 ? 'grid-cols-2 grid-rows-2' :
            'grid-cols-3 grid-rows-2'
          }`}>
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="relative bg-muted rounded-lg overflow-hidden"
              >
                {participant.videoEnabled ? (
                  <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Video className="size-24 text-primary/40" />
                  </div>
                ) : (
                  <div className="size-full flex items-center justify-center">
                    <Avatar className="size-32">
                      <AvatarFallback className="text-4xl">
                        {participant.initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {/* Participant Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-white">
                        {participant.name}
                      </p>
                      {participant.isLocal && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!participant.audioEnabled && (
                        <div className="size-8 rounded-full bg-destructive flex items-center justify-center">
                          <MicOff className="size-4 text-white" />
                        </div>
                      )}
                      {!participant.videoEnabled && (
                        <div className="size-8 rounded-full bg-destructive flex items-center justify-center">
                          <VideoOff className="size-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-border p-4">
            <h3 className="mb-4">Participants ({participants.length})</h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{participant.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">{participant.name}</p>
                      {participant.isLocal && (
                        <p className="text-xs text-muted-foreground">(You)</p>
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
      </main>

      {/* Controls Footer */}
      <footer className="border-t border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-12"
            >
              <Settings className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={audioEnabled ? 'outline' : 'destructive'}
              size="icon"
              className="size-14 rounded-full"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Mic className="size-6" /> : <MicOff className="size-6" />}
            </Button>

            <Button
              variant={videoEnabled ? 'outline' : 'destructive'}
              size="icon"
              className="size-14 rounded-full"
              onClick={() => setVideoEnabled(!videoEnabled)}
            >
              {videoEnabled ? <Video className="size-6" /> : <VideoOff className="size-6" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="size-14 rounded-full"
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

            {/* Hang up button - matches mic/cam style, turns red on hover */}
            <Button
              variant="outline"
              size="icon"
              className="size-14 rounded-full hover:bg-destructive hover:text-destructive-foreground hover:border-destructive hover:scale-110 transition-all duration-200"
              onClick={handleLeaveCall}
            >
              <PhoneOff className="size-6" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-12"
            >
              <MessageSquare className="size-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}