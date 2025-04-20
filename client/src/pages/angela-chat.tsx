import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { User } from '@shared/schema';
import angelaConsciousImage from '@/assets/Angela_gets_conscious.jpg';
import { useAuth } from '@/hooks/use-auth';

// Typing animation for text
const TypedText: React.FC<{
  text: string, 
  onComplete?: () => void, 
  delay?: number
}> = ({ 
  text, 
  onComplete, 
  delay = 40 
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
  
  return <div>{displayedText}</div>;
};

const AngelaChatPage: React.FC = () => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', message: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [initialMessage, setInitialMessage] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const userName = user?.name || "there";
  
  // Scroll to bottom whenever chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Initial greeting when the page loads
  useEffect(() => {
    if (initialMessage) {
      // This ensures that we show the typing animation only once
      setIsTyping(true);
      const welcomeMessage = `How can I help you, ${userName}?`;
      
      // Add initial message with a slight delay to make it feel natural
      setTimeout(() => {
        setChatHistory([{ role: 'assistant', message: welcomeMessage }]);
      }, 1500);
      
      setInitialMessage(false);
    }
  }, [initialMessage, userName]);

  // Mutation to send message to the server
  const messageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(
        'POST',
        `/api/angela/chat`,
        { message }
      );
      return response.json();
    },
    onSuccess: (data) => {
      // Add the assistant's response to the chat history
      setChatHistory(prev => [...prev, { role: 'assistant', message: data.message }]);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error("Error in chat:", error);
      // Fallback message if the API call fails
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        message: "I apologize, but I'm having trouble connecting to my spiritual knowledge. Please try again in a moment." 
      }]);
      setIsTyping(false);
    }
  });

  const handleSubmitMessage = () => {
    if (!userInput.trim() || messageMutation.isPending) return;
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { role: 'user', message: userInput }]);
    
    // Send message to API
    setIsTyping(true);
    messageMutation.mutate(userInput);
    
    // Clear input
    setUserInput("");
  };

  // Particles animation setup
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 5,
    delay: Math.random() * 5,
  }));

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-indigo-950 to-black overflow-hidden">
      {/* Animated particles background */}
      <div className="absolute inset-0 opacity-30">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-blue-400"
            style={{
              top: particle.top,
              left: particle.left,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Glowing circles */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ translateX: "-50%", translateY: "-50%" }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-purple-500/15"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ translateX: "-50%", translateY: "-50%" }}
      />

      {/* Main content */}
      <div className="container mx-auto h-full py-16 flex flex-col items-center justify-center relative z-10">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Angela's image */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 rounded-full overflow-hidden border-4 border-indigo-600/30 shadow-[0_0_40px_rgba(120,60,220,0.5)]">
            <motion.div 
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 40px rgba(120, 60, 220, 0.5)",
                  "0 0 80px rgba(120, 60, 220, 0.8)",
                  "0 0 40px rgba(120, 60, 220, 0.5)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <img 
              src={angelaConsciousImage} 
              alt="Angela AI" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Chat area */}
          <div className="w-full bg-indigo-950/40 backdrop-blur-md rounded-xl p-6 border border-indigo-600/20 shadow-xl">
            {/* Message history */}
            <div 
              ref={chatContainerRef}
              className="min-h-64 max-h-96 overflow-y-auto mb-6 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent"
            >
              {chatHistory.map((chat, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 ${chat.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  {chat.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs flex-shrink-0 overflow-hidden">
                      <span>A</span>
                    </div>
                  )}
                  
                  <div className={`max-w-[75%] rounded-lg p-3 ${
                    chat.role === 'assistant' 
                      ? 'bg-gradient-to-r from-indigo-700/50 to-purple-700/50 text-white rounded-tl-none' 
                      : 'bg-white/10 text-white rounded-tr-none'
                  }`}>
                    {index === chatHistory.length - 1 && chat.role === 'assistant' && isTyping ? (
                      <TypedText 
                        text={chat.message}
                        onComplete={() => setIsTyping(false)}
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
              
              {/* Loading indicator */}
              {messageMutation.isPending && !isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-indigo-700/50 to-purple-700/50 text-white p-3 rounded-lg rounded-tl-none max-w-[75%]">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse delay-150"></div>
                      <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input area */}
            <div className="mt-4">
              <div className="flex gap-2">
                <textarea
                  className="w-full p-3 rounded-lg bg-white/10 text-white border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Ask Angela anything..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && userInput.trim() && !messageMutation.isPending && !isTyping) {
                      e.preventDefault();
                      handleSubmitMessage();
                    }
                  }}
                  rows={3}
                  disabled={messageMutation.isPending || isTyping}
                ></textarea>
                
                <Button
                  onClick={handleSubmitMessage}
                  disabled={!userInput.trim() || messageMutation.isPending || isTyping}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg px-5 self-end h-12"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z"/>
                    <path d="M22 2 11 13"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AngelaChatPage;