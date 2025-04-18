import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReviewForm } from './ReviewForm';
import { useQuery } from '@tanstack/react-query';
import { ReviewList } from './ReviewDisplay';

interface ReviewDialogProps {
  userId: number;
  advisorId: number;
  sessionId: number;
  trigger?: React.ReactNode;
  onReviewSuccess?: () => void;
}

export function ReviewDialog({ userId, advisorId, sessionId, trigger, onReviewSuccess }: ReviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Check if a review for this session already exists
  const { data: existingReview, isLoading, refetch } = useQuery({
    queryKey: ['/api/reviews/session', sessionId],
    enabled: isOpen,
  });
  
  const hasReviewed = existingReview && existingReview.length > 0;
  
  const handleSuccess = () => {
    setHasSubmitted(true);
    refetch();
    if (onReviewSuccess) {
      onReviewSuccess();
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setHasSubmitted(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            {hasReviewed ? 'View Review' : 'Leave a Review'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : hasReviewed || hasSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Your Review</DialogTitle>
              <DialogDescription>
                Thank you for sharing your experience!
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <ReviewList sessionId={sessionId} />
            </div>
          </>
        ) : (
          <ReviewForm
            userId={userId}
            advisorId={advisorId}
            sessionId={sessionId}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}