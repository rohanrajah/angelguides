// WebSocket connection handler for AngelGuides.ai
// This handles the websocket connection, reconnection,
// message sending, and subscription

// Store the WebSocket connection
let socket: WebSocket | null = null;

// Connection status
let isConnecting = false;

// Message listeners
type MessageListener = (payload: any) => void;
const messageListeners = new Map<string, Set<MessageListener>>();

// Create a WebSocket connection
export function connectWebSocket() {
  // Do not attempt to connect if already connecting or if connection exists
  if (isConnecting || (socket && socket.readyState === WebSocket.OPEN)) {
    return;
  }
  
  isConnecting = true;
  
  try {
    // Determine WebSocket protocol based on page protocol
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    socket = new WebSocket(wsUrl);
    
    // Set up connection handlers
    socket.onopen = () => {
      console.log("WebSocket connection established");
      isConnecting = false;
    };
    
    socket.onclose = (event) => {
      console.log("WebSocket connection closed", event.code, event.reason);
      isConnecting = false;
      socket = null;
      
      // Auto-reconnect after a delay
      setTimeout(() => {
        console.log("Attempting to reconnect WebSocket...");
        connectWebSocket();
      }, 3000);
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      isConnecting = false;
    };
    
    // Handle incoming messages
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;
        
        // Handle ping messages specially to maintain connection
        if (type === 'ping') {
          sendMessage('pong', {});
          return;
        }
        
        // Notify all listeners for this message type
        if (messageListeners.has(type)) {
          const listeners = messageListeners.get(type)!;
          listeners.forEach(listener => {
            try {
              listener(payload);
            } catch (err) {
              console.error(`Error in listener for ${type}:`, err);
            }
          });
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
  } catch (error) {
    console.error("Failed to connect WebSocket:", error);
    isConnecting = false;
  }
}

// Disconnect WebSocket
export function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

// Send a message through the WebSocket
export function sendMessage(type: string, payload: any) {
  // Connect if not connected
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connectWebSocket();
    
    // Queue the message to be sent when connection is established
    if (socket) {
      socket.addEventListener('open', () => {
        sendMessage(type, payload);
      }, { once: true });
    }
    
    return;
  }
  
  // Send the message
  const message = JSON.stringify({ type, payload });
  socket.send(message);
}

// Subscribe to a specific message type
export function onMessage(type: string, callback: MessageListener): () => void {
  if (!messageListeners.has(type)) {
    messageListeners.set(type, new Set());
  }
  
  const listeners = messageListeners.get(type)!;
  listeners.add(callback);
  
  // Make sure WebSocket is connected
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connectWebSocket();
  }
  
  // Return unsubscribe function
  return () => {
    if (messageListeners.has(type)) {
      const listeners = messageListeners.get(type)!;
      listeners.delete(callback);
      
      // Clean up empty listener sets
      if (listeners.size === 0) {
        messageListeners.delete(type);
      }
    }
  };
}

// Initialize connection on load
if (typeof window !== 'undefined') {
  connectWebSocket();
  
  // Reconnect on page focus
  window.addEventListener('focus', () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    }
  });
}