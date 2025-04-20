import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Specialty } from '@shared/schema';

// Helper function to get specialty names by ID
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

function getSpecialtyName(id: number): string {
  return specialtyNames[id] || "Spiritual Practice";
}

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
  const [, setLocation] = useLocation();

  // Array to store a more conversational display of the entire chat history
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', message: string}[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      // Smooth scroll to the bottom of the chat
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
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
      // Add user's message to chat history immediately for a more responsive feel
      setChatHistory(prev => [...prev, {role: 'user', message}]);
      
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
        
        // Add response to chat history
        setChatHistory(prev => [...prev, {role: 'assistant', message: data.message}]);
        
        // After showing recommendations for a moment, complete the flow
        setTimeout(() => {
          setIsCompleting(true);
          setTimeout(() => {
            onComplete(data.recommendedAdvisors || []);
          }, 2000);
        }, 6000);
      } else {
        // We got the next question
        const nextQuestion = data as MatchingQuestion;
        setCurrentQuestion(nextQuestion);
        setTypingComplete(false);
        
        // Add response to chat history
        setChatHistory(prev => [...prev, {role: 'assistant', message: nextQuestion.message}]);
      }
      setUserInput("");
    }
  });

  useEffect(() => {
    // Set the initial question from the query
    if (data && !currentQuestion) {
      setCurrentQuestion(data);
      // Add the initial message to chat history
      setChatHistory(prev => [...prev, {role: 'assistant', message: data.message}]);
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
  
  // Fetch advisor data for the recommended advisors
  const { data: advisorData = [] } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
    enabled: recommendation !== null && recommendation.recommendedAdvisors.length > 0,
  });

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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-white font-semibold">
              Your Advisor Matches
            </h3>
            <span className="text-sm text-white/70">
              Conversation complete
            </span>
          </div>
          
          {/* Display conversational chat history including the recommendation */}
          <div ref={chatContainerRef} className="mb-6 space-y-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent pr-2">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex items-start gap-3 ${chat.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                {chat.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs flex-shrink-0 overflow-hidden">
                    <span>A</span>
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  chat.role === 'assistant' 
                    ? 'bg-gradient-to-r from-purple-700/50 to-pink-700/50 text-white rounded-tl-none' 
                    : 'bg-white/10 text-white rounded-tr-none'
                }`}>
                  {index === chatHistory.length - 1 && chat.role === 'assistant' ? (
                    <TypedText 
                      text={chat.message}
                      onComplete={handleTypingComplete}
                      className=""
                    />
                  ) : (
                    <p>{chat.message}</p>
                  )}
                </div>
                
                {chat.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs flex-shrink-0">
                    <span>You</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {typingComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Display up to 3 advisor cards directly */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {recommendation.recommendedAdvisors.slice(0, 3).map(advisorId => {
                  const advisor = advisorData.find((a: User) => a.id === advisorId);
                  if (!advisor) return null;
                  
                  return (
                    <div key={advisorId} className="bg-white/10 backdrop-blur-md rounded-lg overflow-hidden border border-purple-500/30 hover:border-purple-500/70 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer">
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {advisor.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{advisor.name}</h3>
                            <div className="flex items-center text-yellow-300 text-sm">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i}>★</span>
                              ))}
                              <span className="ml-1 text-white/80">{advisor.rating || "5.0"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-white/80 text-sm mb-3 line-clamp-2">
                          {advisor.bio || "Spiritual advisor specializing in guidance and intuitive readings."}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {advisor.specialties && Array.isArray(advisor.specialties) && advisor.specialties.length > 0 ? (
                            // Use the first 3 specialty IDs
                            advisor.specialties.slice(0, 3).map((specialtyId: number) => (
                              <span key={specialtyId} className="text-xs bg-purple-500/20 text-purple-200 px-2 py-1 rounded-full">
                                {getSpecialtyName(specialtyId)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-1 rounded-full">
                              Spiritual Guidance
                            </span>
                          )}
                        </div>
                        
                        <button 
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-md mt-2 font-medium"
                          onClick={() => setLocation(`/advisors/${advisor.id}`)}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <h4 className="text-lg text-purple-300 font-medium mb-2">Suggested Next Steps:</h4>
              <ul className="list-disc pl-5 mb-6 space-y-1">
                {recommendation.suggestions && recommendation.suggestions.map((suggestion, index) => (
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
          
          {/* Display conversational chat history */}
          <div ref={chatContainerRef} className="mb-6 space-y-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent pr-2">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex items-start gap-3 ${chat.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                {chat.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs flex-shrink-0 overflow-hidden">
                    <span>A</span>
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  chat.role === 'assistant' 
                    ? 'bg-gradient-to-r from-purple-700/50 to-pink-700/50 text-white rounded-tl-none' 
                    : 'bg-white/10 text-white rounded-tr-none'
                }`}>
                  {index === chatHistory.length - 1 && chat.role === 'assistant' && currentQuestion ? (
                    <TypedText 
                      text={chat.message}
                      onComplete={handleTypingComplete}
                      className=""
                    />
                  ) : (
                    <p>{chat.message}</p>
                  )}
                </div>
                
                {chat.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs flex-shrink-0">
                    <span>You</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6">
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