import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { API_BASE } from '../../lib/supabase';

interface Book {
  id: string;
  slug: string;
  title: string;
  author_name: string;
}

interface Password {
  id: string;
  book_id: string;
  label: string;
  password_hash: string;
  distribution_type: string;
  is_active: boolean;
  created_at: string;
}

interface PasswordsTabProps {
  adminToken: string;
}

export default function PasswordsTab({ adminToken }: PasswordsTabProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    password: '',
    distributionType: 'hwa',
    isActive: true,
  });

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      loadPasswords(selectedBook);
    }
  }, [selectedBook]);

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
      if (data.books?.length > 0) {
        setSelectedBook(data.books[0].id);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  }

  async function loadPasswords(bookId: string) {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/admin-passwords?bookId=${bookId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load passwords');

      const data = await response.json();
      setPasswords(data.passwords || []);
    } catch (error) {
      console.error('Error loading passwords:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    if (!selectedBook) {
      alert('Please select a book first');
      return;
    }
    setEditingPassword(null);
    setFormData({
      label: '',
      password: '',
      distributionType: 'hwa',
      isActive: true,
    });
    setShowModal(true);
  }

  function openEditModal(password: Password) {
    setEditingPassword(password);
    setFormData({
      label: password.label,
      password: '',
      distributionType: password.distribution_type,
      isActive: password.is_active,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = `${API_BASE}/admin-passwords`;
      const method = editingPassword ? 'PUT' : 'POST';

      const body: any = {
        label: formData.label,
        distributionType: formData.distributionType,
        isActive: formData.isActive,
      };

      if (editingPassword) {
        body.id = editingPassword.id;
        if (formData.password) {
          body.password = formData.password;
        }
      } else {
        body.bookId = selectedBook;
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save password');
      }

      await loadPasswords(selectedBook);
      setShowModal(false);
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleDelete(password: Password) {
    if (!confirm(`Delete password "${password.label}"? This cannot be undone.`))
      return;

    try {
      const response = await fetch(
        `${API_BASE}/admin-passwords?id=${password.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete password');

      await loadPasswords(selectedBook);
    } catch (error: any) {
      alert(error.message);
    }
  }

  const selectedBookData = books.find((b) => b.id === selectedBook);

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Select Book
        </label>
        <select
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title} by {book.author_name}
            </option>
          ))}
        </select>
      </div>

      {selectedBook && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-900">
              Passwords for {selectedBookData?.title}
            </h2>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-md hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Password
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
            </div>
          ) : passwords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-stone-500 text-lg mb-2">No passwords yet</p>
              <p className="text-stone-400 text-sm">Click "Add Password" above to create your first password</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                      Label
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {passwords.map((password) => {
                    const typeColors: { [key: string]: string } = {
                      arc: 'bg-blue-100 text-blue-800',
                      hwa: 'bg-amber-100 text-amber-800',
                      giveaway: 'bg-green-100 text-green-800',
                      other: 'bg-stone-100 text-stone-800',
                    };
                    return (
                      <tr key={password.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 text-sm text-stone-900">
                          {password.label}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs uppercase ${typeColors[password.distribution_type] || 'bg-stone-100 text-stone-800'}`}
                          >
                            {password.distribution_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
                              password.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {password.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-600">
                          {new Date(password.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button
                            onClick={() => openEditModal(password)}
                            className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 mr-3"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(password)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {passwords.length === 0 && (
                <p className="text-center text-stone-500 py-8">
                  No passwords configured for this book
                </p>
              )}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-stone-900 mb-4">
                {editingPassword ? 'Edit Password' : 'Add Password'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Distribution Type
                  </label>
                  <select
                    required
                    value={formData.distributionType}
                    onChange={(e) =>
                      setFormData({ ...formData, distributionType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="hwa">HWA</option>
                    <option value="arc">ARC</option>
                    <option value="giveaway">Giveaway</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., HWA 2025 Conference"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    Custom label to help identify this password
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Password
                    {editingPassword && (
                      <span className="text-xs text-stone-500 ml-2">
                        (leave empty to keep current)
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required={!editingPassword}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="passwordActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="passwordActive"
                    className="text-sm text-stone-700"
                  >
                    Active
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-stone-900 text-white px-6 py-2 rounded-md hover:bg-stone-800 transition-colors"
                  >
                    {editingPassword ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
