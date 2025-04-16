import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { ChatMessage, Conversation } from '@shared/schema';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface AngelaChatWidgetProps {
  userId: number;
}

const AngelaChatWidget: React.FC<AngelaChatWidgetProps> = ({ userId }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
      messages: [...conversation.messages, newMessage]
    });
    
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', `/api/angela/${userId}/message`, { message });
      const data = await response.json();
      
      setConversation(data.conversation);
      setSuggestions(data.suggestions || []);
      
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
    <div className="bg-white rounded-xl shadow-soft mb-6 sticky top-24">
      <div className="p-4 bg-primary rounded-t-xl text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <i className="fas fa-robot text-white"></i>
            </div>
            <div>
              <h3 className="font-heading font-semibold">Angela AI Concierge</h3>
              <p className="text-xs text-white/80">Your spiritual guide assistant</p>
            </div>
          </div>
          <button className="text-white/80 hover:text-white transition duration-200">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
      
      <div className="h-80 overflow-y-auto p-4 bg-neutral-lightest" id="chat-messages">
        <div className="space-y-4">
          {conversation.messages.map((msg, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white mr-3">
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
                  <span className="text-xs font-medium">JD</span>
                </div>
              )}
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white mr-3">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                <div className="flex space-x-1">
                  <motion.div 
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop' }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop', delay: 0.1 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'loop', delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-3 border-t border-neutral-light">
        <form className="flex items-center" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Ask Angela anything..." 
            className="flex-grow px-3 py-2 rounded-l-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-primary hover:bg-primary-dark text-white rounded-r-md px-4 py-2 transition duration-200"
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
                    className="bg-white hover:bg-neutral-lightest text-neutral-dark border border-neutral-light rounded-full px-2 py-1 transition duration-200"
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
      </div>
    </div>
  );
};

export default AngelaChatWidget;
