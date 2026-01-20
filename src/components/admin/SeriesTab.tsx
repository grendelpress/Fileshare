import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { API_BASE, supabase } from '../../lib/supabase';

interface Series {
  id: string;
  slug: string;
  name: string;
  author_name: string;
  description: string;
  cover_image_key: string | null;
  display_order: number;
  is_active: boolean;
  book_count?: number;
}

interface SeriesFormData {
  name: string;
  authorName: string;
  slug: string;
  description: string;
  coverImageKey: string;
  displayOrder: string;
  isActive: boolean;
}

interface SeriesTabProps {
  adminToken: string;
}

export default function SeriesTab({ adminToken }: SeriesTabProps) {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formData, setFormData] = useState<SeriesFormData>({
    name: '',
    authorName: '',
    slug: '',
    description: '',
    coverImageKey: '',
    displayOrder: '0',
    isActive: true,
  });

  useEffect(() => {
    loadSeries();
  }, []);

  async function loadSeries() {
    try {
      const response = await fetch(`${API_BASE}/admin-series`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load series');

      const data = await response.json();
      setSeries(data.series || []);
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingSeries(null);
    setFormData({
      name: '',
      authorName: '',
      slug: '',
      description: '',
      coverImageKey: '',
      displayOrder: '0',
      isActive: true,
    });
    setShowModal(true);
  }

  function openEditModal(series: Series) {
    setEditingSeries(series);
    setFormData({
      name: series.name,
      authorName: series.author_name,
      slug: series.slug,
      description: series.description,
      coverImageKey: series.cover_image_key || '',
      displayOrder: series.display_order.toString(),
      isActive: series.is_active,
    });
    setShowModal(true);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingCover(true);
    try {
      const fileName = `series-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('cover_images')
        .upload(fileName, file);

      if (error) throw error;

      setFormData({ ...formData, coverImageKey: fileName });
      alert('Cover image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload cover: ' + error.message);
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/admin-series`, {
        method: editingSeries ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...(editingSeries && { id: editingSeries.id }),
          ...formData,
          displayOrder: parseInt(formData.displayOrder) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save series');
      }

      await loadSeries();
      setShowModal(false);
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleDelete(series: Series) {
    if (!confirm(`Delete "${series.name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_BASE}/admin-series?id=${series.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete series');

      await loadSeries();
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-stone-900">Series</h2>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-md hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Series
        </button>
      </div>

      {series.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-stone-500 text-lg mb-2">No series yet</p>
          <p className="text-stone-400 text-sm">Click "Add Series" above to create your first series</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Books
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-stone-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {series.map((s) => (
              <tr key={s.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 text-sm text-stone-900">{s.name}</td>
                <td className="px-4 py-3 text-sm text-stone-600">{s.author_name}</td>
                <td className="px-4 py-3 text-sm text-stone-600">{s.slug}</td>
                <td className="px-4 py-3 text-sm text-stone-600">{s.book_count || 0}</td>
                <td className="px-4 py-3 text-sm text-stone-600">{s.display_order}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      s.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button
                    onClick={() => openEditModal(s)}
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 mr-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-stone-900 mb-4">
                {editingSeries ? 'Edit Series' : 'Add Series'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Series Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: formData.slug || generateSlug(name),
                      });
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.authorName}
                    onChange={(e) =>
                      setFormData({ ...formData, authorName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Cover Image
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.coverImageKey}
                      onChange={(e) =>
                        setFormData({ ...formData, coverImageKey: e.target.value })
                      }
                      placeholder="Cover image key (optional)"
                      className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                    <label className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2 rounded-md hover:bg-stone-200 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {uploadingCover ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={uploadingCover}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    Lower numbers appear first on the homepage
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  <label htmlFor="isActive" className="text-sm text-stone-700">
                    Active (visible on homepage)
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
                    {editingSeries ? 'Update' : 'Create'}
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
