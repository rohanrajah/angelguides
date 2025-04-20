import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { sendMessage, onMessage } from '@/lib/websocket';

interface AudioCallContainerProps {
  sessionId: number;
  participantId: number;
  participantName: string;
  participantAvatar?: string;
  isInitiator: boolean;
  onEnd: () => void;
}

export function AudioCallContainer({
  sessionId,
  participantId,
  participantName,
  participantAvatar,
  isInitiator,
  onEnd
}: AudioCallContainerProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format call duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Initialize audio call and WebRTC
  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    
    const initCall = async () => {
      try {
        // Request user media (audio only)
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        
        localStreamRef.current = stream;
        
        // Create peer connection
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        peerConnectionRef.current = pc;
        
        // Add tracks to peer connection
        stream.getTracks().forEach(track => {
          if (pc) pc.addTrack(track, stream);
        });
        
        // Handle incoming tracks to play remote audio
        pc.ontrack = (event) => {
          const audioElement = new Audio();
          audioElement.srcObject = event.streams[0];
          audioElement.play().catch(error => {
            console.error('Audio playback failed:', error);
          });
          
          setIsCallActive(true);
          setIsConnecting(false);
          
          // Start call duration timer
          if (!timerRef.current) {
            timerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000);
          }
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendMessage('signal_ice_candidate', {
              target: participantId,
              signal: { candidate: event.candidate },
              sessionId
            });
          }
        };
        
        // Connection state changes
        pc.onconnectionstatechange = () => {
          switch(pc?.connectionState) {
            case 'connected':
              setIsCallActive(true);
              setIsConnecting(false);
              break;
            case 'disconnected':
            case 'failed':
              endCall();
              break;
          }
        };
        
        // If we're the initiator, create and send the offer
        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          sendMessage('signal_offer', {
            target: participantId,
            signal: { sdp: offer, type: 'audio' },
            sessionId
          });
        }
        
      } catch (error) {
        console.error('Error initializing audio call:', error);
        setIsConnecting(false);
      }
    };
    
    initCall();
    
    // Listen for WebRTC signaling messages
    const handleSignalOffer = async (payload: any) => {
      if (payload.sessionId !== sessionId || !payload.from || payload.from !== participantId) return;
      
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        
        await pc.setRemoteDescription(new RTCSessionDescription(payload.signal.sdp));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        sendMessage('signal_answer', {
          target: participantId,
          signal: { sdp: answer, type: 'audio' },
          sessionId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };
    
    const handleSignalAnswer = async (payload: any) => {
      if (payload.sessionId !== sessionId || !payload.from || payload.from !== participantId) return;
      
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        
        await pc.setRemoteDescription(new RTCSessionDescription(payload.signal.sdp));
        setIsConnecting(false);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    };
    
    const handleSignalIceCandidate = async (payload: any) => {
      if (payload.sessionId !== sessionId || !payload.from || payload.from !== participantId) return;
      
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        
        await pc.addIceCandidate(new RTCIceCandidate(payload.signal.candidate));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    };
    
    const handleSignalEnd = (payload: any) => {
      if (payload.sessionId !== sessionId || !payload.from || payload.from !== participantId) return;
      
      endCall();
    };
    
    // Subscribe to messages
    const unsubscribeOffer = onMessage('signal_offer', handleSignalOffer);
    const unsubscribeAnswer = onMessage('signal_answer', handleSignalAnswer);
    const unsubscribeIceCandidate = onMessage('signal_ice_candidate', handleSignalIceCandidate);
    const unsubscribeEnd = onMessage('signal_end', handleSignalEnd);
    
    return () => {
      // Clean up
      unsubscribeOffer();
      unsubscribeAnswer();
      unsubscribeIceCandidate();
      unsubscribeEnd();
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Close peer connection
      if (pc) {
        pc.close();
      }
      
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, participantId, isInitiator]);
  
  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };
  
  // End the call
  const endCall = () => {
    // Notify the other participant
    sendMessage('signal_end', {
      target: participantId,
      sessionId
    });
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    onEnd();
  };
  
  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-6 relative">
        <div className="w-full flex flex-col items-center">
          <Avatar className="h-32 w-32 mb-6">
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className="text-4xl bg-primary/10">
              {participantName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="text-xl font-medium mb-2">{participantName}</h3>
          
          {isConnecting ? (
            <div className="flex flex-col items-center mt-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3"></div>
              <p className="text-muted-foreground">Connecting...</p>
            </div>
          ) : (
            <>
              <p className="text-lg mb-8">
                {isCallActive ? 'Call in progress' : 'Call connected'}
              </p>
              
              <div className="text-primary font-medium mb-8">
                {formatDuration(callDuration)}
              </div>
            </>
          )}
          
          <div className="flex gap-6 mt-4">
            <Button
              variant="outline"
              size="lg"
              className={`rounded-full h-14 w-14 ${!isAudioEnabled ? 'bg-destructive text-destructive-foreground' : ''}`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={endCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}