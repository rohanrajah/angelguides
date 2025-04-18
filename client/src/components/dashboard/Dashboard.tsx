import React, { useState } from 'react';
import { User, UserType } from '@shared/schema';
import UserDashboard from './UserDashboard';
import AdvisorDashboard from './AdvisorDashboard';
import AdminDashboard from './AdminDashboard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  user: User;
}

const Dashboard = ({ user }: DashboardProps) => {
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [amount, setAmount] = useState(10); // Minimum top-up amount
  const { toast } = useToast();
  
  const topUpMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      const res = await apiRequest('POST', '/api/topup', { amount });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setShowTopUpDialog(false);
      toast({
        title: 'Success',
        description: `Your account has been topped up with $${amount}.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to process top-up. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleTopUp = () => {
    if (amount < 10) {
      toast({
        title: 'Invalid amount',
        description: 'Minimum top-up amount is $10.',
        variant: 'destructive',
      });
      return;
    }
    
    topUpMutation.mutate({ amount });
  };

  // Render appropriate dashboard based on user type
  if (user.userType === UserType.ADMIN) {
    return <AdminDashboard user={user} />;
  }
  
  if (user.userType === UserType.ADVISOR || user.isAdvisor) {
    return (
      <>
        <AdvisorDashboard 
          user={user} 
          onWithdraw={() => {}} 
        />
        
        {/* Top-up Dialog (Advisors can still top up their client wallet) */}
        <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Top Up Your Balance</DialogTitle>
              <DialogDescription>
                Add funds to your account to book sessions with other advisors.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min={10}
                step={5}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Minimum amount: $10
              </p>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTopUpDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleTopUp} 
                disabled={topUpMutation.isPending || amount < 10}
              >
                {topUpMutation.isPending ? 'Processing...' : 'Add Funds'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // Default to regular user dashboard
  return (
    <>
      <UserDashboard 
        user={user} 
        onTopUp={() => setShowTopUpDialog(true)} 
      />
      
      {/* Top-up Dialog */}
      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Your Balance</DialogTitle>
            <DialogDescription>
              Add funds to your account to book sessions with advisors.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min={10}
              step={5}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Minimum amount: $10
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTopUpDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTopUp} 
              disabled={topUpMutation.isPending || amount < 10}
            >
              {topUpMutation.isPending ? 'Processing...' : 'Add Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;