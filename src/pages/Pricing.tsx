import React from 'react';
import { stripeProducts } from '../stripe-config';
import { PricingCard } from '../components/subscription/PricingCard';
import { useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function Pricing() {
  const { subscription } = useSubscription();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select the perfect plan for your publishing needs. All plans include our core features with different levels of support and capabilities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {stripeProducts.map((product) => (
            <PricingCard
              key={product.id}
              product={product}
              isCurrentPlan={subscription?.price_id === product.priceId}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need help choosing? <a href="mailto:support@example.com" className="text-indigo-600 hover:text-indigo-500">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
}