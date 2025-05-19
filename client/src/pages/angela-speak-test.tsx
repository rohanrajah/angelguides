import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Square, Volume2, VolumeX } from 'lucide-react';

const AngelaSpeakTest: React.FC = () => {
  const [text, setText] = useState("Hello, I'm Angela, your spiritual guide. How can I help you with your journey today?");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Simple direct speech synthesis
  const speak = () => {
    if (!text || isMuted) return;

    setError(null);
    setStatus('Speaking...');
    
    try {
      // Cancel any ongoing speech first
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      synthesisRef.current = utterance;
      
      // Configure voice settings
      utterance.rate = 1.0;   // Normal rate
      utterance.pitch = 1.2;  // Slightly higher for feminine voice
      utterance.volume = 1.0;
      
      // Try to find a female voice
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => v.name).join(', '));
      
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('woman') ||
        v.name.toLowerCase().includes('girl') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('victoria')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        console.log('Using voice:', femaleVoice.name);
      } else {
        console.log('No female voice found, using default');
      }
      
      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setStatus('Speaking...');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setStatus('Finished');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
        setStatus('Error');
        setError(`Speech error: ${event.error}`);
        
        // Try audio fallback if speech fails
        useFallbackAudio();
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
      
      // Workaround for Chrome bug that stops speech after 15 seconds
      const intervalId = setInterval(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 5000);
      
      // Clear interval when speech ends
      utterance.onend = () => {
        clearInterval(intervalId);
        setIsSpeaking(false);
        setStatus('Finished');
      };
      
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setError(`Speech error: ${err}`);
      setStatus('Error');
      setIsSpeaking(false);
      
      // Fallback to audio if speech fails
      useFallbackAudio();
    }
  };

  // Use an audio element as fallback
  const useFallbackAudio = () => {
    try {
      // Create an audio element with a male voice (still better than nothing)
      const audio = new Audio();
      audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-US&client=tw-ob&q=${encodeURIComponent(text.substring(0, 150))}`;
      audioRef.current = audio;
      
      audio.onplay = () => {
        setIsSpeaking(true);
        setStatus('Playing audio fallback');
      };
      
      audio.onended = () => {
        setIsSpeaking(false);
        setStatus('Finished (audio fallback)');
      };
      
      audio.onerror = (e) => {
        setError('Audio fallback failed');
        setStatus('Failed');
        setIsSpeaking(false);
      };
      
      audio.play();
    } catch (err) {
      console.error('Audio fallback error:', err);
      setError(`Audio fallback error: ${err}`);
      setStatus('All speech methods failed');
    }
  };

  // Stop any ongoing speech
  const stop = () => {
    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsSpeaking(false);
    setStatus('Stopped');
  };

  // Toggle mute state
  const toggleMute = () => {
    if (!isMuted && isSpeaking) {
      stop();
    }
    setIsMuted(!isMuted);
  };

  // Make sure voices are loaded (needed in some browsers)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Force voices to load
      window.speechSynthesis.getVoices();
      
      // Add listener for when voices change/load
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log(`Loaded ${voices.length} voices`);
      };
      
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      
      // Clean up
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        if (isSpeaking) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [isSpeaking]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-indigo-300/20 shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Angela Speaking Test
          </h1>
          
          <div className="space-y-6">
            {/* Status display */}
            <div className="bg-white/10 rounded-lg p-4 text-white">
              <div className="flex justify-between">
                <div className="font-semibold">Status: {status}</div>
                <div className={isSpeaking ? "text-green-400" : "text-gray-400"}>
                  {isSpeaking ? "Speaking..." : "Silent"}
                </div>
              </div>
              
              {error && (
                <div className="mt-2 text-red-300 text-sm bg-red-900/20 p-2 rounded">
                  Error: {error}
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                size="lg"
                className={`${
                  isSpeaking 
                    ? "bg-red-700/70 hover:bg-red-800/90 text-white border-red-500/50" 
                    : "bg-green-700/70 hover:bg-green-800/90 text-white border-green-500/50"
                }`}
                onClick={isSpeaking ? stop : speak}
              >
                {isSpeaking ? (
                  <><Square className="mr-2 h-4 w-4" /> Stop</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Speak</>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="bg-indigo-700/50 hover:bg-indigo-800/70 text-white border-indigo-500/50"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Input field */}
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                Text for Angela to speak:
              </label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-white/10 border-indigo-300/30 text-white"
                placeholder="Enter text for Angela to speak..."
              />
              
              <div className="flex justify-end mt-2">
                <Button
                  onClick={speak}
                  disabled={isSpeaking || !text.trim() || isMuted}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  Speak This Text
                </Button>
              </div>
            </div>
            
            {/* Voice debug info */}
            <div className="mt-6 text-xs text-indigo-200/70 p-2 bg-indigo-950/30 rounded">
              <p>Debugging Information:</p>
              <p>Speech Synthesis Available: {typeof window !== 'undefined' && 'speechSynthesis' in window ? 'Yes' : 'No'}</p>
              <p>Audio Element Available: {typeof window !== 'undefined' && 'Audio' in window ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AngelaSpeakTest;