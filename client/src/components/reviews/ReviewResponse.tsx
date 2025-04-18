import { useState } from "react";
import { Review } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface ReviewResponseProps {
  review: Review;
  advisorId: number;
  onSuccess?: () => void;
}

const responseSchema = z.object({
  response: z.string().min(10, "Response must be at least 10 characters long").max(1000, "Response must be less than 1000 characters"),
  advisorId: z.number().int().positive(),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

export function ReviewResponse({ review, advisorId, onSuccess }: ReviewResponseProps) {
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "",
      advisorId,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ResponseFormValues) => {
      const response = await apiRequest("POST", `/api/reviews/${review.id}/response`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Response submitted",
        description: "Your response to the review has been submitted.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/advisors', advisorId, 'reviews'] });
      
      // Reset the form and close response UI
      form.reset();
      setIsResponding(false);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ResponseFormValues) {
    mutation.mutate(data);
  }

  // If the review already has a response, show it
  if (review.response) {
    return (
      <Card className="mb-4 border-green-200 bg-green-50/30 dark:bg-green-900/10">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">Your Response</h4>
              <p className="text-xs text-muted-foreground">
                {review.responseDate
                  ? formatDistanceToNow(new Date(review.responseDate), { addSuffix: true })
                  : ""}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{review.response}</p>
        </CardContent>
      </Card>
    );
  }

  // If the user isn't responding yet, show a button to start responding
  if (!isResponding) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">Client Review</h4>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{review.content}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => setIsResponding(true)}
          >
            Respond to Review
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show the response form
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">Client Review</h4>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{review.content}</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="response"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Response</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your response to this review..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your response will be visible to all users. Be professional and helpful.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-2 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsResponding(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Submitting..." : "Submit Response"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}