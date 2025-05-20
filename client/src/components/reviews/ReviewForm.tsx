import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, StarHalf } from 'lucide-react';

// Create a schema for the review form
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(5, "Please provide feedback with at least 5 characters").max(1000),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  sessionId: number;
  advisorId: number;
  onSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ 
  sessionId, 
  advisorId,
  onSuccess
}) => {
  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up the form
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      content: '',
    },
  });

  // Create a mutation for submitting the review
  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      const response = await apiRequest('POST', '/api/reviews', {
        ...data,
        sessionId,
        advisorId,
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advisors', advisorId] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/session', sessionId] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error submitting review',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ReviewFormValues) => {
    reviewMutation.mutate(data);
  };

  // Handle star rating
  const handleRating = (rating: number) => {
    form.setValue('rating', rating, { shouldValidate: true });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-indigo-800">Rate Your Experience</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center mb-6">
            <FormLabel className="mb-2 text-lg">How was your session?</FormLabel>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={36}
                    className={`
                      ${
                        (hoveredRating !== null ? star <= hoveredRating : star <= form.getValues().rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    `}
                  />
                </button>
              ))}
            </div>
            {form.formState.errors.rating && (
              <p className="text-sm text-red-500 mt-1">Please select a rating</p>
            )}
          </div>

          {/* Review Text */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Review</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your experience with this advisor..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your feedback helps other users find the right advisor
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            disabled={reviewMutation.isPending}
          >
            {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReviewForm;