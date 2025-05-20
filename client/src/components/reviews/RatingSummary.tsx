import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Review } from '@shared/schema';

interface RatingSummaryProps {
  advisorId: number;
}

export const RatingSummary: React.FC<RatingSummaryProps> = ({ advisorId }) => {
  // Fetch reviews for this advisor
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['/api/advisors', advisorId, 'reviews'],
    queryFn: async () => {
      const res = await fetch(`/api/advisors/${advisorId}/reviews`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
  });

  // Calculate rating statistics
  const getRatingStats = () => {
    if (!reviews || reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: [0, 0, 0, 0, 0],
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / total;
    
    // Count the number of reviews for each rating (1-5)
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      const idx = review.rating - 1;
      if (idx >= 0 && idx < 5) {
        distribution[idx]++;
      }
    });
    
    return { average, total, distribution };
  };

  const { average, total, distribution } = getRatingStats();
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 flex-grow" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Rating Summary</h3>
        <div className="flex items-center">
          <span className="text-3xl font-bold mr-2">{average.toFixed(1)}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating - 1];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center space-x-4">
              <div className="w-16 flex items-center">
                <span className="mr-1">{rating}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              </div>
              <Progress value={percentage} className="flex-grow h-2.5" />
              <div className="w-10 text-right text-gray-500 text-sm">
                {count}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-center text-gray-500 text-sm">
        Based on {total} review{total !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default RatingSummary;