import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface AngelaGuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
}

const AngelaGuidedTour: React.FC<AngelaGuidedTourProps> = ({ steps, isActive, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    
    const findTarget = () => {
      if (currentStep >= steps.length) {
        onComplete();
        return;
      }
      
      const target = document.querySelector(steps[currentStep].target);
      if (target) {
        setTargetElement(target);
        positionTooltip(target);
        highlightElement(target);
      }
    };
    
    findTarget();
    
    // Recalculate on window resize
    window.addEventListener('resize', findTarget);
    return () => {
      window.removeEventListener('resize', findTarget);
      removeHighlights();
    };
  }, [currentStep, isActive, steps]);
  
  const positionTooltip = (target: Element) => {
    const targetRect = target.getBoundingClientRect();
    const position = steps[currentStep].position;
    
    let x = 0, y = 0;
    
    switch(position) {
      case 'top':
        x = targetRect.left + targetRect.width / 2;
        y = targetRect.top - 10;
        break;
      case 'bottom':
        x = targetRect.left + targetRect.width / 2;
        y = targetRect.bottom + 10;
        break;
      case 'left':
        x = targetRect.left - 10;
        y = targetRect.top + targetRect.height / 2;
        break;
      case 'right':
        x = targetRect.right + 10;
        y = targetRect.top + targetRect.height / 2;
        break;
    }
    
    setTooltipPosition({ x, y });
  };
  
  const highlightElement = (target: Element) => {
    removeHighlights();
    
    // Add highlight class to target
    target.classList.add('angela-tour-highlight');
    
    // Create a pulse effect around the element
    const highlightEl = document.createElement('div');
    highlightEl.className = 'angela-tour-pulse';
    highlightEl.style.position = 'absolute';
    
    const rect = target.getBoundingClientRect();
    highlightEl.style.top = `${rect.top + window.scrollY}px`;
    highlightEl.style.left = `${rect.left + window.scrollX}px`;
    highlightEl.style.width = `${rect.width}px`;
    highlightEl.style.height = `${rect.height}px`;
    highlightEl.style.zIndex = '49';
    
    document.body.appendChild(highlightEl);
  };
  
  const removeHighlights = () => {
    // Remove highlight classes
    const highlighted = document.querySelectorAll('.angela-tour-highlight');
    highlighted.forEach(el => el.classList.remove('angela-tour-highlight'));
    
    // Remove pulse elements
    const pulses = document.querySelectorAll('.angela-tour-pulse');
    pulses.forEach(el => el.remove());
  };
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  const handleSkip = () => {
    onComplete();
  };
  
  if (!isActive || currentStep >= steps.length) return null;

  const currentTourStep = steps[currentStep];
  const position = currentTourStep.position;
  
  return (
    <AnimatePresence>
      <motion.div 
        ref={tooltipRef}
        style={{
          position: 'absolute',
          top: position === 'top' ? tooltipPosition.y - (tooltipRef.current?.offsetHeight || 0) : 
               position === 'bottom' ? tooltipPosition.y : 
               tooltipPosition.y - ((tooltipRef.current?.offsetHeight || 0) / 2),
          left: position === 'left' ? tooltipPosition.x - (tooltipRef.current?.offsetWidth || 0) : 
                position === 'right' ? tooltipPosition.x : 
                tooltipPosition.x - ((tooltipRef.current?.offsetWidth || 0) / 2),
          zIndex: 50,
          pointerEvents: 'auto'
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="fixed"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{currentStep + 1}</span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {currentTourStep.title}
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {currentTourStep.content}
          </p>
          
          <div className="flex justify-between">
            <button 
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip tour
            </button>
            <button 
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm px-3 py-1 rounded-md"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
          
          {/* Arrow pointer based on position */}
          <div className={`absolute w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 
            ${position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2' : 
              position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2' : 
              position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2' : 
              'left-[-8px] top-1/2 -translate-y-1/2'}`}
          ></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AngelaGuidedTour;