import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from '@/lib/utils';

interface PayoutRequestButtonProps {
  advisorId: number;
  balance: number;
  isPending: boolean;
  disabled?: boolean;
}

export function PayoutRequestButton({ 
  advisorId, 
  balance, 
  isPending,
  disabled = false
}: PayoutRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate, isPending: isMutating } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        `/api/advisors/${advisorId}/request-payout`
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payout requested',
        description: 'Your payout request has been submitted successfully.',
      });
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${advisorId}/earnings`] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request payout. Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (balance <= 0) {
    return (
      <Button disabled className="w-full">
        No funds available for payout
      </Button>
    );
  }

  if (isPending) {
    return (
      <Button disabled variant="outline" className="w-full">
        Payout pending...
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          className="w-full" 
          disabled={disabled || balance <= 0}
        >
          Request Payout
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Payout Request</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to request a payout of {formatCurrency(balance)}. 
            This amount will be sent to your registered payment method.
            Payouts typically take 2-3 business days to process.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              mutate();
            }}
            disabled={isMutating}
          >
            {isMutating ? 'Processing...' : 'Confirm Request'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}