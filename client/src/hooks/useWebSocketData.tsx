import { useState, useEffect } from 'react';
import { socket, onMessage } from '@/lib/websocket';

interface UseWebSocketDataProps<T> {
  messageType: string;
  initialData?: T;
  transformData?: (payload: any) => T;
}

/**
 * Custom hook for handling WebSocket data streams.
 * Subscribes to a specific message type and updates state when new messages arrive.
 */
export function useWebSocketData<T>({
  messageType,
  initialData,
  transformData = (payload) => payload as T,
}: UseWebSocketDataProps<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [connected, setConnected] = useState<boolean>(
    socket ? socket.readyState === WebSocket.OPEN : false
  );

  useEffect(() => {
    // Update connection status when socket changes
    const handleSocketOpen = () => setConnected(true);
    const handleSocketClose = () => setConnected(false);
    
    if (socket) {
      // Check current state
      setConnected(socket.readyState === WebSocket.OPEN);
      
      // Add event listeners
      socket.addEventListener('open', handleSocketOpen);
      socket.addEventListener('close', handleSocketClose);
    }
    
    // Handle messages of the specified type
    const unsubscribe = onMessage(messageType, (payload: any) => {
      try {
        const transformedData = transformData(payload);
        setData(transformedData);
      } catch (error) {
        console.error(`Error handling ${messageType} message:`, error);
      }
    });
    
    return () => {
      // Clean up event listeners
      if (socket) {
        socket.removeEventListener('open', handleSocketOpen);
        socket.removeEventListener('close', handleSocketClose);
      }
      
      // Unsubscribe from message handler
      unsubscribe();
    };
  }, [messageType, transformData]);

  return { data, connected };
}