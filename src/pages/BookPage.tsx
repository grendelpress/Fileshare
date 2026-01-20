import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Download, Loader2, Mail, X } from 'lucide-react';
import { supabase, API_BASE, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
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
}

export default function BookPage() {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatingFormat, setGeneratingFormat] = useState<'pdf' | 'epub' | null>(null);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    referredBy: 'HWA',
    password: '',
    mailingOptIn: false,
  });

  useEffect(() => {
    loadBook();
  }, [slug]);

  async function loadBook() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Verify password using edge function
      const response = await fetch(`${API_BASE}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookSlug: slug,
          password: formData.password,
          referredBy: formData.referredBy,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.error || 'Invalid access password');
      }

      setPasswordVerified(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFormatDownload(format: 'pdf' | 'epub') {
    setError('');
    setGeneratingFormat(format);

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookSlug: slug,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          referredBy: formData.referredBy,
          password: formData.password,
          mailingOptIn: formData.mailingOptIn,
          format,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate download link');
      }

      setDownloadUrl(data.downloadUrl);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setGeneratingFormat(null);
    }
  }

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setRequestError('');
    setRequestSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          bookSlug: slug,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit access request');
      }

      setRequestSuccess(true);
    } catch (err: any) {
      setRequestError(err.message || 'An error occurred. Please try again.');
    } finally {
      setRequestSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Book not found or no longer active.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-stone-900 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Books
          </Link>
        </div>
      </div>
    );
  }

  // Show download link page
  if (downloadUrl) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Books
          </Link>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              Your Link is Ready!
            </h2>
            <p className="text-stone-600 mb-6">
              Click the button below to download your stamped copy of{' '}
              <span className="font-semibold">{book.title}</span>
            </p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-md hover:bg-stone-800 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download File
            </a>
            <p className="text-sm text-stone-500 mt-4">
              This link will expire in 30 minutes
            </p>
            <button
              onClick={() => {
                setDownloadUrl(null);
                setPasswordVerified(false);
              }}
              className="text-stone-600 hover:text-stone-900 text-sm mt-6 underline"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show format selection page
  if (passwordVerified) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Books
          </Link>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <h2 className="text-2xl font-bold text-stone-900 mb-2 text-center">
              Choose Your Format
            </h2>
            <p className="text-stone-600 mb-6 text-center">
              Select which format you'd like to download for{' '}
              <span className="font-semibold">{book.title}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleFormatDownload('pdf')}
                disabled={generatingFormat !== null}
                className="flex flex-col items-center justify-center p-6 border-2 border-stone-300 rounded-lg hover:border-stone-900 hover:bg-stone-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BookOpen className="w-12 h-12 text-stone-700 mb-3" />
                <span className="text-lg font-semibold text-stone-900 mb-1">
                  PDF Format
                </span>
                <span className="text-sm text-stone-600 text-center">
                  Best for printing and reading on any device
                </span>
                {generatingFormat === 'pdf' && (
                  <Loader2 className="w-5 h-5 animate-spin text-stone-900 mt-3" />
                )}
              </button>

              {book.epub_storage_key && (
                <button
                  onClick={() => handleFormatDownload('epub')}
                  disabled={generatingFormat !== null}
                  className="flex flex-col items-center justify-center p-6 border-2 border-stone-300 rounded-lg hover:border-stone-900 hover:bg-stone-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-12 h-12 text-stone-700 mb-3" />
                  <span className="text-lg font-semibold text-stone-900 mb-1">
                    EPUB Format
                  </span>
                  <span className="text-sm text-stone-600 text-center">
                    Best for e-readers and mobile devices
                  </span>
                  {generatingFormat === 'epub' && (
                    <Loader2 className="w-5 h-5 animate-spin text-stone-900 mt-3" />
                  )}
                </button>
              )}
            </div>

            <button
              onClick={() => setPasswordVerified(false)}
              className="text-stone-600 hover:text-stone-900 text-sm mt-6 underline block mx-auto"
            >
              Back to Form
            </button>
          </div>
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
          Back to Books
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8 p-8">
            {book.cover_image_key && (
              <div className="lg:w-1/3 flex-shrink-0">
                <img
                  src={`${SUPABASE_URL}/storage/v1/object/public/cover_images/${book.cover_image_key}`}
                  alt={book.title}
                  className="w-full h-auto rounded-lg shadow-md"
                />
                <button
                  onClick={() => setShowRequestAccess(true)}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 border border-stone-300 rounded-md text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Request Access
                </button>
              </div>
            )}
            <div className="flex-1">
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <BookOpen className="w-8 h-8 text-stone-700 flex-shrink-0 mt-1" />
                  <div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-2">
                      {book.title}
                    </h1>
                    <p className="text-lg text-stone-600">by {book.author_name}</p>
                  </div>
                </div>
                {book.description && (
                  <div className="text-stone-700 leading-relaxed whitespace-pre-line mb-8">
                    {book.description}
                  </div>
                )}
              </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-stone-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-stone-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div>
              <label
                htmlFor="referredBy"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Referred By
              </label>
              <select
                id="referredBy"
                value={formData.referredBy}
                onChange={(e) =>
                  setFormData({ ...formData, referredBy: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="HWA">HWA</option>
                <option value="ARC">ARC</option>
                <option value="Giveaway">Giveaway</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700 mb-1"
              >
                Access Password
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="mailingOptIn"
                checked={formData.mailingOptIn}
                onChange={(e) =>
                  setFormData({ ...formData, mailingOptIn: e.target.checked })
                }
                className="mt-1"
              />
              <label htmlFor="mailingOptIn" className="text-sm text-stone-700">
                Join {book.author_name}'s mailing list for updates and new
                releases
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-900 text-white px-6 py-3 rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Continue'
              )}
            </button>
            </form>

              <p className="text-xs text-stone-500 mt-4 text-center">
                Your data is used solely for delivery and mailing list purposes (if
                opted in). We respect your privacy.
              </p>
            </div>
          </div>
        </div>

        {showRequestAccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => {
                  setShowRequestAccess(false);
                  setRequestSuccess(false);
                  setRequestError('');
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>

              {requestSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">
                    Request Submitted
                  </h3>
                  <p className="text-stone-600 mb-6">
                    Your access request has been submitted successfully. You will be
                    notified by email if your request is approved.
                  </p>
                  <button
                    onClick={() => {
                      setShowRequestAccess(false);
                      setRequestSuccess(false);
                    }}
                    className="w-full bg-stone-900 text-white px-6 py-3 rounded-md hover:bg-stone-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">
                    Request Access
                  </h3>
                  <p className="text-stone-600 mb-4 text-sm">
                    Don't have an access password? Submit a request and you'll be
                    notified by email if approved.
                  </p>

                  <form onSubmit={handleRequestAccess} className="space-y-4">
                    <div>
                      <label
                        htmlFor="requestFirstName"
                        className="block text-sm font-medium text-stone-700 mb-1"
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        id="requestFirstName"
                        required
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="requestLastName"
                        className="block text-sm font-medium text-stone-700 mb-1"
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="requestLastName"
                        required
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="requestEmail"
                        className="block text-sm font-medium text-stone-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="requestEmail"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                    </div>

                    {requestError && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                        {requestError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={requestSubmitting}
                      className="w-full bg-stone-900 text-white px-6 py-3 rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {requestSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          Submit Request
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
