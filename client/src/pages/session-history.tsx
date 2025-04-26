import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Session, User } from '@shared/schema';
import { format } from 'date-fns';
import { MessageCircle, PhoneCall, Video, Clock, CheckCircle, Star, XCircle } from 'lucide-react';
import { 
  Card, 
  CardHeader,
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

// Session item component to display a single session
function SessionItem({ session, isAdvisor = false }: { session: Session, isAdvisor?: boolean }) {
  const { toast } = useToast();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Fetch the user or advisor profile data
  const { data: otherParty, isLoading: loadingOtherParty } = useQuery<User>({
    queryKey: [`/api/users/${isAdvisor ? session.userId : session.advisorId}`],
    enabled: !!session,
  });

  // Check if a review exists for this session
  const { data: existingReview, isLoading: checkingReview } = useQuery({
    queryKey: [`/api/reviews/session/${session.id}`],
    enabled: !!session && !isAdvisor, // Only check for reviews if the user is not an advisor
  });

  // Determine if this session has been reviewed already
  const hasReview = existingReview && Array.isArray(existingReview) && existingReview.length > 0;

  // Format session date and time
  const sessionDate = session.startTime ? format(new Date(session.startTime), 'MMMM d, yyyy') : '';
  const sessionTime = session.startTime ? format(new Date(session.startTime), 'h:mm a') : '';
  const sessionDuration = session.endTime && session.startTime 
    ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000) 
    : 0;

  // Helper function to get the session type icon
  const getSessionTypeIcon = () => {
    switch (session.sessionType) {
      case 'chat':
        return <MessageCircle className="h-4 w-4 mr-1" />;
      case 'audio':
        return <PhoneCall className="h-4 w-4 mr-1" />;
      case 'video':
        return <Video className="h-4 w-4 mr-1" />;
      default:
        return <MessageCircle className="h-4 w-4 mr-1" />;
    }
  };

  // Helper function to get status badge
  const getStatusBadge = () => {
    switch (session.status) {
      case 'scheduled':
        return <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200"><Clock className="h-3 w-3 mr-1" /> Scheduled</Badge>;
      case 'active':
        return <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200"><Clock className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={otherParty?.avatar} alt={otherParty?.name} />
              <AvatarFallback>{otherParty?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {loadingOtherParty ? <Skeleton className="h-4 w-24" /> : otherParty?.name}
              </CardTitle>
              <CardDescription>
                {sessionDate} at {sessionTime}
              </CardDescription>
            </div>
          </div>
          <div>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <span className="font-medium mr-2">Type:</span> 
            <div className="flex items-center">
              {getSessionTypeIcon()} 
              <span className="capitalize">{session.sessionType}</span>
            </div>
          </div>
          <div>
            <span className="font-medium mr-2">Duration:</span> {sessionDuration} minutes
          </div>
          <div>
            <span className="font-medium mr-2">Cost:</span> ${session.billedAmount ? (session.billedAmount / 100).toFixed(2) : '0.00'}
          </div>
        </div>
        {session.notes && (
          <div className="mt-4">
            <span className="font-medium">Session Notes:</span>
            <p className="text-sm mt-1">{session.notes}</p>
          </div>
        )}
      </CardContent>
      {!isAdvisor && session.status === 'completed' && (
        <CardFooter className="pt-0 flex justify-end">
          {!hasReview ? (
            <ReviewDialog
              userId={session.userId}
              advisorId={session.advisorId}
              sessionId={session.id}
              trigger={
                <Button 
                  variant="outline" 
                  className="flex items-center"
                >
                  <Star className="h-4 w-4 mr-1" /> Leave Review
                </Button>
              }
            />
          ) : (
            <Button 
              variant="outline" 
              className="flex items-center text-green-600"
              onClick={() => {
                setIsReviewDialogOpen(true);
              }}
            >
              <Star className="h-4 w-4 mr-1 fill-yellow-500 text-yellow-500" /> View Your Review
            </Button>
          )}
        </CardFooter>
      )}
      {isReviewDialogOpen && hasReview && (
        <ReviewDialog
          userId={session.userId}
          advisorId={session.advisorId}
          sessionId={session.id}
          trigger={null}
        />
      )}
    </Card>
  );
}

export default function SessionHistory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('completed');

  // Fetch user's sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<Session[]>({
    queryKey: [`/api/users/${user?.id}/sessions`],
    enabled: !!user?.id,
  });

  // Filter sessions based on status
  const completedSessions = sessions.filter(session => session.status === 'completed');
  const upcomingSessions = sessions.filter(session => session.status === 'scheduled');
  const activeSessions = sessions.filter(session => session.status === 'active');
  const cancelledSessions = sessions.filter(session => session.status === 'cancelled');

  // Sort sessions by date (newest first)
  const sortByDate = (a: Session, b: Session) => {
    const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return dateB - dateA;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Session History</h1>
        
        <Tabs defaultValue="completed" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="completed" className="text-sm">
              Completed ({completedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-sm">
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-sm">
              Active ({activeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-sm">
              Cancelled ({cancelledSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed">
            {loadingSessions ? (
              Array(3).fill(null).map((_, i) => (
                <Card key={i} className="mb-4">
                  <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : completedSessions.length > 0 ? (
              completedSessions.sort(sortByDate).map(session => (
                <SessionItem key={session.id} session={session} />
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No completed sessions yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Once you've had sessions with advisors, they'll appear here, and you'll be able to leave reviews.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {loadingSessions ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ) : upcomingSessions.length > 0 ? (
              upcomingSessions.sort(sortByDate).map(session => (
                <SessionItem key={session.id} session={session} />
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No upcoming sessions</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You don't have any scheduled sessions at the moment. Book a session with an advisor to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active">
            {loadingSessions ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ) : activeSessions.length > 0 ? (
              activeSessions.sort(sortByDate).map(session => (
                <SessionItem key={session.id} session={session} />
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No active sessions</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You don't have any active sessions at the moment. 
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {loadingSessions ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ) : cancelledSessions.length > 0 ? (
              cancelledSessions.sort(sortByDate).map(session => (
                <SessionItem key={session.id} session={session} />
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No cancelled sessions</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You don't have any cancelled sessions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}