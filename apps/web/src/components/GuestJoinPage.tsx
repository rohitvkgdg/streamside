import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, User, Mic, MicOff, VideoOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function GuestJoinPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  
  const [guestName, setGuestName] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState('default');
  const [selectedMicrophone, setSelectedMicrophone] = useState('default');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock studio data
  const studio = {
    name: 'Weekly Podcast',
    hostName: 'John Doe',
    description: 'Our weekly discussion on tech trends',
  };

  // Mock device lists
  const cameras = [
    { id: 'default', name: 'Default Camera' },
    { id: 'camera1', name: 'HD Webcam (Front)' },
  ];

  const microphones = [
    { id: 'default', name: 'Default Microphone' },
    { id: 'mic1', name: 'Blue Yeti' },
    { id: 'mic2', name: 'AirPods Pro' },
  ];

  const handleJoin = async () => {
    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Mock join logic - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to call page as guest
      navigate(`/studio/${inviteCode}/call`);
    } catch (err) {
      setError('Failed to join studio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <Video className="size-8 text-primary" />
            <span className="text-xl ml-2">Streamside</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="mb-2">Join Studio</h1>
          <p className="text-muted-foreground">
            You've been invited to join <span className="font-medium">{studio.name}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-t-lg relative overflow-hidden">
                  {videoEnabled ? (
                    <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Video className="size-24 text-primary/40" />
                      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <p className="text-sm">{guestName || 'Guest'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="size-full flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <VideoOff className="size-16 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Camera is off</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 flex items-center justify-center gap-4">
                  <Button
                    variant={audioEnabled ? 'default' : 'destructive'}
                    size="lg"
                    className="rounded-full size-14"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? <Mic className="size-6" /> : <MicOff className="size-6" />}
                  </Button>
                  
                  <Button
                    variant={videoEnabled ? 'default' : 'destructive'}
                    size="lg"
                    className="rounded-full size-14"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                  >
                    {videoEnabled ? <Video className="size-6" /> : <VideoOff className="size-6" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Device Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Camera</Label>
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map((camera) => (
                        <SelectItem key={camera.id} value={camera.id}>
                          {camera.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Microphone</Label>
                  <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {microphones.map((mic) => (
                        <SelectItem key={mic.id} value={mic.id}>
                          {mic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Join Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Studio Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Studio</Label>
                  <p className="mt-1">{studio.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Host</Label>
                  <p className="mt-1">{studio.hostName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 text-sm">{studio.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>
                  Let others know who you are
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Your Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="guestName"
                        type="text"
                        placeholder="Enter your name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Note:</strong> This is a guest session. You can join the video call and 
                participate normally. If the host enables recording, your video will be recorded.
              </AlertDescription>
            </Alert>

            <Button
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Studio'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Want your own studio?{' '}
                <a href="/auth/signup" className="text-primary hover:underline">
                  Create a free account
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}