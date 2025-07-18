import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import angelaConsciousImage from '@/assets/angela-conscious.jpg';
import angelaWelcomeAudio from '@/assets/audio/angela-welcome.mp3';
// FloatingAngelaBubble is now rendered in App.tsx for all pages
import AdvisorMatchingQuestionnaire from '@/components/advisor/AdvisorMatchingQuestionnaire';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Typing animation for text
const TypedText: React.FC<{
  text: string, 
  onComplete?: () => void, 
  onCharacterTyped?: (char: string) => void,
  delay?: number
}> = ({ 
  text, 
  onComplete, 
  onCharacterTyped,
  delay = 80 
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        const nextChar = text[currentIndex];
        setDisplayedText(prev => prev + nextChar);
        setCurrentIndex(currentIndex + 1);
        
        // Call character callback for talking animation
        if (onCharacterTyped) {
          onCharacterTyped(nextChar);
        }
      }, delay);
      
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, delay, onComplete, onCharacterTyped]);
  
  return <span>{displayedText}</span>;
};

// Login form component
const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Use auth hook for login/register mutations
  const { loginMutation, registerMutation } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await loginMutation.mutateAsync({ username, password });
      
      // Set flag in localStorage to remember this user session
      localStorage.setItem('hasSeenWelcome', 'true');
      
      // Redirect to dashboard
      setLocation('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password || !email) {
      setError('Please fill out all required fields');
      return;
    }
    
    try {
      const userData = {
        username,
        password,
        email,
        name: name || username,
        userType: "USER" as "USER" | "ADVISOR" | "ADMIN"
      };
      
      await registerMutation.mutateAsync(userData);
      
      // Set flag in localStorage to remember this user session
      localStorage.setItem('hasSeenWelcome', 'true');
      
      // Redirect to dashboard
      setLocation('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50 bg-black/60 backdrop-blur-md p-5 rounded-xl border border-purple-500/30 shadow-lg w-80">
      <h3 className="text-white text-xl font-bold mb-4">
        {isRegisterMode ? 'Create Account' : 'Login'}
      </h3>
      
      <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-3">
        <div>
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400"
            autoComplete="username"
            required
          />
        </div>
        
        <div>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400"
            autoComplete={isRegisterMode ? "new-password" : "current-password"}
            required
          />
        </div>
        
        {isRegisterMode && (
          <>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="Full Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/10 border-purple-400/30 text-white placeholder:text-gray-400"
                autoComplete="name"
              />
            </div>
          </>
        )}
        
        {error && <div className="text-red-400 text-sm">{error}</div>}
        
        <div className="flex justify-between items-center">
          <Button 
            type="submit" 
            disabled={isRegisterMode ? registerMutation.isPending : loginMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isRegisterMode ? 
              (registerMutation.isPending ? 'Creating...' : 'Create Account') : 
              (loginMutation.isPending ? 'Logging in...' : 'Login')}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-purple-300 hover:text-purple-200"
          >
            {isRegisterMode ? 'Login' : 'Register'}
          </Button>
        </div>
        
        <div className="text-sm text-gray-300 pt-2 border-t border-purple-500/20 mt-2">
          <div className="font-medium text-purple-300">Test Accounts:</div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div>
              <span className="text-blue-300 block">User:</span>
              <span className="text-gray-300 text-xs">elenalovc2</span>
            </div>
            <div>
              <span className="text-blue-300 block">Admin:</span>
              <span className="text-gray-300 text-xs">rohan555</span>
            </div>
            <div className="col-span-2 mt-1">
              <span className="text-gray-400 text-xs">Test accounts available</span>
              <span className="text-gray-300 text-xs block">(Contact admin for password)</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const WelcomePage: React.FC = () => {
  const [animationState, setAnimationState] = useState<'initial' | 'fadeIn' | 'speaking' | 'matchingQuestionnaire' | 'endPhase' | 'complete'>('initial');
  const [, setLocation] = useLocation();
  const [lipState, setLipState] = useState<'closed' | 'half-open' | 'open'>('closed');
  const [eyeState, setEyeState] = useState<'normal' | 'blink' | 'wide'>('normal');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [recommendedAdvisorIds, setRecommendedAdvisorIds] = useState<number[]>([]);
  
  // Welcome message that Angela will "speak"
  const welcomeMessage = "Welcome to AngelGuides.ai. I am Angela, your AI Concierge for all your spiritual needs.";
  
  // Trigger random eye blinks
  useEffect(() => {
    if (animationState === 'speaking') {
      const blinkInterval = setInterval(() => {
        // Random blink
        setEyeState('blink');
        setTimeout(() => setEyeState('normal'), 200);
      }, 3000 + Math.random() * 2000); // Random blink intervals
      
      return () => clearInterval(blinkInterval);
    }
  }, [animationState]);

  useEffect(() => {
    // Sequence of intro animations
    const initialAnimation = setTimeout(() => {
      setAnimationState('fadeIn');
      
      // Start speaking animation after a slight delay
      setTimeout(() => {
        setAnimationState('speaking');
        // Play welcome audio if needed
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log("Audio playback prevented:", err));
        }
      }, 1000);
    }, 500);
    
    return () => clearTimeout(initialAnimation);
  }, []);
  
  // Handle lip movement based on character being spoken
  const handleCharacterTyped = (char: string) => {
    // Vowels make the mouth open wide
    if (['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'].includes(char)) {
      setLipState('open');
      setTimeout(() => setLipState('half-open'), 120);
    } 
    // Consonants make the mouth half open
    else if (char !== ' ' && char !== '.' && char !== ',') {
      setLipState('half-open');
      setTimeout(() => setLipState('closed'), 80);
    } 
    // For spaces and punctuation, close the mouth briefly
    else {
      setLipState('closed');
    }
    
    // Add occasional eye widening on emphasis words
    if (char === 'A' || char === 'W') {
      setEyeState('wide');
      setTimeout(() => setEyeState('normal'), 500);
    }
  };

  // Handle the typing completion
  const handleTypingComplete = () => {
    // Reset mouth to closed position
    setLipState('closed');
    
    // After message is typed, start the matching questionnaire
    setTimeout(() => {
      setAnimationState('matchingQuestionnaire');
    }, 1000);
  };
  
  // Handle completion of the matching questionnaire
  const handleMatchingComplete = (advisorIds: number[]) => {
    setRecommendedAdvisorIds(advisorIds);
    
    // After questionnaire is completed, move to end phase
    setAnimationState('endPhase');
    
    // Prepare transition to next page with a little delay to show matching completion
    setTimeout(() => {      
      // Mark that user has seen welcome page
      localStorage.setItem('hasSeenWelcome', 'true');
      
      // Store recommended advisors in localStorage to use on advisors page
      localStorage.setItem('recommendedAdvisors', JSON.stringify(advisorIds));
      
      // Set a flag to indicate we're coming from the intro page
      sessionStorage.setItem('fromIntroPage', 'true');
      
      // Redirect to advisors page with recommended advisors
      setTimeout(() => {
        setLocation("/advisors");
      }, 2500);
    }, 1000);
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-indigo-950 to-black overflow-hidden">
      {/* Login Form */}
      <LoginForm />
      
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
              {/* Angela image container with facial animations */}
              <div className="relative mb-8 w-64 h-64 md:w-80 md:h-80 overflow-visible">
                {/* Animated glow behind Angela */}
                <motion.div 
                  className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(120,60,220,0.5)]"
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
                
                {/* Base image */}
                <div className="relative rounded-full overflow-hidden w-full h-full">
                  <img 
                    src={angelaConsciousImage} 
                    alt="Angela AI" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Animated mouth overlay */}
                {animationState === 'speaking' && (
                  <div className="absolute left-0 top-0 w-full h-full">
                    {/* Lip animation */}
                    <motion.div 
                      className="absolute bottom-[30%] left-[50%] w-10 h-3 bg-pink-300/70 rounded-full"
                      style={{ translateX: '-50%' }}
                      animate={{
                        height: lipState === 'closed' ? '3px' : 
                               lipState === 'half-open' ? '6px' : '10px',
                        width: lipState === 'open' ? '30px' : '24px'
                      }}
                      transition={{ duration: 0.1 }}
                    />
                    
                    {/* Eye animations - left eye */}
                    <motion.div 
                      className="absolute top-[38%] left-[38%] w-4 h-4"
                      animate={{
                        scaleY: eyeState === 'blink' ? 0.1 : 1,
                        scaleX: eyeState === 'wide' ? 1.2 : 1
                      }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className="w-full h-full bg-blue-400/30 rounded-full"></div>
                    </motion.div>
                    
                    {/* Eye animations - right eye */}
                    <motion.div 
                      className="absolute top-[38%] right-[38%] w-4 h-4"
                      animate={{
                        scaleY: eyeState === 'blink' ? 0.1 : 1,
                        scaleX: eyeState === 'wide' ? 1.2 : 1
                      }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className="w-full h-full bg-blue-400/30 rounded-full"></div>
                    </motion.div>
                  </div>
                )}
                
                {/* Glowing effect while speaking */}
                {animationState === 'speaking' && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-full"
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
              </div>
              
              {/* Speaking text */}
              {animationState === 'speaking' && (
                <motion.div 
                  className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 p-6 rounded-lg text-white font-semibold text-xl shadow-xl max-w-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <TypedText 
                    text={welcomeMessage}
                    onCharacterTyped={handleCharacterTyped}
                    onComplete={handleTypingComplete}
                  />
                </motion.div>
              )}
              
              {/* Advisor Matching Questionnaire */}
              {animationState === 'matchingQuestionnaire' && (
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <AdvisorMatchingQuestionnaire 
                    userId={5} 
                    onComplete={handleMatchingComplete}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* 
            Final Angela bubble animation - removed since we're now showing 
            the bubble globally from App.tsx
          */}
        </AnimatePresence>
      </div>
      
      {/* Hidden audio element for narration */}
      <audio ref={audioRef} src={angelaWelcomeAudio} preload="auto" />
      
      {/* Skip and Reset buttons */}
      <div className="absolute bottom-6 right-6 flex gap-2">
        <button 
          onClick={() => {
            localStorage.removeItem('hasSeenWelcome');
            window.location.reload();
          }}
          className="px-4 py-2 text-white text-sm bg-red-500/30 hover:bg-red-500/50 rounded-full transition-colors duration-200 backdrop-blur-sm"
        >
          Reset Progress
        </button>
        <button 
          onClick={() => {
            localStorage.setItem('hasSeenWelcome', 'true');
            // Set the flag to also get random advisors when skipping
            sessionStorage.setItem('fromIntroPage', 'true');
            setLocation("/advisors");
          }}
          className="px-4 py-2 text-white text-sm bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200 backdrop-blur-sm"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;