import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AdvisorCard from './AdvisorCard';

interface MatchingQuestion {
  message: string;
  questionNumber: number;
  totalQuestions: number;
  isMatchingQuestion: boolean;
}

interface AdvisorRecommendation {
  message: string;
  recommendedAdvisors: number[];
  suggestions: string[];
}

interface TypedTextProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
  className?: string;
}

// Typing animation for text
const TypedText: React.FC<TypedTextProps> = ({ 
  text, 
  onComplete, 
  delay = 30,
  className = "" 
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        const nextChar = text[currentIndex];
        setDisplayedText(prev => prev + nextChar);
        setCurrentIndex(currentIndex + 1);
      }, delay);
      
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, delay, onComplete]);
  
  return <span className={className}>{displayedText}</span>;
};

const AdvisorMatchingQuestionnaire: React.FC<{
  onComplete: (advisorIds: number[]) => void;
  userId: number;
}> = ({ onComplete, userId }) => {
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<MatchingQuestion | null>(null);
  const [recommendation, setRecommendation] = useState<AdvisorRecommendation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'question' | 'recommendations'>('question');

  const { data: advisors = [] } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
  });

  const startMatchingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', `/api/angela/${userId}/start-matching`);
      return response.json();
    },
    onSuccess: (data: MatchingQuestion) => {
      setCurrentQuestion(data);
      setIsTyping(true);
    }
  });

  const submitResponseMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      setLoading(true);
      const response = await apiRequest('POST', `/api/angela/${userId}/message`, {
        message: userMessage,
      });
      return response.json();
    },
    onSuccess: (data: MatchingQuestion | AdvisorRecommendation) => {
      setLoading(false);
      // If it has recommendedAdvisors, it's the final recommendation
      if ('recommendedAdvisors' in data) {
        setRecommendation(data);
        setStep('recommendations');
      } else {
        // Otherwise it's a question
        setCurrentQuestion(data);
      }
      setIsTyping(true);
      setCurrentResponse("");
    }
  });

  useEffect(() => {
    // Start the matching flow when component mounts
    startMatchingMutation.mutate();
  }, []);

  const handleResponseSubmit = () => {
    if (!currentResponse.trim() || loading) return;
    
    // Save user response
    setUserResponses([...userResponses, currentResponse]);
    
    // Submit to API
    submitResponseMutation.mutate(currentResponse);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleResponseSubmit();
    }
  };

  const handleTypingComplete = () => {
    setIsTyping(false);
  };

  const handleFinishMatching = () => {
    if (recommendation) {
      onComplete(recommendation.recommendedAdvisors);
    }
  };

  const getRecommendedAdvisors = () => {
    if (!recommendation) return [];
    return advisors.filter(advisor => 
      recommendation.recommendedAdvisors.includes(advisor.id)
    );
  };

  if (startMatchingMutation.isPending) {
    return (
      <div className="space-y-4 w-full max-w-3xl mx-auto p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 'question' && currentQuestion && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 p-4"
          >
            <Card className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 p-6 rounded-lg text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Angela AI</h3>
                <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                  Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
                </span>
              </div>
              
              {isTyping ? (
                <TypedText 
                  text={currentQuestion.message}
                  onComplete={handleTypingComplete}
                  className="block font-medium"
                />
              ) : (
                <p className="font-medium">{currentQuestion.message}</p>
              )}
            </Card>
            
            <div className="flex flex-col">
              <textarea
                className="w-full p-4 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent shadow-sm"
                rows={3}
                placeholder="Type your response here..."
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading || isTyping}
              />
              
              <Button
                onClick={handleResponseSubmit}
                disabled={!currentResponse.trim() || loading || isTyping}
                className="mt-2 self-end bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Sending...
                  </>
                ) : (
                  "Send Response"
                )}
              </Button>
            </div>
          </motion.div>
        )}
        
        {step === 'recommendations' && recommendation && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 p-4"
          >
            <Card className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 p-6 rounded-lg text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Angela AI</h3>
                <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                  Recommendations
                </span>
              </div>
              
              {isTyping ? (
                <TypedText 
                  text={recommendation.message}
                  onComplete={handleTypingComplete}
                  className="block font-medium"
                />
              ) : (
                <p className="font-medium">{recommendation.message}</p>
              )}
            </Card>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-neutral-800">Recommended Advisors</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getRecommendedAdvisors().map((advisor) => (
                  <AdvisorCard 
                    key={advisor.id} 
                    advisor={advisor} 
                  />
                ))}
              </div>
              
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-purple-700">Next Steps</h4>
                <ul className="space-y-1">
                  {recommendation.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-neutral-700 flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('question')}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Start Over
                </Button>
                <Button 
                  onClick={handleFinishMatching}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  Explore Advisors
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvisorMatchingQuestionnaire;