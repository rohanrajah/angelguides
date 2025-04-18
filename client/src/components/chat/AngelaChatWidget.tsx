import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ChatMessage, Conversation, User } from '@shared/schema';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';

interface AngelaChatWidgetProps {
  userId: number;
  isFloating?: boolean;
}

const ProgressIndicator = ({ current, total }: { current: number; total: number }) => {
  return (
    <div className="w-full flex justify-center my-3">
      <div className="flex space-x-2">
        {Array.from({ length: total }).map((_, idx) => (
          <div 
            key={idx} 
            className={`w-2 h-2 rounded-full ${
              idx < current ? 'bg-primary' : 'bg-neutral-light'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const AdvisorRecommendation = ({ 
  advisorIds, 
  message, 
  onClose 
}: { 
  advisorIds: number[]; 
  message: string;
  onClose: () => void;
}) => {
  const { data: advisors } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
  });
  
  const recommendedAdvisors = advisors?.filter(advisor => 
    advisorIds.includes(advisor.id)
  ) || [];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-lg p-4 mt-4 border border-purple-100"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-heading text-lg font-semibold text-primary">Your Perfect Advisor Matches</h3>
        <button 
          onClick={onClose}
          className="text-neutral hover:text-neutral-dark"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <p className="text-sm text-neutral-dark mb-4">{message}</p>
      
      <div className="space-y-4 mb-4">
        {recommendedAdvisors.map(advisor => (
          <div key={advisor.id} className="flex gap-3 p-3 rounded-lg bg-neutral-lightest hover:bg-purple-50 transition-colors">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              {advisor.avatar ? (
                <img src={advisor.avatar} alt={advisor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-semibold text-lg">
                  {advisor.name.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-neutral-darkest">{advisor.name}</h4>
                <div className="text-sm flex items-center text-yellow-500">
                  <i className="fas fa-star mr-1"></i>
                  <span>{advisor.rating}</span>
                </div>
              </div>
              
              <p className="text-sm text-neutral-dark line-clamp-2">{advisor.bio}</p>
              
              <div className="mt-2 flex justify-between items-center">
                <div className="text-xs text-primary font-semibold">
                  ${advisor.minuteRate}/min
                </div>
                
                <Link href={`/advisors/${advisor.id}`}>
                  <a className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors">
                    View Profile <i className="fas fa-arrow-right ml-1"></i>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Link href="/advisors">
        <a className="w-full flex justify-center items-center py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg transition-colors">
          See All Advisors
        </a>
      </Link>
    </motion.div>
  );
};

const AngelaChatWidget: React.FC<AngelaChatWidgetProps> = ({ userId, isFloating = false }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMatchingFlow, setIsMatchingFlow] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [recommendedAdvisors, setRecommendedAdvisors] = useState<number[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState('');
  
  // Emotional support states
  const [emotionalTone, setEmotionalTone] = useState<string>('supportive');
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [empathyLevel, setEmpathyLevel] = useState<number>(3);
  
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await apiRequest('GET', `/api/angela/${userId}`);
        const data = await response.json();
        setConversation(data);
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };
    
    fetchConversation();
  }, [userId]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [conversation?.messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startMatchingFlow = () => {
    setMessage("Please help me find the right advisor");
    handleSubmit(new Event('submit') as any);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversation) return;
    
    // Optimistically update the UI
    const newMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setConversation({
      ...conversation,
      messages: [...(conversation.messages as ChatMessage[]), newMessage]
    });
    
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', `/api/angela/${userId}/message`, { message });
      const data = await response.json();
      
      setConversation(data.conversation);
      setSuggestions(data.suggestions || []);
      
      // Handle advisor matching flow
      if (data.isMatchingQuestion) {
        setIsMatchingFlow(true);
        setQuestionNumber(data.questionNumber || 1);
        setTotalQuestions(data.totalQuestions || 5);
      } else {
        setIsMatchingFlow(false);
      }
      
      // Handle advisor recommendations
      if (data.recommendedAdvisors && data.recommendedAdvisors.length > 0) {
        setRecommendedAdvisors(data.recommendedAdvisors);
        setRecommendationMessage(data.message);
        setShowRecommendations(true);
        setIsMatchingFlow(false);
      }
      
      // Handle emotional support data
      if (data.emotionalTone) {
        setEmotionalTone(data.emotionalTone);
      }
      if (data.detectedEmotion) {
        setDetectedEmotion(data.detectedEmotion);
      }
      if (data.empathyLevel) {
        setEmpathyLevel(data.empathyLevel);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Revert optimistic update on error
      setConversation({
        ...conversation,
        messages: conversation.messages
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const handleCloseRecommendations = () => {
    setShowRecommendations(false);
  };

  if (!conversation) {
    return (
      <div className="bg-white rounded-xl shadow-soft mb-6 animate-pulse">
        <div className="p-4 bg-primary rounded-t-xl h-24"></div>
        <div className="h-64 bg-neutral-lightest"></div>
        <div className="p-3 border-t border-neutral-light h-24"></div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-xl shadow-xl ${!isFloating ? 'mb-6 sticky top-24' : ''} border border-purple-100`}>
      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <i className="fas fa-robot text-white"></i>
            </div>
            <div>
              <h3 className="font-heading font-semibold">Angela AI</h3>
              <p className="text-xs text-white/80">Your spiritual guide assistant</p>
            </div>
          </div>
          <motion.button 
            className="text-white/80 hover:text-white transition duration-200 bg-white/10 rounded-full h-8 w-8 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={startMatchingFlow}
          >
            <i className="fas fa-magic"></i>
          </motion.button>
        </div>
      </div>
      
      {isMatchingFlow && (
        <ProgressIndicator current={questionNumber} total={totalQuestions} />
      )}
      
      <div className="h-80 overflow-y-auto p-4 bg-neutral-lightest" id="chat-messages">
        <div className="space-y-4">
          {(conversation.messages as ChatMessage[]).map((msg, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white mr-3">
                  <i className="fas fa-robot text-sm"></i>
                </div>
              )}
              
              <div className={`${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-lg rounded-tr-none' 
                  : 'bg-white rounded-lg rounded-tl-none shadow-sm'
              } p-3 max-w-[80%]`}>
                <p className={`text-sm ${msg.role === 'user' ? 'text-white' : 'text-neutral-dark'}`}>
                  {msg.content}
                </p>
                <p className={`text-xs ${msg.role === 'user' ? 'text-white/70' : 'text-neutral'} mt-1`}>
                  {format(new Date(msg.timestamp), 'h:mm a')}
                </p>
              </div>
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-neutral flex-shrink-0 flex items-center justify-center text-white ml-3">
                  <span className="text-xs font-medium">You</span>
                </div>
              )}
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white mr-3">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                <div className="flex space-x-1">
                  <motion.div 
                    className="w-2 h-2 bg-purple-500 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop' }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-indigo-500 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop', delay: 0.1 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-purple-500 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop', delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {showRecommendations && (
            <AdvisorRecommendation 
              advisorIds={recommendedAdvisors} 
              message={recommendationMessage}
              onClose={handleCloseRecommendations}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-3 border-t border-neutral-light">
        <form className="flex items-center" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder={isMatchingFlow ? "Type your response..." : "Ask Angela anything..."}
            className="flex-grow px-3 py-2 rounded-l-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-r-md px-4 py-2 transition duration-200"
            disabled={isLoading || !message.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
        
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              className="flex justify-center mt-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-wrap gap-2 text-xs">
                {suggestions.map((suggestion, index) => (
                  <motion.button 
                    key={index}
                    className="bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-3 py-1 transition duration-200"
                    onClick={() => handleSuggestionClick(suggestion)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isMatchingFlow && !isLoading && (
          <div className="mt-3 flex justify-center">
            <motion.button
              onClick={startMatchingFlow}
              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="fas fa-magic text-xs"></i>
              <span>Find my perfect advisor match</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AngelaChatWidget;
