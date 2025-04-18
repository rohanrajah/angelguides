import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { Star, MessageSquare, ThumbsUp, Flag } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
  avatar?: string;
}

export interface ReviewData {
  id: number;
  userId: number;
  advisorId: number;
  sessionId: number;
  rating: number;
  content: string;
  createdAt: string;
  response?: string;
  responseDate?: string;
  user?: User;
}

interface ReviewItemProps {
  review: ReviewData;
  isAdvisor?: boolean; // Is the viewer the advisor who received this review
  onRespondSuccess?: () => void;
}

export function ReviewItem({ review, isAdvisor, onRespondSuccess }: ReviewItemProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRespond = async () => {
    if (!response.trim()) {
      toast({
        title: 'Response required',
        description: 'Please enter a response before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiRequest('POST', `/api/reviews/${review.id}/response`, { response });
      if (result.ok) {
        toast({
          title: 'Response submitted',
          description: 'Your response has been added to the review',
        });
        setShowResponseForm(false);
        if (onRespondSuccess) {
          onRespondSuccess();
        }
      } else {
        const error = await result.json();
        toast({
          title: 'Failed to submit response',
          description: error.message || 'Please try again later',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded-md space-y-3 bg-card">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {review.user?.avatar ? (
              <img 
                src={review.user.avatar} 
                alt={review.user?.name || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary font-medium">
                {(review.user?.name || 'User').charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium">{review.user?.name || 'Anonymous User'}</div>
            <div className="text-xs text-muted-foreground">
              {review.createdAt && formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
            />
          ))}
        </div>
      </div>

      <div className="text-sm">{review.content}</div>

      {review.response && (
        <div className="mt-3 pl-4 border-l-2 border-primary/30 py-2">
          <div className="text-xs font-medium mb-1">Advisor Response</div>
          <div className="text-sm">{review.response}</div>
          {review.responseDate && (
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(review.responseDate), { addSuffix: true })}
            </div>
          )}
        </div>
      )}

      {isAdvisor && !review.response && (
        <div className="mt-3">
          {showResponseForm ? (
            <div className="space-y-2">
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your response to this review..."
                className="w-full"
                rows={3}
              />
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResponseForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleRespond}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Response'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center"
              onClick={() => setShowResponseForm(true)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Respond to review
            </Button>
          )}
        </div>
      )}

      <div className="flex space-x-2 mt-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <ThumbsUp className="h-3 w-3 mr-1" /> Helpful
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="h-3 w-3 mr-1" /> Report
        </Button>
      </div>
    </div>
  );
}

interface ReviewListProps {
  advisorId?: number;
  userId?: number;
  sessionId?: number;
  limit?: number;
  showViewMore?: boolean;
  isAdvisor?: boolean;
}

export function ReviewList({ 
  advisorId, 
  userId, 
  sessionId, 
  limit = 5, 
  showViewMore = false,
  isAdvisor = false
}: ReviewListProps) {
  const [page, setPage] = useState(1);
  
  // Determine the correct API endpoint based on props
  let queryKey: any[] = ['/api/reviews'];
  if (advisorId) {
    queryKey = ['/api/advisors', advisorId, 'reviews'];
  } else if (userId) {
    queryKey = ['/api/users', userId, 'reviews'];
  } else if (sessionId) {
    queryKey = ['/api/reviews/session', sessionId];
  }
  
  const { data, isLoading, isError, refetch } = useQuery<ReviewData[]>({
    queryKey,
    enabled: !!(advisorId || userId || sessionId),
  });
  
  const reviews = data || [];
  const displayedReviews = limit ? reviews.slice(0, limit * page) : reviews;
  const hasMore = reviews.length > displayedReviews.length;
  
  const handleLoadMore = () => {
    setPage(page + 1);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-md animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-3 bg-gray-100 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Failed to load reviews. Please try again later.</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-6 text-center border rounded-md">
        <p className="text-muted-foreground">No reviews yet. Be the first to share your experience with this advisor!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {displayedReviews.map((review: ReviewData) => (
        <ReviewItem 
          key={review.id} 
          review={review} 
          isAdvisor={isAdvisor}
          onRespondSuccess={refetch as any}
        />
      ))}
      
      {showViewMore && hasMore && (
        <div className="text-center mt-4">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
          >
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}