import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Video, 
  Plus, 
  Calendar, 
  Link2, 
  Clock, 
  Settings, 
  LogOut, 
  User,
  Play,
  Users,
  Folder
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ThemeToggle } from './ThemeToggle';

interface Studio {
  id: string;
  name: string;
  status: 'active' | 'idle';
  activeParticipants: number;
  lastActive: string;
}

export default function ImprovedDashboard() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');

  const studios: Studio[] = [
    {
      id: '1',
      name: 'Weekly Team Standup',
      status: 'active',
      activeParticipants: 3,
      lastActive: '2 min ago',
    },
    {
      id: '2',
      name: 'Client Presentation',
      status: 'idle',
      activeParticipants: 0,
      lastActive: '1 hour ago',
    },
    {
      id: '3',
      name: 'Design Review',
      status: 'idle',
      activeParticipants: 0,
      lastActive: 'Yesterday',
    },
  ];

  const handleQuickStart = () => {
    navigate('/studio/quick-' + Date.now());
  };

  const handleJoinWithCode = () => {
    if (inviteCode.trim()) {
      navigate(`/join/${inviteCode}`);
    }
  };

  const handleSchedule = () => {
    // Schedule meeting logic
    alert('Schedule meeting feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Video className="size-5" />
              </div>
              <span className="text-xl">Streamside</span>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              <div className="relative group">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-8">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
                
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2">
                    <Link to="/settings">
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm">
                        <User className="size-4" />
                        Profile
                      </button>
                    </Link>
                    <Link to="/settings">
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm">
                        <Settings className="size-4" />
                        Settings
                      </button>
                    </Link>
                    <div className="h-px bg-border my-1" />
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm text-destructive">
                      <LogOut className="size-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2">Welcome back, John</h1>
          <p className="text-muted-foreground">
            Start a meeting or join an existing one
          </p>
        </div>

        {/* Main Actions Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 auto-rows-[180px]">
          {/* Start Instant Meeting - Large Primary Action */}
          <Card 
            onClick={handleQuickStart}
            className="md:col-span-2 md:row-span-2 group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-primary/10 via-background to-background dark:from-primary/5 border-primary/30"
          >
            <CardContent className="p-8 h-full flex flex-col justify-between">
              <div>
                <div className="size-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Video className="size-8 text-primary" />
                </div>
                <h3 className="text-2xl mb-3">Start Instant Meeting</h3>
                <p className="text-muted-foreground text-lg">
                  Begin a video call right now. Get a shareable link instantly.
                </p>
              </div>
              <div className="mt-6">
                <Button size="lg" className="w-full group-hover:bg-primary/90">
                  <Play className="size-5 mr-2" />
                  Start Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join with Code */}
          <Card className="md:col-span-2 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-blue-500/10 via-background to-background dark:from-blue-500/5 border-blue-500/20">
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Link2 className="size-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-3">Join with Code</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter meeting code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                      className="flex-1"
                    />
                    <Button onClick={handleJoinWithCode}>Join</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Meeting */}
          <Card 
            onClick={handleSchedule}
            className="md:col-span-1 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-500/10 via-background to-background dark:from-green-500/5 border-green-500/20"
          >
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div className="size-12 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="mb-2">Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Plan ahead
                </p>
              </div>
            </CardContent>
          </Card>

          {/* New Meeting Room */}
          <Card 
            onClick={() => navigate('/studio/new')}
            className="md:col-span-1 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-purple-500/10 via-background to-background dark:from-purple-500/5 border-purple-500/20"
          >
            <CardContent className="p-6 h-full flex flex-col justify-between">
              <div className="size-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="mb-2">New Room</h3>
                <p className="text-sm text-muted-foreground">
                  Create custom
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Rooms</p>
                  <h3 className="text-2xl">{studios.filter(s => s.status === 'active').length}</h3>
                </div>
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Video className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Participants</p>
                  <h3 className="text-2xl">
                    {studios.reduce((sum, s) => sum + s.activeParticipants, 0)}
                  </h3>
                </div>
                <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="size-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Meeting Rooms</p>
                  <h3 className="text-2xl">{studios.length}</h3>
                </div>
                <div className="size-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Folder className="size-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Meeting Rooms */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Meeting Rooms</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/studio/new')}>
                <Plus className="size-4 mr-2" />
                New Room
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studios.map((studio) => (
                <div
                  key={studio.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/studio/${studio.id}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="size-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4>{studio.name}</h4>
                        {studio.status === 'active' && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <div className="size-2 rounded-full bg-green-500 mr-1 animate-pulse" />
                            Live
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {studio.activeParticipants > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="size-3" />
                            {studio.activeParticipants} participant{studio.activeParticipants !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {studio.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={studio.status === 'active' ? 'default' : 'outline'}
                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    {studio.status === 'active' ? 'Join' : 'Enter Room'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}