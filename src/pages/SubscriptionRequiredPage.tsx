import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { stripeProducts } from '../stripe-config';

export default function SubscriptionRequiredPage() {
  const { user, profile, isSuspended, loading } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && profile && !isSuspended) {
      navigate('/dashboard');
    }
  }, [loading, user, profile, isSuspended, navigate]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSubscribe = async () => {
    setProcessingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const product = stripeProducts[0];
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: 'subscription',
          success_url: `${window.location.origin}/dashboard?subscription=success`,
          cancel_url: `${window.location.origin}/subscription-required`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout: ' + error.message);
    } finally {
      setProcessingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <Lock className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Subscription Required
          </h1>

          <p className="text-lg text-gray-600 mb-2">
            Your trial period has ended and your account has been suspended.
          </p>

          <p className="text-gray-600 mb-8">
            To regain access to your content and continue using all features,
            please subscribe to one of our plans.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What happens when you subscribe:
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Your account will be reactivated immediately
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  All your books, series, and collections will be restored
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Your content will become visible to readers again
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Full access to all platform features
                </span>
              </li>
            </ul>
          </div>

          <div className="mb-6 p-6 bg-stone-50 border border-stone-200 rounded-lg">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-lg font-semibold text-stone-900">Professional Plan</h3>
              <div className="text-right">
                <span className="text-3xl font-bold text-stone-900">$4.99</span>
                <span className="text-stone-600 text-sm ml-1">/month</span>
              </div>
            </div>
            <p className="text-sm text-stone-600 mb-4">
              Subscribe to reactivate your account and restore all your content immediately.
            </p>
            <button
              onClick={handleSubscribe}
              disabled={processingCheckout}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              {processingCheckout ? 'Processing...' : 'Subscribe Now'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard/billing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              View Billing Details
            </Link>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions about your subscription?{' '}
              <a
                href="mailto:info@grendelpress.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
