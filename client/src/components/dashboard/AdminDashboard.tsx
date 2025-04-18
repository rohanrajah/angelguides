import React, { useState } from 'react';
import { User, UserType, Transaction } from '@shared/schema';
import WalletCard from './WalletCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, BarChart3, UserPlus, Settings, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions'],
  });

  const { data: advisors, isLoading: isLoadingAdvisors } = useQuery<User[]>({
    queryKey: ['/api/admin/advisors'],
  });

  const { data: regularUsers, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });
  
  const { data: pendingPayouts, isLoading: isLoadingPayouts } = useQuery<any[]>({
    queryKey: ['/api/admin/pending-payouts'],
  });

  const completePayoutMutation = useMutation({
    mutationFn: async ({ advisorId }: { advisorId: number }) => {
      const res = await apiRequest('POST', `/api/admin/complete-payout/${advisorId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
    },
  });

  // Get summary data
  const totalUsers = (regularUsers?.length || 0) + (advisors?.length || 0);
  const totalRevenue = transactions
    ?.filter(t => t.type === 'session_payment')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const pendingPayoutsTotal = pendingPayouts
    ?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <h3 className="text-2xl font-bold">{totalUsers}</h3>
              </div>
              <Users className="h-8 w-8 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalRevenue)}</h3>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600 opacity-70" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Advisors</p>
                <h3 className="text-2xl font-bold">{advisors?.length || 0}</h3>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-600 opacity-70" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Payouts</p>
                <h3 className="text-2xl font-bold">{formatCurrency(pendingPayoutsTotal)}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="payouts" className="mt-6">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>
        
        {/* Pending Payouts Tab */}
        <TabsContent value="payouts">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Pending Advisor Payouts</CardTitle>
              <CardDescription>Process advisor payout requests</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPayouts ? (
                <div className="text-center py-4">Loading payouts...</div>
              ) : pendingPayouts && pendingPayouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Advisor</TableHead>
                      <TableHead>Payout Amount</TableHead>
                      <TableHead>Requested Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayouts.map(payout => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">{payout.advisorName}</TableCell>
                        <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        <TableCell>{new Date(payout.requestDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Pending</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => completePayoutMutation.mutate({ advisorId: payout.advisorId })}
                            disabled={completePayoutMutation.isPending}
                          >
                            Complete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No pending payouts at this time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* User Management Tab */}
        <TabsContent value="users">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
              </div>
              <Button className="flex items-center">
                <UserPlus className="mr-1 h-4 w-4" />
                New User
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingUsers || isLoadingAdvisors ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(regularUsers || []), ...(advisors || [])].slice(0, 5).map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.userType === UserType.ADVISOR ? 'default' : 'secondary'}>
                            {user.userType === UserType.ADVISOR ? 'Advisor' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.online ? 'success' : 'outline'}>
                            {user.online ? 'Online' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/admin/user/${user.id}`}>
                              <Settings className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/users">View All Users</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Platform financial activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="text-center py-4">Loading transactions...</div>
              ) : transactions && transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 5).map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">#{transaction.id}</TableCell>
                        <TableCell>{transaction.userName || transaction.userId}</TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.type === 'user_topup' 
                              ? 'default' 
                              : transaction.type === 'advisor_payout' 
                                ? 'destructive' 
                                : 'secondary'
                          }>
                            {transaction.type === 'user_topup' 
                              ? 'Top Up' 
                              : transaction.type === 'advisor_payout' 
                                ? 'Payout' 
                                : 'Session Payment'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.paymentStatus === 'completed' 
                              ? 'success' 
                              : transaction.paymentStatus === 'pending' 
                                ? 'outline' 
                                : 'destructive'
                          }>
                            {transaction.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(transaction.timestamp).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No transactions found.</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/transactions">View All Transactions</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;