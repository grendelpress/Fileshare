import React from 'react';
import { stripeProducts } from '../../stripe-config';
import { useSubscription } from '../../hooks/useSubscription';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

export function SubscriptionCard() {
  const { subscription, loading, error } = useSubscription();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">Error loading subscription: {error}</div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'trialing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'canceled':
      case 'unpaid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'canceled':
        return 'Canceled';
      case 'unpaid':
        return 'Payment Failed';
      case 'not_started':
        return 'Not Started';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getCurrentProduct = () => {
    if (!subscription?.price_id) return null;
    return stripeProducts.find(product => product.priceId === subscription.price_id);
  };

  const currentProduct = getCurrentProduct();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
        {subscription && (
          <div className="flex items-center space-x-2">
            {getStatusIcon(subscription.subscription_status)}
            <span className="text-sm font-medium text-gray-700">
              {getStatusText(subscription.subscription_status)}
            </span>
          </div>
        )}
      </div>

      {currentProduct ? (
        <div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            {currentProduct.name}
          </h4>
          <p className="text-gray-600 mb-4">{currentProduct.description}</p>
          <div className="text-2xl font-bold text-indigo-600">
            {currentProduct.currency_symbol}{currentProduct.price_per_unit}
            <span className="text-sm font-normal text-gray-500">/month</span>
          </div>
          
          {subscription?.current_period_end && (
            <div className="mt-4 text-sm text-gray-600">
              {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
              {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-600">
          <p>No active subscription</p>
          <p className="text-sm mt-2">Choose a plan to get started</p>
        </div>
      )}
    </div>
  );
}