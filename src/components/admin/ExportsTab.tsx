import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { API_BASE } from '../../lib/supabase';

interface Book {
  id: string;
  slug: string;
  title: string;
  author_name: string;
}

interface Signup {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  referred_by: string | null;
  optin_mailing: boolean;
  created_at: string;
  book_title: string;
  password_label: string | null;
}

interface ExportsTabProps {
  adminToken: string;
}

export default function ExportsTab({ adminToken }: ExportsTabProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    book: '',
    from: '',
    to: '',
    optinOnly: false,
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadBooks();
    loadSignups();
  }, []);

  useEffect(() => {
    loadSignups();
  }, [filters]);

  async function loadBooks() {
    try {
      const response = await fetch(`${API_BASE}/admin-books`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load books');

      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  }

  async function loadSignups() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.book) params.append('book', filters.book);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      params.append('optinOnly', filters.optinOnly.toString());
      params.append('format', 'json');

      const response = await fetch(
        `${API_BASE}/admin-exports?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load signups');

      const data = await response.json();
      setSignups(data.signups || []);
    } catch (error) {
      console.error('Error loading signups:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.book) params.append('book', filters.book);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      params.append('optinOnly', filters.optinOnly.toString());

      const response = await fetch(
        `${API_BASE}/admin-exports?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to export data');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signups-${filters.book || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-stone-900 mb-6">Export Signups</h2>

      <div className="bg-stone-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="optinOnly"
                checked={filters.optinOnly}
                onChange={(e) =>
                  setFilters({ ...filters, optinOnly: e.target.checked })
                }
              />
              <label htmlFor="optinOnly" className="text-sm text-stone-700">
                Mailing list opt-ins only
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {exporting ? 'Exporting...' : 'Download CSV'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-200">
          <h3 className="font-medium text-stone-900">
            Signups ({signups.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500">Loading...</div>
        ) : signups.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            No signups found matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 text-xs uppercase text-stone-700">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Book</th>
                  <th className="px-6 py-3 text-left">Referred By</th>
                  <th className="px-6 py-3 text-left">Optin</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {signups.map((signup) => (
                  <tr key={signup.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4 text-sm text-stone-900">
                      {signup.first_name} {signup.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {signup.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {signup.book_title}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {signup.referred_by || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {signup.optin_mailing ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-stone-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {new Date(signup.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {signup.password_label || '-'}
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
