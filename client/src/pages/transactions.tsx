import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TransactionList } from '@/components/transactions/TransactionList';
import { PayoutRequestButton } from '@/components/transactions/PayoutRequestButton';
import { TopUpDialog } from '@/components/transactions/TopUpDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export default function TransactionsPage() {
  // Get current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/me'],
  });

  // Get user's balance
  const queryClient = useQueryClient();
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['/api/users', user?.id, 'balance'],
    enabled: !!user?.id,
  });
  
  // Function to refresh balances after a transaction
  const refreshBalances = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'transactions'] });
    }
  };
  
  if (userLoading || balanceLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-48 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
        <div className="h-96 bg-muted rounded"></div>
      </div>
    );
  }

  const isAdvisor = user?.userType === 'advisor';
  
  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">
        {isAdvisor ? 'Earnings & Payouts' : 'Account & Transactions'}
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle>{isAdvisor ? 'Earnings Balance' : 'Account Balance'}</CardTitle>
            <CardDescription>
              {isAdvisor 
                ? 'Your current earnings available for payout' 
                : 'Your current account balance'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {isAdvisor 
                ? formatCurrency(user?.earningsBalance || 0) 
                : formatCurrency(balanceData?.balance || 0)
              }
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {isAdvisor 
                ? 'Request a payout when you\'re ready to withdraw your earnings' 
                : 'Top up your account to book sessions with advisors'
              }
            </p>
            {isAdvisor ? (
              <PayoutRequestButton 
                advisorId={user?.id || 0}
                balance={user?.earningsBalance || 0}
                isPending={user?.pendingPayout || false}
              />
            ) : (
              <TopUpDialog 
                userId={user?.id || 0}
                onSuccess={refreshBalances}
              />
            )}
          </CardFooter>
        </Card>

        {/* Additional Stats */}
        {isAdvisor ? (
          <Card>
            <CardHeader>
              <CardTitle>Earnings Stats</CardTitle>
              <CardDescription>Your lifetime earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Earnings</span>
                  <span className="font-medium">{formatCurrency(user?.totalEarnings || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Sessions</span>
                  <span className="font-medium">{user?.completedSessions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payout Status</span>
                  <span className={`font-medium ${user?.pendingPayout ? 'text-yellow-500' : 'text-green-500'}`}>
                    {user?.pendingPayout ? 'Pending' : 'Available'}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Payouts are typically processed within 2-3 business days
              </p>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>Your account statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Sessions</span>
                  <span className="font-medium">{user?.sessionCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Upcoming Sessions</span>
                  <span className="font-medium">{user?.upcomingSessions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advisor Reviews</span>
                  <span className="font-medium">{user?.reviewCount || 0}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Book a session with an advisor to get started
              </p>
            </CardFooter>
          </Card>
        )}
      </div>

      {isAdvisor ? (
        <Tabs defaultValue="transactions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            <TabsTrigger value="sessions">Completed Sessions</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className="mt-4">
            <TransactionList
              userId={user?.id}
              title="Payment History"
              description="All your earnings and payouts"
              isAdvisor={true}
              showAll={true}
            />
          </TabsContent>
          <TabsContent value="sessions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Sessions</CardTitle>
                <CardDescription>Sessions you've conducted with clients</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Sessions list would go here */}
                <p className="text-center text-muted-foreground py-6">
                  This feature is coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <TransactionList
          userId={user?.id}
          title="Transaction History"
          description="Your recent account activity"
          showAll={true}
        />
      )}
    </div>
  );
}