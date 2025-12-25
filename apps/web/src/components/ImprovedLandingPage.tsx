import { Link } from 'react-router-dom';
import { Video, Monitor, Shield, Users, Zap, MessageSquare, ArrowRight, Globe, UserPlus, Feather } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function ImprovedLandingPage() {
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
              <Link to="/auth/signin">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9">
                  Sign In
                </button>
              </Link>
              <Link to="/auth/signup">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9">
                  Get Started Free
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 border border-primary/20">
            <Zap className="size-4" />
            <span className="text-sm">No download required • Browser-based</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl mb-6 max-w-4xl mx-auto">
            Video Calls Made Simple.
            <br />
            <span className="text-primary">For Teams That Move Fast.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect instantly with HD video calls. No downloads, no hassle. 
            Just click and you're in. Perfect for remote teams and quick sync-ups.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth/signup">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-8 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12">
                Start Meeting Now
                <ArrowRight className="size-4 ml-2" />
              </button>
            </Link>
            <Link to="/dashboard">
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-8 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-12">
                View Demo
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Grid Section - Powerful Features, Simple Experience */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">
              Powerful Features, Simple Experience
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for seamless video collaboration, nothing you don't
            </p>
          </div>

          {/* Bento Grid Layout - Varying Sizes */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
            {/* HD Video Calls - Large Featured */}
            <div className="md:col-span-2 md:row-span-2 group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-blue-500/10 via-background to-background dark:from-blue-500/5 border-blue-500/20 rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="size-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Video className="size-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl mb-3">HD Video Calls</h3>
                  <p className="text-muted-foreground text-lg">
                    Crystal-clear video quality with adaptive bitrate streaming. 
                    Looks great even on slower connections.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all">
                  <span>Learn more</span>
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </div>

            {/* Browser-Based */}
            <div className="md:col-span-2 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-amber-500/10 via-background to-background dark:from-amber-500/5 border-amber-500/20 rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 h-full flex items-start gap-4">
                <div className="size-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="size-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2">Browser-Based</h3>
                  <p className="text-sm text-muted-foreground">
                    Works instantly in Chrome, Safari, and Firefox. No apps to download.
                  </p>
                </div>
              </div>
            </div>

            {/* Lightweight UI */}
            <div className="md:col-span-2 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-cyan-500/10 via-background to-background dark:from-cyan-500/5 border-cyan-500/20 rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 h-full flex items-start gap-4">
                <div className="size-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Feather className="size-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2">Lightweight UI</h3>
                  <p className="text-sm text-muted-foreground">
                    Clean, minimal interface. No clutter, just the essentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Secure P2P Connection */}
            <div className="md:col-span-2 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-green-500/10 via-background to-background dark:from-green-500/5 border-green-500/20 rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 h-full flex items-start gap-4">
                <div className="size-12 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="size-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2">Secure P2P</h3>
                  <p className="text-sm text-muted-foreground">
                    End-to-end encrypted WebRTC. Bank-level security.
                  </p>
                </div>
              </div>
            </div>

            {/* No Sign-Up Needed */}
            <div className="md:col-span-2 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br from-violet-500/10 via-background to-background dark:from-violet-500/5 border-violet-500/20 rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 h-full flex items-start gap-4">
                <div className="size-12 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="size-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2">No Sign-Up Needed</h3>
                  <p className="text-sm text-muted-foreground">
                    Guests join meetings without creating an account.
                  </p>
                </div>
              </div>
            </div>

            {/* Easy Screen Sharing */}
            <div className="md:col-span-2 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 h-full flex items-start gap-4">
                <div className="size-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Monitor className="size-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2">Screen Sharing</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your screen or windows with one click
                  </p>
                </div>
              </div>
            </div>

            {/* Team Chat - Extended to fill space */}
            <div className="md:col-span-4 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 h-full flex items-start gap-4">
                <div className="size-12 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="size-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2">Team Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Built-in messaging for quick questions and seamless collaboration during calls
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-participant - Wide */}
            <div className="md:col-span-6 md:row-span-1 group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-r from-indigo-500/10 via-background to-background dark:from-indigo-500/5 border-indigo-500/20 rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6 h-full flex items-center gap-6">
                <div className="size-14 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Users className="size-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl mb-2">Built for Teams</h3>
                  <p className="text-muted-foreground">
                    Host meetings with up to 100 participants. Perfect for standups, all-hands, or workshops.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-8">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            <div className="text-2xl">Acme Inc</div>
            <div className="text-2xl">TechCorp</div>
            <div className="text-2xl">DesignHub</div>
            <div className="text-2xl">StartupXYZ</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl mb-6">
            Ready to connect with your team?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of teams using Streamside for seamless video collaboration.
            No credit card required. Start your first meeting in 60 seconds.
          </p>
          <Link to="/auth/signup">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-8 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12">
              Get Started Free
              <ArrowRight className="size-4 ml-2" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <Video className="size-5" />
                </div>
                <span className="text-lg">Streamside</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Simple, secure video calls for teams everywhere.
              </p>
            </div>
            
            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground">Features</Link></li>
                <li><Link to="/" className="hover:text-foreground">Pricing</Link></li>
                <li><Link to="/" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground">About</Link></li>
                <li><Link to="/" className="hover:text-foreground">Blog</Link></li>
                <li><Link to="/" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground">Help Center</Link></li>
                <li><Link to="/" className="hover:text-foreground">Contact</Link></li>
                <li><Link to="/" className="hover:text-foreground">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 Streamside. Video calls made simple.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
