import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import AngelaChatWidget from './AngelaChatWidget';
import angelaIconUrl from '../../assets/angela-icon.png';

interface FloatingAngelaBubbleProps {
  userId: number;
}

const FloatingAngelaBubble: React.FC<FloatingAngelaBubbleProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  
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

  // Keeping consistent 1/2 size on all pages
  const bubbleSize = 'w-32 h-32'; // 1/2 size for all pages
  const iconSize = 'h-12 w-12'; // 1/2 size icon for all pages
  
  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    dragControls.start(event, { snapToCursor: false });
  }

  return (
    <motion.div 
      className="fixed z-50 top-8 right-8"
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
            className="absolute bottom-full mb-4 right-0 w-80 md:w-96 shadow-2xl"
          >
            <AngelaChatWidget userId={userId} isFloating={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative" onPointerDown={startDrag}>
        {/* Main Bubble */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`${bubbleSize} angela-bubble rounded-full bg-gradient-radial from-indigo-800 via-indigo-900 to-purple-950 text-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden`}
          whileHover={{ scale: 1.08, boxShadow: "0 10px 25px rgba(120, 57, 213, 0.5)" }}
          whileTap={{ scale: 0.92 }}
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 6px 12px rgba(60, 149, 248, 0.6)",
              "0 10px 20px rgba(168, 85, 247, 0.7)",
              "0 15px 35px rgba(236, 72, 153, 0.8)",
              "0 10px 20px rgba(168, 85, 247, 0.7)",
              "0 6px 12px rgba(60, 149, 248, 0.6)",
            ]
          }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 6,
            ease: "easeInOut"
          }}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-md"></div>
          
          {/* Concentric Waves around logo */}
          <div className="siri-concentric-container">
            <div className="siri-concentric-wave siri-wave-pink"></div>
            <div className="siri-concentric-wave siri-wave-blue"></div>
            <div className="siri-concentric-wave siri-wave-teal"></div>
            <div className="siri-concentric-wave siri-wave-white"></div>
            <div className="siri-concentric-wave siri-wave-pink" style={{animationDelay: '2s'}}></div>
            <div className="siri-concentric-wave siri-wave-blue" style={{animationDelay: '2.5s'}}></div>
            <div className="siri-concentric-wave siri-wave-teal" style={{animationDelay: '3s'}}></div>
            <div className="siri-concentric-wave siri-wave-white" style={{animationDelay: '3.5s'}}></div>
            {/* Additional color wave */}
            <div className="siri-concentric-wave siri-wave-purple"></div>
          </div>
          
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
              <span className="font-semibold text-sm">Angela AI</span>
            </motion.div>
          </div>

          {/* Notification dot - consistent size */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white z-20"></div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FloatingAngelaBubble;