import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import { SessionManager } from '@server/session-manager';
import { WebSocketManager } from '@server/websocket-manager';
import { SignalingService } from '@server/signaling-service';

// Mock implementations for E2E testing
const mockStorage = {
  createSession: vi.fn(),
  updateSession: vi.fn(),
  endSession: vi.fn(),
  getSession: vi.fn()
};

describe('E2E Call Flows', () => {
  let wsManager: WebSocketManager;
  let sessionManager: SessionManager;
  let signalingService: SignalingService;
  
  // Mock WebSocket connections
  let userSocket: any;
  let advisorSocket: any;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock storage to return session with ID
    mockStorage.createSession.mockImplementation((data) => 
      Promise.resolve({ id: Math.floor(Math.random() * 10000), ...data })
    );
    mockStorage.updateSession.mockResolvedValue(null);
    mockStorage.endSession.mockResolvedValue({ billedAmount: 1000, actualDuration: 5 });
    
    // Create mock WebSocket connections
    userSocket = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      close: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn()
    };
    
    advisorSocket = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      close: vi.fn(),
      on: vi.fn(),
      removeAllListeners: vi.fn()
    };
    
    wsManager = new WebSocketManager();
    sessionManager = new SessionManager(wsManager, mockStorage as any);
    signalingService = new SignalingService(wsManager, sessionManager);
    
    // Setup mock connections
    wsManager.handleConnection(userSocket, 123);
    wsManager.handleConnection(advisorSocket, 456);
  });
  
  afterEach(() => {
    wsManager.handleDisconnection(123);
    wsManager.handleDisconnection(456);
  });

  describe('Audio Call Flow', () => {
    it('should complete full audio call establishment', async () => {
      // Step 1: Create session
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      });
      
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(123);
      expect(session.advisorId).toBe(456);
      
      // Add participants to WebSocket session for signaling  
      wsManager.addUserToSession(123, session.id);
      wsManager.addUserToSession(456, session.id);
      
      // Step 2: User initiates call (sends offer)
      const offerMessage = {
        sessionId: session.id,
        offer: {
          type: 'offer',
          sdp: 'mock-offer-sdp'
        },
        callType: 'audio'
      };
      
      await signalingService.handleOffer(123, offerMessage);
      
      // Verify offer was sent to advisor
      expect(advisorSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'signal_offer',
          payload: offerMessage,
          from: 123
        })
      );
      
      // Step 3: Advisor responds with answer
      const answerMessage = {
        sessionId: session.id,
        answer: {
          type: 'answer',
          sdp: 'mock-answer-sdp'
        }
      };
      
      await signalingService.handleAnswer(456, answerMessage);
      
      // Verify answer was sent to user
      expect(userSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'signal_answer',
          payload: answerMessage,
          from: 456
        })
      );
      
      // Step 4: ICE candidate exchange
      const iceMessage = {
        sessionId: session.id,
        candidate: {
          candidate: 'mock-ice-candidate',
          sdpMid: 'audio',
          sdpMLineIndex: 0
        }
      };
      
      await signalingService.handleIceCandidate(123, iceMessage);
      
      // Verify ICE candidate was forwarded
      expect(advisorSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'signal_ice_candidate',
          payload: iceMessage,
          from: 123
        })
      );
      
      // Step 5: Mark session as active
      mockStorage.updateSession.mockResolvedValue(null);
      await sessionManager.updateSessionStatus(session.id, 'active');
      
      const activeSession = sessionManager.getActiveSession(session.id);
      expect(activeSession?.status).toBe('active');
      expect(activeSession?.actualStartTime).toBeDefined();
    });
    
    it('should handle call termination gracefully', async () => {
      // Setup active session
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      });
      
      // Add participants to WebSocket session
      wsManager.addUserToSession(123, session.id);
      wsManager.addUserToSession(456, session.id);
      
      mockStorage.updateSession.mockResolvedValue(null);
      await sessionManager.updateSessionStatus(session.id, 'active');
      
      // Simulate call end
      const endMessage = {
        sessionId: session.id,
        reason: 'user_hangup'
      };
      
      await signalingService.handleCallEnd(123, endMessage);
      
      // Verify end signal was sent to advisor
      expect(advisorSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'signal_end',
          payload: endMessage,
          from: 123
        })
      );
      
      // End session with billing
      mockStorage.endSession.mockResolvedValue({
        billedAmount: 1250, // 5 minutes * $2.50
        actualDuration: 5
      });
      
      const result = await sessionManager.endSession(session.id, {
        endReason: 'user_hangup'
      });
      
      expect(result?.billedAmount).toBe(1250);
      expect(sessionManager.getActiveSession(session.id)).toBeNull();
    });
  });

  describe('Video Call Flow', () => {
    it('should complete full video call establishment with higher quality', async () => {
      // Step 1: Create video session
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 400,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });
      
      expect(session.sessionType).toBe('video');
      
      // Add participants to WebSocket session
      wsManager.addUserToSession(123, session.id);
      wsManager.addUserToSession(456, session.id);
      
      // Step 2: Video offer with video constraints
      const videoOfferMessage = {
        sessionId: session.id,
        offer: {
          type: 'offer',
          sdp: 'mock-video-offer-sdp-with-video-track'
        },
        callType: 'video'
      };
      
      await signalingService.handleOffer(123, videoOfferMessage);
      
      // Verify video offer routing
      expect(advisorSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'signal_offer',
          payload: videoOfferMessage,
          from: 123
        })
      );
      
      // Step 3: Video answer
      const videoAnswerMessage = {
        sessionId: session.id,
        answer: {
          type: 'answer',
          sdp: 'mock-video-answer-sdp-with-video-track'
        }
      };
      
      await signalingService.handleAnswer(456, videoAnswerMessage);
      
      expect(userSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'signal_answer',
          payload: videoAnswerMessage,
          from: 456
        })
      );
      
      // Step 4: Multiple ICE candidates for video
      const videoIceMessage = {
        sessionId: session.id,
        candidate: {
          candidate: 'mock-video-ice-candidate',
          sdpMid: 'video',
          sdpMLineIndex: 1
        }
      };
      
      await signalingService.handleIceCandidate(456, videoIceMessage);
      
      expect(userSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'signal_ice_candidate',
          payload: videoIceMessage,
          from: 456
        })
      );
    });
    
    it('should handle video quality degradation scenarios', async () => {
      // Setup video session
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 400,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });
      
      // Add participants to WebSocket session
      wsManager.addUserToSession(123, session.id);
      wsManager.addUserToSession(456, session.id);
      
      // Simulate network degradation - renegotiation
      const renegotiationOffer = {
        sessionId: session.id,
        offer: {
          type: 'offer',
          sdp: 'mock-reduced-quality-offer-sdp'
        },
        callType: 'video'
      };
      
      await signalingService.handleOffer(123, renegotiationOffer);
      
      // Should still route the renegotiation offer
      expect(advisorSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'signal_offer',
          payload: renegotiationOffer,
          from: 123
        })
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle signaling to non-existent session', async () => {
      const invalidMessage = {
        type: 'signal_offer',
        sessionId: 99999, // Non-existent session
        from: 123,
        target: 456,
        signal: {
          type: 'offer',
          sdp: 'mock-offer-sdp'
        }
      };
      
      // Should not throw, but should not forward message
      await expect(signalingService.handleOffer(123, invalidMessage)).resolves.not.toThrow();
      
      // Should not send to advisor
      expect(advisorSocket.send).not.toHaveBeenCalled();
    });
    
    it('should handle connection loss during call', async () => {
      // Setup active session
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      });
      
      mockStorage.updateSession.mockResolvedValue(null);
      await sessionManager.updateSessionStatus(session.id, 'active');
      
      // Simulate user disconnect
      wsManager.handleDisconnection(123);
      
      // Session should still exist but be marked for cleanup
      const activeSession = sessionManager.getActiveSession(session.id);
      expect(activeSession).toBeDefined();
      
      // Cleanup should identify orphaned session
      mockStorage.endSession.mockResolvedValue({
        billedAmount: 625, // Partial billing
        actualDuration: 2.5
      });
      
      const orphanedSessions = await sessionManager.cleanupOrphanedSessions();
      expect(orphanedSessions).toContain(session.id);
    });
    
    it('should reject malformed signaling messages', async () => {
      const malformedMessage = {
        type: 'signal_offer',
        // Missing required fields
        from: 123
      };
      
      const validatedMessage = signalingService.validateSignalingMessage(malformedMessage);
      expect(validatedMessage).toBeNull();
    });
  });
});