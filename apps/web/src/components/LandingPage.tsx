import { Link } from 'react-router-dom';
import { Video, Mic, Users, Upload, Shield, Zap, Clock, Sparkles, TrendingUp, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Video className="size-8 text-primary" />
              <span className="text-xl">Streamside</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl mb-6">
            Video Calls That Work.
            <br />
            Anywhere, Anytime.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with anyone through high-quality video calls. Host meetings, collaborate with teams, 
            and optionally record your sessions in studio quality.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth/signup">
              <Button size="lg" className="px-8">
                Start a Meeting Free
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="px-8">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl mb-4">
              Powerful Features, Simple Experience
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need for seamless video communication
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Large featured card */}
            <Card className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Sparkles className="size-8 text-primary" />
                  </div>
                  <h3 className="text-2xl mb-3">AI-Powered Enhancement</h3>
                  <p className="text-muted-foreground">
                    Automatic noise cancellation, background blur, and lighting adjustment. 
                    Look and sound your best in every call.
                  </p>
                </div>
                <div className="mt-6">
                  <Button variant="default" className="w-full">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tall card */}
            <Card className="md:row-span-2">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="size-6 text-primary" />
                </div>
                <h3 className="mb-2">No Time Limits</h3>
                <p className="text-sm text-muted-foreground flex-1">
                  Host unlimited meetings with no time restrictions. Whether it's 5 minutes or 5 hours.
                </p>
                <div className="mt-4 text-3xl">∞</div>
              </CardContent>
            </Card>

            {/* Wide card */}
            <Card className="md:col-span-2">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1">Works Everywhere</h3>
                  <p className="text-sm text-muted-foreground">
                    Access from any device, any browser. No downloads required.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Square card */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="size-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                  <TrendingUp className="size-6 text-green-600" />
                </div>
                <div>
                  <h3 className="mb-2">99.9% Uptime</h3>
                  <p className="text-sm text-muted-foreground">
                    Reliable infrastructure you can count on
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Wide card */}
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-2">Up to 100 Participants</h3>
                    <p className="text-sm text-muted-foreground">
                      Host large team meetings, webinars, or virtual events with ease.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Square card */}
            <Card>
              <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2">Enterprise Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Bank-level encryption
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="mb-2">Create a Meeting</h3>
              <p className="text-muted-foreground">
                Start a new meeting instantly or schedule one for later. Set it up in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="mb-2">Invite Participants</h3>
              <p className="text-muted-foreground">
                Share a simple link with anyone. No account required for guests to join.
              </p>
            </div>

            <div className="text-center">
              <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="mb-2">Connect & Collaborate</h3>
              <p className="text-muted-foreground">
                Talk, share screens, and collaborate. Optionally record for later reference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl mb-6">
            Ready to connect with your team?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands using Streamside for video calls and meetings.
          </p>
          <Link to="/auth/signup">
            <Button size="lg" variant="secondary" className="px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>© 2025 Streamside. Video calls made simple.</p>
        </div>
      </footer>
    </div>
  );
}