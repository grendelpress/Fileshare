import { Link, useNavigate } from 'react-router-dom';
import { Check, LogOut, User, CreditCard, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

export default function Navigation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  async function handleSignOut() {
    try {
      console.log('[Navigation] Starting sign out...');

      // Try to sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Navigation] Sign out error:', error);
        // Even if signOut fails, clear local storage and reload
        console.log('[Navigation] Forcing logout by clearing storage...');
      } else {
        console.log('[Navigation] Sign out successful');
      }

      // Clear all local storage items related to Supabase auth
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('[Navigation] Cleared storage, reloading page');
      // Force a full page reload to clear all state and navigate to home
      window.location.href = '/';
    } catch (error) {
      console.error('[Navigation] Sign out failed:', error);
      // Force clear and reload anyway
      localStorage.clear();
      window.location.href = '/';
    }
  }

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <Link to="/" className="flex flex-col hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <Check className="w-6 h-6 text-navy-700" />
            <span className="text-xl font-bold text-navy-800 font-sans">GP Fileshare</span>
          </div>
          <p className="text-xs text-neutral-600 ml-8">Secure Story Distribution</p>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/browse"
            className="text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
          >
            Browse Books
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {!user ? (
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
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 text-sm font-semibold text-navy-700 hover:text-navy-900 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Account</span>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-20">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      to="/dashboard/billing"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <CreditCard className="w-4 h-4" />
                      Billing
                    </Link>
                    <hr className="my-2 border-neutral-200" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleSignOut();
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
