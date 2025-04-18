import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import angelaIconUrl from '../../assets/angela-icon.png';

interface AngelaOnboardingProps {
  onComplete: () => void;
}

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
  highlight?: 'bubble' | 'categories' | 'advisor';
}

const AngelaOnboarding: React.FC<AngelaOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [, setLocation] = useLocation();

  // Define the onboarding steps
  const steps: OnboardingStep[] = [
    {
      title: "Meet Angela, Your Spiritual Guide",
      description: "I'm Angela, your personal guide to the spiritual realm. I'm here to connect you with the perfect advisors for your journey.",
      highlight: 'bubble'
    },
    {
      title: "Browse Advisors by Specialty",
      description: "Explore our advisors by their unique specialties. Whether you need tarot readings, mediumship, or spiritual guidance, we have experts in every field.",
      highlight: 'categories'
    },
    {
      title: "Get Personalized Recommendations",
      description: "Answer a few questions, and I'll match you with advisors who align with your specific needs and energy.",
      highlight: 'advisor'
    },
    {
      title: "Start Your Journey",
      description: "Ready to explore the spiritual realm? You can find me in the corner of any page if you need guidance.",
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem('angelaOnboardingComplete', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('angelaOnboardingComplete', 'true');
    onComplete();
  };

  // Highlight animation for the Angela bubble
  const getBubbleHighlightAnimation = () => {
    if (steps[currentStep].highlight === 'bubble') {
      return (
        <motion.div 
          className="absolute -inset-4 rounded-full border-4 border-pink-500"
          animate={{ 
            boxShadow: ['0 0 0 rgba(236, 72, 153, 0.7)', '0 0 20px rgba(236, 72, 153, 0.7)', '0 0 0 rgba(236, 72, 153, 0.7)'],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "loop" 
          }}
        />
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden relative"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Progress bar */}
            <div className="h-1 bg-gray-200 dark:bg-gray-800">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Angela AI logo with animations */}
                  <div className="relative mb-6">
                    {getBubbleHighlightAnimation()}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
                      {/* Concentric Waves around logo */}
                      <div className="siri-concentric-container">
                        <div className="siri-concentric-wave siri-wave-pink"></div>
                        <div className="siri-concentric-wave siri-wave-blue"></div>
                        <div className="siri-concentric-wave siri-wave-teal"></div>
                        <div className="siri-concentric-wave siri-wave-white"></div>
                      </div>
                      
                      <img 
                        src={angelaIconUrl} 
                        alt="Angela AI" 
                        className="h-16 w-16 rounded-full relative z-10"
                      />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    {steps[currentStep].title}
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {steps[currentStep].description}
                  </p>

                  {/* Visual based on step highlight */}
                  {steps[currentStep].highlight === 'categories' && (
                    <div className="mb-6 flex gap-2 flex-wrap justify-center">
                      {['Tarot', 'Mediumship', 'Healing', 'Astrology', 'Dream Analysis'].map((category) => (
                        <motion.div 
                          key={category} 
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: Math.random() * 0.5 }}
                        >
                          {category}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {steps[currentStep].highlight === 'advisor' && (
                    <motion.div 
                      className="mb-6 w-full p-4 border-2 border-pink-400 rounded-lg max-w-xs mx-auto relative"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        boxShadow: ['0 0 0 rgba(236, 72, 153, 0.3)', '0 4px 12px rgba(236, 72, 153, 0.3)', '0 0 0 rgba(236, 72, 153, 0.3)']
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      <div className="absolute -top-3 -right-3 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                        Recommended
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-gradient-to-br from-purple-400 to-pink-500"></div>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Sarah Johnson</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Tarot Specialist</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between">
              <Button 
                variant="ghost" 
                onClick={handleSkip}
              >
                Skip
              </Button>
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AngelaOnboarding;