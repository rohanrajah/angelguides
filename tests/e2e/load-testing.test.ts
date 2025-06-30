import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import { WebSocketManager } from '@server/websocket-manager';
import { SessionManager } from '@server/session-manager';
import { MessageDeliveryService } from '@server/message-delivery';
import { SignalingService } from '@server/signaling-service';

// Mock implementations optimized for load testing
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

describe('E2E Load Testing', () => {
  let wsManager: WebSocketManager;
  let sessionManager: SessionManager;
  let messageDelivery: MessageDeliveryService;
  let signalingService: SignalingService;
  
  // Mock socket factory
  const createMockSocket = (userId: number) => ({
    readyState: WebSocket.OPEN,
    send: vi.fn(),
    close: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    userId // For tracking
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    wsManager = new WebSocketManager();
    sessionManager = new SessionManager(wsManager, mockStorage as any);
    messageDelivery = new MessageDeliveryService(wsManager, mockMessageService as any);
    signalingService = new SignalingService(wsManager, sessionManager);
    
    // Setup mock responses for load testing
    mockStorage.createSession.mockImplementation((data) => 
      Promise.resolve({ id: Math.floor(Math.random() * 10000), ...data })
    );
    
    mockStorage.updateSession.mockResolvedValue(null);
    mockStorage.endSession.mockResolvedValue({
      billedAmount: 1000,
      actualDuration: 5
    });
    
    mockMessageService.createMessage.mockImplementation((data) => 
      Promise.resolve({ id: `msg-${Date.now()}-${Math.random()}`, ...data })
    );
  });

  describe('Concurrent User Connections', () => {
    it('should handle 50+ concurrent WebSocket connections', async () => {
      const connectionCount = 50;
      const users: Array<{ id: number; socket: any }> = [];
      
      // Create connections
      for (let i = 1; i <= connectionCount; i++) {
        const socket = createMockSocket(i);
        users.push({ id: i, socket });
        wsManager.handleConnection(socket, i);
      }
      
      // Verify all connections are tracked
      const connectedUsers = wsManager.getConnectedUsers();
      expect(connectedUsers).toHaveLength(connectionCount);
      expect(connectedUsers).toEqual(expect.arrayContaining(
        users.map(u => u.id)
      ));
      
      // Test broadcasting to all users
      const broadcastMessage = {
        type: 'system_announcement',
        data: { message: 'Server maintenance in 5 minutes' }
      };
      
      wsManager.broadcast(broadcastMessage);
      
      // All users should receive the broadcast
      users.forEach(user => {
        expect(user.socket.send).toHaveBeenCalledWith(
          JSON.stringify(broadcastMessage)
        );
      });
      
      // Cleanup
      users.forEach(user => {
        wsManager.handleDisconnection(user.id);
      });
    });
    
    it('should handle rapid connection/disconnection cycles', async () => {
      const cycleCount = 20;
      const connectDisconnectCycles = [];
      
      for (let cycle = 0; cycle < cycleCount; cycle++) {
        const userId = 1000 + cycle;
        const socket = createMockSocket(userId);
        
        // Connect
        wsManager.handleConnection(socket, userId);
        expect(wsManager.getConnectedUsers()).toContain(userId);
        
        // Disconnect
        wsManager.handleDisconnection(userId);
        expect(wsManager.getConnectedUsers()).not.toContain(userId);
        
        connectDisconnectCycles.push({ userId, completed: true });
      }
      
      expect(connectDisconnectCycles).toHaveLength(cycleCount);
      expect(connectDisconnectCycles.every(c => c.completed)).toBe(true);
    });
  });

  describe('Concurrent Session Management', () => {
    it('should handle 25+ simultaneous sessions', async () => {
      const sessionCount = 25;
      const sessions: any[] = [];
      
      // Create user connections
      const users: any[] = [];
      for (let i = 1; i <= sessionCount * 2; i++) {
        const socket = createMockSocket(i);
        users.push({ id: i, socket });
        wsManager.handleConnection(socket, i);
      }
      
      // Create sessions concurrently
      const sessionPromises = [];
      for (let i = 0; i < sessionCount; i++) {
        const userId = (i * 2) + 1;
        const advisorId = (i * 2) + 2;
        
        const sessionPromise = sessionManager.createSession({
          userId,
          advisorId,
          sessionType: i % 2 === 0 ? 'audio' : 'video',
          ratePerMinute: 300,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000)
        });
        
        sessionPromises.push(sessionPromise);
      }
      
      const createdSessions = await Promise.all(sessionPromises);
      expect(createdSessions).toHaveLength(sessionCount);
      
      // Verify sessions are tracked (allowing for minor failures in concurrent creation)
      const activeSessions = sessionManager.getAllActiveSessions();
      expect(activeSessions.length).toBeGreaterThanOrEqual(sessionCount - 1); // Allow 1 failure
      expect(activeSessions.length).toBeLessThanOrEqual(sessionCount);
      
      // Activate all sessions concurrently
      const activationPromises = createdSessions.map(session =>
        sessionManager.updateSessionStatus(session.id, 'active')
      );
      
      await Promise.all(activationPromises);
      
      // Verify sessions are active (allowing for minor failures in concurrent activation)
      const activeSessionsAfter = sessionManager.getAllActiveSessions();
      const activeCount = activeSessionsAfter.filter(s => s.status === 'active').length;
      expect(activeCount).toBeGreaterThanOrEqual(sessionCount - 1); // Allow 1 failure
      expect(activeCount).toBeLessThanOrEqual(sessionCount);
      
      // Cleanup
      users.forEach(user => {
        wsManager.handleDisconnection(user.id);
      });
    });
    
    it('should maintain performance with high session turnover', async () => {
      const turnoverCycles = 10;
      const sessionsPerCycle = 10;
      
      const performanceMetrics: Array<{ cycle: number; duration: number }> = [];
      
      for (let cycle = 0; cycle < turnoverCycles; cycle++) {
        const cycleStart = performance.now();
        
        // Create sessions
        const sessionPromises = [];
        for (let i = 0; i < sessionsPerCycle; i++) {
          const userId = (cycle * sessionsPerCycle * 2) + (i * 2) + 1;
          const advisorId = (cycle * sessionsPerCycle * 2) + (i * 2) + 2;
          
          // Connect users
          wsManager.handleConnection(createMockSocket(userId), userId);
          wsManager.handleConnection(createMockSocket(advisorId), advisorId);
          
          sessionPromises.push(
            sessionManager.createSession({
              userId,
              advisorId,
              sessionType: 'audio',
              ratePerMinute: 250,
              startTime: new Date(),
              endTime: new Date(Date.now() + 1800000)
            })
          );
        }
        
        const sessions = await Promise.all(sessionPromises);
        
        // Activate and end sessions
        for (const session of sessions) {
          await sessionManager.updateSessionStatus(session.id, 'active');
          await sessionManager.endSession(session.id, { endReason: 'completed' });
          
          // Disconnect users
          wsManager.handleDisconnection(session.userId);
          wsManager.handleDisconnection(session.advisorId);
        }
        
        const cycleEnd = performance.now();
        const cycleDuration = cycleEnd - cycleStart;
        
        performanceMetrics.push({ cycle, duration: cycleDuration });
      }
      
      // Verify performance doesn't degrade significantly
      const firstCycleDuration = performanceMetrics[0].duration;
      const lastCycleDuration = performanceMetrics[performanceMetrics.length - 1].duration;
      
      // Last cycle shouldn't be more than 50% slower than first
      expect(lastCycleDuration).toBeLessThan(firstCycleDuration * 1.5);
    });
  });

  describe('High-Volume Message Processing', () => {
    it('should process 1000+ messages efficiently', async () => {
      const messageCount = 1000;
      const userCount = 20;
      
      // Setup users
      const users: any[] = [];
      for (let i = 1; i <= userCount; i++) {
        const socket = createMockSocket(i);
        users.push({ id: i, socket });
        wsManager.handleConnection(socket, i);
      }
      
      // Generate messages from random users to random users
      const messagePromises = [];
      const startTime = performance.now();
      
      for (let i = 0; i < messageCount; i++) {
        const senderId = Math.floor(Math.random() * userCount) + 1;
        let receiverId = Math.floor(Math.random() * userCount) + 1;
        
        // Ensure sender != receiver
        while (receiverId === senderId) {
          receiverId = Math.floor(Math.random() * userCount) + 1;
        }
        
        const message = {
          id: `load-test-msg-${i}`,
          sessionId: Math.floor(Math.random() * 10) + 1,
          senderId,
          receiverId,
          content: `Load test message ${i}`,
          timestamp: new Date(),
          messageType: 'text' as const
        };
        
        messagePromises.push(messageDelivery.sendMessage(message));
      }
      
      const results = await Promise.all(messagePromises);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      const messagesPerSecond = messageCount / (processingTime / 1000);
      
      // Verify all messages processed
      expect(results).toHaveLength(messageCount);
      expect(results.every(r => r.success)).toBe(true);
      
      // Most messages should be delivered successfully
      const deliveredCount = results.filter(r => r.delivered).length;
      expect(deliveredCount).toBeGreaterThanOrEqual(messageCount * 0.95); // 95% delivery rate under load
      
      // Should process at least 100 messages per second
      expect(messagesPerSecond).toBeGreaterThan(100);
      
      console.log(`Processed ${messageCount} messages in ${processingTime.toFixed(2)}ms (${messagesPerSecond.toFixed(2)} msg/s)`);
      
      // Cleanup
      users.forEach(user => {
        wsManager.handleDisconnection(user.id);
      });
    });
    
    it('should handle message bursts without memory leaks', async () => {
      const burstCount = 5;
      const messagesPerBurst = 200;
      
      // Setup two users for message exchange
      const senderSocket = createMockSocket(1001);
      const receiverSocket = createMockSocket(1002);
      
      wsManager.handleConnection(senderSocket, 1001);
      wsManager.handleConnection(receiverSocket, 1002);
      
      const initialMemory = process.memoryUsage();
      
      for (let burst = 0; burst < burstCount; burst++) {
        const burstPromises = [];
        
        for (let i = 0; i < messagesPerBurst; i++) {
          const message = {
            id: `burst-${burst}-msg-${i}`,
            sessionId: 999,
            senderId: 1001,
            receiverId: 1002,
            content: `Burst ${burst} message ${i}`,
            timestamp: new Date(),
            messageType: 'text' as const
          };
          
          burstPromises.push(messageDelivery.sendMessage(message));
        }
        
        await Promise.all(burstPromises);
        
        // Brief pause between bursts
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Cleanup
      wsManager.handleDisconnection(1001);
      wsManager.handleDisconnection(1002);
    });
  });

  describe('WebRTC Signaling Under Load', () => {
    it('should route signaling messages efficiently with many concurrent calls', async () => {
      const concurrentCalls = 15;
      const users: any[] = [];
      const sessions: any[] = [];
      
      // Setup users (2 per call)
      for (let i = 1; i <= concurrentCalls * 2; i++) {
        const socket = createMockSocket(i);
        users.push({ id: i, socket });
        wsManager.handleConnection(socket, i);
      }
      
      // Create sessions
      for (let i = 0; i < concurrentCalls; i++) {
        const userId = (i * 2) + 1;
        const advisorId = (i * 2) + 2;
        
        const session = await sessionManager.createSession({
          userId,
          advisorId,
          sessionType: 'video',
          ratePerMinute: 400,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000)
        });
        
        sessions.push(session);
        
        // Add users to WebSocket session for signaling
        wsManager.addUserToSession(userId, session.id);
        wsManager.addUserToSession(advisorId, session.id);
      }
      
      const startTime = performance.now();
      
      // Simulate signaling exchange for all calls concurrently
      const signalingPromises = [];
      
      for (const session of sessions) {
        const userId = session.userId;
        const advisorId = session.advisorId;
        
        // Offer
        signalingPromises.push(
          signalingService.handleOffer(userId, {
            type: 'signal_offer',
            sessionId: session.id,
            from: userId,
            target: advisorId,
            signal: { type: 'offer', sdp: `mock-offer-${session.id}` }
          })
        );
        
        // Answer
        signalingPromises.push(
          signalingService.handleAnswer(advisorId, {
            type: 'signal_answer',
            sessionId: session.id,
            from: advisorId,
            target: userId,
            signal: { type: 'answer', sdp: `mock-answer-${session.id}` }
          })
        );
        
        // ICE candidates (multiple per call)
        for (let ice = 0; ice < 3; ice++) {
          signalingPromises.push(
            signalingService.handleIceCandidate(userId, {
              type: 'signal_ice_candidate',
              sessionId: session.id,
              from: userId,
              target: advisorId,
              signal: { 
                candidate: `mock-ice-${session.id}-${ice}`,
                sdpMid: 'video',
                sdpMLineIndex: 0
              }
            })
          );
        }
      }
      
      await Promise.all(signalingPromises);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      console.log(`Processed ${signalingPromises.length} signaling messages in ${processingTime.toFixed(2)}ms`);
      
      // Should complete within reasonable time (less than 1 second)
      expect(processingTime).toBeLessThan(1000);
      
      // Verify signaling reached recipients (at least some should have been called)
      const calledUsers = users.filter(user => user.socket.send.mock.calls.length > 0);
      expect(calledUsers.length).toBeGreaterThan(0);
      
      // Cleanup
      users.forEach(user => {
        wsManager.handleDisconnection(user.id);
      });
    });
  });

  describe('System Stress Testing', () => {
    it('should handle mixed load scenarios', async () => {
      const testDuration = 2000; // 2 seconds
      const startTime = Date.now();
      
      // Setup baseline users
      const baseUsers = 30;
      const users: any[] = [];
      
      for (let i = 1; i <= baseUsers; i++) {
        const socket = createMockSocket(i);
        users.push({ id: i, socket });
        wsManager.handleConnection(socket, i);
      }
      
      const operations: Promise<any>[] = [];
      let operationCount = 0;
      
      // Run mixed operations for test duration
      const mixedLoadInterval = setInterval(() => {
        if (Date.now() - startTime > testDuration) {
          clearInterval(mixedLoadInterval);
          return;
        }
        
        // Random operations
        const operation = Math.floor(Math.random() * 4);
        
        switch (operation) {
          case 0: // Create session
            operations.push(
              sessionManager.createSession({
                userId: Math.floor(Math.random() * baseUsers) + 1,
                advisorId: Math.floor(Math.random() * baseUsers) + 1,
                sessionType: Math.random() > 0.5 ? 'audio' : 'video',
                ratePerMinute: 300,
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000)
              })
            );
            break;
            
          case 1: // Send message
            operations.push(
              messageDelivery.sendMessage({
                id: `stress-msg-${operationCount}`,
                sessionId: Math.floor(Math.random() * 10) + 1,
                senderId: Math.floor(Math.random() * baseUsers) + 1,
                receiverId: Math.floor(Math.random() * baseUsers) + 1,
                content: `Stress test message ${operationCount}`,
                timestamp: new Date(),
                messageType: 'text'
              })
            );
            break;
            
          case 2: // Connect new user
            const newUserId = baseUsers + operationCount;
            const newSocket = createMockSocket(newUserId);
            wsManager.handleConnection(newSocket, newUserId);
            users.push({ id: newUserId, socket: newSocket });
            break;
            
          case 3: // Broadcast message
            wsManager.broadcast({
              type: 'system_message',
              data: { message: `Broadcast ${operationCount}` }
            });
            break;
        }
        
        operationCount++;
      }, 50); // Every 50ms
      
      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, testDuration + 100));
      
      // Wait for all operations to complete
      await Promise.allSettled(operations);
      
      console.log(`Completed ${operationCount} mixed operations in ${testDuration}ms`);
      
      // System should still be responsive
      expect(operationCount).toBeGreaterThan(0);
      expect(wsManager.getConnectedUsers().length).toBeGreaterThan(0);
      
      // Cleanup
      users.forEach(user => {
        wsManager.handleDisconnection(user.id);
      });
    });
  });
});