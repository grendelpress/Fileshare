import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import Layout from '../components/Layout';

interface Book {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  description: string;
  cover_image_key: string | null;
  epub_storage_key: string | null;
  is_active: boolean;
  series_id: string | null;
  order_in_series: number | null;
}

interface Series {
  id: string;
  slug: string;
  name: string;
  author_name: string;
  description: string;
  cover_image_key: string | null;
  display_order: number;
  is_active: boolean;
  book_count: number;
}

interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover_image_key: string | null;
  display_order: number;
  is_active: boolean;
  book_count: number;
}

interface DisplayItem {
  type: 'series' | 'collection' | 'book';
  data: Series | Collection | Book;
  displayOrder: number;
}

export default function HomePage() {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      const [booksResult, seriesResult, collectionsResult] = await Promise.all([
        supabase
          .from('books')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('series')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('collections')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
      ]);

      if (booksResult.error) throw booksResult.error;
      if (seriesResult.error) throw seriesResult.error;
      if (collectionsResult.error) throw collectionsResult.error;

      const books = booksResult.data || [];
      const series = seriesResult.data || [];
      const collections = collectionsResult.data || [];

      const seriesWithBooks = await Promise.all(
        series.map(async (s) => {
          const { count } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('series_id', s.id)
            .eq('is_active', true);

          return { ...s, book_count: count || 0 };
        })
      );

      const collectionsWithBooks = await Promise.all(
        collections.map(async (c) => {
          const { data: collectionBooks } = await supabase
            .from('collection_books')
            .select('book_id')
            .eq('collection_id', c.id);

          if (!collectionBooks || collectionBooks.length === 0) {
            return { ...c, book_count: 0 };
          }

          const bookIds = collectionBooks.map(cb => cb.book_id);
          const { count } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .in('id', bookIds)
            .eq('is_active', true);

          return { ...c, book_count: count || 0 };
        })
      );

      const collectionBookIds = new Set<string>();
      for (const collection of collectionsWithBooks) {
        const { data: collectionBooks } = await supabase
          .from('collection_books')
          .select('book_id')
          .eq('collection_id', collection.id);

        collectionBooks?.forEach(cb => collectionBookIds.add(cb.book_id));
      }

      const standaloneBooks = books.filter(book =>
        !book.series_id && !collectionBookIds.has(book.id)
      );

      const displayItems: DisplayItem[] = [
        ...seriesWithBooks
          .filter(s => s.book_count > 0)
          .map((s, index) => ({
            type: 'series' as const,
            data: s,
            displayOrder: s.display_order * 1000 + index
          })),
        ...collectionsWithBooks
          .filter(c => c.book_count > 0)
          .map((c, index) => ({
            type: 'collection' as const,
            data: c,
            displayOrder: c.display_order * 1000 + 500 + index
          })),
        ...standaloneBooks.map((book, index) => ({
          type: 'book' as const,
          data: book,
          displayOrder: 999999 + index
        }))
      ];

      displayItems.sort((a, b) => a.displayOrder - b.displayOrder);

      setItems(displayItems);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCoverUrl(imageKey: string | null) {
    if (!imageKey) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/cover_images/${imageKey}`;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-stone-800" />
            <h1 className="text-4xl font-bold text-stone-900">Grendel Press Digital File Share</h1>
          </div>
          <p className="text-lg text-stone-600">These are official copies shared with trusted readers and professional inquiries. Each file is uniquely watermarked to ensure the integrity of our authors' work. Thank you for reading responsibly.</p>
        </header>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600">No content available at this time.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {items.map((item, index) => {
              if (item.type === 'series') {
                const series = item.data as Series;
                return (
                  <Link
                    key={`series-${series.id}`}
                    to={`/series/${series.slug}`}
                    className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-stone-200 overflow-hidden p-4 group"
                  >
                    <div className="flex flex-col md:flex-row">
                      {series.cover_image_key && (
                        <div className="md:w-64 flex-shrink-0">
                          <img
                            src={getCoverUrl(series.cover_image_key)!}
                            alt={series.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Series</span>
                            <span className="text-xs text-stone-400">• {series.book_count} {series.book_count === 1 ? 'book' : 'books'}</span>
                          </div>
                          <h2 className="text-2xl font-bold text-stone-900 mb-2 group-hover:text-stone-700 transition-colors">
                            {series.name}
                          </h2>
                          <p className="text-lg text-stone-600 mb-4">by {series.author_name}</p>
                          {series.description && (
                            <div className="text-stone-700 mb-6 leading-relaxed whitespace-pre-line">
                              {series.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-stone-900 font-medium">
                          View Series
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }

              if (item.type === 'collection') {
                const collection = item.data as Collection;
                return (
                  <Link
                    key={`collection-${collection.id}`}
                    to={`/collections/${collection.slug}`}
                    className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-stone-200 overflow-hidden p-4 group"
                  >
                    <div className="flex flex-col md:flex-row">
                      {collection.cover_image_key && (
                        <div className="md:w-64 flex-shrink-0">
                          <img
                            src={getCoverUrl(collection.cover_image_key)!}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Collection</span>
                            <span className="text-xs text-stone-400">• {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}</span>
                          </div>
                          <h2 className="text-2xl font-bold text-stone-900 mb-4 group-hover:text-stone-700 transition-colors">
                            {collection.name}
                          </h2>
                          {collection.description && (
                            <div className="text-stone-700 mb-6 leading-relaxed whitespace-pre-line">
                              {collection.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-stone-900 font-medium">
                          View Collection
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }

              const book = item.data as Book;
              return (
                <div
                  key={`book-${book.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-stone-200 overflow-hidden p-4"
                >
                  <div className="flex flex-col md:flex-row">
                    {book.cover_image_key && (
                      <div className="md:w-64 flex-shrink-0">
                        <img
                          src={getCoverUrl(book.cover_image_key)!}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-stone-900 mb-2">
                          {book.title}
                        </h2>
                        <p className="text-lg text-stone-600 mb-4">by {book.author_name}</p>
                        {book.description && (
                          <div className="text-stone-700 mb-6 leading-relaxed whitespace-pre-line">
                            {book.description}
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/books/${book.slug}`}
                          className="inline-block bg-stone-900 text-white px-6 py-3 rounded-md hover:bg-stone-800 transition-colors font-medium"
                        >
                          Get Copy
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
