import { ReactNode, useEffect, createContext, useContext, useState } from 'react';
import { connectWebSocket, disconnectWebSocket, sendMessage, socket } from '@/lib/websocket';

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (type: string, payload: any) => void;
  userId?: number;
  userType?: string;
}

interface WebSocketProviderProps {
  children: ReactNode;
  userId?: number;
  userType?: string;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => {},
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children, userId, userType }: WebSocketProviderProps) {
  const [connected, setConnected] = useState<boolean>(
    socket ? socket.readyState === WebSocket.OPEN : false
  );

  // Manage WebSocket connection
  useEffect(() => {
    // Handle connection status changes
    const handleSocketOpen = () => setConnected(true);
    const handleSocketClose = () => setConnected(false);
    
    // Initialize connection
    connectWebSocket();
    
    // Add event listeners
    if (socket) {
      socket.addEventListener('open', handleSocketOpen);
      socket.addEventListener('close', handleSocketClose);
      
      // Update initial state
      setConnected(socket.readyState === WebSocket.OPEN);
    }
    
    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.removeEventListener('open', handleSocketOpen);
        socket.removeEventListener('close', handleSocketClose);
      }
    };
  }, []);

  // Authenticate with the WebSocket server when user ID changes
  useEffect(() => {
    if (userId && userType && connected) {
      try {
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
  }, [userId, userType, connected]);
  
  // Context value
  const contextValue: WebSocketContextType = {
    connected,
    sendMessage,
    userId,
    userType,
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}