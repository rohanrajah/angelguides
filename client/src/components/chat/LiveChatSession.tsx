import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Send, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  X
} from 'lucide-react';
import { connectWebSocket, disconnectWebSocket, sendMessage, onMessage } from '@/lib/websocket';
import { VideoCallContainer } from '@/components/chat/VideoCallContainer';
import { AudioCallContainer } from '@/components/chat/AudioCallContainer';

interface Message {
  id?: number;
  senderId: number;
  content: string;
  timestamp: Date | string;
  isUser: boolean;
}

interface LiveChatSessionProps {
  sessionId: number;
  userId: number;
  participantId: number;
  participantName: string;
  participantAvatar?: string;
  onClose: () => void;
}

export function LiveChatSession({
  sessionId,
  userId,
  participantId,
  participantName,
  participantAvatar,
  onClose
}: LiveChatSessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [mode, setMode] = useState<'chat' | 'audio' | 'video'>('chat');
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to websocket on component mount
  useEffect(() => {
    // Load previous messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${userId}/${participantId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = data.map((msg: any) => ({
            ...msg,
            isUser: msg.senderId === userId
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    // Set up WebSocket message handling
    const unsubscribe = onMessage('chat_message', (payload: any) => {
      if (payload.sessionId === sessionId) {
        const newMsg = {
          senderId: payload.senderId,
          content: payload.content,
          timestamp: new Date(payload.timestamp),
          isUser: payload.senderId === userId
        };
        
        setMessages(prev => [...prev, newMsg]);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [sessionId, userId, participantId]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Send via WebSocket
    sendMessage('chat_message', {
      recipientId: participantId,
      content: newMessage,
      sessionId
    });
    
    // Optimistically add to UI
    const message: Message = {
      senderId: userId,
      content: newMessage,
      timestamp: new Date(),
      isUser: true
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };
  
  // Handle switching communication modes
  const switchToChat = () => {
    setMode('chat');
    setIsAudioOn(false);
    setIsVideoOn(false);
  };
  
  const switchToAudio = () => {
    if (mode === 'audio') {
      setIsAudioOn(!isAudioOn);
      // If turning on, send signal to start call
      if (!isAudioOn) {
        sendMessage('signal_offer', {
          target: participantId,
          signal: { type: 'audio' },
          sessionId
        });
      } else {
        // If turning off, end the call
        sendMessage('signal_end', {
          target: participantId,
          sessionId
        });
      }
    } else {
      setMode('audio');
      setIsAudioOn(true);
      setIsVideoOn(false);
      
      // Send signal to start call
      sendMessage('signal_offer', {
        target: participantId,
        signal: { type: 'audio' },
        sessionId
      });
    }
  };
  
  const switchToVideo = () => {
    if (mode === 'video') {
      setIsVideoOn(!isVideoOn);
      // Toggle video within existing call
      if (!isVideoOn) {
        sendMessage('signal_offer', {
          target: participantId,
          signal: { type: 'video' },
          sessionId
        });
      } else {
        // Switch back to audio only
        sendMessage('signal_update', {
          target: participantId,
          signal: { type: 'audio' },
          sessionId
        });
      }
    } else {
      setMode('video');
      setIsVideoOn(true);
      setIsAudioOn(true);
      
      // Send signal to start video call
      sendMessage('signal_offer', {
        target: participantId,
        signal: { type: 'video' },
        sessionId
      });
    }
  };
  
  // Handle ending the session
  const handleEndSession = () => {
    sendMessage('end_session', {
      participantId,
      sessionId
    });
    
    onClose();
  };
  
  return (
    <Card className="w-full max-w-3xl shadow-lg">
      <CardHeader className="bg-muted/20 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={participantAvatar} />
              <AvatarFallback>
                {participantName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{participantName}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {sessionId ? `Session #${sessionId}` : 'New Conversation'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={switchToChat}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
            
            <Button
              variant={mode === 'audio' ? 'default' : 'outline'}
              size="sm"
              onClick={switchToAudio}
            >
              {isAudioOn && mode === 'audio' ? (
                <MicOff className="h-4 w-4 mr-1" />
              ) : (
                <Phone className="h-4 w-4 mr-1" />
              )}
              Audio
            </Button>
            
            <Button
              variant={mode === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={switchToVideo}
            >
              {isVideoOn && mode === 'video' ? (
                <CameraOff className="h-4 w-4 mr-1" />
              ) : (
                <Video className="h-4 w-4 mr-1" />
              )}
              Video
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndSession}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {mode === 'chat' && (
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                <p>Start your conversation with {participantName}</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {mode === 'audio' && (
          <div className="h-[500px]">
            {isAudioOn ? (
              <AudioCallContainer
                sessionId={sessionId}
                participantId={participantId}
                participantName={participantName}
                participantAvatar={participantAvatar}
                isInitiator={true}
                onEnd={() => {
                  setIsAudioOn(false);
                  setMode('chat');
                }}
              />
            ) : (
              <div className="h-full bg-muted/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-lg">Starting audio call...</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {mode === 'video' && (
          <div className="h-[500px]">
            {isVideoOn ? (
              <VideoCallContainer
                sessionId={sessionId}
                participantId={participantId}
                isInitiator={true}
                onEnd={() => {
                  setIsVideoOn(false);
                  setMode('chat');
                }}
              />
            ) : (
              <div className="h-full bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
                  <p className="text-lg">Starting video call...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {mode === 'chat' && (
        <CardFooter className="p-4 border-t">
          <div className="flex w-full items-center gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}