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
        whileHover={{ scale: 1.08, boxShadow: "0 10px 25px rgba(120, 57, 213, 0.5)" }}
        whileTap={{ scale: 0.92 }}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 6px 12px rgba(120, 57, 213, 0.3)",
            "0 10px 24px rgba(120, 57, 213, 0.5)",
            "0 6px 12px rgba(120, 57, 213, 0.3)",
          ],
        }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 3,
        }}
      >
        <div className="relative">
          {/* Multi-layered glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white opacity-10"
            animate={{
              scale: [1, 1.7, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 3,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-white opacity-15"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2.5,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-white opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2,
              ease: "easeInOut",
              delay: 0.4,
            }}
          />
          
          {/* Icon animation */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse", 
              duration: 2,
              ease: "easeInOut"
            }}
          >
            <i className="fas fa-robot text-2xl"></i>
          </motion.div>

          {/* Notification dot */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
          )}
        </div>
      </motion.button>
    </div>
  );
};

export default FloatingAngelaBubble;