import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, User, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Review } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReviewsListProps {
  advisorId: number;
  isAdvisor?: boolean; // To determine if the current user is viewing their own reviews
  showResponseForm?: boolean; // Only show response form to advisors
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ 
  advisorId,
  isAdvisor = false,
  showResponseForm = false
}) => {
  const [responseText, setResponseText] = React.useState('');
  const [activeReviewId, setActiveReviewId] = React.useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch reviews for this advisor
  const { data: reviews, isLoading, error } = useQuery<Review[]>({
    queryKey: ['/api/advisors', advisorId, 'reviews'],
    queryFn: async () => {
      const res = await fetch(`/api/advisors/${advisorId}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
  });

  // Mutation for submitting a response to a review
  const responseMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: number, response: string }) => {
      const res = await apiRequest('POST', `/api/reviews/${reviewId}/response`, { response });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Response submitted',
        description: 'Your response has been added to the review',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/advisors', advisorId, 'reviews'] });
      setResponseText('');
      setActiveReviewId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error submitting response',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  // Handle submitting a response
  const handleSubmitResponse = (reviewId: number) => {
    if (!responseText.trim()) {
      toast({
        title: 'Please enter a response',
        variant: 'destructive',
      });
      return;
    }
    
    responseMutation.mutate({
      reviewId,
      response: responseText
    });
  };

  // Show a loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  // Show an error state
  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-500">Error loading reviews: {error.message}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/advisors', advisorId, 'reviews'] })}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Show empty state if no reviews
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold mb-2">No Reviews Yet</h2>
        <p className="text-gray-500">
          {isAdvisor 
            ? "You haven't received any reviews yet." 
            : "This advisor hasn't received any reviews yet."}
        </p>
      </div>
    );
  }

  // Render the reviews list
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Client Reviews</h2>
        <div className="flex items-center">
          <div className="flex items-center mr-2">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
            <span className="font-semibold">
              {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)}
            </span>
          </div>
          <span className="text-gray-500">({reviews.length} reviews)</span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6 bg-white border-gray-200">
            <div className="flex justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-indigo-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold">Client</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">{review.content}</p>
            
            {review.response && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center mb-2">
                  <MessageSquare className="h-4 w-4 mr-2 text-indigo-600" />
                  <span className="font-semibold text-indigo-800">Advisor Response</span>
                </div>
                <p className="text-gray-700">{review.response}</p>
                <div className="text-sm text-gray-500 mt-2">
                  {review.responseDate && formatDistanceToNow(new Date(review.responseDate), { addSuffix: true })}
                </div>
              </div>
            )}
            
            {isAdvisor && showResponseForm && !review.response && (
              <div className="mt-4">
                {activeReviewId === review.id ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Write your response to this review..."
                      className="w-full resize-none"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleSubmitResponse(review.id)}
                        disabled={responseMutation.isPending}
                      >
                        {responseMutation.isPending ? 'Submitting...' : 'Submit Response'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setActiveReviewId(null);
                          setResponseText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => setActiveReviewId(review.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Respond to Review
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewsList;