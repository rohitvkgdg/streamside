import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Trash2, Save, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';

export default function StudioSettings() {
  const { studioId } = useParams();
  const navigate = useNavigate();
  
  const [studioName, setStudioName] = useState('Weekly Podcast');
  const [description, setDescription] = useState('Our weekly discussion on tech trends');
  const [autoRecord, setAutoRecord] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [enableChat, setEnableChat] = useState(true);
  const [enableScreenShare, setEnableScreenShare] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings logic
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this studio? This action cannot be undone.'
    );
    if (confirmed) {
      // Delete studio logic
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to={`/studio/${studioId}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to Studio
            </Link>
            
            <div className="flex items-center gap-2">
              <Video className="size-6 text-primary" />
              <span className="text-lg">Studio Settings</span>
            </div>

            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saved && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/50">
            <AlertDescription className="text-green-600">
              Settings saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic information about your studio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Studio Name</Label>
                <Input
                  id="name"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="e.g. Weekly Podcast"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this studio is for..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Maximum Participants</Label>
                <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                  <SelectTrigger id="maxParticipants">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 participants</SelectItem>
                    <SelectItem value="5">5 participants</SelectItem>
                    <SelectItem value="10">10 participants</SelectItem>
                    <SelectItem value="20">20 participants</SelectItem>
                    <SelectItem value="50">50 participants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Recording Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Recording Settings</CardTitle>
              <CardDescription>
                Configure how recordings are captured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Record</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start recording when call begins
                  </p>
                </div>
                <Switch checked={autoRecord} onCheckedChange={setAutoRecord} />
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Studio Features</CardTitle>
              <CardDescription>
                Enable or disable features for this studio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>In-Call Chat</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow participants to send text messages during calls
                  </p>
                </div>
                <Switch checked={enableChat} onCheckedChange={setEnableChat} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Screen Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow participants to share their screens
                  </p>
                </div>
                <Switch checked={enableScreenShare} onCheckedChange={setEnableScreenShare} />
              </div>
            </CardContent>
          </Card>

          {/* Invite Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Invite Settings</CardTitle>
              <CardDescription>
                Control who can join this studio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/join/${studioId}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/join/${studioId}`);
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Anyone with this link can join your studio
                </p>
              </div>

              <Button variant="outline" className="w-full">
                Regenerate Invite Link
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/studio/${studioId}`)}
            >
              Cancel
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Delete Studio</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this studio and all its recordings
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}