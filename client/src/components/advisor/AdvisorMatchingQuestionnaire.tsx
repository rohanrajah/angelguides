import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface TypedTextProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
  className?: string;
}

const TypedText: React.FC<TypedTextProps> = ({ 
  text, 
  onComplete, 
  delay = 40, 
  className = "" 
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, delay);
      
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, delay, onComplete]);
  
  return <div className={className}>{displayedText}</div>;
};

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

interface Props {
  userId: number;
  onComplete: (advisorIds: number[]) => void;
}

const AdvisorMatchingQuestionnaire: React.FC<Props> = ({ userId, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState<MatchingQuestion | null>(null);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  const [recommendation, setRecommendation] = useState<AdvisorRecommendation | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Query to start the matching flow
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/angela', userId, 'start-matching'],
    queryFn: async () => {
      const response = await apiRequest(
        'GET', 
        `/api/angela/${userId}/start-matching`
      );
      return response.json();
    },
    enabled: userResponses.length === 0,
  });

  // Mutation to send user responses and get the next question
  const messageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(
        'POST', 
        `/api/angela/${userId}/message`, 
        { message }
      );
      return response.json();
    },
    onSuccess: (data: MatchingQuestion | AdvisorRecommendation) => {
      if ('recommendedAdvisors' in data) {
        // We got recommendations, we're done
        setRecommendation(data as AdvisorRecommendation);
        setCurrentQuestion(null);
        
        // After showing recommendations for a moment, complete the flow
        setTimeout(() => {
          setIsCompleting(true);
          setTimeout(() => {
            onComplete(data.recommendedAdvisors);
          }, 2000);
        }, 6000);
      } else {
        // We got the next question
        setCurrentQuestion(data as MatchingQuestion);
        setTypingComplete(false);
      }
      setUserInput("");
    }
  });

  useEffect(() => {
    // Set the initial question from the query
    if (data && !currentQuestion) {
      setCurrentQuestion(data);
    }
  }, [data, currentQuestion]);

  const handleSubmitResponse = () => {
    if (!userInput.trim() || messageMutation.isPending) return;
    
    // Save this response
    setUserResponses(prev => [...prev, userInput]);
    
    // Send it to get the next question
    messageMutation.mutate(userInput);
  };

  const handleTypingComplete = () => {
    setTypingComplete(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-lg rounded-xl shadow-lg max-w-2xl w-full mx-auto">
        <div className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <div className="mt-6">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-lg rounded-xl shadow-lg max-w-2xl w-full mx-auto text-red-400">
        <p>Error loading advisor matching questions. Please try again later.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-6 bg-white/5 backdrop-blur-lg rounded-xl shadow-lg max-w-2xl w-full mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {isCompleting ? (
        <div className="text-center">
          <p className="text-xl text-white font-medium mb-4">
            Thanks for completing the questionnaire!
          </p>
          <div className="flex justify-center items-center">
            <div className="h-12 w-12 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-white/70">
            Finding your perfect spiritual advisor match...
          </p>
        </div>
      ) : recommendation ? (
        <div>
          <h3 className="text-xl text-white font-semibold mb-4">Your Advisor Matches</h3>
          <TypedText 
            text={recommendation.message}
            onComplete={handleTypingComplete}
            className="text-white mb-6"
          />
          
          {typingComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h4 className="text-lg text-purple-300 font-medium mb-2">Suggested Topics:</h4>
              <ul className="list-disc pl-5 mb-6 space-y-1">
                {recommendation.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-white/80">{suggestion}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      ) : currentQuestion ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-white font-semibold">
              Advisor Matching
            </h3>
            <span className="text-sm text-white/70">
              Question {currentQuestion.questionNumber} of {currentQuestion.totalQuestions}
            </span>
          </div>
          
          <TypedText 
            text={currentQuestion.message}
            onComplete={handleTypingComplete}
            className="text-white mb-6"
          />
          
          <div className="mt-4">
            <div className="flex items-start gap-3">
              <textarea
                className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Type your response here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && userInput.trim() && !messageMutation.isPending && typingComplete) {
                    e.preventDefault();
                    handleSubmitResponse();
                  }
                }}
                rows={3}
                disabled={messageMutation.isPending || !typingComplete}
              />
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSubmitResponse}
                disabled={!userInput.trim() || messageMutation.isPending || !typingComplete}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2"
              >
                {messageMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-40">
          <div className="h-12 w-12 border-4 border-t-transparent border-purple-500 rounded-full animate-spin"></div>
        </div>
      )}
    </motion.div>
  );
};

export default AdvisorMatchingQuestionnaire;