import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import AngelaChatWidget from './AngelaChatWidget';

interface FloatingAngelaBubbleProps {
  userId: number;
}

const FloatingAngelaBubble: React.FC<FloatingAngelaBubbleProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Add event listener to close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-80 md:w-96 shadow-2xl"
          >
            <AngelaChatWidget userId={userId} isFloating={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(120, 57, 213, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 2.5,
        }}
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-white opacity-20"
            animate={{
              scale: [1, 1.4, 1],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2.5,
            }}
          />
          <i className="fas fa-robot text-2xl"></i>
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
          )}
        </div>
      </motion.button>
    </div>
  );
};

export default FloatingAngelaBubble;