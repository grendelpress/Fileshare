import React, { useState } from 'react';
import { StripeProduct } from '../../stripe-config';
import { supabase } from '../../lib/supabase';
import { Check } from 'lucide-react';

interface PricingCardProps {
  product: StripeProduct;
  isCurrentPlan?: boolean;
}

export function PricingCard({ product, isCurrentPlan = false }: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-8 ${isCurrentPlan ? 'ring-2 ring-indigo-500' : ''}`}>
      {isCurrentPlan && (
        <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
          Current Plan
        </div>
      )}
      
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
      <p className="text-gray-600 mb-6">{product.description}</p>
      
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">
          {product.currency_symbol}{product.price_per_unit}
        </span>
        {product.mode === 'subscription' && (
          <span className="text-gray-600 ml-2">/month</span>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        <li className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-gray-700">Professional book distribution</span>
        </li>
        <li className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-gray-700">Advanced reader copy management</span>
        </li>
        <li className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-gray-700">Analytics and tracking</span>
        </li>
        <li className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-gray-700">Email support</span>
        </li>
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={loading || isCurrentPlan}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : 'Get Started'}
      </button>
    </div>
  );
}