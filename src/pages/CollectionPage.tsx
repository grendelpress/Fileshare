import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import Layout from '../components/Layout';

interface Book {
  id: string;
  slug: string;
  title: string;
  author_name: string;
  description: string;
  cover_image_key: string | null;
  order_in_collection: number;
}

interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover_image_key: string | null;
}

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadCollectionAndBooks();
    }
  }, [slug]);

  async function loadCollectionAndBooks() {
    try {
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (collectionError) throw collectionError;
      setCollection(collectionData);

      const { data: collectionBooks, error: cbError } = await supabase
        .from('collection_books')
        .select('book_id, order_in_collection')
        .eq('collection_id', collectionData.id)
        .order('order_in_collection', { ascending: true });

      if (cbError) throw cbError;

      if (collectionBooks && collectionBooks.length > 0) {
        const bookIds = collectionBooks.map(cb => cb.book_id);
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds)
          .eq('is_active', true);

        if (booksError) throw booksError;

        const booksWithOrder = booksData.map(book => {
          const cb = collectionBooks.find(cb => cb.book_id === book.id);
          return {
            ...book,
            order_in_collection: cb?.order_in_collection || 0
          };
        });

        booksWithOrder.sort((a, b) => a.order_in_collection - b.order_in_collection);
        setBooks(booksWithOrder);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCoverUrl(imageKey: string | null) {
    if (!imageKey) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/cover_images/${imageKey}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <p className="text-stone-600">Collection not found.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {collection.cover_image_key && (
              <div className="md:w-64 flex-shrink-0">
                <img
                  src={getCoverUrl(collection.cover_image_key)!}
                  alt={collection.name}
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="mb-4">
                <span className="inline-block text-xs font-medium text-stone-500 uppercase tracking-wide bg-stone-100 px-3 py-1 rounded-full">
                  Collection
                </span>
              </div>
              <h1 className="text-4xl font-bold text-stone-900 mb-6">{collection.name}</h1>
              {collection.description && (
                <div className="text-stone-700 leading-relaxed whitespace-pre-line">
                  {collection.description}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-stone-900 mb-6">
            Books in this Collection ({books.length})
          </h2>
          <div className="space-y-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-stone-200 overflow-hidden p-4"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {book.cover_image_key && (
                    <div className="md:w-48 flex-shrink-0">
                      <img
                        src={getCoverUrl(book.cover_image_key)!}
                        alt={book.title}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-stone-900 mb-2">{book.title}</h3>
                      <p className="text-lg text-stone-600 mb-4">by {book.author_name}</p>
                      {book.description && (
                        <div className="text-stone-700 leading-relaxed whitespace-pre-line mb-4">
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
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
