import { WebSocket } from 'ws';

export interface ConnectedUser {
  id: number;
  socket: WebSocket;
  lastHeartbeat: Date;
  sessionIds: Set<number>;
}

export class WebSocketManager {
  private connections = new Map<number, ConnectedUser>();
  private sessionUsers = new Map<number, Set<number>>(); // sessionId -> Set of userIds

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket: WebSocket, userId: number): void {
    const connectedUser: ConnectedUser = {
      id: userId,
      socket,
      lastHeartbeat: new Date(),
      sessionIds: new Set()
    };

    this.connections.set(userId, connectedUser);
    
    // Set up heartbeat mechanism
    this.setupHeartbeat(socket, userId);
    
    console.log(`User ${userId} connected via WebSocket`);
  }

  /**
   * Handle user disconnection
   */
  handleDisconnection(userId: number): void {
    const user = this.connections.get(userId);
    if (!user) return;

    // Remove user from all sessions
    user.sessionIds.forEach(sessionId => {
      this.removeUserFromSession(userId, sessionId);
    });

    // Remove the connection
    this.connections.delete(userId);
    
    console.log(`User ${userId} disconnected from WebSocket`);
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: number, message: any): boolean {
    const user = this.connections.get(userId);
    if (!user || user.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      user.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to user ${userId}:`, error);
      this.handleDisconnection(userId);
      return false;
    }
  }

  /**
   * Broadcast message to all connected users
   */
  broadcast(message: any, excludeUsers?: number[]): void {
    const excludeSet = new Set(excludeUsers || []);
    
    this.connections.forEach((user, userId) => {
      if (!excludeSet.has(userId)) {
        this.sendToUser(userId, message);
      }
    });
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUsers(): number[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: number): boolean {
    const user = this.connections.get(userId);
    return user !== undefined && user.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Add user to session
   */
  addUserToSession(userId: number, sessionId: number): void {
    const user = this.connections.get(userId);
    if (!user) return;

    user.sessionIds.add(sessionId);
    
    if (!this.sessionUsers.has(sessionId)) {
      this.sessionUsers.set(sessionId, new Set());
    }
    this.sessionUsers.get(sessionId)!.add(userId);
  }

  /**
   * Remove user from session
   */
  removeUserFromSession(userId: number, sessionId: number): void {
    const user = this.connections.get(userId);
    if (user) {
      user.sessionIds.delete(sessionId);
    }

    const sessionUserSet = this.sessionUsers.get(sessionId);
    if (sessionUserSet) {
      sessionUserSet.delete(userId);
      if (sessionUserSet.size === 0) {
        this.sessionUsers.delete(sessionId);
      }
    }
  }

  /**
   * Get sessions that a user is part of
   */
  getUserSessions(userId: number): number[] {
    const user = this.connections.get(userId);
    return user ? Array.from(user.sessionIds) : [];
  }

  /**
   * Get users in a specific session
   */
  getUsersInSession(sessionId: number): number[] {
    const users = this.sessionUsers.get(sessionId);
    return users ? Array.from(users) : [];
  }

  /**
   * Update heartbeat timestamp for user
   */
  updateHeartbeat(userId: number): void {
    const user = this.connections.get(userId);
    if (user) {
      user.lastHeartbeat = new Date();
    }
  }

  /**
   * Get last heartbeat time for user
   */
  getLastHeartbeat(userId: number): Date | null {
    const user = this.connections.get(userId);
    return user ? user.lastHeartbeat : null;
  }

  /**
   * Get connections that haven't sent heartbeat within threshold
   */
  getStaleConnections(thresholdMs: number): number[] {
    const now = new Date();
    const staleUsers: number[] = [];

    this.connections.forEach((user, userId) => {
      const timeSinceHeartbeat = now.getTime() - user.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > thresholdMs) {
        staleUsers.push(userId);
      }
    });

    return staleUsers;
  }

  /**
   * Set up heartbeat mechanism for socket
   */
  private setupHeartbeat(socket: WebSocket, userId: number): void {
    socket.on('pong', () => {
      this.updateHeartbeat(userId);
    });

    socket.on('message', (data) => {
      const message = data.toString();
      if (message === 'ping') {
        socket.send('pong');
        this.updateHeartbeat(userId);
      }
    });

    // Send periodic ping
    const interval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      } else {
        clearInterval(interval);
      }
    }, 30000); // 30 seconds

    socket.on('close', () => {
      clearInterval(interval);
      this.handleDisconnection(userId);
    });
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(thresholdMs: number = 60000): void {
    const staleUsers = this.getStaleConnections(thresholdMs);
    staleUsers.forEach(userId => {
      const user = this.connections.get(userId);
      if (user) {
        user.socket.terminate();
        this.handleDisconnection(userId);
      }
    });
  }
}