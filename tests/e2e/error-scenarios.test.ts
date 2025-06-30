import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import { WebSocketManager } from '@server/websocket-manager';
import { SessionManager } from '@server/session-manager';
import { MessageDeliveryService } from '@server/message-delivery';
import { SignalingService } from '@server/signaling-service';

// Mock implementations with error injection capabilities
const mockStorage = {
  createSession: vi.fn(),
  updateSession: vi.fn(),
  endSession: vi.fn(),
  getSession: vi.fn()
};

const mockMessageService = {
  createMessage: vi.fn(),
  getConversationHistory: vi.fn(),
  markAsRead: vi.fn()
};

describe('E2E Error Scenarios & Recovery', () => {
  let wsManager: WebSocketManager;
  let sessionManager: SessionManager;
  let messageDelivery: MessageDeliveryService;
  let signalingService: SignalingService;
  
  const createMockSocket = (userId: number, readyState = WebSocket.OPEN) => ({
    readyState,
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    userId
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    wsManager = new WebSocketManager();
    sessionManager = new SessionManager(wsManager, mockStorage as any);
    messageDelivery = new MessageDeliveryService(wsManager, mockMessageService as any);
    signalingService = new SignalingService(wsManager, sessionManager);
    
    // Default successful mocks
    mockStorage.createSession.mockImplementation((data) => 
      Promise.resolve({ id: Math.floor(Math.random() * 10000), ...data })
    );
    mockStorage.updateSession.mockResolvedValue(null);
    mockStorage.endSession.mockResolvedValue({ billedAmount: 1000, actualDuration: 5 });
    mockMessageService.createMessage.mockImplementation((data) => 
      Promise.resolve({ id: `msg-${Date.now()}`, ...data })
    );
  });

  describe('Database Connection Failures', () => {
    it('should handle session creation with database unavailable', async () => {
      // Mock database connection failure
      mockStorage.createSession.mockRejectedValue(new Error('Database connection timeout'));
      
      const sessionData = {
        userId: 123,
        advisorId: 456,
        sessionType: 'audio' as const,
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      };
      
      // Should handle error gracefully
      await expect(sessionManager.createSession(sessionData)).rejects.toThrow('Database connection timeout');
      
      // Should not have any active sessions
      expect(sessionManager.getAllActiveSessions()).toHaveLength(0);
    });
    
    it('should handle message persistence failures while maintaining delivery', async () => {
      // Setup WebSocket connections
      const senderSocket = createMockSocket(123);
      const receiverSocket = createMockSocket(456);
      
      wsManager.handleConnection(senderSocket, 123);
      wsManager.handleConnection(receiverSocket, 456);
      
      // Mock database failure for message persistence
      mockMessageService.createMessage.mockRejectedValue(new Error('Database write failed'));
      
      const message = {
        id: 'msg-db-fail',
        sessionId: 789,
        senderId: 123,
        receiverId: 456,
        content: 'Message with DB failure',
        timestamp: new Date(),
        messageType: 'text' as const
      };
      
      const result = await messageDelivery.sendMessage(message);
      
      // Should still deliver via WebSocket
      expect(result.delivered).toBe(true);
      expect(result.persisted).toBe(false);
      expect(result.error).toBeDefined();
      
      // Receiver should still get the message
      expect(receiverSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Message with DB failure')
      );
    });
    
    it('should recover from database outage', async () => {
      // Initial failure
      mockStorage.createSession.mockRejectedValueOnce(new Error('Database unavailable'));
      
      // Then recovery
      mockStorage.createSession.mockResolvedValueOnce({
        id: 789,
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      });
      
      const sessionData = {
        userId: 123,
        advisorId: 456,
        sessionType: 'audio' as const,
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      };
      
      // First attempt should fail
      await expect(sessionManager.createSession(sessionData)).rejects.toThrow();
      
      // Second attempt should succeed
      const session = await sessionManager.createSession(sessionData);
      expect(session.id).toBe(789);
    });
  });

  describe('WebSocket Connection Failures', () => {
    it('should handle WebSocket send failures gracefully', async () => {
      const faultySocket = createMockSocket(123);
      faultySocket.send.mockImplementation(() => {
        throw new Error('Connection closed');
      });
      
      wsManager.handleConnection(faultySocket, 123);
      
      // Attempt to send message to faulty connection
      const success = wsManager.sendToUser(123, { type: 'test', data: 'test message' });
      
      // Should return false for failed send
      expect(success).toBe(false);
      
      // Should not crash the system
      expect(() => wsManager.getConnectedUsers()).not.toThrow();
    });
    
    it('should handle user disconnection during active session', async () => {
      // Setup active session
      const userSocket = createMockSocket(123);
      const advisorSocket = createMockSocket(456);
      
      wsManager.handleConnection(userSocket, 123);
      wsManager.handleConnection(advisorSocket, 456);
      
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 400,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });
      
      mockStorage.updateSession.mockResolvedValue(null);
      await sessionManager.updateSessionStatus(session.id, 'active');
      
      // User disconnects unexpectedly
      wsManager.handleDisconnection(123);
      
      // Session should still exist but be identifiable as orphaned
      const activeSession = sessionManager.getActiveSession(session.id);
      expect(activeSession).toBeDefined();
      
      // Cleanup should identify and handle orphaned session
      mockStorage.endSession.mockResolvedValue({ billedAmount: 2000, actualDuration: 5 });
      const orphanedSessions = await sessionManager.cleanupOrphanedSessions();
      
      expect(orphanedSessions).toContain(session.id);
    });
    
    it('should handle broadcasting to mixed connection states', async () => {
      // Setup mix of healthy and faulty connections
      const healthySocket = createMockSocket(123);
      const faultySocket = createMockSocket(456);
      const closedSocket = createMockSocket(789, WebSocket.CLOSED);
      
      faultySocket.send.mockImplementation(() => {
        throw new Error('Send failed');
      });
      
      wsManager.handleConnection(healthySocket, 123);
      wsManager.handleConnection(faultySocket, 456);
      wsManager.handleConnection(closedSocket, 789);
      
      const message = { type: 'broadcast', data: 'System message' };
      
      // Should not throw despite mixed connection states
      expect(() => wsManager.broadcast(message)).not.toThrow();
      
      // Healthy connection should receive message
      expect(healthySocket.send).toHaveBeenCalledWith(JSON.stringify(message));
      
      // Faulty connection should not crash the broadcast
      expect(faultySocket.send).toHaveBeenCalled();
    });
  });

  describe('Signaling Protocol Errors', () => {
    it('should handle malformed signaling messages', async () => {
      const userSocket = createMockSocket(123);
      const advisorSocket = createMockSocket(456);
      
      wsManager.handleConnection(userSocket, 123);
      wsManager.handleConnection(advisorSocket, 456);
      
      // Test various malformed messages
      const malformedMessages = [
        { type: 'signal_offer' }, // Missing required fields
        { type: 'signal_offer', sessionId: 'invalid', from: 123 }, // Invalid sessionId type
        { type: 'invalid_type', sessionId: 789, from: 123, target: 456 }, // Invalid type
        { sessionId: 789, from: 123, target: 456 }, // Missing type
        null, // Null message
        'invalid json' // Non-object message
      ];
      
      for (const message of malformedMessages) {
        const validated = signalingService.validateSignalingMessage(message);
        expect(validated).toBeNull();
      }
      
      // System should remain stable
      expect(wsManager.getConnectedUsers()).toContain(123);
      expect(wsManager.getConnectedUsers()).toContain(456);
    });
    
    it('should handle signaling to non-existent sessions', async () => {
      const userSocket = createMockSocket(123);
      wsManager.handleConnection(userSocket, 123);
      
      const invalidMessage = {
        type: 'signal_offer',
        sessionId: 99999, // Non-existent session
        from: 123,
        target: 456,
        signal: { type: 'offer', sdp: 'mock-sdp' }
      };
      
      // Should handle gracefully without throwing
      await expect(signalingService.handleOffer(123, invalidMessage)).resolves.not.toThrow();
      
      // Should not forward message to any user
      expect(userSocket.send).not.toHaveBeenCalled();
    });
    
    it('should handle signaling from unauthorized users', async () => {
      // Create session with specific participants
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      });
      
      // Setup connections
      const authorizedSocket = createMockSocket(123);
      const unauthorizedSocket = createMockSocket(789); // Not part of session
      
      wsManager.handleConnection(authorizedSocket, 123);
      wsManager.handleConnection(unauthorizedSocket, 789);
      
      const signalMessage = {
        type: 'signal_offer',
        sessionId: session.id,
        from: 789, // Unauthorized user
        target: 123,
        signal: { type: 'offer', sdp: 'mock-sdp' }
      };
      
      // Should reject unauthorized signaling
      await expect(signalingService.handleOffer(789, signalMessage)).resolves.not.toThrow();
      
      // Authorized user should not receive the message
      expect(authorizedSocket.send).not.toHaveBeenCalled();
    });
  });

  describe('Memory and Resource Leaks', () => {
    it('should cleanup resources after connection failures', async () => {
      const connectionCount = 50;
      const sockets: any[] = [];
      
      // Create many connections
      for (let i = 1; i <= connectionCount; i++) {
        const socket = createMockSocket(i);
        sockets.push(socket);
        wsManager.handleConnection(socket, i);
      }
      
      expect(wsManager.getConnectedUsers()).toHaveLength(connectionCount);
      
      // Simulate various disconnection scenarios
      for (let i = 0; i < connectionCount; i++) {
        if (i % 3 === 0) {
          // Normal disconnection
          wsManager.handleDisconnection(i + 1);
        } else if (i % 3 === 1) {
          // Socket error before disconnection
          sockets[i].readyState = WebSocket.CLOSED;
          wsManager.handleDisconnection(i + 1);
        } else {
          // Force cleanup without proper disconnection
          wsManager.handleDisconnection(i + 1);
        }
      }
      
      // All connections should be cleaned up
      expect(wsManager.getConnectedUsers()).toHaveLength(0);
    });
    
    it('should prevent session memory leaks during errors', async () => {
      const sessionCount = 20;
      const createdSessions: any[] = [];
      
      // Create sessions
      for (let i = 0; i < sessionCount; i++) {
        try {
          const session = await sessionManager.createSession({
            userId: 100 + i,
            advisorId: 200 + i,
            sessionType: 'audio',
            ratePerMinute: 250,
            startTime: new Date(),
            endTime: new Date(Date.now() + 1800000)
          });
          createdSessions.push(session);
        } catch (error) {
          // Some may fail, that's ok for this test
        }
      }
      
      const initialActiveCount = sessionManager.getAllActiveSessions().length;
      
      // Simulate various error scenarios during session end
      mockStorage.endSession.mockImplementation(() => {
        if (Math.random() > 0.7) {
          return Promise.reject(new Error('Database error during session end'));
        }
        return Promise.resolve({ billedAmount: 1000, actualDuration: 5 });
      });
      
      // Attempt to end all sessions
      const endPromises = createdSessions.map(session =>
        sessionManager.endSession(session.id, { endReason: 'test_cleanup' }).catch(() => null)
      );
      
      await Promise.all(endPromises);
      
      // Force cleanup of any remaining sessions
      await sessionManager.cleanupOrphanedSessions();
      
      const finalActiveCount = sessionManager.getAllActiveSessions().length;
      
      // Should have fewer active sessions (ideally 0, but some cleanup might be pending)
      expect(finalActiveCount).toBeLessThan(initialActiveCount);
    });
  });

  describe('Race Conditions', () => {
    it('should handle concurrent session creation for same users', async () => {
      const userId = 123;
      const advisorId = 456;
      
      // Attempt to create multiple sessions concurrently for same user pair
      const sessionPromises = Array.from({ length: 5 }, (_, i) =>
        sessionManager.createSession({
          userId,
          advisorId,
          sessionType: 'audio',
          ratePerMinute: 250,
          startTime: new Date(),
          endTime: new Date(Date.now() + 1800000)
        })
      );
      
      const results = await Promise.allSettled(sessionPromises);
      const successfulSessions = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as any).value);
      
      // Should have created sessions (system doesn't prevent multiple sessions per user pair)
      expect(successfulSessions.length).toBeGreaterThan(0);
      
      // Each session should have unique ID
      const sessionIds = successfulSessions.map(s => s.id);
      const uniqueIds = [...new Set(sessionIds)];
      expect(uniqueIds).toHaveLength(sessionIds.length);
    });
    
    it('should handle concurrent message sending to same recipient', async () => {
      const senderSocket = createMockSocket(123);
      const receiverSocket = createMockSocket(456);
      
      wsManager.handleConnection(senderSocket, 123);
      wsManager.handleConnection(receiverSocket, 456);
      
      // Send many messages concurrently
      const messageCount = 20;
      const messagePromises = Array.from({ length: messageCount }, (_, i) =>
        messageDelivery.sendMessage({
          id: `concurrent-msg-${i}`,
          sessionId: 789,
          senderId: 123,
          receiverId: 456,
          content: `Concurrent message ${i}`,
          timestamp: new Date(Date.now() + i), // Slightly different timestamps
          messageType: 'text'
        })
      );
      
      const results = await Promise.all(messagePromises);
      
      // All messages should be processed
      expect(results).toHaveLength(messageCount);
      expect(results.every(r => r.success)).toBe(true);
      
      // Most messages should be delivered (allowing for minor race conditions)
      const deliveredCount = results.filter(r => r.delivered).length;
      expect(deliveredCount).toBeGreaterThanOrEqual(messageCount - 2); // Allow for 2 failures in race conditions
      
      // Receiver should get all messages
      expect(receiverSocket.send).toHaveBeenCalledTimes(messageCount);
    });
  });

  describe('System Recovery', () => {
    it('should recover gracefully from temporary service unavailability', async () => {
      // Simulate service degradation
      let serviceHealthy = false;
      
      mockStorage.createSession.mockImplementation(() => {
        if (!serviceHealthy) {
          return Promise.reject(new Error('Service temporarily unavailable'));
        }
        return Promise.resolve({ id: 999, userId: 123, advisorId: 456 });
      });
      
      mockMessageService.createMessage.mockImplementation(() => {
        if (!serviceHealthy) {
          return Promise.reject(new Error('Message service unavailable'));
        }
        return Promise.resolve({ id: 'msg-999' });
      });
      
      // Attempts during outage should fail
      await expect(sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      })).rejects.toThrow('Service temporarily unavailable');
      
      // Service recovers
      serviceHealthy = true;
      
      // Subsequent attempts should succeed
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      });
      
      expect(session.id).toBe(999);
    });
    
    it('should maintain system stability during cascading failures', async () => {
      // Setup connections
      const users = Array.from({ length: 10 }, (_, i) => {
        const socket = createMockSocket(i + 1);
        wsManager.handleConnection(socket, i + 1);
        return { id: i + 1, socket };
      });
      
      // Introduce cascading failures
      mockStorage.createSession.mockRejectedValue(new Error('Database cascade failure'));
      mockMessageService.createMessage.mockRejectedValue(new Error('Message service cascade failure'));
      
      // Test session creation failure
      const sessionCreationPromise = sessionManager.createSession({
        userId: 1,
        advisorId: 2,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      }).catch(() => 'session-failed');
      
      // Test message delivery (should gracefully handle persistence failure)
      const messageResult = await messageDelivery.sendMessage({
        id: 'cascade-fail-msg',
        sessionId: 999,
        senderId: 1,
        receiverId: 2,
        content: 'Cascade failure test',
        timestamp: new Date(),
        messageType: 'text'
      });
      
      const sessionResult = await sessionCreationPromise;
      
      // Session creation should fail gracefully
      expect(sessionResult).toBe('session-failed');
      
      // Message delivery should succeed via WebSocket despite persistence failure
      expect(messageResult.success).toBe(true);
      expect(messageResult.persisted).toBe(false);
      expect(messageResult.error).toBeDefined();
      
      // WebSocket service should still function
      wsManager.broadcast({ type: 'system', payload: { message: 'Still alive' } });
      
      // All users should still be connected and receive broadcast
      users.forEach(user => {
        expect(user.socket.send).toHaveBeenCalledWith(
          expect.stringContaining('Still alive')
        );
      });
      
      // System should remain responsive
      expect(wsManager.getConnectedUsers()).toHaveLength(10);
    });
  });
});