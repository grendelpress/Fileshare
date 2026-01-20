import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Shield, Zap, FileText, BarChart3, Check, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Check className="w-6 h-6 text-navy-700" />
              <span className="text-xl font-bold text-navy-800 font-sans">GP Fileshare</span>
            </div>
            <p className="text-xs text-neutral-600 ml-8">Secure Story Distribution</p>
          </div>
          <div className="flex items-center gap-6">
            {loading ? (
              <div className="w-32 h-10 bg-neutral-100 animate-pulse rounded-lg"></div>
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold bg-primary-500 text-white px-5 py-2.5 rounded-lg hover:bg-primary-600 transition-all shadow-sm hover:shadow-md"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-primary-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h1 className="text-5xl sm:text-6xl font-bold text-navy-800 mb-6 leading-tight">
                Share Your Stories<br />With Trusted Readers
              </h1>
              <p className="text-lg text-neutral-700 mb-10 leading-relaxed">
                Securely distribute your manuscripts to beta readers, ARC reviewers, and professional contacts. Track engagement and protect your work with watermarked copies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-all shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-navy-700 bg-white border-2 border-navy-200 rounded-lg hover:border-navy-300 hover:bg-neutral-50 transition-all"
                >
                  Browse Books
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <img src="/book-share-icon.png" alt="Book sharing illustration" className="w-full max-w-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-navy-800 mb-4">
              Everything You Need to Share Your Work
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Built specifically for authors who need to distribute manuscripts securely and professionally.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:shadow-lg hover:border-primary-200 transition-all">
              <div className="w-14 h-14 bg-navy-700 rounded-xl flex items-center justify-center mb-5">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy-800 mb-3">Watermarked Copies</h3>
              <p className="text-neutral-600 leading-relaxed">
                Every download is uniquely watermarked with reader information, ensuring your work is protected and traceable.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:shadow-lg hover:border-primary-200 transition-all">
              <div className="w-14 h-14 bg-navy-700 rounded-xl flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy-800 mb-3">Reader Management</h3>
              <p className="text-neutral-600 leading-relaxed">
                Organize readers by type: ARC reviewers, HWA members, giveaway recipients, or custom groups.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:shadow-lg hover:border-primary-200 transition-all">
              <div className="w-14 h-14 bg-navy-700 rounded-xl flex items-center justify-center mb-5">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy-800 mb-3">Instant Distribution</h3>
              <p className="text-neutral-600 leading-relaxed">
                Generate unique access passwords and share them instantly. Readers get immediate access to your work.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:shadow-lg hover:border-primary-200 transition-all">
              <div className="w-14 h-14 bg-navy-700 rounded-xl flex items-center justify-center mb-5">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy-800 mb-3">Multiple Formats</h3>
              <p className="text-neutral-600 leading-relaxed">
                Share your work as PDF or EPUB. Readers can choose the format that works best for them.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:shadow-lg hover:border-primary-200 transition-all">
              <div className="w-14 h-14 bg-navy-700 rounded-xl flex items-center justify-center mb-5">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy-800 mb-3">Download Tracking</h3>
              <p className="text-neutral-600 leading-relaxed">
                See who accessed your work, when they downloaded it, and export reader data for follow-up.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:shadow-lg hover:border-primary-200 transition-all">
              <div className="w-14 h-14 bg-navy-700 rounded-xl flex items-center justify-center mb-5">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy-800 mb-3">Series & Collections</h3>
              <p className="text-neutral-600 leading-relaxed">
                Organize your books into series or collections. Share complete storylines with your readers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              One plan with everything you need. Watermarking, tracking, and unlimited readers included.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-neutral-900 p-10 rounded-xl border-2 bg-primary-500 shadow-xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-3">Indie Author</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-white">$4.99</span>
                  <span className="text-neutral-300 text-xl">/month</span>
                </div>
                <p className="text-neutral-300 text-lg">Everything you need to share your work</p>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-200 text-lg">Unlimited books and series</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-200 text-lg">Unlimited readers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-200 text-lg">Watermarked PDFs & EPUBs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-200 text-lg">Password-protected distribution</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-200 text-lg">Download tracking & analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-200 text-lg">Reader data export</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-200 text-lg">Email support</span>
                </li>
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center px-8 py-4 bg-white text-neutral-900 text-lg font-bold rounded-lg hover:bg-neutral-100 transition-colors shadow-lg"
              >
                Get Started
              </Link>
            </div>
            <p className="text-center mt-6 text-neutral-600">
              Grendel Press authors get complimentary access with invitation code
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Share Your Stories?
          </h2>
          <p className="text-xl text-white mb-8 leading-relaxed">
            Join authors who trust Grendel Press to distribute their work securely and professionally.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-neutral-900 bg-white rounded-lg hover:bg-neutral-100 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started Today
          </Link>
          <p className="mt-4 text-sm text-white">$4.99/month • Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-neutral-900" />
                <span className="font-bold text-neutral-900">GP Fileshare</span>
              </div>
              <p className="text-sm text-neutral-600">
                Secure manuscript distribution for authors and publishers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link to="/browse" className="hover:text-neutral-900">Browse Books</Link></li>
                <li><Link to="/signup" className="hover:text-neutral-900">Sign Up</Link></li>
                <li><Link to="/login" className="hover:text-neutral-900">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Grendel Press LLC</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="https://grendelpress.com/about" className="hover:text-neutral-900">About</a></li>
                <li><a href="https://grendelpress.com/blog" className="hover:text-neutral-900">Blog</a></li>
                <li>Contact: info@grendelpress.com</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link to="/privacy" className="hover:text-neutral-900">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-neutral-900">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-200 text-center text-sm text-neutral-600">
            <p>&copy; {new Date().getFullYear()} Grendel Press. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
