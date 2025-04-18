import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff
} from 'lucide-react';
import { sendMessage } from '@/lib/websocket';

interface VideoCallContainerProps {
  sessionId: number;
  participantId: number;
  isInitiator: boolean;
  onEnd: () => void;
}

export function VideoCallContainer({
  sessionId,
  participantId,
  isInitiator,
  onEnd
}: VideoCallContainerProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  // Initialize media devices and WebRTC
  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    
    const initCall = async () => {
      try {
        // Request user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        
        // Set local video stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
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
        
        // Handle incoming tracks
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setIsCallActive(true);
            setIsConnecting(false);
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
        
        // If we're the initiator, create and send the offer
        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          sendMessage('signal_offer', {
            target: participantId,
            signal: { sdp: offer },
            sessionId
          });
        }
        
      } catch (error) {
        console.error('Error initializing call:', error);
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
          signal: { sdp: answer },
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
    
    // Subscribe to messages
    const unsubscribeOffer = onMessage('signal_offer', handleSignalOffer);
    const unsubscribeAnswer = onMessage('signal_answer', handleSignalAnswer);
    const unsubscribeIceCandidate = onMessage('signal_ice_candidate', handleSignalIceCandidate);
    
    return () => {
      // Clean up
      unsubscribeOffer();
      unsubscribeAnswer();
      unsubscribeIceCandidate();
      
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
  
  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing, restore camera
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: isAudioEnabled,
          video: isVideoEnabled
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        localStreamRef.current = stream;
        
        // Replace tracks in peer connection
        const pc = peerConnectionRef.current;
        if (pc) {
          const senders = pc.getSenders();
          senders.forEach(sender => {
            if (sender.track?.kind === 'video') {
              const track = stream.getVideoTracks()[0];
              if (track) sender.replaceTrack(track);
            }
          });
        }
        
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Keep audio from current stream
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            stream.addTrack(audioTrack);
          }
        }
        
        // Replace video track in peer connection
        const pc = peerConnectionRef.current;
        if (pc) {
          const senders = pc.getSenders();
          senders.forEach(sender => {
            if (sender.track?.kind === 'video') {
              const track = stream.getVideoTracks()[0];
              if (track) sender.replaceTrack(track);
            }
          });
        }
        
        // Handle the case when user stops screen sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenSharing();
        };
        
        localStreamRef.current = stream;
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen sharing:', error);
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
    
    onEnd();
  };
  
  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0 relative">
        <div className="w-full h-[500px] bg-black relative">
          {/* Remote Video (Large) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Small PiP) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-muted rounded-lg overflow-hidden border-2 border-background">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Connection Status Overlay */}
          {isConnecting && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
                <p className="text-white text-lg">Connecting...</p>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 p-2 bg-background/80 rounded-full">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full ${!isAudioEnabled ? 'bg-destructive text-destructive-foreground' : ''}`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic /> : <MicOff />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full ${!isVideoEnabled ? 'bg-destructive text-destructive-foreground' : ''}`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Camera /> : <CameraOff />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full ${isScreenSharing ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={toggleScreenSharing}
            >
              {isScreenSharing ? <ScreenShareOff /> : <ScreenShare />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full"
              onClick={endCall}
            >
              <PhoneOff />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}