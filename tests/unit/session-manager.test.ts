import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionManager } from '@server/session-manager';
import { WebSocketManager } from '@server/websocket-manager';

// Mock the storage
const mockStorage = {
  getSession: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
  endSession: vi.fn()
};

// Mock WebSocketManager
vi.mock('@server/websocket-manager');

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockWsManager: WebSocketManager;

  beforeEach(() => {
    mockWsManager = {
      addUserToSession: vi.fn(),
      removeUserFromSession: vi.fn(),
      getUsersInSession: vi.fn(),
      sendToUser: vi.fn(),
      broadcast: vi.fn()
    } as any;
    
    sessionManager = new SessionManager(mockWsManager, mockStorage as any);
  });

  describe('Session Creation', () => {
    it('should create new session with correct properties', async () => {
      const sessionData = {
        userId: 123,
        advisorId: 456,
        sessionType: 'video' as const,
        ratePerMinute: 300, // $3.00 per minute
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000) // 1 hour later
      };

      mockStorage.createSession.mockResolvedValue({
        id: 789,
        ...sessionData
      });

      const session = await sessionManager.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.id).toBe(789);
      expect(session.userId).toBe(123);
      expect(session.advisorId).toBe(456);
      expect(session.sessionType).toBe('video');
      expect(session.status).toBe('connecting');
      
      // Should be tracked in memory
      expect(sessionManager.getActiveSession(789)).toBeDefined();
    });

    it('should add participants to WebSocket session', async () => {
      const sessionData = {
        userId: 123,
        advisorId: 456,
        sessionType: 'audio' as const,
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000) // 30 minutes
      };

      mockStorage.createSession.mockResolvedValue({
        id: 789,
        ...sessionData
      });

      await sessionManager.createSession(sessionData);

      expect(mockWsManager.addUserToSession).toHaveBeenCalledWith(123, 789);
      expect(mockWsManager.addUserToSession).toHaveBeenCalledWith(456, 789);
    });

    it('should start billing timer when session becomes active', async () => {
      const sessionData = {
        userId: 123,
        advisorId: 456,
        sessionType: 'chat' as const,
        ratePerMinute: 200,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      };

      mockStorage.createSession.mockResolvedValue({
        id: 789,
        ...sessionData
      });

      const session = await sessionManager.createSession(sessionData);
      
      // Mark session as active
      await sessionManager.updateSessionStatus(789, 'active');

      const activeSession = sessionManager.getActiveSession(789);
      expect(activeSession?.status).toBe('active');
      expect(activeSession?.startTime).toBeDefined();
    });
  });

  describe('Participant Management', () => {
    beforeEach(async () => {
      // Create a test session
      mockStorage.createSession.mockResolvedValue({
        id: 789,
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 300,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });

      await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 300,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });
    });

    it('should add participant to session', () => {
      const result = sessionManager.addParticipant(789, 999);
      
      expect(result).toBe(true);
      
      const session = sessionManager.getActiveSession(789);
      expect(session?.participants.has(999)).toBe(true);
    });

    it('should remove participant from session', () => {
      // First add, then remove
      sessionManager.addParticipant(789, 999);
      const result = sessionManager.removeParticipant(789, 999);
      
      expect(result).toBe(true);
      
      const session = sessionManager.getActiveSession(789);
      expect(session?.participants.has(999)).toBe(false);
    });

    it('should handle removing participant from non-existent session', () => {
      const result = sessionManager.removeParticipant(99999, 123);
      expect(result).toBe(false);
    });
  });

  describe('Session Status Management', () => {
    let sessionId: number;

    beforeEach(async () => {
      mockStorage.createSession.mockResolvedValue({
        id: 789,
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      });

      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'audio',
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000)
      });
      
      sessionId = session.id;
    });

    it('should update session status and notify participants', async () => {
      mockWsManager.getUsersInSession.mockReturnValue([123, 456]);

      await sessionManager.updateSessionStatus(sessionId, 'active');

      const session = sessionManager.getActiveSession(sessionId);
      expect(session?.status).toBe('active');

      // Should notify participants
      expect(mockWsManager.sendToUser).toHaveBeenCalledTimes(2);
    });

    it('should track session duration when active', async () => {
      const beforeActive = Date.now();
      await sessionManager.updateSessionStatus(sessionId, 'active');
      const afterActive = Date.now();

      const session = sessionManager.getActiveSession(sessionId);
      expect(session?.actualStartTime).toBeDefined();
      
      const startTime = session!.actualStartTime!.getTime();
      expect(startTime).toBeGreaterThanOrEqual(beforeActive);
      expect(startTime).toBeLessThanOrEqual(afterActive);
    });

    it('should calculate duration when session ends', async () => {
      // Start session
      await sessionManager.updateSessionStatus(sessionId, 'active');
      
      // Wait a bit (simulate active call)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // End session
      await sessionManager.updateSessionStatus(sessionId, 'completed');

      const session = sessionManager.getActiveSession(sessionId);
      expect(session?.actualDuration).toBeGreaterThan(0);
    });
  });

  describe('Session Termination', () => {
    let sessionId: number;

    beforeEach(async () => {
      mockStorage.createSession.mockResolvedValue({
        id: 789,
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 300,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });

      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 300,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });
      
      sessionId = session.id;
    });

    it('should end session and calculate billing', async () => {
      // Make session active for billing calculation
      await sessionManager.updateSessionStatus(sessionId, 'active');
      await new Promise(resolve => setTimeout(resolve, 100));

      mockStorage.endSession.mockResolvedValue({
        billedAmount: 5000, // $50.00
        actualDuration: 10 // 10 minutes
      });

      const result = await sessionManager.endSession(sessionId, {
        endReason: 'user_hangup',
        notes: 'Good session'
      });

      expect(result).toBeDefined();
      expect(result.billedAmount).toBe(5000);
      
      // Session should be removed from active sessions
      expect(sessionManager.getActiveSession(sessionId)).toBeNull();
    });

    it('should remove participants from WebSocket session', async () => {
      mockWsManager.getUsersInSession.mockReturnValue([123, 456]);

      await sessionManager.endSession(sessionId, {
        endReason: 'completed'
      });

      expect(mockWsManager.removeUserFromSession).toHaveBeenCalledWith(123, sessionId);
      expect(mockWsManager.removeUserFromSession).toHaveBeenCalledWith(456, sessionId);
    });

    it('should handle ending non-existent session gracefully', async () => {
      const result = await sessionManager.endSession(99999, {
        endReason: 'not_found'
      });

      expect(result).toBeNull();
    });
  });

  describe('Orphaned Session Cleanup', () => {
    it('should identify and clean up orphaned sessions', async () => {
      // Create multiple sessions
      for (let i = 1; i <= 3; i++) {
        mockStorage.createSession.mockResolvedValue({
          id: i,
          userId: 100 + i,
          advisorId: 200 + i,
          sessionType: 'audio',
          ratePerMinute: 250,
          startTime: new Date(),
          endTime: new Date(Date.now() + 1800000)
        });

        await sessionManager.createSession({
          userId: 100 + i,
          advisorId: 200 + i,
          sessionType: 'audio',
          ratePerMinute: 250,
          startTime: new Date(),
          endTime: new Date(Date.now() + 1800000)
        });
      }

      // Mock that some users are no longer connected
      mockWsManager.getUsersInSession.mockImplementation((sessionId) => {
        if (sessionId === 1) return []; // No participants
        if (sessionId === 2) return [102]; // Only one participant
        return [103, 203]; // Both participants
      });

      const orphanedSessions = await sessionManager.cleanupOrphanedSessions();

      expect(orphanedSessions).toContain(1); // Should identify session with no participants
      // Session 2 might or might not be considered orphaned depending on implementation
    });
  });

  describe('Session Query Methods', () => {
    beforeEach(async () => {
      // Create multiple test sessions
      for (let i = 1; i <= 3; i++) {
        mockStorage.createSession.mockResolvedValue({
          id: i,
          userId: 100,
          advisorId: 200 + i,
          sessionType: 'video',
          ratePerMinute: 300,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000)
        });

        await sessionManager.createSession({
          userId: 100,
          advisorId: 200 + i,
          sessionType: 'video',
          ratePerMinute: 300,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000)
        });
      }
    });

    it('should get all active sessions', () => {
      const activeSessions = sessionManager.getAllActiveSessions();
      expect(activeSessions).toHaveLength(3);
    });

    it('should get sessions by user', () => {
      const userSessions = sessionManager.getUserActiveSessions(100);
      expect(userSessions).toHaveLength(3);
      expect(userSessions.every(s => s.userId === 100)).toBe(true);
    });

    it('should get sessions by advisor', () => {
      const advisorSessions = sessionManager.getAdvisorActiveSessions(201);
      expect(advisorSessions).toHaveLength(1);
      expect(advisorSessions[0].advisorId).toBe(201);
    });
  });
});