import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Review, User } from '@shared/schema';
import { Star, Filter, ArrowUpDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReviewResponse } from '@/components/reviews/ReviewResponse';
import { RatingSummary } from '@/components/reviews/RatingSummary';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '../components/layout/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

type SortField = 'date' | 'rating';
type SortDirection = 'asc' | 'desc';
type FilterRating = 'all' | '1' | '2' | '3' | '4' | '5' | 'responded' | 'unresponded';

interface ReviewWithUser extends Review {
  user?: User;
}

export default function AdvisorReviews() {
  const { user } = useAuth();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // For debugging, log the userType when component loads
  useEffect(() => {
    console.log('Current userType:', user?.userType);
  }, [user?.userType]);

  // Fetch advisor's reviews
  const { data: allReviews = [], isLoading } = useQuery<ReviewWithUser[]>({
    queryKey: ['/api/advisors', user?.id, 'reviews'],
    enabled: !!user?.id && (user?.userType === 'ADVISOR' || user?.userType === 'advisor'),
  });

  // Calculate rating statistics
  const totalReviews = allReviews.length;
  const avgRating = totalReviews > 0
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;
  const respondedReviews = allReviews.filter(review => !!review.response).length;
  
  // Apply filters
  const filteredReviews = allReviews.filter(review => {
    // Filter by rating
    if (filterRating === 'responded' && !review.response) return false;
    if (filterRating === 'unresponded' && review.response) return false;
    if (filterRating !== 'all' && filterRating !== 'responded' && filterRating !== 'unresponded') {
      if (review.rating !== parseInt(filterRating)) return false;
    }

    // Filter by search query
    if (searchQuery && !review.content?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sort the filtered reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortField === 'date') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      return sortDirection === 'asc' ? a.rating - b.rating : b.rating - a.rating;
    }
  });

  // Group reviews into responded and pending
  const respondedReviewsList = sortedReviews.filter(review => !!review.response);
  const pendingReviewsList = sortedReviews.filter(review => !review.response);

  // Handle sorting changes
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">My Reviews</h1>
        <p className="text-muted-foreground mb-6">Manage and respond to your client reviews</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold mr-2">
                  {avgRating ? avgRating.toFixed(1) : '0.0'}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= Math.round(avgRating) 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground ml-2">
                  ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold mr-2">
                  {totalReviews > 0 ? Math.round((respondedReviews / totalReviews) * 100) : 0}%
                </span>
                <span className="text-sm text-muted-foreground">
                  ({respondedReviews} of {totalReviews} responded)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pending Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold mr-2">
                  {totalReviews - respondedReviews}
                </span>
                <span className="text-sm text-muted-foreground">
                  {totalReviews - respondedReviews === 1 ? 'review' : 'reviews'} need your response
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating summary */}
        {user?.id && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <RatingSummary advisorId={user.id} />
            </CardContent>
          </Card>
        )}

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input 
              placeholder="Search reviews..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-row gap-2">
            <Select
              value={filterRating}
              onValueChange={(value) => setFilterRating(value as FilterRating)}
            >
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Filter</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="unresponded">Needs Response</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => toggleSort('date')}
              className={sortField === 'date' ? 'border-primary' : ''}
            >
              <Clock className="h-4 w-4 mr-1" />
              Date
              {sortField === 'date' && (
                <ArrowUpDown className={`h-3 w-3 ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={() => toggleSort('rating')}
              className={sortField === 'rating' ? 'border-primary' : ''}
            >
              <Star className="h-4 w-4 mr-1" />
              Rating
              {sortField === 'rating' && (
                <ArrowUpDown className={`h-3 w-3 ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="pending" className="text-sm">
              Needs Response ({pendingReviewsList.length})
            </TabsTrigger>
            <TabsTrigger value="responded" className="text-sm">
              Responded ({respondedReviewsList.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              Array(3).fill(null).map((_, i) => (
                <Card key={i} className="mb-4">
                  <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : pendingReviewsList.length > 0 ? (
              pendingReviewsList.map(review => (
                <Card key={review.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={review.user?.avatar} alt={review.user?.name} />
                          <AvatarFallback>{review.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{review.user?.name || 'Anonymous User'}</CardTitle>
                          <CardDescription>
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <Badge variant="outline" className="ml-2">Needs Response</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{review.content}</p>
                    <ReviewResponse 
                      review={review} 
                      advisorId={user?.id || 0}
                    />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-medium mb-2">All caught up!</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You've responded to all your reviews. Great job maintaining communication with your clients!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="responded">
            {isLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ) : respondedReviewsList.length > 0 ? (
              respondedReviewsList.map(review => (
                <Card key={review.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={review.user?.avatar} alt={review.user?.name} />
                          <AvatarFallback>{review.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{review.user?.name || 'Anonymous User'}</CardTitle>
                          <CardDescription>
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Responded</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{review.content}</p>
                    {review.response && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-medium mb-2">Your Response</h4>
                        <p className="text-sm">{review.response}</p>
                        {review.responseDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Responded {formatDistanceToNow(new Date(review.responseDate), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No responded reviews</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    You haven't responded to any reviews yet. Reviews with your responses will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}