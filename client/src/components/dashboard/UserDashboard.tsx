import React from 'react';
import { User, UserType, Session } from '@shared/schema';
import WalletCard from './WalletCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Search, Star, History } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface UserDashboardProps {
  user: User;
  onTopUp: () => void;
}

const UserDashboard = ({ user, onTopUp }: UserDashboardProps) => {
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: [`/api/users/${user.id}/sessions`],
  });

  const upcomingSessions = sessions?.filter(session => 
    session.status === 'scheduled' && new Date(session.startTime) > new Date()
  ).slice(0, 3) || [];

  // Get the current time in user's timezone
  const now = new Date();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Welcome back, {user.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <div className="md:col-span-1">
          <WalletCard user={user} onTopUp={onTopUp} />
        </div>
        
        {/* Quick Actions */}
        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Things you can do right now</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2" asChild>
              <Link href="/advisors">
                <Search className="h-6 w-6 text-primary" />
                <span>Find an Advisor</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2" asChild>
              <Link href="/bookings">
                <Calendar className="h-6 w-6 text-primary" />
                <span>Schedule a Session</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2" asChild>
              <Link href="/messages">
                <History className="h-6 w-6 text-primary" />
                <span>Past Sessions</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Sessions */}
      <Card className="mt-6 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
          <CardDescription>Your scheduled sessions with advisors</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="text-center py-4">Loading sessions...</div>
          ) : upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map(session => {
                const sessionDate = new Date(session.startTime);
                const formattedDate = sessionDate.toLocaleDateString();
                const formattedTime = sessionDate.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                return (
                  <div key={session.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Session with {session.advisorName || 'Advisor'}</h3>
                      <div className="text-sm text-muted-foreground">{formattedDate} at {formattedTime}</div>
                      <Badge variant={
                        sessionDate.getTime() - now.getTime() < 1000 * 60 * 30 ? 'destructive' : 'outline'
                      }>
                        {sessionDate.getTime() - now.getTime() < 1000 * 60 * 30 
                          ? 'Starting Soon' 
                          : 'Scheduled'}
                      </Badge>
                    </div>
                    <Button asChild>
                      <Link href={`/session/${session.id}`}>
                        Join
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No upcoming sessions scheduled.</p>
              <Button className="mt-2" asChild>
                <Link href="/advisors">Find an Advisor</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;