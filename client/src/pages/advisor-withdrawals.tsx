import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  BarChartIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  DollarSignIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingIcon, // Replacing BankIcon
  CreditCardIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdvisorWithdrawals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // Fetch advisor earnings data
  const { data: earningsData, isLoading } = useQuery({
    queryKey: [`/api/advisors/${user?.id}/earnings`],
    enabled: !!user?.id && user?.userType === "ADVISOR",
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST", 
        `/api/advisors/${user?.id}/request-payout`
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${user?.id}/earnings`] });
      setShowRequestDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Request Failed",
        description: error.message || "There was an error requesting your payout.",
        variant: "destructive",
      });
    },
  });

  const handleRequestPayout = () => {
    requestPayoutMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  // Format currency amounts
  const availableBalance = ((earningsData?.earningsBalance || 0) / 100).toFixed(2);
  const totalEarnings = ((earningsData?.totalEarnings || 0) / 100).toFixed(2);
  const pendingPayout = earningsData?.pendingPayout;

  // Filter transactions for withdrawals only
  const withdrawalTransactions = (earningsData?.transactions || [])
    .filter(tx => tx.type === "ADVISOR_PAYOUT")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Withdrawals</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSignIcon className="h-5 w-5 mr-2 text-green-600" />
              <span className="text-3xl font-bold">${availableBalance}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Amount available for withdrawal
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => setShowRequestDialog(true)}
              disabled={
                earningsData?.earningsBalance <= 0 || 
                earningsData?.pendingPayout ||
                requestPayoutMutation.isPending
              }
            >
              {requestPayoutMutation.isPending ? (
                <>Processing...</>
              ) : pendingPayout ? (
                <>Payout Pending</>
              ) : (
                <>Request Payout</>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChartIcon className="h-5 w-5 mr-2 text-blue-600" />
              <span className="text-3xl font-bold">${totalEarnings}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Lifetime earnings on AngelGuides.ai
            </p>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <div className="flex justify-between mb-1 text-sm">
                <span>Completion Rate</span>
                <span>98%</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-muted-foreground">Payout Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {pendingPayout ? (
                <>
                  <ClockIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  <span className="text-xl font-medium">Payout Pending</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  <span className="text-xl font-medium">Ready for Withdrawal</span>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {pendingPayout 
                ? "Your payout request is being processed" 
                : "You can request a payout at any time"}
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <BuildingIcon className="h-4 w-4" />
              <span>Payment will be sent to your registered payout method</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>
            All your previous withdrawal requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You haven't made any withdrawal requests yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono">#{transaction.id}</TableCell>
                    <TableCell>${(transaction.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.paymentStatus === "completed" ? "success" :
                          transaction.paymentStatus === "pending" ? "warning" :
                          "destructive"
                        }
                      >
                        {transaction.paymentStatus === "completed" ? "Completed" :
                         transaction.paymentStatus === "pending" ? "Processing" :
                         "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center">
                      <BuildingIcon className="h-4 w-4 mr-2" />
                      Bank Transfer
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout Methods</CardTitle>
          <CardDescription>
            Manage your connected payout options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                <BuildingIcon className="h-5 w-5 mr-3" />
                <div>
                  <h3 className="font-medium">Bank Account (Primary)</h3>
                  <p className="text-sm text-muted-foreground">••••1234 - Example Bank</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div className="flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-3" />
                <div>
                  <h3 className="font-medium">Credit Card</h3>
                  <p className="text-sm text-muted-foreground">Visa ending in ••••5678</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
            
            <Button variant="ghost" className="justify-start">
              <span className="mr-2">+</span> Add New Payout Method
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Payout</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to request a payout of ${availableBalance}. This process usually takes 2-3 business days to complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRequestPayout}
              disabled={requestPayoutMutation.isPending}
            >
              {requestPayoutMutation.isPending ? "Processing..." : "Confirm Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}