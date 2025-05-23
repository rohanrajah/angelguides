import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

const GetMatchedPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [responses, setResponses] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  
  // Get all advisors
  const { data: advisors = [] } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
  });
  
  // The 5 spiritual advisor matching questions
  const questions = [
    "What type of spiritual guidance are you seeking at this moment in your journey?",
    "How do you prefer to connect with your spiritual advisor? (Intuitive, analytical, compassionate, direct)",
    "What area of your life needs the most spiritual attention right now?",
    "What spiritual practices resonate with you? (Meditation, energy work, divination, prayer, etc.)",
    "How important is it that your advisor shares your specific spiritual beliefs or traditions?"
  ];
  
  // Function to score advisors based on extracted keywords
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
    
    // Score based on keyword matches with weight for exact matches
    return terms.reduce((score, term) => {
      // Check for exact match (higher weight)
      if (searchText.includes(term.toLowerCase())) {
        return score + 2;
      }
      // Check for partial match (lower weight)
      else if (term.length > 3 && searchText.split(' ').some(word => 
        word.toLowerCase().includes(term.toLowerCase()) || 
        term.toLowerCase().includes(word.toLowerCase())
      )) {
        return score + 1;
      }
      return score;
    }, 0);
  };
  
  // Extract keywords from user responses
  const extractKeywords = (responses: string[]): string[] => {
    // Common spiritual and advisor-related keywords to look for
    const keywordCategories = {
      practices: [
        "tarot", "astrology", "meditation", "energy healing", "chakra", "reiki",
        "past life", "medium", "channeling", "psychic", "intuitive", "divination",
        "crystals", "spiritual coaching", "oracle cards", "numerology"
      ],
      lifeAreas: [
        "relationship", "career", "family", "health", "money", "purpose", "spirituality",
        "growth", "transition", "healing", "grief", "clarity", "direction", "future"
      ],
      communicationStyles: [
        "compassionate", "direct", "nurturing", "analytical", "intuitive", "gentle",
        "straightforward", "detailed", "supportive", "empathetic", "practical"
      ]
    };
    
    // Flatten all keywords into a single array
    const allKeywords = [
      ...keywordCategories.practices, 
      ...keywordCategories.lifeAreas,
      ...keywordCategories.communicationStyles
    ];
    
    // Join all user responses into a single string for easier searching
    const userText = responses.join(' ').toLowerCase();
    
    // Find keywords present in the user's responses
    const foundKeywords = allKeywords.filter(keyword => 
      userText.includes(keyword.toLowerCase())
    );
    
    // If we found less than 3 keywords, add some default ones
    if (foundKeywords.length < 3) {
      // Add some common defaults based on the context
      if (userText.includes('love') || userText.includes('partner') || userText.includes('relationship')) {
        foundKeywords.push('relationship guidance');
      }
      
      if (userText.includes('work') || userText.includes('job') || userText.includes('career')) {
        foundKeywords.push('career guidance');
      }
      
      if (userText.includes('meaning') || userText.includes('purpose') || userText.includes('path')) {
        foundKeywords.push('spiritual purpose');
      }
      
      // Ensure we have at least 3 keywords
      if (foundKeywords.length < 3) {
        foundKeywords.push('spiritual guidance');
        
        if (foundKeywords.length < 3) {
          foundKeywords.push('intuitive reading');
        }
      }
    }
    
    return Array.from(new Set(foundKeywords)).slice(0, 5); // Return up to 5 unique keywords
  };
  
  // Get top 3 advisors based on extracted keywords
  const getTopAdvisors = (): User[] => {
    if (advisors.length === 0) {
      return [];
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
  
  // Handle the next step in the questionnaire
  const handleNextStep = () => {
    if (!inputValue.trim()) return;
    
    // Save the response
    const updatedResponses = [...responses, inputValue];
    setResponses(updatedResponses);
    setInputValue('');
    
    if (step < 5) {
      // Move to the next question
      setStep(step + 1);
    } else {
      // Extract keywords and move to results
      setIsLoading(true);
      setTimeout(() => {
        const extractedKeywords = extractKeywords(updatedResponses);
        setKeywords(extractedKeywords);
        setStep(6);
        setIsLoading(false);
      }, 1500);
    }
  };
  
  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNextStep();
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-3">Find Your Spiritual Match</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Answer 5 quick questions to connect with the ideal spiritual advisor for your unique journey.
          </p>
          
          {/* Progress bar */}
          {step <= 5 && (
            <div className="mt-6 w-full bg-neutral-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" 
                style={{ width: `${(step / 5) * 100}%` }}
              ></div>
              <p className="text-sm text-muted-foreground mt-2">
                Question {step} of 5
              </p>
            </div>
          )}
        </motion.div>
        
        {/* Questionnaire */}
        {step <= 5 ? (
          <motion.div
            key={`question-${step}`}
            className="bg-white p-6 rounded-xl shadow-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4">{questions[step - 1]}</h2>
            
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share your thoughts..."
              className="w-full mb-4 min-h-[100px]"
            />
            
            <div className="flex justify-between mt-4">
              {step > 1 && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setStep(step - 1);
                    // Restore the previous response
                    setInputValue(responses[responses.length - 1]);
                    // Remove the last response
                    setResponses(responses.slice(0, -1));
                  }}
                >
                  Back
                </Button>
              )}
              <Button 
                className="ml-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                onClick={handleNextStep}
                disabled={!inputValue.trim()}
              >
                {step === 5 ? 'Find My Matches' : 'Next'}
              </Button>
            </div>
          </motion.div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-semibold">Finding Your Perfect Matches</h2>
            <p className="text-muted-foreground mt-2">Analyzing your spiritual needs...</p>
          </div>
        ) : (
          <>
            {/* Results */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                <h2 className="text-2xl font-bold">Your Spiritual Matches</h2>
                <Sparkles className="h-6 w-6 text-yellow-500" />
              </div>
              
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Based on your responses, we've found these spiritual advisors who align perfectly with your needs.
              </p>
              
              {keywords.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="bg-primary/10">
                      ✨ {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
            
            {/* Advisor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {topAdvisors.length > 0 ? (
                topAdvisors.map((advisor) => (
                  <Card key={advisor.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          {advisor.avatar ? (
                            <AvatarImage src={advisor.avatar} alt={advisor.name} />
                          ) : (
                            <AvatarFallback className="bg-primary/20 text-primary text-lg">
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
                    <CardContent>
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
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <p>No advisor matches found. Please try again with different responses.</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <p className="text-center text-muted-foreground mb-4">
                Don't see the perfect match? Explore our full collection of spiritual advisors.
              </p>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/advisors')}
                >
                  View All Advisors
                </Button>
                <Button 
                  variant="default"
                  onClick={() => {
                    setStep(1);
                    setResponses([]);
                    setInputValue('');
                    setKeywords([]);
                  }}
                >
                  Start Over
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GetMatchedPage;