'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Video,
    FileText,
    Link2,
    Copy,
    Check,
    Bell,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSession } from '@/lib/auth-client';

export default function SchedulePage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    const [studioName, setStudioName] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scheduled, setScheduled] = useState(false);
    const [meetingDetails, setMeetingDetails] = useState<{
        id: string;
        inviteCode: string;
        inviteLink: string;
        scheduledAt: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    if (!isPending && !session) {
        router.push('/auth/signin');
        return null;
    }

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!studioName.trim()) {
            setError('Studio name is required');
            return;
        }

        if (!date || !time) {
            setError('Please select both date and time');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create the studio with scheduled time
            const res = await fetch('/api/studios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: studioName.trim(),
                    description: description.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to schedule meeting');
                setIsSubmitting(false);
                return;
            }

            const data = await res.json();
            const scheduledDateTime = new Date(`${date}T${time}`);

            // Store meeting details for display
            setMeetingDetails({
                id: data.studio.id,
                inviteCode: data.studio.inviteCode,
                inviteLink: `${window.location.origin}/invite/${data.studio.inviteCode}`,
                scheduledAt: scheduledDateTime.toLocaleString(),
            });

            // Request notification permission and schedule reminder
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const reminderTime = scheduledDateTime.getTime() - 5 * 60 * 1000; // 5 min before
                    const now = Date.now();

                    if (reminderTime > now) {
                        setTimeout(() => {
                            new Notification('Meeting Reminder', {
                                body: `Your meeting "${studioName}" starts in 5 minutes!`,
                                icon: '/favicon.ico',
                            });
                        }, reminderTime - now);
                    }
                }
            }

            setScheduled(true);
        } catch (err) {
            console.error('Error scheduling meeting:', err);
            setError('Failed to schedule meeting. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Get minimum date (today) and time
    const today = new Date().toISOString().split('T')[0];

    if (isPending) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 relative">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Dashboard
                        </button>

                        <span className="text-lg font-semibold absolute left-1/2 -translate-x-1/2">Schedule Meeting</span>

                        <ThemeToggle />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!scheduled ? (
                    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Calendar className="size-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold">Schedule a Meeting</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Plan your meeting in advance and get a shareable link
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSchedule} className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            )}

                            {/* Studio Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Video className="size-4 text-muted-foreground" />
                                    Studio Name <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={studioName}
                                    onChange={(e) => setStudioName(e.target.value)}
                                    placeholder="e.g., Weekly Team Standup"
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="size-4 text-muted-foreground" />
                                    Description <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What's this meeting about?"
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                                />
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="size-4 text-muted-foreground" />
                                        Date <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={today}
                                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="size-4 text-muted-foreground" />
                                        Time <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Notification Note */}
                            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                                <Bell className="size-5 text-primary mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">Reminder Notification</p>
                                    <p className="text-xs text-muted-foreground">
                                        You'll receive a browser notification 5 minutes before the meeting starts
                                    </p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                        Scheduling...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="size-4" />
                                        Schedule Meeting
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Success State */
                    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b border-border text-center">
                            <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <Check className="size-8 text-green-500" />
                            </div>
                            <h1 className="text-xl font-semibold mb-1">Meeting Scheduled!</h1>
                            <p className="text-sm text-muted-foreground">
                                Your meeting "{studioName}" has been scheduled
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Meeting Details */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="size-5 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium">Scheduled for</p>
                                            <p className="text-xs text-muted-foreground">{meetingDetails?.scheduledAt}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Invite Code */}
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium flex items-center gap-2">
                                            <Link2 className="size-4 text-primary" />
                                            Invite Code
                                        </span>
                                        <button
                                            onClick={() => handleCopy(meetingDetails?.inviteCode || '')}
                                            className="text-xs px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                                        >
                                            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <p className="text-lg font-mono font-semibold tracking-wider">
                                        {meetingDetails?.inviteCode}
                                    </p>
                                </div>

                                {/* Invite Link */}
                                <div className="p-4 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Share Link</span>
                                        <button
                                            onClick={() => handleCopy(meetingDetails?.inviteLink || '')}
                                            className="text-xs px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                                        >
                                            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                            {copied ? 'Copied!' : 'Copy Link'}
                                        </button>
                                    </div>
                                    <p className="text-sm text-muted-foreground break-all">
                                        {meetingDetails?.inviteLink}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="flex-1 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
                                >
                                    Back to Dashboard
                                </button>
                                <button
                                    onClick={() => router.push(`/studio/${meetingDetails?.id}/call?name=${encodeURIComponent(studioName)}`)}
                                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    Join Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
