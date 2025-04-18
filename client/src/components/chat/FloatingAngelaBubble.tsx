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

  // Size based on page - reducing homepage size to 3X
  const bubbleSize = isHomePage ? 'w-64 h-64' : 'w-20 h-20';
  const iconSize = isHomePage ? 'text-5xl' : 'text-2xl';
  const wingSize = isHomePage ? 'w-[20rem] h-[20rem]' : 'w-32 h-32';
  const wingPosition = isHomePage ? '-top-3/4' : '-top-1/2';
  
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
        {/* Left Wing */}
        <motion.div
          className={`absolute ${wingSize} -left-3/4 ${wingPosition} pointer-events-none`}
          initial={{ rotate: -60, originX: 1, originY: 0.5 }}
          animate={{
            rotate: [-60, -75, -60],
            translateY: [0, -15, 0],
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
                <stop offset="0%" stopColor="#F0F4FF" />
                <stop offset="40%" stopColor="#E1E8FF" />
                <stop offset="70%" stopColor="#D5DEFF" />
                <stop offset="100%" stopColor="#C4B5FD" />
              </linearGradient>
              <filter id="glowLeft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path
              d="M100,50 Q80,20 60,10 Q40,0 20,10 Q10,20 0,40 Q20,30 40,20 Q60,10 80,20 Q90,30 100,50 Z"
              fill="url(#angelGradientLeft)"
              opacity="0.9"
              filter="url(#glowLeft)"
            />
          </svg>
        </motion.div>

        {/* Right Wing */}
        <motion.div
          className={`absolute ${wingSize} -right-3/4 ${wingPosition} pointer-events-none`}
          initial={{ rotate: 60, originX: 0, originY: 0.5 }}
          animate={{
            rotate: [60, 75, 60],
            translateY: [0, -15, 0],
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
                <stop offset="0%" stopColor="#F0F4FF" />
                <stop offset="40%" stopColor="#E1E8FF" />
                <stop offset="70%" stopColor="#D5DEFF" />
                <stop offset="100%" stopColor="#C4B5FD" />
              </linearGradient>
              <filter id="glowRight" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <path
              d="M0,50 Q10,20 20,10 Q40,0 60,10 Q80,20 100,40 Q80,30 60,20 Q40,10 20,20 Q10,30 0,50 Z"
              fill="url(#angelGradientRight)"
              opacity="0.9"
              filter="url(#glowRight)"
            />
          </svg>
        </motion.div>

        {/* Main Bubble */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`${bubbleSize} angela-bubble angela-pulse rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden`}
          whileHover={{ scale: 1.08, boxShadow: "0 10px 25px rgba(120, 57, 213, 0.5)" }}
          whileTap={{ scale: 0.92 }}
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: [
              "0 6px 12px rgba(120, 57, 213, 0.4)",
              "0 15px 35px rgba(120, 57, 213, 0.8)",
              "0 6px 12px rgba(120, 57, 213, 0.4)",
            ],
            y: [0, -10, 0],
          }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 2.5,
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
              <img 
                src={angelaIconUrl} 
                alt="Angela AI Logo" 
                className={`${isHomePage ? 'h-24 w-24' : 'h-12 w-12'} mb-1 rounded-full`} 
              />
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