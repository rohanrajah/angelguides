import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare } from 'lucide-react';
import { Review, Session } from '@shared/schema';
import ReviewForm from './ReviewForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SessionReviewButtonProps {
  session: Session;
  onReviewSubmitted?: () => void;
}

export const SessionReviewButton: React.FC<SessionReviewButtonProps> = ({ 
  session, 
  onReviewSubmitted 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if the user has already reviewed this session
  const { data: existingReview, isLoading } = useQuery<Review>({
    queryKey: ['/api/reviews/session', session.id],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/session/${session.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          return null; // No review exists
        }
        throw new Error('Failed to fetch review');
      }
      return res.json();
    },
  });

  // If the session is not completed, we don't need to show the review option
  if (session.status !== 'completed') {
    return null;
  }

  const handleReviewSuccess = () => {
    setIsDialogOpen(false);
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Star className="h-4 w-4 mr-2 animate-pulse" />
        Checking...
      </Button>
    );
  }

  // If the user has already left a review
  if (existingReview) {
    return (
      <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
        <Star className="h-4 w-4 mr-2 fill-green-500" />
        Reviewed ({existingReview.rating}/5)
      </Button>
    );
  }

  // If no review exists yet, show the option to leave a review
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
          <MessageSquare className="h-4 w-4 mr-2" />
          Leave Review
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Review Your Session</DialogTitle>
          <DialogDescription className="text-center">
            Share your experience with {session.advisorId} to help others find the right advisor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <ReviewForm 
            sessionId={session.id} 
            advisorId={session.advisorId} 
            onSuccess={handleReviewSuccess} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionReviewButton;