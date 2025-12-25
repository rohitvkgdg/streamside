'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Folder,
  Trash2
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { authClient, useSession } from '@/lib/auth-client';

interface Studio {
  id: string;
  name: string;
  status: 'active' | 'idle';
  activeParticipants: number;
  lastActive: string;
}

export default function ImprovedDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [inviteCode, setInviteCode] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Guest info popup state
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [guestError, setGuestError] = useState('');

  // Check if coming from "Join as Guest" link
  useEffect(() => {
    if (searchParams?.get('guest') === 'true') {
      setShowGuestPopup(true);
    }
  }, [searchParams]);

  // Helper function to get user initials from name
  const getUserInitials = (): string => {
    // First try session user name
    if (session?.user?.name) {
      const nameParts = session.user.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      return nameParts[0].charAt(0).toUpperCase();
    }
    // Fallback to guest name
    if (guestFirstName) {
      return (guestFirstName.charAt(0) + (guestLastName ? guestLastName.charAt(0) : '')).toUpperCase();
    }
    // Default
    return 'U';
  };

  // Get display name for welcome message
  const getDisplayName = (): string => {
    if (session?.user?.name) {
      return session.user.name.split(' ')[0]; // First name only
    }
    if (guestFirstName) {
      return guestFirstName;
    }
    return '';
  };

  const handleGuestSubmit = () => {
    if (!guestFirstName.trim()) {
      setGuestError('First name is required');
      return;
    }
    setGuestError('');
    setShowGuestPopup(false);
    // Clear the guest param from URL
    router.replace('/dashboard');
  };

  const handleGuestCancel = () => {
    setShowGuestPopup(false);
    router.push('/');
  };

  // Studios state - fetched from API
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isLoadingStudios, setIsLoadingStudios] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  // Fetch studios from API
  const fetchStudios = async () => {
    try {
      const response = await fetch('/api/studios/stats');
      if (response.ok) {
        const data = await response.json();
        setStudios(data.studios || []);
      }
    } catch (error) {
      console.error('Failed to fetch studios:', error);
    } finally {
      setIsLoadingStudios(false);
    }
  };

  // Fetch studios on mount and set up auto-refresh
  useEffect(() => {
    fetchStudios();

    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchStudios, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle clearing idle rooms (only clears closed rooms, not active/live ones)
  const handleClearIdleRooms = async () => {
    console.log('Clear button clicked');
    console.log('All studios:', studios);
    console.log('Studios statuses:', studios.map(s => ({ id: s.id, name: s.name, status: s.status })));

    const idleStudios = studios.filter(s => s.status === 'idle');
    const activeStudios = studios.filter(s => s.status === 'active');

    console.log(`Found ${idleStudios.length} idle rooms and ${activeStudios.length} active rooms`);

    if (idleStudios.length === 0) {
      alert(`No closed rooms to clear. You have ${activeStudios.length} active room(s) which cannot be deleted.`);
      return;
    }

    // No confirmation needed - just delete
    setIsClearing(true);
    let successCount = 0;
    let failedCount = 0;

    // Delete all idle studios in parallel
    await Promise.all(
      idleStudios.map(async (studio) => {
        try {
          console.log(`Attempting to delete studio: ${studio.id}`);
          const res = await fetch(`/api/studios/${studio.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          console.log(`Delete response for ${studio.id}: ${res.status}`);
          if (res.ok) {
            successCount++;
            console.log(`Successfully deleted studio: ${studio.id}`);
          } else {
            const errorData = await res.json().catch(() => ({}));
            console.error('Failed to delete studio:', studio.id, 'Status:', res.status, 'Error:', errorData.error || res.statusText);
            failedCount++;
          }
        } catch (error) {
          console.error('Failed to delete studio:', studio.id, error);
          failedCount++;
        }
      })
    );

    // Refresh the list
    await fetchStudios();
    setIsClearing(false);

    if (failedCount > 0 && successCount > 0) {
      alert(`Cleared ${successCount} room(s). ${failedCount} room(s) could not be deleted (you can only delete rooms you created).`);
    } else if (failedCount > 0) {
      alert(`Could not delete ${failedCount} room(s). You can only delete rooms you created.`);
    } else if (successCount > 0) {
      // Success - no alert needed, the UI will update
    }
  };

  const [isStartingMeeting, setIsStartingMeeting] = useState(false);

  const handleQuickStart = async () => {
    if (isStartingMeeting) return;
    setIsStartingMeeting(true);

    try {
      // Check if this is a guest (no authenticated session)
      const isGuest = !session?.user && guestFirstName;

      // For guests, generate a guest ID if not already in sessionStorage
      let guestId = '';
      const guestFullName = `${guestFirstName} ${guestLastName}`.trim();
      if (isGuest) {
        guestId = sessionStorage.getItem('guestId') || `guest-${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem('guestId', guestId);
        sessionStorage.setItem('guestName', guestFullName);
      }

      // Create studio with "Instant Meeting" name
      const res = await fetch('/api/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Instant Meeting',
          description: 'Quick meeting started from dashboard',
          ...(isGuest ? { guestId, guestName: guestFullName } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to create instant meeting:', data.error);
        alert('Failed to start meeting. Please try again.');
        setIsStartingMeeting(false);
        return;
      }

      const data = await res.json();
      // Navigate directly to the video call page, skipping the lobby
      router.push(`/studio/${data.studio.id}/call?name=${encodeURIComponent('Instant Meeting')}`);
    } catch (error) {
      console.error('Error starting instant meeting:', error);
      alert('Failed to start meeting. Please try again.');
      setIsStartingMeeting(false);
    }
  };

  const handleJoinWithCode = () => {
    if (inviteCode.trim()) {
      router.push(`/invite/${inviteCode.trim()}`);
    }
  };

  const handleSchedule = () => {
    router.push('/schedule');
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if signOut fails
      router.push('/');
    }
  };

  return (
    <>
      {/* Guest Info Popup */}
      {showGuestPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-card rounded-lg p-6 w-96 shadow-xl relative">
            <button
              onClick={handleGuestCancel}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2 className="text-xl font-semibold mb-4">Guest Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={guestFirstName}
                  onChange={(e) => {
                    setGuestFirstName(e.target.value);
                    if (e.target.value.trim()) setGuestError('');
                  }}
                  placeholder="Enter your first name"
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                {guestError && (
                  <p className="text-destructive text-sm mt-1">{guestError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  value={guestLastName}
                  onChange={(e) => setGuestLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mobile Number <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={guestMobile}
                  onChange={(e) => setGuestMobile(e.target.value)}
                  placeholder="Enter your mobile number"
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleGuestCancel}
                  className="flex-1 py-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGuestSubmit}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background transition-colors duration-300">
        {/* Navigation */}
        <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-semibold">Streamside</span>
              </Link>

              <div className="flex items-center gap-4">
                <ThemeToggle />

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 size-9"
                  >
                    <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <span className="text-sm font-medium">{getUserInitials()}</span>
                    </div>
                  </button>

                  {/* Dropdown */}
                  {showUserMenu && (
                    <>
                      {/* Backdrop to close on click outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                        <div className="p-2">
                          <Link href="/settings" onClick={() => setShowUserMenu(false)}>
                            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm">
                              <User className="size-4" />
                              Profile
                            </button>
                          </Link>
                          <Link href="/settings#password-settings" onClick={() => setShowUserMenu(false)}>
                            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm">
                              <Settings className="size-4" />
                              Settings
                            </button>
                          </Link>
                          <div className="h-px bg-border my-1" />
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              handleSignOut();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm text-destructive"
                          >
                            <LogOut className="size-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="mb-2">Welcome back{getDisplayName() ? `, ${getDisplayName()}` : ''}</h1>
            <p className="text-muted-foreground">
              Start a meeting or join an existing one
            </p>
          </div>

          {/* Main Actions Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-12 auto-rows-[180px]">
            {/* Start Instant Meeting - Large Primary Action */}
            <div
              onClick={!isStartingMeeting ? handleQuickStart : undefined}
              className={`md:col-span-2 md:row-span-2 cursor-pointer rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 ${isStartingMeeting ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <div className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="size-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6">
                    {isStartingMeeting ? (
                      <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Video className="size-8 text-primary" />
                    )}
                  </div>
                  <h3 className="text-2xl mb-3">Start Instant Meeting</h3>
                  <p className="text-muted-foreground text-lg">
                    Begin a video call right now. Get a shareable link instantly.
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    disabled={isStartingMeeting}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 w-full group-hover:bg-primary/90"
                  >
                    {isStartingMeeting ? (
                      <>
                        <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="size-5 mr-2" />
                        Start Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div
              onClick={() => router.push('/studio/new')}
              className="md:col-span-1 md:row-span-1 cursor-pointer rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              <div className="p-6 h-full flex flex-col justify-between">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/10 flex items-center justify-center mb-4">
                  <Plus className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2">New Room</h3>
                  <p className="text-sm text-muted-foreground">
                    Create custom
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={handleSchedule}
              className="md:col-span-1 md:row-span-1 cursor-pointer rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              <div className="p-6 h-full flex flex-col justify-between">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2">Schedule</h3>
                  <p className="text-sm text-muted-foreground">
                    Plan ahead
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 md:row-span-1 rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200">
              <div className="p-6 h-full flex flex-col justify-between">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/10 flex items-center justify-center flex-shrink-0">
                    <Link2 className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-3">Join with Code</h3>
                    <div className="flex gap-2">
                      <input
                        placeholder="Enter meeting code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
                        className="flex-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <button onClick={handleJoinWithCode} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9">
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Rooms</p>
                    <h3 className="text-2xl">{studios.filter(s => s.status === 'active').length}</h3>
                  </div>
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Video className="size-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Participants</p>
                    <h3 className="text-2xl">
                      {studios.reduce((sum, s) => sum + s.activeParticipants, 0)}
                    </h3>
                  </div>
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="size-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Meeting Rooms</p>
                    <h3 className="text-2xl">{studios.length}</h3>
                  </div>
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Folder className="size-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Meeting Rooms */}
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl">Recent Meeting Rooms</h3>
                <div className="flex items-center gap-2">
                  {studios.filter(s => s.status === 'idle').length > 0 && (
                    <button
                      onClick={handleClearIdleRooms}
                      disabled={isClearing}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 h-8 text-sm disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isClearing ? (
                        <>
                          <div className="size-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="size-4" />
                          Clear
                        </>
                      )}
                    </button>
                  )}
                  <button onClick={() => router.push('/studio/new')} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8">
                    <Plus className="size-4 mr-2" />
                    New Room
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-3">
                {studios.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Video className="size-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-lg mb-2">No meeting rooms yet</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create your first meeting room to get started
                    </p>
                    <button
                      onClick={() => router.push('/studio/new')}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9"
                    >
                      <Plus className="size-4 mr-1" />
                      Create Room
                    </button>
                  </div>
                ) : (
                  [...studios].sort((a, b) => {
                    // Sort by status first (active first), then by lastActive ascending (oldest first)
                    if (a.status === 'active' && b.status !== 'active') return -1;
                    if (a.status !== 'active' && b.status === 'active') return 1;
                    return 0; // Keep original order for same status (API returns in ascending order)
                  }).map((studio) => (
                    <div
                      key={studio.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/studio/${studio.id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Video className="size-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4>{studio.name}</h4>
                            {studio.status === 'active' && (
                              <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                <div className="size-2 rounded-full bg-green-500 mr-1 animate-pulse" />
                                Live
                              </span>
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
                      <button
                        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 ${studio.status === 'active'
                          ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                          : 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground'
                          } group-hover:bg-primary group-hover:text-primary-foreground`}
                      >
                        {studio.status === 'active' ? 'Join' : 'Enter Room'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
