import React, { useState, useEffect } from 'react';
import { supabase, API_BASE } from '../../lib/supabase';
import { Plus, Trash2, Power, PowerOff, RefreshCw } from 'lucide-react';

interface AuthorCode {
  id: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  usage_count?: number;
}

export function AuthorCodesTab() {
  const [codes, setCodes] = useState<AuthorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  console.log('[AuthorCodesTab] Initialized with API_BASE:', API_BASE);

  const getAuthToken = async () => {
    console.log('[AuthorCodesTab] Getting auth token...');

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session timeout after 5s')), 5000)
      );

      const sessionPromise = supabase.auth.getSession();

      const { data: { session } } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;

      console.log('[AuthorCodesTab] Session exists:', !!session);
      console.log('[AuthorCodesTab] Token exists:', !!session?.access_token);

      if (!session?.access_token) {
        console.warn('[AuthorCodesTab] No token, trying to get user directly...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: { session: newSession } } = await supabase.auth.refreshSession();
          console.log('[AuthorCodesTab] Refreshed session, token exists:', !!newSession?.access_token);
          return newSession?.access_token || '';
        }
      }

      return session?.access_token || '';
    } catch (error) {
      console.error('[AuthorCodesTab] Error getting auth token:', error);
      throw new Error('Failed to get authentication token. Please refresh the page.');
    }
  };

  const fetchCodes = async () => {
    console.log('[AuthorCodesTab] Starting fetchCodes...');
    setLoading(true);
    setError('');

    try {
      const token = await getAuthToken();
      console.log('[AuthorCodesTab] Token length:', token.length);

      const url = `${API_BASE}/admin-author-codes`;
      console.log('[AuthorCodesTab] Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[AuthorCodesTab] Response status:', response.status);
      console.log('[AuthorCodesTab] Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AuthorCodesTab] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch author codes');
      }

      const data = await response.json();
      console.log('[AuthorCodesTab] Success! Received codes count:', data.codes?.length || 0);
      setCodes(data.codes || []);
    } catch (err: any) {
      console.error('[AuthorCodesTab] Fetch error:', err);
      console.error('[AuthorCodesTab] Error message:', err.message);
      setError(err.message);
      setCodes([]);
    } finally {
      console.log('[AuthorCodesTab] Fetch complete, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[AuthorCodesTab] Component mounted, calling fetchCodes');
    fetchCodes();
  }, []);

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AuthorCodesTab] handleAddCode called');
    setError('');

    if (!newCode.trim()) {
      setError('Code is required');
      return;
    }

    try {
      const token = await getAuthToken();
      console.log('[AuthorCodesTab] Creating code:', newCode.trim());

      const response = await fetch(`${API_BASE}/admin-author-codes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newCode.trim(),
          description: newDescription.trim(),
        }),
      });

      console.log('[AuthorCodesTab] Create response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AuthorCodesTab] Create error:', errorData);
        throw new Error(errorData.error || 'Failed to create author code');
      }

      console.log('[AuthorCodesTab] Code created successfully');
      setNewCode('');
      setNewDescription('');
      setShowAddForm(false);
      fetchCodes();
    } catch (err: any) {
      console.error('[AuthorCodesTab] handleAddCode error:', err);
      setError(err.message);
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    console.log('[AuthorCodesTab] toggleCodeStatus called for ID:', id);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/admin-author-codes`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isActive: !currentStatus,
        }),
      });

      console.log('[AuthorCodesTab] Toggle response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AuthorCodesTab] Toggle error:', errorData);
        throw new Error(errorData.error || 'Failed to update author code');
      }

      console.log('[AuthorCodesTab] Code toggled successfully');
      fetchCodes();
    } catch (err: any) {
      console.error('[AuthorCodesTab] toggleCodeStatus error:', err);
      setError(err.message);
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this code?')) return;

    console.log('[AuthorCodesTab] deleteCode called for ID:', id);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/admin-author-codes?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[AuthorCodesTab] Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[AuthorCodesTab] Delete error:', errorData);
        throw new Error(errorData.error || 'Failed to delete author code');
      }

      console.log('[AuthorCodesTab] Code deleted successfully');
      fetchCodes();
    } catch (err: any) {
      console.error('[AuthorCodesTab] deleteCode error:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GP Author Codes</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage verification codes for GP author accounts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchCodes()}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh codes"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Code
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-red-700">{error}</div>
            <button
              onClick={() => {
                setError('');
                fetchCodes();
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Code</h3>
          <form onSubmit={handleAddCode} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Code
              </label>
              <input
                type="text"
                id="code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter author code"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Optional description"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Create Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCode('');
                  setNewDescription('');
                  setError('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Used By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  No author codes yet. Create one to get started.
                </td>
              </tr>
            ) : (
              codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{code.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {code.description || <span className="italic">No description</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        code.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {code.usage_count !== undefined ? code.usage_count : '...'} {code.usage_count === 1 ? 'user' : 'users'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(code.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => toggleCodeStatus(code.id, code.is_active)}
                        className={`inline-flex items-center p-2 border border-transparent rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                          code.is_active ? 'text-gray-600' : 'text-green-600'
                        }`}
                        title={code.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {code.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteCode(code.id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
