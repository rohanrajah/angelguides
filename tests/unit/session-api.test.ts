import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionAPI } from '@server/session-api';
import { SessionManager } from '@server/session-manager';
import { BillingService } from '@server/billing-service';

// Mock dependencies
vi.mock('@server/session-manager');
vi.mock('@server/billing-service');

describe('SessionAPI', () => {
  let sessionAPI: SessionAPI;
  let mockSessionManager: SessionManager;
  let mockBillingService: BillingService;

  beforeEach(() => {
    mockSessionManager = {
      createSession: vi.fn(),
      getActiveSession: vi.fn(),
      addParticipant: vi.fn(),
      removeParticipant: vi.fn(),
      endSession: vi.fn(),
      updateSessionStatus: vi.fn(),
      updateSessionNotes: vi.fn(),
      getSessionParticipants: vi.fn(),
      isUserInSession: vi.fn()
    } as any;

    mockBillingService = {
      calculateSessionCost: vi.fn(),
      processSessionPayment: vi.fn(),
      getSessionBilling: vi.fn(),
      updateBillingStatus: vi.fn()
    } as any;

    sessionAPI = new SessionAPI(mockSessionManager, mockBillingService);
  });

  describe('Session Creation', () => {
    it('should start a new session successfully', async () => {
      const startRequest = {
        userId: 123,
        advisorId: 456,
        sessionType: 'video' as const,
        scheduledTime: new Date()
      };

      const expectedSession = {
        id: 1,
        userId: 123,
        advisorId: 456,
        status: 'scheduled',
        sessionType: 'video',
        scheduledTime: startRequest.scheduledTime,
        createdAt: new Date(),
        participants: []
      };

      (mockSessionManager.createSession as any).mockResolvedValue(expectedSession);

      const result = await sessionAPI.startSession(startRequest);

      expect(result.success).toBe(true);
      expect(result.session).toEqual(expectedSession);
      expect(mockSessionManager.createSession).toHaveBeenCalledWith(expect.objectContaining({
        userId: startRequest.userId,
        advisorId: startRequest.advisorId,
        sessionType: startRequest.sessionType,
        scheduledTime: startRequest.scheduledTime
      }));
    });

    it('should handle immediate session start', async () => {
      const startRequest = {
        userId: 123,
        advisorId: 456,
        sessionType: 'chat' as const
        // No scheduledTime = immediate start
      };

      const expectedSession = {
        id: 2,
        userId: 123,
        advisorId: 456,
        status: 'active',
        sessionType: 'chat',
        startedAt: new Date(),
        participants: [123, 456]
      };

      (mockSessionManager.createSession as any).mockResolvedValue(expectedSession);

      const result = await sessionAPI.startSession(startRequest);

      expect(result.success).toBe(true);
      expect(result.session?.status).toBe('active');
      expect(mockSessionManager.createSession).toHaveBeenCalledWith(expect.objectContaining({
        userId: startRequest.userId,
        advisorId: startRequest.advisorId,
        sessionType: startRequest.sessionType
      }));
    });

    it('should validate session start request', async () => {
      const invalidRequest = {
        userId: 0, // Invalid user ID
        advisorId: 456,
        sessionType: 'video' as const
      };

      const result = await sessionAPI.startSession(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user or advisor ID');
    });

    it('should handle advisor unavailability', async () => {
      const startRequest = {
        userId: 123,
        advisorId: 456,
        sessionType: 'audio' as const
      };

      (mockSessionManager.createSession as any).mockRejectedValue(new Error('Advisor not available'));

      const result = await sessionAPI.startSession(startRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Advisor not available');
    });
  });

  describe('Session Status Management', () => {
    it('should get session status', async () => {
      const sessionId = 1;
      const expectedStatus = {
        id: 1,
        status: 'active',
        participants: [123, 456],
        startedAt: new Date(),
        duration: 1800, // 30 minutes
        billingStatus: 'in_progress'
      };

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        status: 'active',
        participants: [123, 456],
        startedAt: new Date()
      });
      (mockBillingService.getSessionBilling as any).mockResolvedValue({
        status: 'in_progress',
        currentCost: 45.00
      });

      const result = await sessionAPI.getSessionStatus(sessionId);

      expect(result.id).toBe(1);
      expect(result.status).toBe('active');
      expect(result.participants).toEqual([123, 456]);
    });

    it('should handle non-existent session', async () => {
      const sessionId = 999;

      (mockSessionManager.getActiveSession as any).mockReturnValue(null);

      await expect(sessionAPI.getSessionStatus(sessionId)).rejects.toThrow('Session not found');
    });

    it('should calculate session duration', async () => {
      const sessionId = 1;
      const startTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        status: 'active',
        startedAt: startTime
      });
      (mockBillingService.getSessionBilling as any).mockResolvedValue({
        status: 'in_progress'
      });

      const result = await sessionAPI.getSessionStatus(sessionId);

      expect(result.duration).toBeGreaterThan(1700); // Should be around 1800 seconds
      expect(result.duration).toBeLessThan(1900);
    });
  });

  describe('Session Participation', () => {
    it('should allow user to join session', async () => {
      const sessionId = 1;
      const userId = 789;

      (mockSessionManager.isUserInSession as any).mockReturnValue(false);
      (mockSessionManager.addParticipant as any).mockReturnValue(true);
      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        status: 'active',
        participants: [123, 456, 789]
      });

      const result = await sessionAPI.joinSession(sessionId, userId);

      expect(result.success).toBe(true);
      expect(result.participantCount).toBe(3);
      expect(mockSessionManager.addParticipant).toHaveBeenCalledWith(sessionId, userId);
    });

    it('should prevent duplicate joins', async () => {
      const sessionId = 1;
      const userId = 123; // Already in session

      (mockSessionManager.isUserInSession as any).mockReturnValue(true);

      const result = await sessionAPI.joinSession(sessionId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User already in session');
    });

    it('should allow user to leave session', async () => {
      const sessionId = 1;
      const userId = 123;

      (mockSessionManager.isUserInSession as any).mockReturnValue(true);
      (mockSessionManager.removeParticipant as any).mockReturnValue(true);

      await sessionAPI.leaveSession(sessionId, userId);

      expect(mockSessionManager.removeParticipant).toHaveBeenCalledWith(sessionId, userId);
    });

    it('should handle leaving non-existent session', async () => {
      const sessionId = 999;
      const userId = 123;

      (mockSessionManager.isUserInSession as any).mockReturnValue(false);

      await expect(sessionAPI.leaveSession(sessionId, userId)).rejects.toThrow('User not in session');
    });

    it('should enforce session participant limits', async () => {
      const sessionId = 1;
      const userId = 789;

      (mockSessionManager.isUserInSession as any).mockReturnValue(false);
      (mockSessionManager.addParticipant as any).mockReturnValue(false); // Failed due to limit
      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        participants: new Array(10).fill(0).map((_, i) => i + 1) // 10 participants
      });

      const result = await sessionAPI.joinSession(sessionId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session participant limit reached');
    });
  });

  describe('Session Termination', () => {
    it('should end session with billing calculation', async () => {
      const sessionId = 1;
      const endData = {
        endedBy: 123,
        reason: 'completed',
        notes: 'Great session!'
      };

      const mockSession = {
        id: 1,
        userId: 123,
        advisorId: 456,
        status: 'active',
        startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        ratePerMinute: 2.50
      };

      (mockSessionManager.getActiveSession as any).mockReturnValue(mockSession);
      (mockBillingService.calculateSessionCost as any).mockResolvedValue({
        duration: 30,
        cost: 75.00,
        breakdown: {
          baseRate: 2.50,
          minutes: 30,
          total: 75.00
        }
      });
      (mockBillingService.processSessionPayment as any).mockResolvedValue({
        success: true,
        transactionId: 'txn_123',
        amount: 75.00
      });
      (mockSessionManager.endSession as any).mockResolvedValue(undefined);

      const result = await sessionAPI.endSession(sessionId, endData);

      expect(result.success).toBe(true);
      expect(result.billing?.cost).toBe(75.00);
      expect(result.billing?.duration).toBe(30);
      expect(mockSessionManager.endSession).toHaveBeenCalledWith(sessionId, endData);
    });

    it('should handle billing failures gracefully', async () => {
      const sessionId = 1;
      const endData = {
        endedBy: 123,
        reason: 'completed'
      };

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        status: 'active',
        startedAt: new Date()
      });
      (mockBillingService.calculateSessionCost as any).mockResolvedValue({
        cost: 50.00
      });
      (mockBillingService.processSessionPayment as any).mockRejectedValue(new Error('Payment failed'));

      const result = await sessionAPI.endSession(sessionId, endData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment processing failed');
    });

    it('should allow free sessions to end without billing', async () => {
      const sessionId = 1;
      const endData = {
        endedBy: 123,
        reason: 'completed'
      };

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        sessionType: 'free_consultation',
        startedAt: new Date()
      });
      (mockBillingService.calculateSessionCost as any).mockResolvedValue({
        cost: 0,
        isFree: true
      });
      (mockSessionManager.endSession as any).mockResolvedValue(undefined);

      const result = await sessionAPI.endSession(sessionId, endData);

      expect(result.success).toBe(true);
      expect(result.billing?.cost).toBe(0);
      expect(result.billing?.isFree).toBe(true);
    });
  });

  describe('Session Notes Management', () => {
    it('should update session notes', async () => {
      const sessionId = 1;
      const notes = 'Session went well, discussed spiritual guidance techniques';
      const userId = 456; // Advisor

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        advisorId: 456,
        status: 'completed'
      });
      (mockSessionManager.updateSessionNotes as any).mockResolvedValue(true);

      await sessionAPI.updateSessionNotes(sessionId, notes, userId);

      expect(mockSessionManager.updateSessionNotes).toHaveBeenCalledWith(sessionId, notes);
    });

    it('should validate notes permissions', async () => {
      const sessionId = 1;
      const notes = 'Unauthorized notes';
      const userId = 789; // Not the advisor

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        advisorId: 456, // Different advisor
        status: 'completed'
      });

      await expect(sessionAPI.updateSessionNotes(sessionId, notes, userId))
        .rejects.toThrow('Unauthorized to update session notes');
    });

    it('should prevent notes update on active sessions', async () => {
      const sessionId = 1;
      const notes = 'Notes during active session';
      const userId = 456;

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        advisorId: 456,
        status: 'active' // Still active
      });

      await expect(sessionAPI.updateSessionNotes(sessionId, notes, userId))
        .rejects.toThrow('Cannot update notes on active session');
    });
  });

  describe('Error Handling', () => {
    it('should handle session manager errors', async () => {
      const startRequest = {
        userId: 123,
        advisorId: 456,
        sessionType: 'video' as const
      };

      (mockSessionManager.createSession as any).mockRejectedValue(new Error('Database connection failed'));

      const result = await sessionAPI.startSession(startRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    it('should handle billing service errors', async () => {
      const sessionId = 1;

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        status: 'active'
      });
      (mockBillingService.getSessionBilling as any).mockRejectedValue(new Error('Billing service unavailable'));

      await expect(sessionAPI.getSessionStatus(sessionId)).rejects.toThrow('Billing service unavailable');
    });

    it('should validate session state transitions', async () => {
      const sessionId = 1;
      const endData = {
        endedBy: 123,
        reason: 'completed'
      };

      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        status: 'completed' // Already completed
      });

      const result = await sessionAPI.endSession(sessionId, endData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session already completed');
    });
  });

  describe('Session Analytics', () => {
    it('should track session metrics', async () => {
      const startRequest = {
        userId: 123,
        advisorId: 456,
        sessionType: 'video' as const
      };

      const expectedSession = {
        id: 1,
        userId: 123,
        advisorId: 456,
        status: 'active',
        sessionType: 'video',
        metrics: {
          startTime: new Date(),
          participantJoins: [],
          participantLeaves: []
        }
      };

      (mockSessionManager.createSession as any).mockResolvedValue(expectedSession);

      const result = await sessionAPI.startSession(startRequest);

      expect(result.session?.metrics).toBeDefined();
      expect(result.session?.metrics?.startTime).toBeDefined();
    });

    it('should track participant activity', async () => {
      const sessionId = 1;
      const userId = 789;

      (mockSessionManager.isUserInSession as any).mockReturnValue(false);
      (mockSessionManager.addParticipant as any).mockReturnValue(true);
      (mockSessionManager.getActiveSession as any).mockReturnValue({
        id: 1,
        participants: [123, 456, 789],
        metrics: {
          participantJoins: [
            { userId: 789, timestamp: new Date() }
          ]
        }
      });

      const result = await sessionAPI.joinSession(sessionId, userId);

      expect(result.success).toBe(true);
      expect(mockSessionManager.addParticipant).toHaveBeenCalledWith(sessionId, userId);
    });
  });
});