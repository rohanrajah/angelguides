import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';
import { useAngelaVoice } from '@/hooks/use-angela-voice';

const AngelaVoiceTestPage: React.FC = () => {
  const [message, setMessage] = useState("Hello, I'm Angela, your spiritual guide. How can I help you today?");
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Use our Angela voice hook
  const { isSpeaking, speak, stop } = useAngelaVoice({
    text: message,
    autoPlay: false, // We'll control play manually
    onStart: () => console.log("Started speaking"),
    onEnd: () => console.log("Finished speaking")
  });
  
  // Start speaking when the page loads
  useEffect(() => {
    if (!isMuted) {
      // Small delay to ensure voices are loaded
      const timer = setTimeout(() => {
        speak();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isMuted, speak]);
  
  // Handle play button
  const handlePlay = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak();
    }
  };
  
  // Toggle mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stop();
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl p-6 bg-white/10 backdrop-blur-lg border-indigo-200/20 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">Angela Voice Test</h1>
        
        <div className="bg-indigo-800/40 p-4 rounded-lg mb-6 min-h-[120px]">
          <p className="text-white">{message}</p>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-indigo-600/30 border-indigo-400/20 hover:bg-indigo-500/40 text-white"
                onClick={handlePlay}
              >
                {isSpeaking ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-indigo-600/30 border-indigo-400/20 hover:bg-indigo-500/40 text-white"
                onClick={handleToggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="text-white text-sm">
              Status: {isSpeaking ? "Speaking" : "Silent"}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-white text-sm mb-1 block">Test a different message:</label>
            <Input
              placeholder="Enter text for Angela to speak..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white/10 border-indigo-400/30 text-white"
            />
          </div>
          
          <Button 
            onClick={() => speak()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            disabled={isSpeaking || message.trim() === ''}
          >
            Speak This Message
          </Button>
        </div>
        
        <div className="mt-8 pt-4 border-t border-indigo-400/20">
          <h3 className="text-white text-lg mb-2">Instructions</h3>
          <ul className="text-white/80 text-sm space-y-1 list-disc pl-5">
            <li>Enter any text in the input field above</li>
            <li>Click "Speak This Message" to hear Angela speak</li>
            <li>Use the play/pause button to control playback</li>
            <li>Use the volume button to mute/unmute the voice</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default AngelaVoiceTestPage;