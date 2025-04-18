import React, { useState } from 'react';
import { User, UserType, Session } from '@shared/schema';
import WalletCard from './WalletCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Star, DollarSign, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

interface AdvisorDashboardProps {
  user: User;
  onWithdraw: () => void;
}

const AdvisorDashboard = ({ user, onWithdraw }: AdvisorDashboardProps) => {
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: [`/api/advisors/${user.id}/sessions`],
  });

  const { data: earnings } = useQuery({
    queryKey: [`/api/advisors/${user.id}/earnings`],
  });

  const todaySessions = sessions?.filter(session => {
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    return sessionDate.getDate() === today.getDate() &&
           sessionDate.getMonth() === today.getMonth() &&
           sessionDate.getFullYear() === today.getFullYear();
  }).slice(0, 3) || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ online }: { online: boolean }) => {
      const res = await apiRequest('PATCH', `/api/advisors/${user.id}/status`, { online });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    },
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/advisors/${user.id}/request-payout`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.invalidateQueries({ queryKey: [`/api/advisors/${user.id}/earnings`] });
      setShowWithdrawDialog(false);
    },
  });

  const toggleStatus = () => {
    updateStatusMutation.mutate({ online: !user.online });
  };

  const handleRequestPayout = () => {
    requestPayoutMutation.mutate();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user.name}</h1>
        
        <div className="flex items-center space-x-4 mt-3 md:mt-0">
          <Badge variant={user.online ? "success" : "secondary"} className="py-1 px-3">
            {user.online ? "Online" : "Offline"}
          </Badge>
          
          <Button 
            variant={user.online ? "outline" : "default"}
            size="sm"
            onClick={toggleStatus}
            disabled={updateStatusMutation.isPending}
            className="flex items-center"
          >
            {user.online ? (
              <>
                <ToggleRight className="mr-1 h-4 w-4" />
                Go Offline
              </>
            ) : (
              <>
                <ToggleLeft className="mr-1 h-4 w-4" />
                Go Online
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <div className="md:col-span-1">
          <WalletCard 
            user={user} 
            onWithdraw={() => setShowWithdrawDialog(true)} 
          />
        </div>
        
        {/* Performance Stats */}
        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
            <CardDescription>Key metrics and stats</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <Star className="h-8 w-8 text-amber-500 mb-2" />
              <span className="text-2xl font-bold">{user.rating || 0}/5</span>
              <span className="text-sm text-muted-foreground">Average Rating</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">{user.reviewCount || 0}</span>
              <span className="text-sm text-muted-foreground">Total Reviews</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <Calendar className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-2xl font-bold">{sessions?.length || 0}</span>
              <span className="text-sm text-muted-foreground">Total Sessions</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Today's Schedule */}
      <Card className="mt-6 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>Your sessions for today</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="text-center py-4">Loading sessions...</div>
          ) : todaySessions.length > 0 ? (
            <div className="space-y-4">
              {todaySessions.map(session => {
                const sessionDate = new Date(session.startTime);
                const formattedTime = sessionDate.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div key={session.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Session with {session.userName || 'Client'}</h3>
                      <div className="text-sm text-muted-foreground">Today at {formattedTime}</div>
                      <div className="flex items-center mt-1">
                        <Badge variant={session.status === 'in_progress' ? 'default' : 'outline'}>
                          {session.status === 'scheduled' ? 'Upcoming' : 
                           session.status === 'in_progress' ? 'In Progress' : 
                           'Completed'}
                        </Badge>
                        <span className="ml-2 text-sm text-muted-foreground">{session.sessionType}</span>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/session/${session.id}`}>
                        {session.status === 'scheduled' ? 'Start' : 
                         session.status === 'in_progress' ? 'Continue' : 
                         'View'}
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No sessions scheduled for today.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/bookings">View All Sessions</Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Update Profile Reminder */}
      <Card className="mt-6 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Edit className="mr-2 h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Keep your profile up to date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Make sure your profile is complete to attract more clients.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center p-3 border rounded-lg">
              <p className="text-sm"><strong>Availability:</strong> {user.availability || 'Not set'}</p>
            </div>
            <div className="flex items-center p-3 border rounded-lg">
              <p className="text-sm"><strong>Chat Rate:</strong> {formatCurrency((user.chatRate || 0) * 60)}/hr</p>
            </div>
            <div className="flex items-center p-3 border rounded-lg">
              <p className="text-sm"><strong>Video Rate:</strong> {formatCurrency((user.videoRate || 0) * 60)}/hr</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/profile">Update Profile</Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Earnings</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>You are about to request a payout of your available earnings.</p>
            
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Available for withdrawal:</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(user.earningsBalance || 0)}
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Once requested, our team will process your payout within 1-3 business days.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWithdrawDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleRequestPayout}
              disabled={requestPayoutMutation.isPending || (user.earningsBalance || 0) <= 0}
            >
              <DollarSign className="mr-1 h-4 w-4" />
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvisorDashboard;