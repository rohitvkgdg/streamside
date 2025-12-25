'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Video, Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { ThemeToggle } from './ThemeToggle';
import { signUp } from '@/lib/auth-client';

export default function SignUpPage() {
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailExists(false);

    // Frontend validation
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
      const result = await signUp.email({
        name,
        email,
        password,
      });

      console.log('Signup result:', result);

      // BetterAuth can return error in different ways
      const signUpError = result?.error;

      if (signUpError) {
        console.log('Signup error:', signUpError);
        // Handle specific BetterAuth error codes for existing users
        const errorCode = signUpError.code?.toLowerCase() || '';
        const errorMsg = signUpError.message?.toLowerCase() || '';
        const errorStatus = signUpError.status;

        // Check for user already exists by various indicators
        if (
          errorCode === 'user_already_exists' ||
          errorCode.includes('exist') ||
          errorMsg.includes('already exists') ||
          errorMsg.includes('already registered') ||
          errorMsg.includes('email is already') ||
          errorMsg.includes('user with this email') ||
          errorStatus === 422
        ) {
          setEmailExists(true);
        } else {
          setError(signUpError.message || 'Registration failed');
        }
        return;
      }

      // Success - redirect to dashboard
      if (result?.data) {
        router.push('/dashboard');
      } else {
        // Edge case - no data and no error
        setError('Registration failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Signup exception:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Also check caught errors for "already exists" patterns
      if (
        errorMessage.toLowerCase().includes('already') ||
        errorMessage.toLowerCase().includes('exist') ||
        errorMessage.includes('422')
      ) {
        setEmailExists(true);
      } else {
        setError(errorMessage || 'An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      // Placeholder — wire OAuth later
      router.push('/dashboard');
    } catch {
      setError('Google sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Video className="size-8 text-primary" />
          <span className="text-2xl">Streamside</span>
        </Link>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Get started with studio-quality recording
            </CardDescription>
          </CardHeader>

          <CardContent>
            {emailExists && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="size-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  <span className="font-medium">This email is already registered.</span>
                  <br />
                  <span className="text-sm">
                    Please sign in to your existing account or use a different email.
                  </span>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/auth/signin')}
                      className="border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                    >
                      Sign in to existing account
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && !emailExists && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
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
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
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
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked: boolean | 'indeterminate') =>
                    setAgreeToTerms(checked === true)
                  }
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-none"
                >
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
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

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              Sign up with Google
            </Button>
          </CardContent>

          <CardFooter>
            <p className="text-sm text-muted-foreground text-center w-full">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
