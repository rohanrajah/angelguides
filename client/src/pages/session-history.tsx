import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calendar, Clock, Video, MessageSquare, Phone } from 'lucide-react';
import SessionReviewButton from '@/components/reviews/SessionReviewButton';
import { Session } from '@shared/schema';

const statusColorMap = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-purple-50 text-purple-700 border-purple-200',
  canceled: 'bg-red-50 text-red-700 border-red-200',
};

const iconMap = {
  chat: <MessageSquare className="h-5 w-5" />,
  audio: <Phone className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
};

interface SessionCardProps {
  session: Session & { advisor?: any };
  onReviewSubmitted?: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onReviewSubmitted }) => {
  const statusClass = statusColorMap[session.status as keyof typeof statusColorMap] || 'bg-gray-50 text-gray-700 border-gray-200';
  const icon = iconMap[session.sessionType as keyof typeof iconMap] || <MessageSquare className="h-5 w-5" />;
  
  // Format date and time
  const formattedDate = format(new Date(session.startTime), 'MMM d, yyyy');
  const formattedStartTime = format(new Date(session.startTime), 'h:mm a');
  const formattedEndTime = format(new Date(session.endTime), 'h:mm a');
  
  // Calculate session cost
  const sessionCost = session.billedAmount ? 
    (session.billedAmount / 100).toFixed(2) : 
    ((Number(session.ratePerMinute) * 60) / 100).toFixed(2);
  
  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge className={`${statusClass} font-medium capitalize`}>
            {session.status}
          </Badge>
          <div className="flex items-center text-gray-500 space-x-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>
        </div>
        <CardTitle className="flex items-center mt-2">
          <div className="flex-shrink-0 mr-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={session.advisor?.avatar || ''} alt={session.advisor?.name || 'Advisor'} />
              <AvatarFallback>{session.advisor?.name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{session.advisor?.name || 'Unknown Advisor'}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <div className="flex items-center mr-3">
                {icon}
                <span className="ml-1 capitalize">{session.sessionType} Session</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{formattedStartTime} - {formattedEndTime}</span>
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-3">
        {session.notes && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Session Notes</h4>
            <p className="text-gray-700">{session.notes}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Rate</h4>
            <p className="text-gray-900">${(session.ratePerMinute / 100).toFixed(2)}/min</p>
          </div>
          {session.actualDuration && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Duration</h4>
              <p className="text-gray-900">{session.actualDuration} minutes</p>
            </div>
          )}
          {session.billedAmount && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Total</h4>
              <p className="text-gray-900">${(session.billedAmount / 100).toFixed(2)}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-3 flex justify-between">
        <div className="flex space-x-2">
          {session.status === 'scheduled' && (
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
              Cancel Session
            </Button>
          )}
        </div>
        
        <SessionReviewButton 
          session={session} 
          onReviewSubmitted={onReviewSubmitted}
        />
      </CardFooter>
    </Card>
  );
};

const SessionHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Force refresh when a review is submitted
  const handleReviewSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Fetch user sessions
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['/api/users', user?.id, 'sessions', refreshTrigger],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/users/${user.id}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Filter sessions by status
  const upcomingSessions = sessions?.filter((session: Session) => 
    session.status === 'scheduled'
  ) || [];
  
  const pastSessions = sessions?.filter((session: Session) => 
    session.status === 'completed' || session.status === 'canceled'
  ) || [];
  
  const ongoingSessions = sessions?.filter((session: Session) => 
    session.status === 'in_progress'
  ) || [];
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-10">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Sessions</h2>
          <p className="text-red-600">{error.message}</p>
          <Button 
            onClick={() => setRefreshTrigger(prev => prev + 1)} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Session History</h1>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="upcoming">
            Upcoming
            {upcomingSessions.length > 0 && (
              <Badge className="ml-2 bg-blue-500">{upcomingSessions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ongoing">
            Ongoing
            {ongoingSessions.length > 0 && (
              <Badge className="ml-2 bg-green-500">{ongoingSessions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Sessions
            {pastSessions.length > 0 && (
              <Badge className="ml-2 bg-purple-500">{pastSessions.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Upcoming Sessions</h3>
              <p className="text-gray-500 mb-6">You don't have any upcoming sessions scheduled.</p>
              <Button>Book a Session</Button>
            </div>
          ) : (
            <div>
              {upcomingSessions.map((session: Session) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  onReviewSubmitted={handleReviewSubmitted}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ongoing">
          {ongoingSessions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Ongoing Sessions</h3>
              <p className="text-gray-500">You don't have any sessions in progress.</p>
            </div>
          ) : (
            <div>
              {ongoingSessions.map((session: Session) => (
                <SessionCard 
                  key={session.id} 
                  session={session}
                  onReviewSubmitted={handleReviewSubmitted} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {pastSessions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Past Sessions</h3>
              <p className="text-gray-500">You don't have any completed or canceled sessions.</p>
            </div>
          ) : (
            <div>
              {pastSessions.map((session: Session) => (
                <SessionCard 
                  key={session.id} 
                  session={session}
                  onReviewSubmitted={handleReviewSubmitted} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionHistoryPage;