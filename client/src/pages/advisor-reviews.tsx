import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import ReviewsList from '@/components/reviews/ReviewsList';
import RatingSummary from '@/components/reviews/RatingSummary';
import { User } from '@shared/schema';

const AdvisorReviewsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const advisorId = parseInt(id || '0', 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const isOwnProfile = user?.id === advisorId;
  
  // Fetch advisor data
  const { data: advisor, isLoading: isLoadingAdvisor } = useQuery<User>({
    queryKey: ['/api/advisors', advisorId],
    queryFn: async () => {
      const res = await fetch(`/api/advisors/${advisorId}`);
      if (!res.ok) throw new Error('Failed to fetch advisor data');
      return res.json();
    },
    enabled: !!advisorId,
  });

  if (isLoadingAdvisor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-10">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600">Loading advisor information...</p>
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-10">
        <div className="text-center p-10 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Advisor Not Found</h2>
          <p className="text-red-600 mb-6">The advisor you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation('/advisors')}>
            Browse Advisors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      {/* Back button and header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 pl-0"
          onClick={() => setLocation(`/advisors/${advisorId}`)}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Advisor Profile
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isOwnProfile ? "My Reviews" : `${advisor.name}'s Reviews`}
            </h1>
            <div className="flex items-center text-gray-600">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="font-medium mr-1">
                  {advisor.rating ? advisor.rating.toFixed(1) : 'No ratings yet'}
                </span>
              </div>
              {advisor.reviewCount ? (
                <span className="text-gray-500">({advisor.reviewCount} reviews)</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rating Summary */}
        <div className="lg:col-span-1">
          <RatingSummary advisorId={advisorId} />
        </div>
        
        {/* Reviews List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="all">All Reviews</TabsTrigger>
                {isOwnProfile && <TabsTrigger value="pending">Pending Responses</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="all">
                <ReviewsList 
                  advisorId={advisorId} 
                  isAdvisor={isOwnProfile} 
                  showResponseForm={isOwnProfile}
                />
              </TabsContent>
              
              {isOwnProfile && (
                <TabsContent value="pending">
                  {/* We could add a filter here for reviews without responses if needed */}
                  <ReviewsList 
                    advisorId={advisorId} 
                    isAdvisor={true} 
                    showResponseForm={true}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorReviewsPage;