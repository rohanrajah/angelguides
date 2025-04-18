import React from 'react';
import { User, UserType } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, DollarSign, ArrowUpRight, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface WalletCardProps {
  user: User;
  onTopUp?: () => void;
  onWithdraw?: () => void;
}

const WalletCard = ({ user, onTopUp, onWithdraw }: WalletCardProps) => {
  const isAdvisor = user.userType === UserType.ADVISOR || user.isAdvisor;
  const isAdmin = user.userType === UserType.ADMIN;
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          <Wallet className="mr-2 h-5 w-5 text-primary" />
          {isAdvisor ? 'Your Earnings' : 'Your Wallet'}
        </CardTitle>
        <CardDescription>
          {isAdvisor 
            ? 'Track your earnings and request payouts' 
            : 'Manage your account balance'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="flex flex-col space-y-4">
          <div className="rounded-lg bg-neutral-50 p-4">
            <p className="text-sm text-muted-foreground mb-1">
              {isAdvisor ? 'Available for Withdrawal' : 'Current Balance'}
            </p>
            <h3 className="text-3xl font-bold text-primary">
              {isAdvisor 
                ? formatCurrency(user.earningsBalance || 0)
                : formatCurrency(user.accountBalance || 0)}
            </h3>
          </div>

          {isAdvisor && (
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Earnings</span>
                <span className="font-medium">{formatCurrency(user.totalEarnings || 0)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Pending Payout</span>
                <span className={`font-medium ${user.pendingPayout ? 'text-amber-500' : ''}`}>
                  {user.pendingPayout ? 'In Progress' : 'None'}
                </span>
              </div>
            </div>
          )}
          
          {!isAdvisor && !isAdmin && (
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Top-up</span>
                <span className="font-medium">
                  {/* We'll fetch this data from transactions later */}
                  None
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Spent this month</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
            </div>
          )}
          
          {isAdmin && (
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">System Balance</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Pending Payouts</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        {isAdvisor ? (
          <Button 
            onClick={onWithdraw} 
            className="w-full" 
            disabled={!(user.earningsBalance && user.earningsBalance > 0) || !!user.pendingPayout}
          >
            <ArrowUpRight className="mr-1 h-4 w-4" />
            {user.pendingPayout ? 'Payout In Progress' : 'Request Payout'}
          </Button>
        ) : (
          <Button 
            onClick={onTopUp} 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <CreditCard className="mr-1 h-4 w-4" />
            Add Funds
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WalletCard;