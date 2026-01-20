import { useState, useEffect } from 'react';
import { Check, X, Loader2, Copy, CheckCircle } from 'lucide-react';
import { API_BASE } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Book {
  id: string;
  slug: string;
  title: string;
  author_name: string;
}

interface AccessRequest {
  id: string;
  book_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'pending' | 'approved' | 'denied';
  temporary_password_hash: string | null;
  password_expires_at: string | null;
  claimed_at: string | null;
  approved_by: string | null;
  denial_reason: string | null;
  created_at: string;
  updated_at: string;
  books: {
    title: string;
    author_name: string;
  };
}

interface AccessRequestsTabProps {
  adminToken?: string;
}

export default function AccessRequestsTab({ adminToken }: AccessRequestsTabProps) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});

  const [filters, setFilters] = useState({
    book: '',
    status: 'all',
    from: '',
    to: '',
  });

  useEffect(() => {
    loadBooks();
    loadRequests();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [filters]);

  async function loadBooks() {
    if (!adminToken && !user) return;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }

      const response = await fetch(`${API_BASE}/admin-books`, { headers });

      if (!response.ok) throw new Error('Failed to load books');

      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  }

  async function loadRequests() {
    if (!adminToken && !user) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.book) params.append('book', filters.book);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }

      const response = await fetch(
        `${API_BASE}/admin-access-requests?${params.toString()}`,
        { headers }
      );

      if (!response.ok) throw new Error('Failed to load access requests');

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading access requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(requestId: string, action: 'approve' | 'deny', denialReason?: string) {
    setProcessingId(requestId);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`;
      }

      const response = await fetch(`${API_BASE}/manage-access-request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requestId,
          action,
          denialReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} request`);
      }

      const data = await response.json();

      if (action === 'approve' && data.temporaryPassword) {
        setTempPasswords(prev => ({
          ...prev,
          [requestId]: data.temporaryPassword,
        }));
      }

      await loadRequests();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  }

  async function copyToClipboard(text: string, requestId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPassword(requestId);
      setTimeout(() => setCopiedPassword(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Access Requests</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-stone-600 mt-1">
              {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="bg-stone-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Book
            </label>
            <select
              value={filters.book}
              onChange={(e) =>
                setFilters({ ...filters, book: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
            >
              <option value="">All Books</option>
              {books.map((book) => (
                <option key={book.id} value={book.slug}>
                  {book.title} by {book.author_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters({ ...filters, from: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-200">
          <h3 className="font-medium text-stone-900">
            Requests ({requests.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            No access requests found matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 text-xs uppercase text-stone-700">
                <tr>
                  <th className="px-6 py-3 text-left">Requester</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Book</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4 text-sm text-stone-900">
                      {request.first_name} {request.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {request.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {request.books.title}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {request.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      )}
                      {request.status === 'denied' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Denied
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(request.id, 'approve')}
                            disabled={processingId === request.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {processingId === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for denial (optional):');
                              handleAction(request.id, 'deny', reason || undefined);
                            }}
                            disabled={processingId === request.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            Deny
                          </button>
                        </div>
                      ) : request.status === 'approved' && tempPasswords[request.id] ? (
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-stone-100 rounded text-xs font-mono">
                            {tempPasswords[request.id]}
                          </code>
                          <button
                            onClick={() => copyToClipboard(tempPasswords[request.id], request.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-stone-600 hover:text-stone-900"
                            title="Copy password"
                          >
                            {copiedPassword === request.id ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : request.status === 'approved' && request.claimed_at ? (
                        <span className="text-xs text-stone-500">Claimed</span>
                      ) : request.status === 'approved' ? (
                        <span className="text-xs text-stone-500">Password sent</span>
                      ) : (
                        <span className="text-xs text-stone-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
