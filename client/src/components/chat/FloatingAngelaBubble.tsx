import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AngelaChatWidget from './AngelaChatWidget';
import angelaIconUrl from '../../assets/angela-icon.png';

interface FloatingAngelaBubbleProps {
  userId: number;
}

const FloatingAngelaBubble: React.FC<FloatingAngelaBubbleProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const isHomePage = location === "/" || location === "/home";
  
  // Position values for dragging
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  // Add event listener to close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node) && 
          !(event.target as Element).classList.contains('angela-bubble')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Size based on page
  const bubbleSize = isHomePage ? 'w-64 h-64' : 'w-20 h-20';
  const iconSize = isHomePage ? 'h-24 w-24' : 'h-12 w-12';
  
  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragControls.start(event, { snapToCursor: false });
  }

  return (
    <motion.div 
      className={`fixed z-50 ${isHomePage ? 'top-1/4 left-1/2 -translate-x-1/2' : 'bottom-8 right-8'}`}
      style={{ x, y }}
      drag
      dragControls={dragControls}
      dragMomentum={false}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`absolute ${isHomePage ? 'top-full mt-8 left-1/2 -translate-x-1/2' : 'bottom-20 right-0'} w-80 md:w-96 shadow-2xl`}
          >
            <AngelaChatWidget userId={userId} isFloating={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative" onPointerDown={startDrag}>
        {/* Main Bubble */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`${bubbleSize} angela-bubble rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 text-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden`}
          whileHover={{ scale: 1.08, boxShadow: "0 10px 25px rgba(120, 57, 213, 0.5)" }}
          whileTap={{ scale: 0.92 }}
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 6px 12px rgba(120, 57, 213, 0.4)",
              "0 15px 35px rgba(120, 57, 213, 0.8)",
              "0 6px 12px rgba(120, 57, 213, 0.4)",
            ]
          }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 3,
            ease: "easeInOut"
          }}
        >
          {/* Siri-like waves */}
          <div className="siri-waves">
            <div className="siri-wave"></div>
            <div className="siri-wave"></div>
            <div className="siri-wave"></div>
          </div>
          
          {/* Circle animations */}
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-300 opacity-30"
            animate={{
              scale: [1, 1.7, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "mirror",
              duration: 2.3,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-300 opacity-30"
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.3, 0.15, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 3.5,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          
          <motion.div
            className="absolute inset-0 rounded-full bg-pink-300 opacity-30"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.2, 0.3],
              rotate: [0, -180, -360]
            }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 4,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          
          {/* Glowing rings */}
          <motion.div 
            className="absolute inset-0 border-4 border-white rounded-full opacity-20"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.2, 0, 0.2],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 3,
              ease: "linear"
            }}
          />
          
          <motion.div 
            className="absolute inset-0 border-2 border-white rounded-full opacity-15"
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.15, 0, 0.15],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 2.5,
              ease: "linear",
              delay: 0.3
            }}
          />
          
          <motion.div 
            className="absolute inset-0 border border-white rounded-full opacity-10"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0, 0.1],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 2,
              ease: "linear",
              delay: 0.6
            }}
          />
          
          {/* Content */}
          <div className="relative z-10">
            <motion.div
              className="flex flex-col items-center justify-center"
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
              <img 
                src={angelaIconUrl} 
                alt="Angela AI Logo" 
                className={`${iconSize} mb-1 rounded-full`} 
              />
              <span className={`font-semibold ${isHomePage ? 'text-xl' : 'text-xs'}`}>Angela AI</span>
            </motion.div>
          </div>

          {/* Notification dot */}
          {!isOpen && (
            <div className={`absolute -top-1 -right-1 ${isHomePage ? 'w-8 h-8' : 'w-4 h-4'} rounded-full bg-red-500 border-2 border-white z-20`}></div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FloatingAngelaBubble;