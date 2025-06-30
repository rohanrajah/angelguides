import { SessionManager, ActiveSession } from './session-manager';
import { BillingService } from './billing-service';

export interface StartSessionRequest {
  userId: number;
  advisorId: number;
  sessionType: 'chat' | 'audio' | 'video' | 'free_consultation';
  scheduledTime?: Date;
  ratePerMinute?: number;
}

export interface SessionResponse {
  success: boolean;
  session?: ActiveSession;
  error?: string;
}

export interface SessionStatus {
  id: number;
  status: string;
  participants: number[];
  startedAt?: Date;
  duration?: number;
  billingStatus?: string;
  metrics?: {
    startTime?: Date;
    participantJoins?: Array<{ userId: number; timestamp: Date }>;
    participantLeaves?: Array<{ userId: number; timestamp: Date }>;
  };
}

export interface JoinResult {
  success: boolean;
  participantCount?: number;
  error?: string;
  message?: string;
}

export interface EndSessionData {
  endedBy: number;
  reason: 'completed' | 'cancelled' | 'timeout' | 'error';
  notes?: string;
}

export interface BillingResult {
  success: boolean;
  billing?: {
    cost: number;
    duration: number;
    transactionId?: string;
    isFree?: boolean;
  };
  error?: string;
}

export class SessionAPI {
  constructor(
    private sessionManager: SessionManager,
    private billingService: BillingService
  ) {}

  /**
   * Start a new session
   */
  async startSession(request: StartSessionRequest): Promise<SessionResponse> {
    try {
      // Validate request
      if (!request.userId || request.userId <= 0) {
        return {
          success: false,
          error: 'Invalid user or advisor ID'
        };
      }

      if (!request.advisorId || request.advisorId <= 0) {
        return {
          success: false,
          error: 'Invalid user or advisor ID'
        };
      }

      // Create session
      const sessionData = {
        ...request,
        status: request.scheduledTime ? 'scheduled' : 'active',
        participants: request.scheduledTime ? [] : [request.userId, request.advisorId],
        createdAt: new Date(),
        ...(request.scheduledTime ? { scheduledTime: request.scheduledTime } : { startedAt: new Date() }),
        metrics: {
          startTime: new Date(),
          participantJoins: [],
          participantLeaves: []
        }
      };

      const session = await this.sessionManager.createSession(sessionData);

      return {
        success: true,
        session
      };

    } catch (error) {
      console.error('Error starting session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start session'
      };
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionId: number): Promise<SessionStatus> {
    try {
      const session = this.sessionManager.getActiveSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      let duration = 0;
      if (session.startedAt) {
        duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      }

      // Get billing status
      const billingInfo = await this.billingService.getSessionBilling(sessionId);

      return {
        id: session.id,
        status: session.status,
        participants: session.participants || [],
        startedAt: session.startedAt,
        duration,
        billingStatus: billingInfo.status,
        metrics: session.metrics
      };

    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  }

  /**
   * Join session
   */
  async joinSession(sessionId: number, userId: number): Promise<JoinResult> {
    try {
      // Check if user is already in session
      if (this.sessionManager.isUserInSession(sessionId, userId)) {
        return {
          success: false,
          error: 'User already in session'
        };
      }

      // Add participant
      const success = this.sessionManager.addParticipant(sessionId, userId);
      
      if (!success) {
        // Check if it's due to participant limit
        const session = this.sessionManager.getActiveSession(sessionId);
        if (session && session.participants.length >= 10) {
          return {
            success: false,
            error: 'Session participant limit reached'
          };
        }
        
        return {
          success: false,
          error: 'Failed to join session'
        };
      }

      const updatedSession = this.sessionManager.getActiveSession(sessionId);
      
      return {
        success: true,
        participantCount: updatedSession?.participants.length || 0,
        message: 'Successfully joined session'
      };

    } catch (error) {
      console.error('Error joining session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join session'
      };
    }
  }

  /**
   * Leave session
   */
  async leaveSession(sessionId: number, userId: number): Promise<void> {
    try {
      // Check if user is in session
      if (!this.sessionManager.isUserInSession(sessionId, userId)) {
        throw new Error('User not in session');
      }

      // Remove participant
      this.sessionManager.removeParticipant(sessionId, userId);

    } catch (error) {
      console.error('Error leaving session:', error);
      throw error;
    }
  }

  /**
   * End session with billing
   */
  async endSession(sessionId: number, endData: EndSessionData): Promise<BillingResult> {
    try {
      const session = this.sessionManager.getActiveSession(sessionId);
      
      if (!session) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      if (session.status === 'completed') {
        return {
          success: false,
          error: 'Session already completed'
        };
      }

      // Calculate billing if session was active
      if (session.startedAt && session.status === 'active') {
        const billingData = {
          sessionId,
          advisorId: session.advisorId,
          userId: session.userId,
          startTime: session.startedAt,
          endTime: new Date(),
          ratePerMinute: session.ratePerMinute || 0,
          sessionType: session.sessionType
        };

        try {
          const costResult = await this.billingService.calculateSessionCost(billingData);
          
          let paymentResult = null;
          if (costResult.cost > 0) {
            paymentResult = await this.billingService.processSessionPayment({
              sessionId,
              userId: session.userId,
              amount: costResult.cost,
              paymentMethod: 'credit_card'
            });

            if (!paymentResult.success) {
              return {
                success: false,
                error: 'Payment processing failed'
              };
            }
          }

          // End the session
          await this.sessionManager.endSession(sessionId, endData);

          return {
            success: true,
            billing: {
              cost: costResult.cost,
              duration: costResult.duration,
              transactionId: paymentResult?.transactionId,
              isFree: costResult.isFree
            }
          };
        } catch (billingError) {
          return {
            success: false,
            error: 'Payment processing failed'
          };
        }
      }

      // End session without billing (was scheduled or free)
      await this.sessionManager.endSession(sessionId, endData);

      return {
        success: true,
        billing: {
          cost: 0,
          duration: 0,
          isFree: true
        }
      };

    } catch (error) {
      console.error('Error ending session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end session'
      };
    }
  }

  /**
   * Update session notes
   */
  async updateSessionNotes(sessionId: number, notes: string, userId: number): Promise<void> {
    try {
      const session = this.sessionManager.getActiveSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Check permissions (only advisor can update notes)
      if (session.advisorId !== userId) {
        throw new Error('Unauthorized to update session notes');
      }

      // Prevent updates on active sessions
      if (session.status === 'active') {
        throw new Error('Cannot update notes on active session');
      }

      await this.sessionManager.updateSessionNotes(sessionId, notes);

    } catch (error) {
      console.error('Error updating session notes:', error);
      throw error;
    }
  }
}