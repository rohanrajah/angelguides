import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

interface RatingSummaryProps {
  advisorId: number;
}

export function RatingSummary({ advisorId }: RatingSummaryProps) {
  // Fetch reviews for this advisor
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['/api/advisors', advisorId, 'reviews'],
    enabled: !!advisorId,
  });
  
  // Fetch advisor data to get overall rating
  const { data: advisor, isLoading: advisorLoading } = useQuery({
    queryKey: ['/api/advisors', advisorId],
    enabled: !!advisorId,
  });
  
  if (isLoading || advisorLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex space-x-2 items-center">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-4 border rounded text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to review this advisor!
      </div>
    );
  }
  
  // Calculate rating distribution
  const ratingCounts = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  
  reviews.forEach((review: any) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating]++;
    }
  });
  
  const totalReviews = reviews.length;
  const averageRating = advisor?.rating ? advisor.rating / 100 : 0;
  const roundedAverage = Math.round(averageRating * 10) / 10;
  
  const distribution: RatingDistribution[] = Object.keys(ratingCounts)
    .map((rating) => {
      const count = ratingCounts[parseInt(rating)];
      return {
        rating: parseInt(rating),
        count,
        percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
      };
    })
    .sort((a, b) => b.rating - a.rating); // Sort by rating (5 to 1)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="text-4xl font-bold">{roundedAverage}</div>
          <div className="flex justify-center mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i <= Math.round(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        
        <div className="w-3/4 space-y-2">
          {distribution.map((item) => (
            <div key={item.rating} className="flex items-center space-x-2">
              <div className="w-16 text-xs flex items-center">
                <span>{item.rating}</span>
                <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
              </div>
              <Progress value={item.percentage} className="h-2" />
              <div className="w-8 text-xs text-right">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}