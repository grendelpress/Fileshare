import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BooksTab from '../components/admin/BooksTab';
import PasswordsTab from '../components/admin/PasswordsTab';
import ExportsTab from '../components/admin/ExportsTab';
import SeriesTab from '../components/admin/SeriesTab';
import CollectionsTab from '../components/admin/CollectionsTab';
import { AuthorCodesTab } from '../components/admin/AuthorCodesTab';
import AccessRequestsTab from '../components/admin/AccessRequestsTab';
import { TrialBanner } from '../components/subscription/TrialBanner';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAccessRequestCount } from '../hooks/useAccessRequestCount';

type TabType = 'books' | 'access-requests' | 'series' | 'collections' | 'passwords' | 'exports' | 'codes';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isOnTrial, trialDaysRemaining, profile: authProfile } = useAuth();
  const { count: pendingRequestCount } = useAccessRequestCount();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('books');

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/login');
        } else if (session) {
          setSession(session);
          await loadAuthor(session.user.id);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      setSession(session);
      setUser(session.user);
      await loadAuthor(session.user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }

  async function loadAuthor(userId: string) {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!data.is_approved) {
        alert('Your account is pending approval');
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      if (data.account_status === 'suspended') {
        navigate('/subscription-required');
        return;
      }

      setAuthor(data);
    } catch (error) {
      console.error('Error loading author:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-primary-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700"></div>
      </div>
    );
  }

  if (!user || !author) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isOnTrial && trialDaysRemaining !== null && (
          <TrialBanner daysRemaining={trialDaysRemaining} />
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-navy-800">
            {author.is_super_admin ? 'Super Admin Dashboard' : 'Author Dashboard'}
          </h1>

          <div className="flex items-center gap-4">
            {author.account_status && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                author.account_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : author.account_status === 'trial'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {author.is_grendel_press
                  ? 'Grendel Press'
                  : author.account_status === 'active'
                  ? 'Pro'
                  : author.account_status === 'trial' && trialDaysRemaining !== null
                  ? `Trial (${trialDaysRemaining} days left)`
                  : author.account_status}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-neutral-200">
          <div className="border-b border-neutral-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('books')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'books'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-navy-700'
                }`}
              >
                Books
              </button>
              <button
                onClick={() => setActiveTab('access-requests')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors relative ${
                  activeTab === 'access-requests'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-navy-700'
                }`}
              >
                Access Requests
                {pendingRequestCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full animate-pulse">
                    {pendingRequestCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('series')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'series'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-navy-700'
                }`}
              >
                Series
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'collections'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-navy-700'
                }`}
              >
                Collections
              </button>
              <button
                onClick={() => setActiveTab('passwords')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'passwords'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-navy-700'
                }`}
              >
                Passwords
              </button>
              <button
                onClick={() => setActiveTab('exports')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'exports'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-navy-700'
                }`}
              >
                Exports
              </button>
              {author.is_super_admin && (
                <button
                  onClick={() => setActiveTab('codes')}
                  className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                    activeTab === 'codes'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-navy-700'
                  }`}
                >
                  Author Codes
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'books' && <BooksTab adminToken={session.access_token} />}
            {activeTab === 'access-requests' && <AccessRequestsTab adminToken={session.access_token} />}
            {activeTab === 'series' && <SeriesTab adminToken={session.access_token} />}
            {activeTab === 'collections' && <CollectionsTab adminToken={session.access_token} />}
            {activeTab === 'passwords' && <PasswordsTab adminToken={session.access_token} />}
            {activeTab === 'exports' && <ExportsTab adminToken={session.access_token} />}
            {activeTab === 'codes' && author.is_super_admin && <AuthorCodesTab />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
