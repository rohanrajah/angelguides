import { useEffect, useState } from 'react';
import { onMessage } from '@/lib/websocket';

interface UseWebSocketDataOptions<T> {
  messageType: string;
  initialData?: T | null;
  transformData?: (data: any) => T;
}

export function useWebSocketData<T = any>({ 
  messageType, 
  initialData = null,
  transformData = (data: any) => data as T
}: UseWebSocketDataOptions<T>) {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    setIsLoading(true);
    
    // Subscribe to WebSocket messages of the specified type
    const unsubscribe = onMessage(messageType, (payload: any) => {
      try {
        const transformedData = transformData(payload);
        setData(transformedData);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    });
    
    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, [messageType, transformData]);
  
  return { data, isLoading, error };
}