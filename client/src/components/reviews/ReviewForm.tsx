import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertReviewSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { StarIcon } from "lucide-react";

interface ReviewFormProps {
  userId: number;
  advisorId: number;
  sessionId: number;
  onSuccess?: () => void;
}

const reviewSchema = insertReviewSchema.extend({
  userId: z.number().int().positive(),
  advisorId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10, "Review must be at least 10 characters long").max(1000, "Review must be less than 1000 characters"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewForm({ userId, advisorId, sessionId, onSuccess }: ReviewFormProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      userId,
      advisorId,
      sessionId,
      rating: 0,
      content: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/advisors', advisorId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'reviews'] });
      
      // Reset the form
      form.reset();
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ReviewFormValues) {
    if (data.rating === 0) {
      form.setError("rating", { message: "Please select a rating" });
      return;
    }
    
    mutation.mutate(data);
  }

  const handleStarClick = (rating: number) => {
    form.setValue("rating", rating);
  };

  const rating = form.watch("rating");

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-xl font-semibold mb-4">Leave a Review</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <FormControl>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="focus:outline-none"
                        aria-label={`Rate ${star} stars`}
                      >
                        <StarIcon
                          className={`w-8 h-8 ${
                            (hoveredStar ? star <= hoveredStar : star <= rating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          } transition-colors duration-100`}
                        />
                      </button>
                    ))}
                  </div>
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
                <FormDescription>
                  Your review will help other users choose the right advisor for their needs.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </Form>
    </div>
  );
}