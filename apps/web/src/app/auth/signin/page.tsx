'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { authClient, useSession } from '@/lib/auth-client';

const MIN_PASSWORD_LENGTH = 8;

// Security note: Showing "account doesn't exist" enables account enumeration.
// For production, consider showing only "Invalid email or password" for all auth errors.
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const errorObj = error as { code?: string; message?: string };

    // Check for error code first (BetterAuth error format)
    if ('code' in errorObj && typeof errorObj.code === 'string') {
      const code = errorObj.code;
      switch (code) {
        case 'USER_NOT_FOUND':
        case 'CREDENTIAL_ACCOUNT_NOT_FOUND':
          return 'No account found with this email. Please sign up first.';
        case 'INVALID_PASSWORD':
          return 'Incorrect password. Please try again.';
        case 'INVALID_CREDENTIALS':
        case 'INVALID_EMAIL_OR_PASSWORD':
          return 'Invalid email or password. Please try again.';
        case 'EMAIL_NOT_VERIFIED':
          return 'Please verify your email address before signing in.';
        case 'ACCOUNT_NOT_FOUND':
          return 'Account not found. Please sign up to create an account.';
        default:
          break;
      }
    }

    // Check for message text
    if ('message' in errorObj && typeof errorObj.message === 'string') {
      const message = errorObj.message.toLowerCase();
      if (message.includes('credential account not found') || message.includes('user not found') || message.includes('no user')) {
        return 'No account found with this email. Please sign up first.';
      }
      if (message.includes('invalid password') || message.includes('incorrect password')) {
        return 'Incorrect password. Please try again.';
      }
      if (message.includes('invalid') || message.includes('incorrect') || message.includes('wrong')) {
        return 'Invalid email or password. Please try again.';
      }
      return errorObj.message;
    }
  }

  return 'Something went wrong. Please try again.';
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/dashboard';

  const { data: session, isPending } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ single redirect source
  useEffect(() => {
    if (!isPending && session) {
      router.replace(callbackUrl);
    }
  }, [session, isPending, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Attempt to sign in directly - BetterAuth will handle account existence checks
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
        rememberMe: true,
      });

      // BetterAuth returns error in response object instead of throwing
      if (result.error) {
        console.error('Sign-in error:', result.error);
        setError(getErrorMessage(result.error));
        setLoading(false);
        return;
      }

      // Success - redirect is handled automatically by BetterAuth
    } catch (err) {
      console.error('Email sign-in error:', err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: callbackUrl,
      });

      // Check if there's an error in the response
      if (result?.error) {
        console.error('Google sign-in error:', result.error);
        const errorMessage = result.error.message || result.error.code;
        if (errorMessage?.toLowerCase().includes('not configured') ||
          errorMessage?.toLowerCase().includes('provider') ||
          result.error.code === 'SOCIAL_PROVIDER_NOT_FOUND') {
          setError('Google sign-in is not configured. Please use email/password.');
        } else {
          setError(getErrorMessage(result.error));
        }
        setLoading(false);
        return;
      }
      // BetterAuth handles redirect on success
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in is not available. Please use email/password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8">
          <span className="text-2xl font-semibold">Streamside</span>
        </Link>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-6 space-y-1">
            <h3 className="text-2xl">Sign In</h3>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="p-6 pt-0">
            {error && (
              <div className="relative w-full rounded-lg border px-4 py-3 mb-4 border-destructive bg-destructive/10 text-destructive">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 mt-0.5" />
                  <div className="text-sm">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password">Password</label>
                  <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-full"
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="p-6 pt-0">
            <p className="text-sm text-muted-foreground text-center w-full">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
