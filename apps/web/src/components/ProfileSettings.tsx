import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, User, Mail, Lock, Save, AlertCircle, TrendingUp, Clock, Award, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

export default function ProfileSettings() {
  const navigate = useNavigate();
  
  // Profile settings
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [bio, setBio] = useState('');
  
  // Password settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSaveProfile = () => {
    // Save profile logic
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = () => {
    setError('');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Change password logic
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your studios and recordings.'
    );
    if (confirmed) {
      const doubleConfirm = window.confirm(
        'This is your last chance. Type DELETE to confirm account deletion.'
      );
      if (doubleConfirm) {
        // Delete account logic
        navigate('/auth/signin');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
            
            <div className="flex items-center gap-2">
              <Video className="size-6 text-primary" />
              <span className="text-lg">Account Settings</span>
            </div>

            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saved && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/50">
            <AlertDescription className="text-green-600">
              Settings saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and how you appear to others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="size-20">
                    <AvatarFallback className="text-2xl">
                      {fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile}>
                  <Save className="size-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button onClick={handleChangePassword}>
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                  Manage your OAuth connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full border border-border flex items-center justify-center">
                      <svg className="size-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </div>
                    <div>
                      <p>Google</p>
                      <p className="text-sm text-muted-foreground">Connected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {/* User Stats Bento Grid */}
            <div className="mb-6">
              <h3 className="text-lg mb-4">Your Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Large stat card */}
                <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Meeting Time</p>
                        <h3 className="text-3xl">24.5 hrs</h3>
                      </div>
                      <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="size-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="size-4 text-green-600" />
                      <span className="text-green-600">+12% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tall stat card */}
                <Card>
                  <CardContent className="p-6 h-full flex flex-col justify-between">
                    <div>
                      <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Video className="size-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Meetings This Week</p>
                      <h3 className="text-3xl">12</h3>
                    </div>
                    <Badge variant="secondary" className="w-fit mt-4">
                      Active User
                    </Badge>
                  </CardContent>
                </Card>

                {/* Achievement card */}
                <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Award className="size-6 text-amber-600" />
                      </div>
                      <div>
                        <h4>Early Adopter</h4>
                        <p className="text-xs text-muted-foreground">Member since Dec 2024</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calendar card */}
                <Card className="md:col-span-2">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="size-5 text-primary" />
                          <h4>Next Meeting</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">Weekly Standup - Tomorrow at 10:00 AM</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Notification settings coming soon...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recording Defaults</CardTitle>
                <CardDescription>
                  Default settings for new studios and recordings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Recording preferences coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-destructive mt-8">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <Label>Delete Account</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account, studios, and all recordings.
                  This action cannot be undone.
                </p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}