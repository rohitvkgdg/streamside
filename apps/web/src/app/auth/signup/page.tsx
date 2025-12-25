'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { authClient, useSession } from '@/lib/auth-client';

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isPending && session) {
      router.replace('/dashboard');
    }
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailExists(false);

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard',
      });

      // Check for error in response
      if (result?.error) {
        const errorCode = (result.error.code || '').toLowerCase();
        const errorMsg = (result.error.message || '').toLowerCase();

        // Check for user already exists
        if (
          errorCode === 'user_already_exists' ||
          errorCode.includes('exist') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('already registered') ||
          errorMsg.includes('email is already') ||
          errorMsg.includes('user with this email')
        ) {
          setEmailExists(true);
        } else {
          setError(result.error.message || 'Registration failed');
        }
        setLoading(false);
        return;
      }

      // Success - BetterAuth handles the redirect
    } catch (err: unknown) {
      console.error('Signup error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Check caught errors for "already exists" patterns
      if (
        errorMessage.toLowerCase().includes('already') ||
        errorMessage.toLowerCase().includes('exist')
      ) {
        setEmailExists(true);
      } else {
        setError(errorMessage || 'An error occurred during registration');
      }
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });

      if (result?.error) {
        console.error('Google signup error:', result.error);
        const errorMessage = result.error.message || result.error.code;
        if (errorMessage?.toLowerCase().includes('not configured') ||
          errorMessage?.toLowerCase().includes('provider') ||
          result.error.code === 'SOCIAL_PROVIDER_NOT_FOUND') {
          setError('Google sign-up is not configured. Please use email/password.');
        } else {
          setError(result.error.message || 'Google sign-up failed');
        }
        setLoading(false);
        return;
      }
      // BetterAuth handles the redirect on success
    } catch (err) {
      console.error('Google signup error:', err);
      setError('Google sign-up is not available. Please use email/password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8">
          <span className="text-2xl font-semibold">Streamside</span>
        </Link>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-6 space-y-1">
            <h3 className="text-2xl">Create an Account</h3>
            <p className="text-sm text-muted-foreground">
              Get started with studio-quality recording
            </p>
          </div>
          <div className="p-6 pt-0">
            {/* Email Already Exists Alert */}
            {emailExists && (
              <div className="relative w-full rounded-lg border px-4 py-3 mb-4 border-amber-500/50 bg-amber-500/10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 mt-0.5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        This email is already registered.
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        Please sign in to your existing account or use a different email.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/auth/signin')}
                    className="w-full mt-2 h-8 px-3 rounded-md text-xs font-medium border border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    Sign in to existing account
                  </button>
                </div>
              </div>
            )}

            {/* Generic Error Alert */}
            {error && !emailExists && (
              <div className="relative w-full rounded-lg border px-4 py-3 mb-4 border-destructive bg-destructive/10 text-destructive">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 mt-0.5" />
                  <div className="text-sm">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-10 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-10 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={agreeToTerms}
                  onClick={() => setAgreeToTerms(!agreeToTerms)}
                  className={`peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1 ${agreeToTerms ? 'bg-primary text-primary-foreground' : 'bg-background'
                    }`}
                >
                  {agreeToTerms && (
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <label className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button type="submit" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-full"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </button>
          </div>
          <div className="p-6 pt-0">
            <p className="text-sm text-muted-foreground text-center w-full">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
