import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { WebSocketManager } from '@server/websocket-manager';
import { WebSocket } from 'ws';

// Mock WebSocket constants
const WS_OPEN = 1;

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  let mockWebSocket: Partial<WebSocket>;

  beforeEach(() => {
    wsManager = new WebSocketManager();
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      terminate: vi.fn(),
      ping: vi.fn(),
      readyState: WS_OPEN,
      on: vi.fn(),
      off: vi.fn()
    };
  });

  describe('Connection Management', () => {
    it('should handle new WebSocket connections', () => {
      const userId = 123;
      
      wsManager.handleConnection(mockWebSocket as WebSocket, userId);
      
      expect(wsManager.getConnectedUsers()).toContain(userId);
      expect(wsManager.isUserConnected(userId)).toBe(true);
    });

    it('should track multiple simultaneous connections', () => {
      const user1 = 123;
      const user2 = 456;
      
      wsManager.handleConnection(mockWebSocket as WebSocket, user1);
      wsManager.handleConnection(mockWebSocket as WebSocket, user2);
      
      const connectedUsers = wsManager.getConnectedUsers();
      expect(connectedUsers).toContain(user1);
      expect(connectedUsers).toContain(user2);
      expect(connectedUsers.length).toBe(2);
    });

    it('should handle user disconnection', () => {
      const userId = 123;
      
      wsManager.handleConnection(mockWebSocket as WebSocket, userId);
      expect(wsManager.isUserConnected(userId)).toBe(true);
      
      wsManager.handleDisconnection(userId);
      expect(wsManager.isUserConnected(userId)).toBe(false);
      expect(wsManager.getConnectedUsers()).not.toContain(userId);
    });

    it('should clean up connection data on disconnect', () => {
      const userId = 123;
      const sessionId = 456;
      
      wsManager.handleConnection(mockWebSocket as WebSocket, userId);
      wsManager.addUserToSession(userId, sessionId);
      
      wsManager.handleDisconnection(userId);
      
      expect(wsManager.getUserSessions(userId)).toEqual([]);
    });
  });

  describe('Message Sending', () => {
    it('should send message to connected user', () => {
      const userId = 123;
      const message = { type: 'test', data: 'hello' };
      
      wsManager.handleConnection(mockWebSocket as WebSocket, userId);
      
      const result = wsManager.sendToUser(userId, message);
      
      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should return false when sending to disconnected user', () => {
      const userId = 123;
      const message = { type: 'test', data: 'hello' };
      
      const result = wsManager.sendToUser(userId, message);
      
      expect(result).toBe(false);
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should broadcast message to all connected users', () => {
      const user1 = 123;
      const user2 = 456;
      const mockWs1 = { 
        ...mockWebSocket, 
        send: vi.fn(),
        readyState: WS_OPEN 
      };
      const mockWs2 = { 
        ...mockWebSocket, 
        send: vi.fn(),
        readyState: WS_OPEN 
      };
      const message = { type: 'broadcast', data: 'hello all' };
      
      wsManager.handleConnection(mockWs1 as WebSocket, user1);
      wsManager.handleConnection(mockWs2 as WebSocket, user2);
      
      wsManager.broadcast(message);
      
      expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should broadcast message excluding specified users', () => {
      const user1 = 123;
      const user2 = 456;
      const user3 = 789;
      const mockWs1 = { 
        ...mockWebSocket, 
        send: vi.fn(),
        readyState: WS_OPEN 
      };
      const mockWs2 = { 
        ...mockWebSocket, 
        send: vi.fn(),
        readyState: WS_OPEN 
      };
      const mockWs3 = { 
        ...mockWebSocket, 
        send: vi.fn(),
        readyState: WS_OPEN 
      };
      const message = { type: 'broadcast', data: 'hello' };
      
      wsManager.handleConnection(mockWs1 as WebSocket, user1);
      wsManager.handleConnection(mockWs2 as WebSocket, user2);
      wsManager.handleConnection(mockWs3 as WebSocket, user3);
      
      wsManager.broadcast(message, [user2]);
      
      expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(mockWs2.send).not.toHaveBeenCalled();
      expect(mockWs3.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
  });

  describe('Session Management', () => {
    it('should add user to session', () => {
      const userId = 123;
      const sessionId = 456;
      
      wsManager.handleConnection(mockWebSocket as WebSocket, userId);
      wsManager.addUserToSession(userId, sessionId);
      
      expect(wsManager.getUserSessions(userId)).toContain(sessionId);
    });

    it('should remove user from session', () => {
      const userId = 123;
      const sessionId = 456;
      
      wsManager.handleConnection(mockWebSocket as WebSocket, userId);
      wsManager.addUserToSession(userId, sessionId);
      wsManager.removeUserFromSession(userId, sessionId);
      
      expect(wsManager.getUserSessions(userId)).not.toContain(sessionId);
    });

    it('should get users in session', () => {
      const user1 = 123;
      const user2 = 456;
      const sessionId = 789;
      
      wsManager.handleConnection(mockWebSocket as WebSocket, user1);
      wsManager.handleConnection(mockWebSocket as WebSocket, user2);
      wsManager.addUserToSession(user1, sessionId);
      wsManager.addUserToSession(user2, sessionId);
      
      const usersInSession = wsManager.getUsersInSession(sessionId);
      expect(usersInSession).toContain(user1);
      expect(usersInSession).toContain(user2);
    });
  });

  describe('Heartbeat Mechanism', () => {
    it('should update heartbeat timestamp on activity', () => {
      const userId = 123;
      
      wsManager.handleConnection(mockWebSocket as WebSocket, userId);
      const initialHeartbeat = wsManager.getLastHeartbeat(userId);
      
      // Simulate some delay
      setTimeout(() => {
        wsManager.updateHeartbeat(userId);
        const updatedHeartbeat = wsManager.getLastHeartbeat(userId);
        
        expect(updatedHeartbeat).toBeGreaterThan(initialHeartbeat);
      }, 10);
    });

    it('should identify stale connections', () => {
      const userId = 123;
      const staleThreshold = 1000; // 1 second
      
      wsManager.handleConnection(mockWebSocket as WebSocket, userId);
      
      // Simulate stale connection
      setTimeout(() => {
        const staleConnections = wsManager.getStaleConnections(staleThreshold);
        expect(staleConnections).toContain(userId);
      }, staleThreshold + 100);
    });
  });
});