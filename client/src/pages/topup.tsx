import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Missing Stripe public key.');
}
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// Predefined top-up amounts
const topupAmounts = [10, 25, 50, 100, 200];

const TopupForm = ({ userId, amount }: { userId: number; amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Submit payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile?success=true`,
        },
      });

      if (result.error) {
        toast({
          title: 'Payment Failed',
          description: result.error.message || 'An error occurred during payment processing.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-neutral-lightest/50 p-6 rounded-xl backdrop-blur-sm border border-purple-100">
        <PaymentElement />
      </div>
      
      <div className="mt-6">
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={`w-full py-4 rounded-xl font-medium text-white ${
            !stripe || isProcessing
              ? 'bg-neutral cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Processing Payment...
            </span>
          ) : (
            `Add $${amount} to Your Spiritual Journey`
          )}
        </button>
      </div>
    </form>
  );
};

const TopupPage: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(10); // Default to $10 (minimum)
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/me'],
  });

  const { data: balance } = useQuery<{ balance: number; formattedBalance: string }>({
    queryKey: ['/api/users', user?.id, 'balance'],
    enabled: !!user?.id,
  });

  useEffect(() => {
    const initializePayment = async () => {
      if (!user) return;

      try {
        const response = await apiRequest('POST', '/api/topup', {
          userId: user.id,
          amountUsd: selectedAmount,
        });

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error initializing payment:', error);
      }
    };

    if (user?.id) {
      initializePayment();
    }
  }, [user?.id, selectedAmount]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
  };

  return (
    <div 
      className="container mx-auto px-4 py-12"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1519515547959-9281e9655a89?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center"
      }}
    >
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-8 border border-purple-100">
          <div className="text-center mb-8">
            <div className="inline-block mb-3">
              <i className="fas fa-moon text-4xl text-purple-600"></i>
            </div>
            <h1 className="font-heading text-3xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Energize Your Spiritual Journey
            </h1>
            <p className="text-neutral-dark">
              Add funds to unlock deeper connections with our spiritual guides. Minimum top-up: $10
            </p>
          </div>

          {balance && (
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl p-6 mb-8 border border-purple-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Your Spiritual Balance:</span>
                <span className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {balance.formattedBalance}
                </span>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="font-medium text-purple-800 mb-4 flex items-center">
              <span className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-purple-600">1</span>
              Choose Your Energy Amount
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {topupAmounts.map((amount) => (
                <motion.button
                  key={amount}
                  type="button"
                  className={`py-4 rounded-xl text-center ${
                    selectedAmount === amount
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100'
                  }`}
                  onClick={() => handleAmountSelect(amount)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ${amount}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-medium text-purple-800 mb-4 flex items-center">
              <span className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-purple-600">2</span>
              Sacred Payment Gateway
            </h2>
            {user && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <TopupForm userId={user.id} amount={selectedAmount} />
              </Elements>
            ) : (
              <div className="flex justify-center p-12">
                <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-purple-100">
          <h2 className="font-heading text-2xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 text-center">
            Your Spiritual Journey Awaits
          </h2>
          <div className="space-y-4 text-gray-600">
            <div className="flex gap-4 items-start">
              <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                <i className="fas fa-star"></i>
              </div>
              <div>
                <h3 className="font-medium text-purple-800 mb-1">Divine Connection</h3>
                <p>Your account balance facilitates your connection with our gifted spiritual advisors. As you journey together, your balance sustains the energy exchange.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                <i className="fas fa-clock"></i>
              </div>
              <div>
                <h3 className="font-medium text-purple-800 mb-1">Sacred Minute Billing</h3>
                <p>Our advisors are compensated for their spiritual guidance at their specific per-minute rate. You'll only exchange energy for the time you spend in consultation.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                <i className="fas fa-gem"></i>
              </div>
              <div>
                <h3 className="font-medium text-purple-800 mb-1">Minimum Energy Exchange</h3>
                <p>The minimum amount to add to your spiritual account is $10. This threshold helps maintain the sacred balance of our community and service.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TopupPage;