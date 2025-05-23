import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

// Map of specialty IDs to names
const specialtyNames: Record<number, string> = {
  1: "Tarot Reading",
  2: "Astrology",
  3: "Medium",
  4: "Dream Interpretation",
  5: "Energy Healing",
  6: "Spiritual Coaching",
  7: "Chakra Balancing",
  8: "Numerology",
  9: "Psychic Reading",
  10: "Past Life Reading",
  11: "Crystal Healing",
  12: "Angel Communication",
  13: "Spiritual Guidance"
};

// Helper function to get specialty names by ID
function getSpecialtyName(id: number): string {
  return specialtyNames[id] || "Spiritual Practice";
}

const AdvisorRecommendationsPage: React.FC = () => {
  const [match, params] = useRoute('/advisor-recommendations/:keywords');
  const [, setLocation] = useLocation();
  
  // Parse keywords from URL or use default
  const keywordsString = params?.keywords || '';
  const keywords = keywordsString ? decodeURIComponent(keywordsString).split(',') : ["spiritual guidance", "intuitive", "support"];
  
  // Get all advisors
  const { data: advisors = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
  });
  
  // Function to score advisors based on keywords
  const scoreAdvisors = (advisor: User, terms: string[]): number => {
    if (!advisor.bio) return 0;
    
    // Convert specialties array to strings if it exists
    const specialtyNames = advisor.specialties 
      ? (Array.isArray(advisor.specialties) 
          ? advisor.specialties.map((id: number) => getSpecialtyName(id).toLowerCase())
          : [])
      : [];
      
    // Combine bio and specialties for searching
    const searchText = `${advisor.bio.toLowerCase()} ${specialtyNames.join(' ')}`;
    
    // Score based on keyword matches
    return terms.reduce((score, term) => {
      return searchText.includes(term.toLowerCase()) ? score + 1 : score;
    }, 0);
  };
  
  // Sort and get top 3 advisors based on keywords
  const getTopAdvisors = (): User[] => {
    if (keywords.length === 0 || advisors.length === 0) {
      // If no keywords, return first 3 advisors
      return advisors.slice(0, 3);
    }
    
    return [...advisors]
      .map(advisor => ({ 
        advisor, 
        score: scoreAdvisors(advisor, keywords) 
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.advisor);
  };
  
  const topAdvisors = getTopAdvisors();
  
  // Generate personalized notes based on advisor specialties and keywords
  const getPersonalizedNote = (advisor: User): string => {
    if (!advisor.bio) return "I'd be happy to guide you on your spiritual journey.";
    
    // Get advisor specialties
    const specialties = advisor.specialties 
      ? (Array.isArray(advisor.specialties) 
          ? advisor.specialties.map((id: number) => getSpecialtyName(id))
          : [])
      : [];
          
    if (specialties.length === 0) {
      return "I'd be happy to guide you on your spiritual journey.";
    }
    
    // Create a personalized note mentioning specialties
    return `As a specialist in ${specialties.slice(0, 2).join(' and ')}, I can provide the guidance you're looking for. I'd be honored to help you explore your spiritual path.`;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4"
    >
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Your Recommended Spiritual Guides</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Based on your responses, we've found these advisors who align perfectly with your spiritual needs.
        </p>
        
        {keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {keywords.map((keyword, index) => (
              <Badge key={index} variant="outline" className="bg-primary/10">
                ✨ {keyword}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {topAdvisors.map((advisor) => (
          <Card key={advisor.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {advisor.avatar ? (
                    <AvatarImage src={advisor.avatar} alt={advisor.name} />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {advisor.name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle>{advisor.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < (advisor.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="ml-1 text-sm">{advisor.rating || "5.0"}</span>
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {advisor.bio || "Expert spiritual advisor ready to guide you on your journey."}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {advisor.specialties && Array.isArray(advisor.specialties) && 
                  advisor.specialties.slice(0, 3).map((specialtyId: number) => (
                    <Badge key={specialtyId} variant="secondary">
                      {getSpecialtyName(specialtyId)}
                    </Badge>
                  ))
                }
              </div>
              
              <div className="p-3 bg-muted rounded-md italic text-sm mt-3">
                "{getPersonalizedNote(advisor)}"
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation(`/advisors/${advisor.id}`)}
              >
                View Profile
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setLocation(`/book/${advisor.id}`)}
              >
                Book Session
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center">
        <p className="text-center text-muted-foreground mb-4">
          Don't see the perfect match? Explore our full collection of spiritual advisors.
        </p>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => setLocation('/advisors')}
        >
          View All Advisors
        </Button>
      </div>
    </motion.div>
  );
};

export default AdvisorRecommendationsPage;