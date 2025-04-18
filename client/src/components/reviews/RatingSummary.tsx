import { StarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Review } from "@shared/schema";

interface RatingSummaryProps {
  advisorId: number;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function RatingSummary({
  advisorId,
  reviews,
  averageRating,
  totalReviews,
}: RatingSummaryProps) {
  // Calculate rating distribution
  const ratingCounts = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  // Count ratings by star level
  reviews.forEach((review) => {
    const rating = review.rating;
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating as keyof typeof ratingCounts]++;
    }
  });

  // Calculate percentages for the progress bars
  const ratingPercentages = Object.keys(ratingCounts).reduce((acc, key) => {
    const numKey = parseInt(key);
    acc[numKey] = totalReviews > 0 
      ? Math.round((ratingCounts[numKey as keyof typeof ratingCounts] / totalReviews) * 100) 
      : 0;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="flex items-center mt-2 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>

        <div className="flex-1 max-w-md space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <div className="flex items-center min-w-[60px]">
                <span className="text-sm font-medium">{rating}</span>
                <StarIcon className="w-4 h-4 ml-1 text-yellow-500 fill-yellow-500" />
              </div>
              <Progress value={ratingPercentages[rating]} className="h-2" />
              <div className="text-sm text-muted-foreground min-w-[40px]">
                {ratingPercentages[rating]}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}