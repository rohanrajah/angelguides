import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { AdvisorRecommendation } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Props {
  recommendations: AdvisorRecommendation;
  onSelectAdvisor: (advisorId: number) => void;
}

const AdvisorRecommendationsPage: React.FC<Props> = ({ recommendations, onSelectAdvisor }) => {
  if (!recommendations || !recommendations.recommendedAdvisors || recommendations.recommendedAdvisors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-semibold mb-4">Finding Your Perfect Match</h2>
        <p className="text-muted-foreground mb-6">
          We're currently searching for the best spiritual advisors for your unique needs...
        </p>
        <Link href="/advisors">
          <Button variant="default">View All Advisors</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center p-4 w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3">Your Recommended Spiritual Guides</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {recommendations.message}
        </p>
        
        {recommendations.suggestions && recommendations.suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {recommendations.suggestions.map((suggestion, index) => (
              <Badge key={index} variant="outline" className="bg-primary/10">
                💫 {suggestion}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
        {recommendations.recommendedAdvisors.map((advisorId) => {
          // This is a placeholder since we don't have the actual advisor data here
          // In a real implementation, you would fetch the advisor details or pass them as props
          return (
            <Card key={advisorId} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{`A${advisorId}`}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">Advisor #{advisorId}</CardTitle>
                    <CardDescription>
                      Spiritual Guide
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-sm">
                  This advisor has been matched to your spiritual needs based on your conversation with Angela.
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Tarot</Badge>
                  <Badge variant="secondary" className="text-xs">Healing</Badge>
                  <Badge variant="secondary" className="text-xs">Intuitive</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onSelectAdvisor(advisorId)}
                >
                  View Profile
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                >
                  Book Session
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col items-center">
        <p className="text-center text-muted-foreground mb-4">
          Don't see the right fit? Explore our full collection of spiritual advisors.
        </p>
        <Link href="/advisors">
          <Button variant="outline" size="lg">
            View All Advisors
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default AdvisorRecommendationsPage;