import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Message } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';

const Messages: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [advisors, setAdvisors] = useState<User[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/me'],
  });
  
  // Fetch all advisors
  const { data: allAdvisors = [] } = useQuery<User[]>({
    queryKey: ['/api/advisors'],
  });
  
  // Fetch conversation with selected user
  const { data: conversation = [], isLoading: conversationLoading, refetch: refetchConversation } = useQuery<Message[]>({
    queryKey: [`/api/messages/${currentUser?.id}/${selectedUser?.id}`],
    enabled: !!currentUser && !!selectedUser,
  });
  
  // Set up list of available advisors to message
  useEffect(() => {
    if (allAdvisors.length > 0) {
      setAdvisors(allAdvisors);
      
      // Select first advisor by default if none selected
      if (!selectedUser) {
        setSelectedUser(allAdvisors[0]);
      }
    }
  }, [allAdvisors]);
  
  // Scroll to bottom of messages when conversation changes
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [conversation]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser || !selectedUser) return;
    
    try {
      await apiRequest('POST', '/api/messages', {
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        content: message
      });
      
      // Clear message input
      setMessage('');
      
      // Refetch conversation
      await refetchConversation();
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Format timestamp to readable time
  const formatMessageTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                   date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();
    
    return isToday ? format(date, 'h:mm a') : format(date, 'MMM d, h:mm a');
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-soft overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 h-[600px]">
          {/* Advisor list sidebar */}
          <div className="col-span-1 border-r border-neutral-light">
            <div className="p-4 border-b border-neutral-light">
              <h1 className="font-heading text-xl font-semibold text-neutral-darkest">Messages</h1>
              <div className="relative mt-2">
                <input 
                  type="text" 
                  placeholder="Search conversations..." 
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral"></i>
              </div>
            </div>
            
            <div className="overflow-y-auto" style={{ height: 'calc(600px - 89px)' }}>
              {advisors.map(advisor => (
                <motion.div 
                  key={advisor.id}
                  className={`p-4 border-b border-neutral-light flex items-center cursor-pointer ${
                    selectedUser?.id === advisor.id ? 'bg-primary/10' : 'hover:bg-neutral-lightest'
                  }`}
                  onClick={() => setSelectedUser(advisor)}
                  whileHover={{ backgroundColor: 'rgba(123, 104, 238, 0.05)' }}
                  whileTap={{ backgroundColor: 'rgba(123, 104, 238, 0.1)' }}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                      <img 
                        src={advisor.avatar || "https://via.placeholder.com/100"} 
                        alt={advisor.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {advisor.online && (
                      <div className="absolute bottom-0 right-2 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-neutral-darkest">{advisor.name}</h3>
                      <span className="text-xs text-neutral">12:34 PM</span>
                    </div>
                    <p className="text-sm text-neutral-dark truncate">
                      {advisor.id % 2 === 0 ? 
                        'Thanks for your question. I can help with that...' : 
                        'Let me know if you have any other questions.'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Conversation area */}
          <div className="col-span-1 md:col-span-3 flex flex-col">
            {selectedUser ? (
              <>
                {/* Conversation header */}
                <div className="p-4 border-b border-neutral-light flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                      <img 
                        src={selectedUser.avatar || "https://via.placeholder.com/100"} 
                        alt={selectedUser.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="font-medium text-neutral-darkest">{selectedUser.name}</h2>
                      <p className="text-xs text-neutral-dark">
                        {selectedUser.online ? (
                          <span className="text-success">
                            <i className="fas fa-circle text-xs mr-1"></i>
                            Online
                          </span>
                        ) : (
                          <span className="text-neutral">
                            <i className="far fa-circle text-xs mr-1"></i>
                            Away
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <button className="text-neutral hover:text-primary transition-colors mr-3">
                      <i className="fas fa-phone"></i>
                    </button>
                    <button className="text-neutral hover:text-primary transition-colors mr-3">
                      <i className="fas fa-video"></i>
                    </button>
                    <button className="text-neutral hover:text-primary transition-colors">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </div>
                </div>
                
                {/* Messages area */}
                <div 
                  className="flex-grow p-4 overflow-y-auto bg-neutral-lightest" 
                  style={{ height: 'calc(600px - 89px - 76px)' }}
                  ref={messageContainerRef}
                >
                  {conversationLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-pulse text-primary">
                        <i className="fas fa-spinner fa-spin text-2xl"></i>
                      </div>
                    </div>
                  ) : conversation.length > 0 ? (
                    <div className="space-y-4">
                      {conversation.map((msg, index) => {
                        const isCurrentUser = currentUser && msg.senderId === currentUser.id;
                        return (
                          <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isCurrentUser && (
                              <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                <img 
                                  src={selectedUser.avatar || "https://via.placeholder.com/50"} 
                                  alt={selectedUser.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div 
                              className={`max-w-[75%] rounded-lg p-3 ${
                                isCurrentUser 
                                  ? 'bg-primary text-white rounded-tr-none' 
                                  : 'bg-white text-neutral-dark rounded-tl-none'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white/70' : 'text-neutral'}`}>
                                {formatMessageTime(msg.timestamp)}
                              </p>
                            </div>
                            {isCurrentUser && (
                              <div className="w-8 h-8 rounded-full bg-neutral ml-2 flex items-center justify-center text-white flex-shrink-0">
                                <span className="text-xs font-medium">
                                  {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="text-neutral mb-4">
                        <i className="far fa-comments text-5xl"></i>
                      </div>
                      <h3 className="font-heading text-lg font-medium mb-2">No Messages Yet</h3>
                      <p className="text-neutral-dark text-sm mb-4">
                        Start the conversation with {selectedUser.name} by sending a message below.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Message input area */}
                <div className="p-3 border-t border-neutral-light bg-white">
                  <form className="flex items-end" onSubmit={handleSendMessage}>
                    <button type="button" className="text-neutral hover:text-primary mx-2">
                      <i className="far fa-smile text-xl"></i>
                    </button>
                    <div className="flex-grow">
                      <textarea 
                        placeholder={`Message ${selectedUser.name}...`} 
                        className="w-full px-3 py-2 rounded-md border border-neutral-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200 resize-none"
                        rows={1}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className={`bg-primary hover:bg-primary-dark text-white rounded-full w-10 h-10 flex items-center justify-center ml-2 ${
                        !message.trim() ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!message.trim()}
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="text-neutral mb-4">
                  <i className="far fa-comment-dots text-5xl"></i>
                </div>
                <h3 className="font-heading text-xl font-medium mb-2">Select a Conversation</h3>
                <p className="text-neutral-dark">
                  Choose an advisor from the list to view your conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Messaging tips */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-5">
          <div className="text-primary mb-3">
            <i className="fas fa-shield-alt text-xl"></i>
          </div>
          <h3 className="font-heading text-lg font-medium mb-2">Secure Messaging</h3>
          <p className="text-neutral-dark text-sm">
            All conversations with your advisors are private and encrypted for your security and peace of mind.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-soft p-5">
          <div className="text-primary mb-3">
            <i className="fas fa-clock text-xl"></i>
          </div>
          <h3 className="font-heading text-lg font-medium mb-2">Response Times</h3>
          <p className="text-neutral-dark text-sm">
            Most advisors respond within 24 hours. Online advisors typically reply much faster.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-soft p-5">
          <div className="text-primary mb-3">
            <i className="fas fa-heart text-xl"></i>
          </div>
          <h3 className="font-heading text-lg font-medium mb-2">Effective Communication</h3>
          <p className="text-neutral-dark text-sm">
            Be clear about your questions and concerns to receive the most insightful guidance from your advisor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Messages;
