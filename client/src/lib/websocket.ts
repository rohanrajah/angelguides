// WebSocket connection manager
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const messageQueue: any[] = [];
const messageHandlers: Map<string, Function[]> = new Map();

// Connect to the WebSocket server
export function connectWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  
  // Clean up any existing socket
  if (socket) {
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
    socket.close();
  }
  
  // Create WebSocket with the correct protocol and path
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  
  // In Replit environment, we can use the host directly since Vite proxies to the server
  // Make the WebSocket URL relative to ensure it connects to the same origin
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  console.log(`Connecting to WebSocket at ${wsUrl}`);
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("WebSocket connection established");
    
    // Process any queued messages
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    }
  };
  
  socket.onclose = (event) => {
    console.log("WebSocket connection closed", event.code, event.reason);
    
    // Attempt to reconnect unless this was a normal closure
    if (event.code !== 1000) {
      scheduleReconnect();
    }
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    socket?.close();
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
}

// Close the WebSocket connection
export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (socket) {
    socket.onclose = null; // Prevent reconnect
    socket.close(1000, "Normal closure");
    socket = null;
  }
}

// Schedule reconnection attempt
function scheduleReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  reconnectTimer = setTimeout(() => {
    console.log("Attempting to reconnect WebSocket...");
    connectWebSocket();
  }, 3000);
}

// Send a message through the WebSocket
export function sendMessage(type: string, payload: any) {
  const message = { type, payload };
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    // Queue message to be sent when connection is established
    messageQueue.push(message);
    
    // Ensure connection is being attempted
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      connectWebSocket();
    }
  }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(data: any) {
  const { type, payload } = data;
  
  // Call all registered handlers for this message type
  if (messageHandlers.has(type)) {
    messageHandlers.get(type)?.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in handler for message type "${type}":`, error);
      }
    });
  }
}

// Register a handler for a specific message type
export function onMessage(type: string, handler: Function) {
  if (!messageHandlers.has(type)) {
    messageHandlers.set(type, []);
  }
  
  messageHandlers.get(type)?.push(handler);
  
  // Return unsubscribe function
  return () => {
    const handlers = messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  };
}

// Auto-connect when this module is imported
if (typeof window !== 'undefined') {
  // Only connect in browser environment
  connectWebSocket();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    disconnectWebSocket();
  });
}