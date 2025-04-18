import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Wallet, ArrowDownLeft, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { User, UserType } from '@shared/schema';

interface WalletCardProps {
  user: User;
  onTopUp?: () => void;
  onWithdraw?: () => void;
  onViewAllTransactions?: () => void;
}

const WalletCard = ({ user, onTopUp, onWithdraw, onViewAllTransactions }: WalletCardProps) => {
  const showTopUp = user.userType !== UserType.ADVISOR;
  const showWithdraw = user.userType === UserType.ADVISOR && (user.earningsBalance || 0) > 0;

  return (
    <Card className="shadow-md w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Wallet className="mr-2 h-5 w-5 text-primary" />
          My Wallet
        </CardTitle>
        <CardDescription>
          Manage your account balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Available Balance</span>
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(user.accountBalance || 0)}
            </span>
          </div>

          {user.userType === UserType.ADVISOR && (
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Earnings Balance</span>
              <span className="text-2xl font-bold text-emerald-600">
                {formatCurrency(user.earningsBalance || 0)}
              </span>
            </div>
          )}

          {user.userType === UserType.ADVISOR && (
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Total Earnings</span>
              <span className="text-xl font-semibold text-emerald-600">
                {formatCurrency(user.totalEarnings || 0)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {showTopUp && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center" 
            onClick={onTopUp}
          >
            <ArrowUpRight className="mr-1 h-4 w-4" />
            Top Up
          </Button>
        )}
        
        {showWithdraw && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center" 
            onClick={onWithdraw}
          >
            <ArrowDownLeft className="mr-1 h-4 w-4" />
            Withdraw
          </Button>
        )}
        
        {user.userType === UserType.ADMIN && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center"
            onClick={onViewAllTransactions}
          >
            <DollarSign className="mr-1 h-4 w-4" />
            View All Transactions
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WalletCard;