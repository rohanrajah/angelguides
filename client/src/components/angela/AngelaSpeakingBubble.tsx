import React, { useState, useEffect, useRef } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface AngelaSpeakingBubbleProps {
  message: string;
  isActive: boolean;
  avatarSrc?: string;
  videoSrc?: string;
}

const AngelaSpeakingBubble: React.FC<AngelaSpeakingBubbleProps> = ({
  message,
  isActive,
  avatarSrc,
  videoSrc
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
      
      // Get available voices
      const populateVoiceList = () => {
        const voices = synthesisRef.current?.getVoices() || [];
        // Preferably select a female voice
        const femaleVoice = voices.find(voice => 
          voice.name.includes('female') || 
          voice.name.includes('woman') || 
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('victoria')
        );
        
        if (femaleVoice && utteranceRef.current) {
          utteranceRef.current.voice = femaleVoice;
        }
      };
      
      // Chrome loads voices asynchronously
      if (synthesisRef.current.onvoiceschanged !== undefined) {
        synthesisRef.current.onvoiceschanged = populateVoiceList;
      }
      
      populateVoiceList();
    }
    
    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);
  
  // Create and configure utterance when message changes
  useEffect(() => {
    if (!synthesisRef.current || isMuted) return;
    
    // Create new utterance with the message
    const utterance = new SpeechSynthesisUtterance(message);
    utteranceRef.current = utterance;
    
    // Set voice properties
    const voices = synthesisRef.current.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('female') || 
      voice.name.includes('woman') || 
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('victoria')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    // Configure other properties for a pleasant voice
    utterance.rate = 1.0;  // Normal speed
    utterance.pitch = 1.2; // Slightly higher pitch for female voice
    utterance.volume = 1.0; 
    
    // Set event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error("Audio playback prevented:", err);
        });
      }
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
    
    // Speak the message if component is active
    if (isActive && !isMuted) {
      synthesisRef.current.cancel(); // Cancel any ongoing speech
      synthesisRef.current.speak(utterance);
    }
    
  }, [message, isActive, isMuted]);
  
  // Toggle mute state
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      // Resume speaking if active
      if (isActive && utteranceRef.current && synthesisRef.current) {
        synthesisRef.current.speak(utteranceRef.current);
      }
    } else {
      setIsMuted(true);
      // Stop speaking
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    }
  };
  
  return (
    <div className="relative w-full max-w-md">
      {/* Angela Bubble with pulsating animation */}
      <motion.div 
        className="relative bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full overflow-hidden aspect-square shadow-lg"
        animate={isActive ? {
          boxShadow: [
            '0 0 0 0 rgba(192, 108, 255, 0.7)',
            '0 0 0 15px rgba(192, 108, 255, 0)',
          ],
        } : {}}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: 'easeInOut',
        }}
      >
        {/* Video or Image */}
        {videoSrc ? (
          <video 
            ref={videoRef}
            className="w-full h-full object-cover rounded-full"
            loop
            muted
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <img 
            src={avatarSrc || '/angela-avatar.png'} 
            alt="Angela AI" 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Concentric circles animation when active */}
        <AnimatePresence>
          {isActive && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border border-white/30"
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-white/20"
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.9, opacity: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut', delay: 0.2 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-white/10"
                initial={{ scale: 0.8, opacity: 0.4 }}
                animate={{ scale: 2.3, opacity: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeOut', delay: 0.4 }}
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Floating speech bubble with the message */}
      <AnimatePresence>
        {message && (
          <motion.div
            className="absolute -top-16 right-0 bg-white rounded-xl p-3 shadow-md max-w-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="text-sm text-gray-700">{message}</div>
            <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mute/Unmute button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleMute}
        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-white shadow"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-red-500" />
        ) : (
          <Volume2 className="h-4 w-4 text-purple-500" />
        )}
      </Button>
    </div>
  );
};

export default AngelaSpeakingBubble;