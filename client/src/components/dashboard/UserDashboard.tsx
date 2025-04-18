import React from 'react';
import { User, Session } from '@shared/schema';
import WalletCard from './WalletCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Star, MessageSquare } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface UserDashboardProps {
  user: User;
  onTopUp: () => void;
}

const UserDashboard = ({ user, onTopUp }: UserDashboardProps) => {
  // Fetch user's upcoming sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: [`/api/users/${user.id}/sessions`],
  });

  // Fetch user's favorite advisors
  const { data: favoriteAdvisors, isLoading: isLoadingFavorites } = useQuery<User[]>({
    queryKey: [`/api/users/${user.id}/favorites`],
  });

  // Get upcoming sessions (limit to 3)
  const upcomingSessions = sessions
    ?.filter(session => session.status === 'scheduled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3) || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Welcome back, {user.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <div className="md:col-span-1">
          <WalletCard user={user} onTopUp={onTopUp} />
        </div>
        
        {/* Recent Activity */}
        <Card className="md:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions and sessions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <Calendar className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">{sessions?.length || 0}</span>
              <span className="text-sm text-muted-foreground">Total Sessions</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <Star className="h-8 w-8 text-amber-500 mb-2" />
              <span className="text-2xl font-bold">{favoriteAdvisors?.length || 0}</span>
              <span className="text-sm text-muted-foreground">Favorite Advisors</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-2xl font-bold">0</span>
              <span className="text-sm text-muted-foreground">Unread Messages</span>
            </div>
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
                const formattedDate = format(sessionDate, 'MMMM d, yyyy');
                const formattedTime = format(sessionDate, 'h:mm a');
                
                return (
                  <div key={session.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Session with Advisor #{session.advisorId}</h3>
                      <div className="text-sm text-muted-foreground">{formattedDate} at {formattedTime}</div>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline">
                          {session.status === 'scheduled' ? 'Upcoming' : 
                           session.status === 'in_progress' ? 'In Progress' : 
                           'Completed'}
                        </Badge>
                        <span className="ml-2 text-sm text-muted-foreground">{session.sessionType}</span>
                      </div>
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
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/bookings">View All Sessions</Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Recommended Advisors */}
      <Card className="mt-6 shadow-md">
        <CardHeader>
          <CardTitle>Recommended Advisors</CardTitle>
          <CardDescription>Based on your preferences and past sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoadingFavorites ? (
              <div className="text-center py-4 col-span-2">Loading advisors...</div>
            ) : favoriteAdvisors && favoriteAdvisors.length > 0 ? (
              favoriteAdvisors.slice(0, 4).map(advisor => (
                <div key={advisor.id} className="border rounded-lg p-4 flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {advisor.avatar ? (
                      <img src={advisor.avatar} alt={advisor.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-primary font-semibold">{advisor.name.split(' ').map(n => n[0]).join('')}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{advisor.name}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-3 w-3 text-amber-500 mr-1" />
                      <span>{advisor.rating || 0}/5</span>
                      <span className="mx-2">•</span>
                      <span>{advisor.specialty || 'Spiritual Advisor'}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/advisors/${advisor.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground col-span-2">
                <p>No recommended advisors yet. Start booking sessions to get personalized recommendations.</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/advisors">Browse All Advisors</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserDashboard;