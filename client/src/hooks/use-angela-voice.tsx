import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAngelaVoiceProps {
  text: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

// Audio context fallback for browsers where speech synthesis doesn't work
const createAudioElement = (text: string): HTMLAudioElement | null => {
  try {
    // Encode the text for URL safety
    const encodedText = encodeURIComponent(text);
    // Create a URL for Google's TTS API
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;
    
    // Create an audio element
    const audio = new Audio(url);
    return audio;
  } catch (error) {
    console.error('Error creating audio element:', error);
    return null;
  }
};

export const useAngelaVoice = ({
  text,
  autoPlay = true,
  onStart,
  onEnd
}: UseAngelaVoiceProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Initialize voices if needed
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Some browsers need this hack to get voices loaded correctly
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
        setVoicesLoaded(true);
      };
      
      // Check if voices are already loaded
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoicesLoaded(true);
      } else {
        // Wait for voices to be loaded
        window.speechSynthesis.onvoiceschanged = loadVoices;
        // Fallback timeout in case onvoiceschanged doesn't fire
        setTimeout(loadVoices, 1000);
      }
    }
  }, []);

  // Stop any current speech
  const stop = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Stop speech synthesis if available
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Stop audio fallback if available
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }
    
    setIsSpeaking(false);
    onEnd?.();
  }, [onEnd]);

  // Speak the provided text
  const speak = useCallback((textToSpeak: string = text) => {
    if (!textToSpeak || textToSpeak.trim() === '') return;
    
    // Stop any previous speech
    stop();
    
    try {
      // First try using the Web Speech API
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Create a new speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;
        
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
        utterance.pitch = 1.2;   // Slightly higher pitch
        utterance.rate = 1.0;    // Normal rate
        utterance.volume = 1.0;  // Full volume
        
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
          // Fallback to audio element
          tryAudioFallback(textToSpeak);
        };
        
        // Start speaking
        window.speechSynthesis.speak(utterance);
        
        // Chrome bug workaround - resumes if paused
        setTimeout(() => {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 100);
      } else {
        // If Web Speech API is not available, use the audio fallback
        tryAudioFallback(textToSpeak);
      }
    } catch (error) {
      console.error('Error with speech synthesis:', error);
      // Try fallback if main approach fails
      tryAudioFallback(textToSpeak);
    }
  }, [text, stop, onStart, onEnd]);
  
  // Fallback method using audio element
  const tryAudioFallback = useCallback((textToSpeak: string) => {
    const audio = createAudioElement(textToSpeak);
    
    if (audio) {
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsSpeaking(true);
        onStart?.();
      };
      
      audio.onended = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsSpeaking(false);
        onEnd?.();
      };
      
      audio.play().catch(err => {
        console.error('Audio playback prevented:', err);
        setIsSpeaking(false);
        onEnd?.();
      });
    } else {
      setIsSpeaking(false);
      onEnd?.();
    }
  }, [onStart, onEnd]);

  // Auto-play the speech when text changes
  useEffect(() => {
    if (text && autoPlay && voicesLoaded) {
      // Small delay to ensure voices are loaded
      const timer = setTimeout(() => {
        speak(text);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [text, autoPlay, speak, voicesLoaded]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSpeaking,
    speak,
    stop
  };
};