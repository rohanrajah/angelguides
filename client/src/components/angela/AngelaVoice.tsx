import { useEffect, useRef, useState } from 'react';

interface UseAngelaVoiceProps {
  text: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Hook for Angela AI voice capabilities
 */
const useAngelaVoice = ({
  text,
  autoPlay = true,
  onStart,
  onEnd
}: UseAngelaVoiceProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    // Create speech synthesis functionality
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Clean up previous utterance if exists
      if (speechSynthRef.current) {
        window.speechSynthesis.cancel();
      }

      // Create a new utterance with the text
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice preferences - try to find a female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('female') || 
        voice.name.includes('woman') || 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('victoria')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      // Set other properties
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.2; // Slightly higher pitch for a feminine voice
      utterance.volume = 1.0; // Full volume
      
      // Set event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        if (onStart) onStart();
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      
      // Store reference to the utterance
      speechSynthRef.current = utterance;
      
      // Auto-play if enabled
      if (autoPlay && text) {
        window.speechSynthesis.speak(utterance);
      }
    }
    
    return () => {
      // Clean up on component unmount
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text, autoPlay, onStart, onEnd]);

  // Function to manually start speaking
  const speak = () => {
    if (speechSynthRef.current && !isSpeaking) {
      window.speechSynthesis.speak(speechSynthRef.current);
    }
  };

  // Function to pause/resume speaking
  const togglePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isSpeaking && !isPausedRef.current) {
        window.speechSynthesis.pause();
        isPausedRef.current = true;
      } else if (isPausedRef.current) {
        window.speechSynthesis.resume();
        isPausedRef.current = false;
      }
    }
  };

  // Function to stop speaking
  const stop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (onEnd) onEnd();
    }
  };

  return {
    isSpeaking,
    speak,
    togglePause,
    stop
  };
};

export default useAngelaVoice;