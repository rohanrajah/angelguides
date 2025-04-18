import { ReactNode, useEffect } from 'react';
import { connectWebSocket, sendMessage } from '@/lib/websocket';
import { UserType } from '@shared/schema';

interface WebSocketProviderProps {
  children: ReactNode;
  userId?: number;
  userType?: string;
}

export function WebSocketProvider({ children, userId, userType }: WebSocketProviderProps) {
  // Authenticate with the WebSocket server when user ID changes
  useEffect(() => {
    if (userId && userType) {
      try {
        // Ensure WebSocket is connected
        connectWebSocket();
        
        // Authenticate with WebSocket server
        sendMessage('authenticate', {
          userId,
          userType
        });
        
        console.log('WebSocket authentication sent for user', userId, userType);
      } catch (error) {
        console.error('Error in WebSocket authentication:', error);
      }
    }
  }, [userId, userType]);
  
  return <>{children}</>;
}