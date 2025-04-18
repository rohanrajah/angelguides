import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Video, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { connectWebSocket, onMessage } from '@/lib/websocket';

interface OnlineStatusIndicatorProps {
  advisorId: number;
  initialOnlineStatus: boolean;
  onInitiateChat?: () => void;
  onInitiateAudioCall?: () => void;
  onInitiateVideoCall?: () => void;
  showButtons?: boolean;
}

export function OnlineStatusIndicator({
  advisorId,
  initialOnlineStatus,
  onInitiateChat,
  onInitiateAudioCall,
  onInitiateVideoCall,
  showButtons = true
}: OnlineStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(initialOnlineStatus);
  
  useEffect(() => {
    // Ensure WebSocket is connected
    connectWebSocket();
    
    // Listen for advisor status changes
    const unsubscribe = onMessage('advisor_status_change', (payload: { advisorId: number, isOnline: boolean }) => {
      if (payload.advisorId === advisorId) {
        setIsOnline(payload.isOnline);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [advisorId]);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <Badge variant={isOnline ? "default" : "outline"} className="transition-colors">
        {isOnline ? 'Online Now' : 'Offline'}
      </Badge>
      
      {showButtons && isOnline && (
        <div className="flex gap-2 mt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={onInitiateChat}
                  disabled={!onInitiateChat}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={onInitiateAudioCall}
                  disabled={!onInitiateAudioCall}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice Call</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={onInitiateVideoCall}
                  disabled={!onInitiateVideoCall}
                >
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Video Call</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}