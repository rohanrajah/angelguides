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
      getUsersInSession: vi.fn().mockReturnValue([]), // Default to empty array
      sendToUser: vi.fn(),
      broadcast: vi.fn()
    } as any;

    // Reset storage mocks
    mockStorage.getSession.mockReset();
    mockStorage.createSession.mockReset(); 
    mockStorage.updateSession.mockReset();
    mockStorage.endSession.mockReset();
    
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

      // Setup mock storage to return session with ID
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
      expect(sessionManager.getActiveSession(session.id)).toBeDefined();
    });

    it('should add participants to WebSocket session', async () => {
      const sessionData = {
        userId: 123,
        advisorId: 456,
        sessionType: 'audio' as const,
        ratePerMinute: 250,
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000), // 30 minutes
        status: 'active' // Set to active to trigger WebSocket participant addition
      };

      // Setup mock storage to return session with ID
      mockStorage.createSession.mockResolvedValue({
        id: 456,
        ...sessionData
      });

      const session = await sessionManager.createSession(sessionData);

      expect(mockWsManager.addUserToSession).toHaveBeenCalledWith(123, session.id);
      expect(mockWsManager.addUserToSession).toHaveBeenCalledWith(456, session.id);
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

      // Setup mock storage to return session with ID
      mockStorage.createSession.mockResolvedValue({
        id: 123,
        ...sessionData
      });
      mockStorage.updateSession.mockResolvedValue(null);
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);

      const session = await sessionManager.createSession(sessionData);
      
      // Mark session as active
      await sessionManager.updateSessionStatus(session.id, 'active');

      const activeSession = sessionManager.getActiveSession(session.id);
      expect(activeSession?.status).toBe('active');
      expect(activeSession?.actualStartTime).toBeDefined();
    });
  });

  describe('Participant Management', () => {
    let testSessionId: number;

    beforeEach(async () => {
      // Setup mock storage to return session with ID
      mockStorage.createSession.mockResolvedValue({
        id: 999,
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 300,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });
      
      // Create a test session
      const session = await sessionManager.createSession({
        userId: 123,
        advisorId: 456,
        sessionType: 'video',
        ratePerMinute: 300,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000)
      });
      testSessionId = session.id;
    });

    it('should add participant to session', () => {
      const result = sessionManager.addParticipant(testSessionId, 999);
      
      expect(result).toBe(true);
      
      const session = sessionManager.getActiveSession(testSessionId);
      expect(session?.participants.includes(999)).toBe(true);
    });

    it('should remove participant from session', () => {
      // First add, then remove
      sessionManager.addParticipant(testSessionId, 999);
      const result = sessionManager.removeParticipant(testSessionId, 999);
      
      expect(result).toBe(true);
      
      const session = sessionManager.getActiveSession(testSessionId);
      expect(session?.participants.includes(999)).toBe(false);
    });

    it('should handle removing participant from non-existent session', () => {
      const result = sessionManager.removeParticipant(99999, 123);
      expect(result).toBe(false);
    });
  });

  describe('Session Status Management', () => {
    let sessionId: number;

    beforeEach(async () => {
      // Setup mock storage to return session with ID
      mockStorage.createSession.mockResolvedValue({
        id: 888,
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
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);
      mockStorage.updateSession.mockResolvedValue(null);

      await sessionManager.updateSessionStatus(sessionId, 'active');

      const session = sessionManager.getActiveSession(sessionId);
      expect(session?.status).toBe('active');

      // Should notify participants
      expect(mockWsManager.sendToUser).toHaveBeenCalledTimes(2);
    });

    it('should track session duration when active', async () => {
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);
      mockStorage.updateSession.mockResolvedValue(null);

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
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);
      mockStorage.updateSession.mockResolvedValue(null);

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
      // Setup mock storage to return session with ID
      mockStorage.createSession.mockResolvedValue({
        id: 777,
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
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);
      mockStorage.updateSession.mockResolvedValue(null);
      mockStorage.endSession.mockResolvedValue({
        billedAmount: 5000, // $50.00
        actualDuration: 10 // 10 minutes
      });

      // Make session active for billing calculation
      await sessionManager.updateSessionStatus(sessionId, 'active');
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await sessionManager.endSession(sessionId, {
        endReason: 'user_hangup',
        notes: 'Good session'
      });

      expect(result).toBeDefined();
      expect(result!.billedAmount).toBe(5000);
      
      // Session should be removed from active sessions
      expect(sessionManager.getActiveSession(sessionId)).toBeNull();
    });

    it('should remove participants from WebSocket session', async () => {
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);
      mockStorage.endSession.mockResolvedValue({
        billedAmount: 1000,
        actualDuration: 5
      });

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
      const sessionIds: number[] = [];
      for (let i = 1; i <= 3; i++) {
        // Setup mock storage to return session with ID
        mockStorage.createSession.mockResolvedValueOnce({
          id: i + 100,
          userId: 100 + i,
          advisorId: 200 + i,
          sessionType: 'audio',
          ratePerMinute: 250,
          startTime: new Date(),
          endTime: new Date(Date.now() + 1800000)
        });
        
        const session = await sessionManager.createSession({
          userId: 100 + i,
          advisorId: 200 + i,
          sessionType: 'audio',
          ratePerMinute: 250,
          startTime: new Date(),
          endTime: new Date(Date.now() + 1800000)
        });
        sessionIds.push(session.id);
      }

      // Mock that some users are no longer connected
      (mockWsManager.getUsersInSession as any).mockImplementation((sessionId) => {
        if (sessionId === sessionIds[0]) return []; // No participants
        if (sessionId === sessionIds[1]) return [102]; // Only one participant
        return [103, 203]; // Both participants
      });

      // Mock endSession for cleanup
      mockStorage.endSession.mockResolvedValue({
        billedAmount: 0,
        actualDuration: 0
      });

      const orphanedSessions = await sessionManager.cleanupOrphanedSessions();

      expect(orphanedSessions).toContain(sessionIds[0]); // Should identify session with no participants
      // Session 2 might or might not be considered orphaned depending on implementation
    });
  });

  describe('Session Query Methods', () => {
    beforeEach(async () => {
      // Create multiple test sessions
      for (let i = 1; i <= 3; i++) {
        // Setup mock storage to return session with ID
        mockStorage.createSession.mockResolvedValueOnce({
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