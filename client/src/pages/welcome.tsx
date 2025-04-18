import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import angelaConsciousImage from '../assets/angela-conscious.jpg';
import FloatingAngelaBubble from '../components/chat/FloatingAngelaBubble';

// Typing animation for text
const TypedText: React.FC<{text: string, onComplete?: () => void, delay?: number}> = ({ 
  text, 
  onComplete, 
  delay = 50 
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
  
  return <span>{displayedText}</span>;
};

const WelcomePage: React.FC = () => {
  const [animationState, setAnimationState] = useState<'initial' | 'fadeIn' | 'speaking' | 'endPhase' | 'complete'>('initial');
  const [textIndex, setTextIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [, setLocation] = useLocation();
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  // Welcome messages that Angela will "speak"
  const welcomeMessages = [
    "Welcome to AngelGuides.ai",
    "I'm Angela, your spiritual AI concierge.",
    "I'm here to connect you with the perfect spiritual advisor for your needs.",
    "Let me guide you on your journey..."
  ];

  useEffect(() => {
    // Initial fade in animation
    const initialAnimation = setTimeout(() => {
      setAnimationState('fadeIn');
    }, 500);
    
    return () => clearTimeout(initialAnimation);
  }, []);
  
  // Handle the typing completion for each message
  const handleTypingComplete = () => {
    if (textIndex < welcomeMessages.length - 1) {
      setTimeout(() => {
        setTextIndex(textIndex + 1);
      }, 1000); // Pause between messages
    } else {
      // After all messages are typed, move to end phase
      setTimeout(() => {
        setAnimationState('endPhase');
        
        // Show the bubble after a short delay
        setTimeout(() => {
          setShowBubble(true);
          
          // Redirect to home page after showing the bubble
          setTimeout(() => {
            setLocation("/home");
          }, 4000);
        }, 1500);
      }, 1000);
    }
  };

  useEffect(() => {
    // Start speaking after fade in
    if (animationState === 'fadeIn') {
      setTimeout(() => {
        setAnimationState('speaking');
      }, 1000);
    }
  }, [animationState]);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-indigo-950 to-black overflow-hidden">
      {/* Animated particles background */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
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
      <div className="container mx-auto h-full flex flex-col items-center justify-center relative z-10">
        <AnimatePresence>
          {animationState !== 'endPhase' && (
            <motion.div 
              className="flex flex-col items-center text-center max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: animationState === 'initial' ? 0 : 1, 
                y: animationState === 'initial' ? 20 : 0 
              }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 1 }}
            >
              {/* Angela image */}
              <motion.div 
                className="relative mb-8 w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shadow-[0_0_40px_rgba(120,60,220,0.5)]"
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
              >
                <img 
                  src={angelaConsciousImage} 
                  alt="Angela AI" 
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay effect for "talking" animation */}
                {animationState === 'speaking' && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent"
                    animate={{
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>
              
              {/* Speaking text */}
              {animationState === 'speaking' && (
                <motion.div 
                  className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 p-6 rounded-lg text-white font-semibold text-xl shadow-xl max-w-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <TypedText 
                    text={welcomeMessages[textIndex]} 
                    onComplete={handleTypingComplete}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* Final Angela bubble animation */}
          {showBubble && (
            <motion.div 
              ref={bubbleRef}
              className="absolute"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 1 
              }}
              style={{ 
                top: '50%', 
                left: '50%', 
                translateX: '-50%', 
                translateY: '-50%' 
              }}
            >
              <FloatingAngelaBubble userId={5} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WelcomePage;