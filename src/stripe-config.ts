export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price_per_unit: number;
  currency_symbol: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TNNtLlrGRfI65s',
    priceId: 'price_1SQd7vJ2D1Y0KDGjvSeWz4hv',
    name: 'Indie Author',
    description: 'Perfect for independent authors looking to distribute their work professionally',
    price_per_unit: 4.99,
    currency_symbol: '$',
    mode: 'subscription'
  }
];