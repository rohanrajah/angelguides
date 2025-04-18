import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to call loadStripe outside of a component's render to avoid recreating the Stripe object on every render
// In a real application, use an environment variable for the Stripe public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface TopUpDialogProps {
  userId: number;
  onSuccess?: () => void;
}

// Checkout form that appears once payment intent is created
function CheckoutForm({ onSuccess }: { onSuccess?: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/transactions',
      },
      redirect: 'if_required',
    });
    
    if (error) {
      toast({
        title: 'Payment failed',
        description: error.message || 'An error occurred during payment processing.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    } else {
      toast({
        title: 'Payment successful',
        description: 'Your account has been topped up successfully.',
      });
      if (onSuccess) {
        onSuccess();
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="mt-6">
        <Button disabled={!stripe || isProcessing} className="w-full">
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </Button>
      </div>
    </form>
  );
}

export function TopUpDialog({ userId, onSuccess }: TopUpDialogProps) {
  const [amount, setAmount] = useState<number>(10);
  const [isOpen, setIsOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const presetAmounts = [10, 25, 50, 100];
  
  async function handleTopUp() {
    if (amount < 10) {
      toast({
        title: 'Invalid amount',
        description: 'Minimum top-up amount is $10',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/topup', {
        userId,
        amountUsd: amount,
      });
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }
  
  function resetDialog() {
    setAmount(10);
    setClientSecret(null);
  }
  
  function handleClose(open: boolean) {
    if (!open) {
      resetDialog();
    }
    setIsOpen(open);
  }
  
  function handleSuccess() {
    setIsOpen(false);
    resetDialog();
    if (onSuccess) {
      onSuccess();
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="w-full">Top Up Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {!clientSecret ? (
          <>
            <DialogHeader>
              <DialogTitle>Top Up Your Account</DialogTitle>
              <DialogDescription>
                Add funds to your account to book sessions with our advisors.
                The minimum amount is $10.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((presetAmount) => (
                  <Button
                    key={presetAmount}
                    type="button"
                    variant={amount === presetAmount ? "default" : "outline"}
                    onClick={() => setAmount(presetAmount)}
                  >
                    ${presetAmount}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">$</span>
                <Input
                  type="number"
                  min="10"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="text-lg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleTopUp} disabled={isLoading || amount < 10}>
                {isLoading ? 'Processing...' : `Add ${formatCurrency(amount * 100)}`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Complete your payment to add {formatCurrency(amount * 100)} to your account.
              </DialogDescription>
            </DialogHeader>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handleSuccess} />
            </Elements>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}