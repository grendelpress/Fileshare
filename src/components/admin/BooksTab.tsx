import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { API_BASE, supabase } from '../../lib/supabase';

interface Book {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  description: string;
  storage_key: string;
  epub_storage_key: string | null;
  cover_image_key: string | null;
  is_active: boolean;
  series_id: string | null;
  order_in_series: number | null;
  created_at: string;
}

interface Series {
  id: string;
  name: string;
  author_name: string;
}

interface Collection {
  id: string;
  name: string;
}

interface BookFormData {
  title: string;
  authorName: string;
  slug: string;
  description: string;
  storageKey: string;
  epubStorageKey: string;
  coverImageKey: string;
  isActive: boolean;
  seriesId: string;
  orderInSeries: string;
  collectionIds: string[];
}

interface BooksTabProps {
  adminToken: string;
}

export default function BooksTab({ adminToken }: BooksTabProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingEpub, setUploadingEpub] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    authorName: '',
    slug: '',
    description: '',
    storageKey: '',
    epubStorageKey: '',
    coverImageKey: '',
    isActive: true,
    seriesId: '',
    orderInSeries: '',
    collectionIds: [],
  });

  useEffect(() => {
    loadBooks();
    loadSeries();
    loadCollections();
  }, []);

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
    } finally {
      setLoading(false);
    }
  }

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
    }
  }

  async function loadCollections() {
    try {
      const response = await fetch(`${API_BASE}/admin-collections`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load collections');

      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  }

  function openCreateModal() {
    setEditingBook(null);
    setFormData({
      title: '',
      authorName: '',
      slug: '',
      description: '',
      storageKey: '',
      epubStorageKey: '',
      coverImageKey: '',
      isActive: true,
      seriesId: '',
      orderInSeries: '',
      collectionIds: [],
    });
    setShowModal(true);
  }

  async function openEditModal(book: Book) {
    setEditingBook(book);

    let collectionIds: string[] = [];
    if (book.id) {
      try {
        const { data } = await supabase
          .from('collection_books')
          .select('collection_id')
          .eq('book_id', book.id);

        collectionIds = data?.map(cb => cb.collection_id) || [];
      } catch (error) {
        console.error('Error loading book collections:', error);
      }
    }

    setFormData({
      title: book.title,
      authorName: book.author_name,
      slug: book.slug,
      description: book.description,
      storageKey: book.storage_key,
      epubStorageKey: book.epub_storage_key || '',
      coverImageKey: book.cover_image_key || '',
      isActive: book.is_active,
      seriesId: book.series_id || '',
      orderInSeries: book.order_in_series?.toString() || '',
      collectionIds,
    });
    setShowModal(true);
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setUploadingFile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/pdf-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('master_pdfs')
        .upload(fileName, file);

      if (error) throw error;

      setFormData({ ...formData, storageKey: fileName });
      alert('PDF uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleEpubUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/epub+zip') {
      alert('Please select an EPUB file');
      return;
    }

    setUploadingEpub(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/epub-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('master_pdfs')
        .upload(fileName, file);

      if (error) throw error;

      setFormData({ ...formData, epubStorageKey: fileName });
      alert('EPUB uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload EPUB: ' + error.message);
    } finally {
      setUploadingEpub(false);
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingCover(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${user.id}/${Date.now()}-${file.name}`;
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
      const url = editingBook
        ? `${API_BASE}/admin-books`
        : `${API_BASE}/admin-books`;

      const response = await fetch(url, {
        method: editingBook ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...(editingBook && { id: editingBook.id }),
          ...formData,
          seriesId: formData.seriesId || null,
          orderInSeries: formData.orderInSeries ? parseInt(formData.orderInSeries) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save book');
      }

      const result = await response.json();
      const bookId = result.book?.id;

      if (bookId && formData.collectionIds.length > 0) {
        await supabase
          .from('collection_books')
          .delete()
          .eq('book_id', bookId);

        const collectionBooks = formData.collectionIds.map((collectionId, index) => ({
          collection_id: collectionId,
          book_id: bookId,
          order_in_collection: index,
        }));

        await supabase
          .from('collection_books')
          .insert(collectionBooks);
      } else if (bookId) {
        await supabase
          .from('collection_books')
          .delete()
          .eq('book_id', bookId);
      }

      await loadBooks();
      setShowModal(false);
    } catch (error: any) {
      alert(error.message);
    }
  }

  function toggleCollection(collectionId: string) {
    setFormData(prev => ({
      ...prev,
      collectionIds: prev.collectionIds.includes(collectionId)
        ? prev.collectionIds.filter(id => id !== collectionId)
        : [...prev.collectionIds, collectionId]
    }));
  }

  async function handleDelete(book: Book) {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_BASE}/admin-books?id=${book.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete book');

      await loadBooks();
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
        <h2 className="text-xl font-bold text-stone-900">Books</h2>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-md hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-stone-500 text-lg mb-2">No books yet</p>
          <p className="text-stone-400 text-sm">Click "Add Book" above to create your first book</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Formats
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
              {books.map((book) => (
              <tr key={book.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 text-sm text-stone-900">
                  {book.title}
                </td>
                <td className="px-4 py-3 text-sm text-stone-600">
                  {book.author_name}
                </td>
                <td className="px-4 py-3 text-sm text-stone-600">
                  {book.slug}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-1">
                    <span className="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      PDF
                    </span>
                    {book.epub_storage_key && (
                      <span className="inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        EPUB
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      book.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {book.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <button
                    onClick={() => openEditModal(book)}
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 mr-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(book)}
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
                {editingBook ? 'Edit Book' : 'Add Book'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({
                        ...formData,
                        title,
                        slug: formData.slug || generateSlug(title),
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
                    Series (Optional)
                  </label>
                  <select
                    value={formData.seriesId}
                    onChange={(e) =>
                      setFormData({ ...formData, seriesId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="">No Series</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} by {s.author_name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.seriesId && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Order in Series
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.orderInSeries}
                      onChange={(e) =>
                        setFormData({ ...formData, orderInSeries: e.target.value })
                      }
                      placeholder="e.g., 1 for Book 1"
                      className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Collections (Optional)
                  </label>
                  <div className="border border-stone-300 rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {collections.length === 0 ? (
                      <p className="text-sm text-stone-500">No collections available</p>
                    ) : (
                      collections.map((collection) => (
                        <label
                          key={collection.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-stone-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.collectionIds.includes(collection.id)}
                            onChange={() => toggleCollection(collection.id)}
                            className="rounded border-stone-300"
                          />
                          <span className="text-sm text-stone-700">{collection.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Master PDF
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={formData.storageKey}
                      onChange={(e) =>
                        setFormData({ ...formData, storageKey: e.target.value })
                      }
                      placeholder="PDF storage key"
                      className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                    <label className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2 rounded-md hover:bg-stone-200 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {uploadingFile ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Master EPUB (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.epubStorageKey}
                      onChange={(e) =>
                        setFormData({ ...formData, epubStorageKey: e.target.value })
                      }
                      placeholder="EPUB storage key (optional)"
                      className="flex-1 px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                    <label className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2 rounded-md hover:bg-stone-200 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {uploadingEpub ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="application/epub+zip"
                        onChange={handleEpubUpload}
                        disabled={uploadingEpub}
                        className="hidden"
                      />
                    </label>
                  </div>
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
                    Active (accepting signups)
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
                    {editingBook ? 'Update' : 'Create'}
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
