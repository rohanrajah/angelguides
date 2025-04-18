import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Star } from 'lucide-react';

// Define the review schema with validation
const reviewSchema = z.object({
  rating: z.coerce.number().min(1, "Rating is required").max(5),
  content: z.string().min(10, "Review must be at least 10 characters").max(500, "Review must be less than 500 characters"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  userId: number;
  advisorId: number;
  sessionId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ userId, advisorId, sessionId, onSuccess, onCancel }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Initialize the form with default values
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      content: '',
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: ReviewFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/reviews', {
        userId,
        advisorId,
        sessionId,
        rating: values.rating,
        content: values.content,
      });
      
      if (response.ok) {
        toast({
          title: 'Review submitted',
          description: 'Thank you for sharing your experience!',
        });
        
        // Invalidate related queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/advisors', advisorId] });
        queryClient.invalidateQueries({ queryKey: ['/api/advisors', advisorId, 'reviews'] });
        queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'reviews'] });
        queryClient.invalidateQueries({ queryKey: ['/api/reviews/session', sessionId] });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        toast({
          title: 'Failed to submit review',
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rate Your Session</CardTitle>
        <CardDescription>Share your experience with this advisor</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value.toString()}
                      className="flex space-x-1"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <FormItem key={rating} className="flex items-center space-x-0">
                          <FormControl>
                            <RadioGroupItem 
                              value={rating.toString()} 
                              id={`rating-${rating}`} 
                              className="sr-only"
                            />
                          </FormControl>
                          <label
                            htmlFor={`rating-${rating}`}
                            className={`cursor-pointer p-1 ${
                              parseInt(field.value.toString()) >= rating
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          >
                            <Star className="h-8 w-8 fill-current" />
                          </label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your experience with this advisor..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </CardFooter>
    </Card>
  );
}