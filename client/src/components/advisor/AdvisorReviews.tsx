import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReviewList } from '@/components/reviews/ReviewDisplay';
import { RatingSummary } from '@/components/reviews/RatingSummary';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { Session } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MessageSquare } from 'lucide-react';

interface AdvisorReviewsProps {
  advisorId: number;
  userId?: number;
  className?: string;
}

export function AdvisorReviews({ advisorId, userId, className = '' }: AdvisorReviewsProps) {
  const [activeTab, setActiveTab] = useState('reviews');
  
  // Fetch user's sessions with this advisor if userId is provided
  const { data: sessions = [], isLoading: loadingSessions } = useQuery<Session[]>({
    queryKey: [`/api/users/${userId}/sessions`],
    enabled: !!userId,
  });
  
  // Filter completed sessions with this advisor
  const completedSessions = sessions.filter(
    session => session.advisorId === advisorId && session.status === 'completed'
  );
  
  // Use the latest session for the review
  const latestSession = completedSessions.length > 0 
    ? completedSessions.sort(
        (a, b) => new Date(b.endTime || '').getTime() - new Date(a.endTime || '').getTime()
      )[0] 
    : null;
    
  // Check if user has already reviewed this session
  const { data: existingReview, isLoading: checkingReview } = useQuery({
    queryKey: [`/api/reviews/session/${latestSession?.id}`],
    enabled: !!latestSession,
  });
  
  const hasExistingReview = existingReview && Array.isArray(existingReview) && existingReview.length > 0;
  const canLeaveReview = !!userId && !!latestSession && !hasExistingReview;
  
  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="text-xl">Reviews & Ratings</CardTitle>
              <CardDescription>
                See what others are saying about this advisor
              </CardDescription>
            </div>
            
            {canLeaveReview && (
              <ReviewDialog
                userId={userId}
                advisorId={advisorId}
                sessionId={latestSession.id}
                trigger={
                  <Button className="flex items-center">
                    <Star className="mr-1 h-4 w-4" />
                    Leave a Review
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="reviews" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="reviews" className="flex items-center">
                <MessageSquare className="mr-1 h-4 w-4" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="ratings">
                <Star className="mr-1 h-4 w-4" />
                Rating Summary
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews">
              <ReviewList 
                advisorId={advisorId} 
                limit={3} 
                showViewMore={true}
              />
            </TabsContent>
            
            <TabsContent value="ratings">
              <RatingSummary advisorId={advisorId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}