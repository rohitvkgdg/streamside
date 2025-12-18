import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Plus, Settings, LogOut, Folder, Clock, Users, MoreVertical, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

interface Studio {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  recordingsCount: number;
  participantsCount: number;
  status: 'active' | 'idle';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [studios] = useState<Studio[]>([
    {
      id: '1',
      name: 'Weekly Podcast',
      description: 'Our weekly discussion on tech trends',
      createdAt: '2025-11-20',
      recordingsCount: 12,
      participantsCount: 3,
      status: 'active',
    },
    {
      id: '2',
      name: 'Client Interviews',
      description: 'Customer success stories and testimonials',
      createdAt: '2025-11-15',
      recordingsCount: 8,
      participantsCount: 2,
      status: 'idle',
    },
    {
      id: '3',
      name: 'Team Standup',
      description: 'Daily team sync recordings',
      createdAt: '2025-11-10',
      recordingsCount: 45,
      participantsCount: 5,
      status: 'idle',
    },
  ]);

  const filteredStudios = studios.filter(studio =>
    studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    studio.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStudio = () => {
    // Mock studio creation - in real app, would open dialog/modal
    const newStudioId = Math.random().toString(36).substring(7);
    navigate(`/studio/${newStudioId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <Video className="size-8 text-primary" />
              <span className="text-xl">Streamside</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/recordings">
                <Button variant="ghost">
                  <Folder className="size-4 mr-2" />
                  Recordings
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative size-10 rounded-full">
                    <Avatar>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="size-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/auth/signin')}>
                    <LogOut className="size-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-2">Your Meeting Rooms</h1>
            <p className="text-muted-foreground">
              Manage your meeting rooms and start video calls
            </p>
          </div>
          <Button onClick={handleCreateStudio}>
            <Plus className="size-4 mr-2" />
            New Meeting Room
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search meeting rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Rooms</CardTitle>
              <Folder className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{studios.length}</div>
              <p className="text-xs text-muted-foreground">
                {studios.filter(s => s.status === 'active').length} active now
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Recorded Meetings</CardTitle>
              <Video className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {studios.reduce((sum, s) => sum + s.recordingsCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Saved recordings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">2 days ago</div>
              <p className="text-xs text-muted-foreground">
                Last meeting
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Studios Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudios.map((studio) => (
            <Card key={studio.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{studio.name}</CardTitle>
                      {studio.status === 'active' && (
                        <Badge variant="default" className="text-xs">Live</Badge>
                      )}
                    </div>
                    <CardDescription>{studio.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/studio/${studio.id}`}>
                          Open Studio
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/studio/${studio.id}/settings`}>
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Delete Studio
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Video className="size-4" />
                    <span>{studio.recordingsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="size-4" />
                    <span>{studio.participantsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-4" />
                    <span>{new Date(studio.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/studio/${studio.id}`)}
                  >
                    Enter Studio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Copy invite link
                      navigator.clipboard.writeText(`${window.location.origin}/join/${studio.id}`);
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudios.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Folder className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="mb-2">No studios found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Create your first studio to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateStudio}>
                  <Plus className="size-4 mr-2" />
                  Create Studio
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}