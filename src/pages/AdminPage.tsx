import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BooksTab from '../components/admin/BooksTab';
import PasswordsTab from '../components/admin/PasswordsTab';
import ExportsTab from '../components/admin/ExportsTab';
import SeriesTab from '../components/admin/SeriesTab';
import CollectionsTab from '../components/admin/CollectionsTab';
import { AuthorCodesTab } from '../components/admin/AuthorCodesTab';
import AccessRequestsTab from '../components/admin/AccessRequestsTab';
import { API_BASE } from '../lib/supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [activeTab, setActiveTab] = useState<'books' | 'series' | 'collections' | 'passwords' | 'exports' | 'codes' | 'access-requests'>('books');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      verifyToken(storedToken);
    } else {
      setCheckingExisting(false);
    }
  }, []);

  async function verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/admin-books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setAdminToken(token);
        return true;
      } else {
        localStorage.removeItem('adminToken');
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem('adminToken');
      return false;
    } finally {
      setCheckingExisting(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!adminToken.trim()) {
      setError('Please enter admin token');
      return;
    }

    setVerifying(true);
    const isValid = await verifyToken(adminToken);
    setVerifying(false);

    if (isValid) {
      localStorage.setItem('adminToken', adminToken);
    } else {
      setError('Invalid admin token');
      setAdminToken('');
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    setAdminToken('');
    setIsAuthenticated(false);
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-md mx-auto px-4 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Books
          </Link>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <h1 className="text-2xl font-bold text-stone-900 mb-6">
              Admin Login
            </h1>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label
                  htmlFor="adminToken"
                  className="block text-sm font-medium text-stone-700 mb-1"
                >
                  Admin Token
                </label>
                <input
                  type="password"
                  id="adminToken"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="Enter admin token"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="w-full bg-stone-900 text-white px-6 py-3 rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('adminToken') || adminToken;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-3xl font-bold text-stone-900">
              Admin Dashboard
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200">
          <div className="border-b border-stone-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('books')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'books'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                Books
              </button>
              <button
                onClick={() => setActiveTab('series')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'series'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                Series
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'collections'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                Collections
              </button>
              <button
                onClick={() => setActiveTab('passwords')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'passwords'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                Passwords
              </button>
              <button
                onClick={() => setActiveTab('exports')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'exports'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                Exports
              </button>
              <button
                onClick={() => setActiveTab('codes')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'codes'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                Author Codes
              </button>
              <button
                onClick={() => setActiveTab('access-requests')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'access-requests'
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                Access Requests
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'books' && <BooksTab adminToken={token} />}
            {activeTab === 'series' && <SeriesTab adminToken={token} />}
            {activeTab === 'collections' && <CollectionsTab adminToken={token} />}
            {activeTab === 'passwords' && <PasswordsTab adminToken={token} />}
            {activeTab === 'exports' && <ExportsTab adminToken={token} />}
            {activeTab === 'codes' && <AuthorCodesTab />}
            {activeTab === 'access-requests' && <AccessRequestsTab adminToken={token} />}
          </div>
        </div>
      </div>
    </div>
  );
}
