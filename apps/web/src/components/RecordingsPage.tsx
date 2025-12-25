import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Search, Download, Trash2, Play, Calendar, Clock, FileVideo, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';

interface Recording {
  id: string;
  title: string;
  studioName: string;
  duration: string;
  size: string;
  date: string;
  participants: number;
  status: 'completed' | 'processing' | 'failed';
  thumbnailUrl?: string;
}

export default function RecordingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  
  const [recordings] = useState<Recording[]>([
    {
      id: '1',
      title: 'Episode 45: AI in Healthcare',
      studioName: 'Weekly Podcast',
      duration: '1:23:45',
      size: '2.4 GB',
      date: '2025-11-25',
      participants: 3,
      status: 'completed',
    },
    {
      id: '2',
      title: 'Customer Interview - Acme Corp',
      studioName: 'Client Interviews',
      duration: '45:12',
      size: '1.1 GB',
      date: '2025-11-24',
      participants: 2,
      status: 'completed',
    },
    {
      id: '3',
      title: 'Episode 44: Future of Remote Work',
      studioName: 'Weekly Podcast',
      duration: '1:15:32',
      size: '2.2 GB',
      date: '2025-11-23',
      participants: 4,
      status: 'processing',
    },
    {
      id: '4',
      title: 'Team Standup - Nov 22',
      studioName: 'Team Standup',
      duration: '15:30',
      size: '450 MB',
      date: '2025-11-22',
      participants: 5,
      status: 'completed',
    },
    {
      id: '5',
      title: 'Interview with Jane Smith',
      studioName: 'Client Interviews',
      duration: '0:00',
      size: '0 MB',
      date: '2025-11-21',
      participants: 2,
      status: 'failed',
    },
  ]);

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = 
      recording.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recording.studioName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || recording.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: Recording['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
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
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="ghost" className="relative size-10 rounded-full">
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Recordings</h1>
          <p className="text-muted-foreground">
            View, download, and manage all your recording sessions
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recordings</p>
                  <p className="text-2xl mt-1">{recordings.length}</p>
                </div>
                <FileVideo className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl mt-1">
                    {recordings.filter(r => r.status === 'completed').length}
                  </p>
                </div>
                <Play className="size-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-2xl mt-1">
                    {recordings.filter(r => r.status === 'processing').length}
                  </p>
                </div>
                <Clock className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-2xl mt-1">6.2 GB</p>
                </div>
                <Download className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search recordings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="size-4 mr-2" />
                    Filter: {filterStatus === 'all' ? 'All' : filterStatus}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                    All Recordings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterStatus('completed')}>
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('processing')}>
                    Processing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('failed')}>
                    Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Recordings Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recording</TableHead>
                  <TableHead>Studio</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded bg-muted flex items-center justify-center">
                          <Video className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{recording.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {recording.participants} participant{recording.participants !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{recording.studioName}</TableCell>
                    <TableCell>{recording.duration}</TableCell>
                    <TableCell>{recording.size}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="size-4" />
                        {new Date(recording.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(recording.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={recording.status !== 'completed'}>
                            <Play className="size-4 mr-2" />
                            Play
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={recording.status !== 'completed'}>
                            <Download className="size-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredRecordings.length === 0 && (
              <div className="text-center py-12">
                <FileVideo className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2">No recordings found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Try a different search term or filter' 
                    : 'Start recording in a studio to see your recordings here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
