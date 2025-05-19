import { useState, useEffect, useCallback } from 'react';

interface UseAngelaVoiceProps {
  text: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

export const useAngelaVoice = ({
  text,
  autoPlay = true,
  onStart,
  onEnd
}: UseAngelaVoiceProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop any current speech synthesis
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    onEnd?.();
  }, [onEnd]);

  // Speak the provided text
  const speak = useCallback((textToSpeak: string = text) => {
    if (!textToSpeak || textToSpeak.trim() === '') return;
    
    try {
      // Cancel any previous speaking
      window.speechSynthesis.cancel();
      
      // Create a new speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Configure the voice - use a female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('female') || 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Moira')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      // Set other properties
      utterance.pitch = 1.1;  // Slightly higher pitch
      utterance.rate = 1.0;   // Normal rate
      utterance.volume = 1.0; // Full volume
      
      // Add event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        onStart?.();
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        onEnd?.();
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      setIsSpeaking(false);
      onEnd?.();
    }
  }, [text, onStart, onEnd]);

  // Auto-play the speech when text changes
  useEffect(() => {
    if (text && autoPlay) {
      speak(text);
    }
    
    // Clean up on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text, autoPlay, speak]);

  return {
    isSpeaking,
    speak,
    stop
  };
};