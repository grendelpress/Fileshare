import { useState, useEffect } from 'react';
import { CreditCard, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { stripeProducts } from '../stripe-config';
import Layout from '../components/Layout';

export default function BillingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<any>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [processingReactivate, setProcessingReactivate] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    loadBilling();
    loadSubscriptionData();
  }, []);

  async function loadBilling() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      const { data: authorData, error } = await supabase
        .from('authors')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setAuthor(authorData);
    } catch (error) {
      console.error('Error loading billing:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscriptionData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading subscription:', error);
      } else {
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  }

  async function handleSubscribe() {
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
          cancel_url: `${window.location.origin}/billing`,
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
  }

  async function handleCancelSubscription() {
    setProcessingCancel(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-cancel-subscription`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      const result = await response.json();
      setShowCancelModal(false);
      await loadBilling();
      await loadSubscriptionData();
      alert('Your subscription has been cancelled. You will retain access until the end of your billing period.');
    } catch (error: any) {
      console.error('Cancel error:', error);
      alert('Failed to cancel subscription: ' + error.message);
    } finally {
      setProcessingCancel(false);
    }
  }

  async function handleReactivateSubscription() {
    setProcessingReactivate(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-reactivate-subscription`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reactivate subscription');
      }

      const result = await response.json();
      await loadBilling();
      await loadSubscriptionData();
      alert('Your subscription has been reactivated!');
    } catch (error: any) {
      console.error('Reactivate error:', error);
      alert('Failed to reactivate subscription: ' + error.message);
    } finally {
      setProcessingReactivate(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  if (!author) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Billing & Subscription</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-900 mb-2">
                  Current Plan
                </h2>
                <p className="text-stone-600">
                  {author.is_grendel_press
                    ? 'Grendel Press Author (Free)'
                    : author.account_status === 'active'
                    ? 'Professional Plan - $4.99/month'
                    : author.account_status === 'trial'
                    ? '14-Day Free Trial'
                    : 'No active subscription'}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                author.account_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : author.account_status === 'trial'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {author.account_status === 'trial' ? 'Trial' : author.account_status}
              </div>
            </div>

            {author.trial_ends_at && author.account_status === 'trial' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-900 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Trial Period</span>
                </div>
                <p className="text-sm text-blue-800">
                  Your trial ends on {new Date(author.trial_ends_at).toLocaleDateString()}.
                  Subscribe below to continue using the platform after your trial expires.
                </p>
              </div>
            )}

            {!author.is_grendel_press && author.account_status === 'active' && subscriptionData?.current_period_end && !subscriptionData?.cancel_at_period_end && (
              <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-lg">
                <div className="flex items-center gap-2 text-stone-900 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Next Renewal</span>
                </div>
                <p className="text-sm text-stone-700">
                  Your subscription will renew on {new Date(subscriptionData.current_period_end * 1000).toLocaleDateString()} for $4.99.
                </p>
              </div>
            )}

            {author.is_grendel_press && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                <p className="font-medium">You have lifetime free access as a Grendel Press author!</p>
                <p className="text-sm mt-1">No payment required.</p>
              </div>
            )}

            {!author.is_grendel_press && author.account_status === 'active' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-stone-700">
                  <CreditCard className="w-5 h-5 text-stone-400" />
                  <span>Subscription managed through Stripe</span>
                </div>

                {subscriptionData?.cancel_at_period_end ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">Subscription Cancelling</p>
                          <p className="text-sm text-amber-800 mt-1">
                            Your subscription will end on {subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end * 1000).toLocaleDateString() : 'the end of your billing period'}. You will retain access until then.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={processingReactivate}
                      className="w-full px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {processingReactivate ? 'Processing...' : 'Reactivate Subscription'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            )}

            {!author.is_grendel_press && author.account_status === 'trial' && (
              <div className="mt-6 p-6 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-lg">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-lg font-semibold text-stone-900">Subscribe Now</h3>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-stone-900">$4.99</span>
                    <span className="text-stone-600 text-sm ml-1">/month</span>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-amber-900 font-medium mb-1">
                    Trial expires on {new Date(author.trial_ends_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-amber-800">
                    Subscribe before your trial ends to keep your account active and your content visible. After your trial expires, your account will be suspended and your books will become private until you subscribe.
                  </p>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={processingCheckout}
                  className="w-full px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {processingCheckout ? 'Processing...' : 'Subscribe to Maintain Access'}
                </button>
              </div>
            )}

            {!author.is_grendel_press && author.account_status !== 'active' && author.account_status !== 'trial' && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <p className="font-medium">Your subscription is inactive</p>
                <p className="text-sm mt-1 mb-3">
                  Subscribe to continue using the platform.
                </p>
                <button
                  onClick={handleSubscribe}
                  disabled={processingCheckout}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingCheckout ? 'Processing...' : 'Subscribe for $4.99/month'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Plan Features</h2>
            <ul className="space-y-3 text-stone-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span>
                Unlimited books
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span>
                Unlimited ARC distribution passwords
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span>
                Series and collection management
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span>
                Reader signup tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span>
                Export signups to CSV
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-stone-900 rounded-full"></span>
                PDF watermarking and tracking
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-stone-900 mb-4">Cancel Subscription?</h3>
            <div className="space-y-4 mb-6">
              <p className="text-stone-700">
                Are you sure you want to cancel your subscription?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>You will keep access until the end of your billing period.</strong>
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  After that, your account will be suspended and your books will become private. You can reactivate anytime before your billing period ends.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={processingCancel}
                className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={processingCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {processingCancel ? 'Processing...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
