import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { connectWebSocket, disconnectWebSocket, sendMessage } from '@/lib/websocket';

interface WebSocketContextType {
  sendMessage: (type: string, payload: any) => void;
}

interface WebSocketProviderProps {
  children: ReactNode;
  userId?: number;
  userType?: string;
}

// Create a context for WebSocket
const WebSocketContext = createContext<WebSocketContextType>({
  sendMessage: () => {},
});

export function WebSocketProvider({ children, userId, userType = 'user' }: WebSocketProviderProps) {
  // Authenticate user on connection or userId change
  useEffect(() => {
    if (userId) {
      // Send authentication message
      sendMessage('authenticate', { userId, userType });
      console.log(`WebSocket authentication sent for user ${userId}, ${userType}`);
    }
  }, [userId, userType]);
  
  // Reconnect WebSocket on page focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        connectWebSocket();
        
        // Re-authenticate
        if (userId) {
          sendMessage('authenticate', { userId, userType });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, userType]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);
  
  // Create the context value
  const contextValue: WebSocketContextType = {
    sendMessage,
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to use the WebSocket context
export function useWebSocket() {
  return useContext(WebSocketContext);
}