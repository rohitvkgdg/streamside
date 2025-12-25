'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Mail,
    Lock,
    Save,
    AlertCircle,
    LogOut,
    Loader2
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { authClient, useSession } from '@/lib/auth-client';

export default function SettingsPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Redirect to signin if not authenticated
    useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/signin');
        }
    }, [session, isPending, router]);

    // Populate form with user data from session
    useEffect(() => {
        if (session?.user) {
            setDisplayName(session.user.name || '');
            setEmail(session.user.email || '');
        }
    }, [session]);

    // Helper function to get user initials from name
    const getUserInitials = (): string => {
        const name = displayName || session?.user?.name;
        if (name) {
            const nameParts = name.trim().split(/\s+/);
            if (nameParts.length >= 2) {
                return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
            }
            return nameParts[0].charAt(0).toUpperCase();
        }
        return 'U';
    };

    const [isLoading, setIsLoading] = useState(false);

    const handleSaveProfile = async () => {
        setError('');
        setIsLoading(true);

        try {
            const result = await authClient.updateUser({
                name: displayName,
            });

            if (result.error) {
                setError(result.error.message || 'Failed to update profile');
                return;
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError('An error occurred while updating your profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword) {
            setError('Please enter your current password');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const result = await authClient.changePassword({
                currentPassword: currentPassword,
                newPassword: newPassword,
                revokeOtherSessions: true,
            });

            if (result.error) {
                setError(result.error.message || 'Failed to change password');
                return;
            }

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Failed to change password:', err);
            setError('An error occurred while changing your password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
            router.push('/');
        } catch (error) {
            console.error('Sign out error:', error);
            router.push('/');
        }
    };

    // Show loading while session is being fetched
    if (isPending) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Dashboard
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">Settings</span>
                        </div>

                        <ThemeToggle />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {saved && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                        <p className="text-green-600 text-sm">Settings saved successfully!</p>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Profile Settings */}
                    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold">Profile Settings</h2>
                            <p className="text-sm text-muted-foreground">
                                Manage your personal information
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-6 mb-6">
                                <div className="size-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                    <span className="text-2xl font-semibold">{getUserInitials()}</span>
                                </div>
                                <div>
                                    <button className="px-4 py-2 text-sm border border-input bg-background rounded-lg hover:bg-accent transition-colors">
                                        Change Photo
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none opacity-70 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Password Settings */}
                    <div id="password-settings" className="rounded-xl border border-border bg-card text-card-foreground shadow-sm scroll-mt-20">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold">Change Password</h2>
                            <p className="text-sm text-muted-foreground">
                                Update your password
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="size-4 text-destructive" />
                                    <p className="text-destructive text-sm">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Current Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleChangePassword}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold">Account</h2>
                            <p className="text-sm text-muted-foreground">
                                Manage your session
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Sign Out</p>
                                    <p className="text-sm text-muted-foreground">
                                        Sign out of your account on this device
                                    </p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-input bg-background rounded-lg hover:bg-accent transition-colors"
                                >
                                    <LogOut className="size-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="rounded-xl border border-destructive bg-card text-card-foreground shadow">
                        <div className="p-6 border-b border-destructive/50">
                            <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
                            <p className="text-sm text-muted-foreground">
                                Irreversible actions
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Delete Account</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete your account and all data
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                                            try {
                                                setIsLoading(true);
                                                // BetterAuth deleteUser API
                                                const response = await fetch('/api/auth/delete-user', {
                                                    method: 'DELETE',
                                                    credentials: 'include',
                                                });

                                                if (response.ok) {
                                                    // Sign out and redirect after deletion
                                                    await authClient.signOut();
                                                    router.push('/');
                                                } else {
                                                    const data = await response.json().catch(() => ({}));
                                                    setError(data.error || 'Failed to delete account');
                                                }
                                            } catch (err) {
                                                console.error('Delete account error:', err);
                                                setError('An error occurred while deleting your account');
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
