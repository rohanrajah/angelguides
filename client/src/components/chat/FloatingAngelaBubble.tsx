import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AngelaChatWidget from './AngelaChatWidget';

interface FloatingAngelaBubbleProps {
  userId: number;
}

const FloatingAngelaBubble: React.FC<FloatingAngelaBubbleProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const isHomePage = location === "/";
  
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
  const bubbleSize = isHomePage ? 'w-80 h-80' : 'w-16 h-16';
  const iconSize = isHomePage ? 'text-5xl' : 'text-2xl';
  const wingSize = isHomePage ? 'w-96 h-96' : 'w-24 h-24';
  
  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragControls.start(event, { snapToCursor: false });
  }

  return (
    <motion.div 
      className="fixed z-50"
      initial={{ 
        bottom: isHomePage ? '50%' : '8rem', 
        right: isHomePage ? '50%' : '2rem', 
        transform: isHomePage ? 'translate(50%, 50%)' : 'none' 
      }}
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
            className={`absolute ${isHomePage ? 'bottom-48 -right-48' : 'bottom-20 right-0'} w-80 md:w-96 shadow-2xl`}
          >
            <AngelaChatWidget userId={userId} isFloating={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative" onPointerDown={startDrag}>
        {/* Left Wing */}
        <motion.div
          className={`absolute ${wingSize} -left-3/4 top-0 pointer-events-none`}
          initial={{ rotate: -10, originX: 1, originY: 0.5 }}
          animate={{
            rotate: [-10, -30, -10],
            translateY: [0, -5, 0],
          }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.5,
            ease: "easeInOut",
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="angelGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C4B5FD" />
                <stop offset="50%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              <filter id="glowLeft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path
              d="M100,10 Q80,30 70,90 Q60,70 40,60 Q20,50 0,55 Q10,30 30,15 Q60,0 100,10 Z"
              fill="url(#angelGradientLeft)"
              opacity="0.9"
              filter="url(#glowLeft)"
            />
          </svg>
        </motion.div>

        {/* Right Wing */}
        <motion.div
          className={`absolute ${wingSize} -right-3/4 top-0 pointer-events-none`}
          initial={{ rotate: 10, originX: 0, originY: 0.5 }}
          animate={{
            rotate: [10, 30, 10],
            translateY: [0, -5, 0],
          }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.5,
            ease: "easeInOut",
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="angelGradientRight" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C4B5FD" />
                <stop offset="50%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              <filter id="glowRight" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path
              d="M0,10 Q20,30 30,90 Q40,70 60,60 Q80,50 100,55 Q90,30 70,15 Q40,0 0,10 Z"
              fill="url(#angelGradientRight)"
              opacity="0.9"
              filter="url(#glowRight)"
            />
          </svg>
        </motion.div>

        {/* Main Bubble */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`${bubbleSize} angela-bubble rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing`}
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
            
            {/* Angela Text */}
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
              <i className={`fas fa-feather-alt ${iconSize} mb-1`}></i>
              <span className={`font-semibold ${isHomePage ? 'text-xl' : 'text-xs'}`}>Angela AI</span>
            </motion.div>

            {/* Notification dot */}
            {!isOpen && (
              <div className={`absolute -top-1 -right-1 ${isHomePage ? 'w-8 h-8' : 'w-4 h-4'} rounded-full bg-red-500 border-2 border-white`}></div>
            )}
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FloatingAngelaBubble;