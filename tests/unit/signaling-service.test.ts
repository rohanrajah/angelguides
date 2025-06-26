import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignalingService } from '@server/signaling-service';
import { WebSocketManager } from '@server/websocket-manager';
import { 
  SignalingOffer, 
  SignalingAnswer, 
  SignalingIceCandidate, 
  SignalingEnd,
  WebSocketMessageType 
} from '@shared/websocket-types';

// Mock WebSocketManager
vi.mock('@server/websocket-manager');

describe('SignalingService', () => {
  let signalingService: SignalingService;
  let mockWsManager: WebSocketManager;

  beforeEach(() => {
    mockWsManager = {
      getUsersInSession: vi.fn(),
      sendToUser: vi.fn(),
      addUserToSession: vi.fn(),
      removeUserFromSession: vi.fn()
    } as any;
    
    signalingService = new SignalingService(mockWsManager);
  });

  describe('Offer Handling', () => {
    it('should route WebRTC offer to target user', async () => {
      const fromUserId = 123;
      const targetUserId = 456;
      const sessionId = 789;
      
      const offer: SignalingOffer = {
        sessionId,
        offer: {
          type: 'offer',
          sdp: 'mock-sdp-offer'
        },
        callType: 'video'
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([fromUserId, targetUserId]);

      await signalingService.handleOffer(fromUserId, offer);

      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(targetUserId, {
        type: WebSocketMessageType.SIGNAL_OFFER,
        payload: offer,
        from: fromUserId
      });
    });

    it('should not send offer if target user not found', async () => {
      const fromUserId = 123;
      const sessionId = 789;
      
      const offer: SignalingOffer = {
        sessionId,
        offer: {
          type: 'offer',
          sdp: 'mock-sdp-offer'
        },
        callType: 'audio'
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([fromUserId]);

      await signalingService.handleOffer(fromUserId, offer);

      expect(mockWsManager.sendToUser).not.toHaveBeenCalled();
    });

    it('should validate offer before routing', () => {
      const validOffer: SignalingOffer = {
        sessionId: 123,
        offer: {
          type: 'offer',
          sdp: 'valid-sdp'
        },
        callType: 'video'
      };

      const result = signalingService.validateSignalingMessage({
        type: WebSocketMessageType.SIGNAL_OFFER,
        payload: validOffer
      });

      expect(result).toBeTruthy();
      expect(result?.payload).toEqual(validOffer);
    });

    it('should reject invalid offer structure', () => {
      const invalidOffer = {
        sessionId: 123,
        // Missing offer field
        callType: 'video'
      };

      const result = signalingService.validateSignalingMessage({
        type: WebSocketMessageType.SIGNAL_OFFER,
        payload: invalidOffer
      });

      expect(result).toBeNull();
    });
  });

  describe('Answer Handling', () => {
    it('should route WebRTC answer to caller', async () => {
      const fromUserId = 456;
      const targetUserId = 123;
      const sessionId = 789;
      
      const answer: SignalingAnswer = {
        sessionId,
        answer: {
          type: 'answer',
          sdp: 'mock-sdp-answer'
        }
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([fromUserId, targetUserId]);

      await signalingService.handleAnswer(fromUserId, answer);

      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(targetUserId, {
        type: WebSocketMessageType.SIGNAL_ANSWER,
        payload: answer,
        from: fromUserId
      });
    });

    it('should validate answer structure', () => {
      const validAnswer: SignalingAnswer = {
        sessionId: 123,
        answer: {
          type: 'answer',
          sdp: 'valid-answer-sdp'
        }
      };

      const result = signalingService.validateSignalingMessage({
        type: WebSocketMessageType.SIGNAL_ANSWER,
        payload: validAnswer
      });

      expect(result).toBeTruthy();
    });
  });

  describe('ICE Candidate Handling', () => {
    it('should route ICE candidates between peers', async () => {
      const fromUserId = 123;
      const targetUserId = 456;
      const sessionId = 789;
      
      const iceCandidate: SignalingIceCandidate = {
        sessionId,
        candidate: {
          candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54400 typ host',
          sdpMLineIndex: 0,
          sdpMid: '0'
        }
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([fromUserId, targetUserId]);

      await signalingService.handleIceCandidate(fromUserId, iceCandidate);

      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(targetUserId, {
        type: WebSocketMessageType.SIGNAL_ICE_CANDIDATE,
        payload: iceCandidate,
        from: fromUserId
      });
    });

    it('should handle multiple ICE candidates in sequence', async () => {
      const fromUserId = 123;
      const targetUserId = 456;
      const sessionId = 789;

      (mockWsManager.getUsersInSession as any).mockReturnValue([fromUserId, targetUserId]);

      // Send multiple ICE candidates
      for (let i = 0; i < 3; i++) {
        const iceCandidate: SignalingIceCandidate = {
          sessionId,
          candidate: {
            candidate: `candidate:${i} 1 UDP 2130706431 192.168.1.100 5440${i} typ host`,
            sdpMLineIndex: i,
            sdpMid: String(i)
          }
        };

        await signalingService.handleIceCandidate(fromUserId, iceCandidate);
      }

      expect(mockWsManager.sendToUser).toHaveBeenCalledTimes(3);
    });
  });

  describe('Call End Handling', () => {
    it('should notify all participants when call ends', async () => {
      const fromUserId = 123;
      const participant1 = 456;
      const participant2 = 789;
      const sessionId = 999;
      
      const signalEnd: SignalingEnd = {
        sessionId,
        reason: 'user_hangup'
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([fromUserId, participant1, participant2]);

      await signalingService.handleCallEnd(fromUserId, signalEnd);

      // Should notify all participants except the one who ended the call
      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(participant1, {
        type: WebSocketMessageType.SIGNAL_END,
        payload: signalEnd,
        from: fromUserId
      });
      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(participant2, {
        type: WebSocketMessageType.SIGNAL_END,
        payload: signalEnd,
        from: fromUserId
      });
      expect(mockWsManager.sendToUser).toHaveBeenCalledTimes(2);
    });

    it('should handle call end for session with no other participants', async () => {
      const fromUserId = 123;
      const sessionId = 999;
      
      const signalEnd: SignalingEnd = {
        sessionId,
        reason: 'no_answer'
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([fromUserId]);

      await signalingService.handleCallEnd(fromUserId, signalEnd);

      expect(mockWsManager.sendToUser).not.toHaveBeenCalled();
    });
  });

  describe('Message Validation', () => {
    it('should validate complete signaling message structure', () => {
      const validMessage = {
        type: WebSocketMessageType.SIGNAL_OFFER,
        payload: {
          sessionId: 123,
          offer: {
            type: 'offer',
            sdp: 'valid-sdp'
          },
          callType: 'video'
        }
      };

      const result = signalingService.validateSignalingMessage(validMessage);
      expect(result).toEqual(validMessage);
    });

    it('should reject message with missing sessionId', () => {
      const invalidMessage = {
        type: WebSocketMessageType.SIGNAL_OFFER,
        payload: {
          offer: {
            type: 'offer',
            sdp: 'valid-sdp'
          },
          callType: 'video'
        }
      };

      const result = signalingService.validateSignalingMessage(invalidMessage);
      expect(result).toBeNull();
    });

    it('should reject message with invalid signaling type', () => {
      const invalidMessage = {
        type: WebSocketMessageType.CHAT_MESSAGE, // Wrong type
        payload: {
          sessionId: 123,
          offer: {
            type: 'offer',
            sdp: 'valid-sdp'
          }
        }
      };

      const result = signalingService.validateSignalingMessage(invalidMessage);
      expect(result).toBeNull();
    });
  });

  describe('Session Management Integration', () => {
    it('should work with session participant management', async () => {
      const sessionId = 123;
      const user1 = 456;
      const user2 = 789;

      // Mock session with two participants
      (mockWsManager.getUsersInSession as any).mockReturnValue([user1, user2]);

      const offer: SignalingOffer = {
        sessionId,
        offer: { type: 'offer', sdp: 'test-sdp' },
        callType: 'audio'
      };

      await signalingService.handleOffer(user1, offer);

      // Verify that the offer was sent to the other participant
      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(user2, expect.any(Object));
    });
  });
});