import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketManager } from '@server/websocket-manager';
import { SignalingService } from '@server/signaling-service';
import { 
  WebSocketMessageType,
  SignalingOffer,
  SignalingAnswer,
  SignalingIceCandidate 
} from '@shared/websocket-types';
import { WebSocket } from 'ws';

// Mock WebSocket constants
const WS_OPEN = 1;

describe('WebSocket + Signaling Integration', () => {
  let wsManager: WebSocketManager;
  let signalingService: SignalingService;
  let mockSocket1: Partial<WebSocket>;
  let mockSocket2: Partial<WebSocket>;

  beforeEach(() => {
    wsManager = new WebSocketManager();
    signalingService = new SignalingService(wsManager);
    
    mockSocket1 = {
      send: vi.fn(),
      readyState: WS_OPEN,
      on: vi.fn(),
      ping: vi.fn(),
      terminate: vi.fn()
    };
    
    mockSocket2 = {
      send: vi.fn(),
      readyState: WS_OPEN,
      on: vi.fn(),
      ping: vi.fn(),
      terminate: vi.fn()
    };
  });

  it('should handle complete WebRTC call setup flow', async () => {
    const user1 = 123; // Caller
    const user2 = 456; // Receiver
    const sessionId = 789;

    // Connect both users
    wsManager.handleConnection(mockSocket1 as WebSocket, user1);
    wsManager.handleConnection(mockSocket2 as WebSocket, user2);

    // Add both users to the same session
    wsManager.addUserToSession(user1, sessionId);
    wsManager.addUserToSession(user2, sessionId);

    // Step 1: User1 sends offer to User2
    const offer: SignalingOffer = {
      sessionId,
      offer: {
        type: 'offer',
        sdp: 'mock-offer-sdp'
      },
      callType: 'video'
    };

    await signalingService.handleOffer(user1, offer);

    expect(mockSocket2.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: WebSocketMessageType.SIGNAL_OFFER,
        payload: offer,
        from: user1
      })
    );

    // Step 2: User2 sends answer to User1
    const answer: SignalingAnswer = {
      sessionId,
      answer: {
        type: 'answer',
        sdp: 'mock-answer-sdp'
      }
    };

    await signalingService.handleAnswer(user2, answer);

    expect(mockSocket1.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: WebSocketMessageType.SIGNAL_ANSWER,
        payload: answer,
        from: user2
      })
    );

    // Step 3: ICE candidates exchange
    const iceCandidate1: SignalingIceCandidate = {
      sessionId,
      candidate: {
        candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54400 typ host',
        sdpMLineIndex: 0,
        sdpMid: '0'
      }
    };

    await signalingService.handleIceCandidate(user1, iceCandidate1);

    expect(mockSocket2.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: WebSocketMessageType.SIGNAL_ICE_CANDIDATE,
        payload: iceCandidate1,
        from: user1
      })
    );

    // Verify session state
    const sessionStats = signalingService.getSessionStats(sessionId);
    expect(sessionStats.participantCount).toBe(2);
    expect(sessionStats.participants).toContain(user1);
    expect(sessionStats.participants).toContain(user2);
  });

  it('should handle call termination properly', async () => {
    const user1 = 123;
    const user2 = 456;
    const sessionId = 789;

    // Set up session
    wsManager.handleConnection(mockSocket1 as WebSocket, user1);
    wsManager.handleConnection(mockSocket2 as WebSocket, user2);
    wsManager.addUserToSession(user1, sessionId);
    wsManager.addUserToSession(user2, sessionId);

    // User1 ends the call
    await signalingService.handleCallEnd(user1, {
      sessionId,
      reason: 'user_hangup'
    });

    // User2 should receive the call end signal
    expect(mockSocket2.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: WebSocketMessageType.SIGNAL_END,
        payload: { sessionId, reason: 'user_hangup' },
        from: user1
      })
    );
  });

  it('should validate signaling messages before processing', () => {
    // Valid message
    const validMessage = {
      type: WebSocketMessageType.SIGNAL_OFFER,
      payload: {
        sessionId: 123,
        offer: { type: 'offer', sdp: 'valid-sdp' },
        callType: 'video'
      }
    };

    expect(signalingService.validateSignalingMessage(validMessage)).toBeTruthy();

    // Invalid message - missing sessionId
    const invalidMessage = {
      type: WebSocketMessageType.SIGNAL_OFFER,
      payload: {
        offer: { type: 'offer', sdp: 'valid-sdp' },
        callType: 'video'
      }
    };

    expect(signalingService.validateSignalingMessage(invalidMessage)).toBeNull();
  });

  it('should handle user disconnection during active call', () => {
    const user1 = 123;
    const user2 = 456;
    const sessionId = 789;

    // Set up active session
    wsManager.handleConnection(mockSocket1 as WebSocket, user1);
    wsManager.handleConnection(mockSocket2 as WebSocket, user2);
    wsManager.addUserToSession(user1, sessionId);
    wsManager.addUserToSession(user2, sessionId);

    // Verify both users are in session
    expect(wsManager.getUsersInSession(sessionId)).toContain(user1);
    expect(wsManager.getUsersInSession(sessionId)).toContain(user2);

    // User1 disconnects
    wsManager.handleDisconnection(user1);

    // User1 should be removed from session
    expect(wsManager.getUsersInSession(sessionId)).not.toContain(user1);
    expect(wsManager.getUsersInSession(sessionId)).toContain(user2);
    expect(wsManager.isUserConnected(user1)).toBe(false);
  });

  it('should handle multiple concurrent sessions', async () => {
    const user1 = 123, user2 = 456, user3 = 789, user4 = 101;
    const session1 = 1001, session2 = 1002;

    // Connect all users
    wsManager.handleConnection(mockSocket1 as WebSocket, user1);
    wsManager.handleConnection(mockSocket2 as WebSocket, user2);
    wsManager.handleConnection({ ...mockSocket1, send: vi.fn() } as any, user3);
    wsManager.handleConnection({ ...mockSocket2, send: vi.fn() } as any, user4);

    // Set up two separate sessions
    wsManager.addUserToSession(user1, session1);
    wsManager.addUserToSession(user2, session1);
    wsManager.addUserToSession(user3, session2);
    wsManager.addUserToSession(user4, session2);

    // Send offers in both sessions
    await signalingService.handleOffer(user1, {
      sessionId: session1,
      offer: { type: 'offer', sdp: 'session1-sdp' },
      callType: 'audio'
    });

    await signalingService.handleOffer(user3, {
      sessionId: session2,
      offer: { type: 'offer', sdp: 'session2-sdp' },
      callType: 'video'
    });

    // Verify session isolation
    const session1Stats = signalingService.getSessionStats(session1);
    const session2Stats = signalingService.getSessionStats(session2);

    expect(session1Stats.participants).toEqual([user1, user2]);
    expect(session2Stats.participants).toEqual([user3, user4]);
  });
});