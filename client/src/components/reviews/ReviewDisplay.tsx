import { useQuery } from "@tanstack/react-query";
import { Review, User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

interface ReviewDisplayProps {
  advisorId: number;
}

export function ReviewDisplay({ advisorId }: ReviewDisplayProps) {
  const { data: reviews = [], isLoading, error } = useQuery<Review[]>({
    queryKey: ['/api/advisors', advisorId, 'reviews'],
    enabled: !!advisorId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load reviews. Please try again later.
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No reviews yet. Be the first to leave a review!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-2xl font-semibold">Client Reviews</h3>
        <Badge variant="outline" className="rounded-full">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </Badge>
      </div>

      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  // Format the review date
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="font-semibold">Anonymous Client</div>
            <div className="text-sm text-muted-foreground">{formattedDate}</div>
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
      {review.response && (
        <>
          <Separator />
          <CardFooter className="pt-4">
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold">Advisor Response</div>
                <div className="text-xs text-muted-foreground">
                  {review.responseDate
                    ? formatDistanceToNow(new Date(review.responseDate), { addSuffix: true })
                    : ""}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{review.response}</p>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}