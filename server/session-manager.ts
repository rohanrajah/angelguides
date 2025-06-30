import { WebSocketManager } from './websocket-manager';
import { WebSocketMessageType } from '@shared/websocket-types';

export interface CreateSessionRequest {
  userId: number;
  advisorId: number;
  sessionType: 'chat' | 'audio' | 'video' | 'free_consultation';
  ratePerMinute?: number;
  startTime?: Date;
  endTime?: Date;
  scheduledTime?: Date;
  status?: string;
  participants?: number[];
  createdAt?: Date;
  startedAt?: Date;
  metrics?: any;
}

export interface ActiveSession {
  id: number;
  userId: number;
  advisorId: number;
  sessionType: 'chat' | 'audio' | 'video' | 'free_consultation';
  status: 'connecting' | 'active' | 'ending' | 'completed' | 'scheduled';
  participants: number[];
  ratePerMinute?: number;
  startTime?: Date;
  endTime?: Date;
  scheduledTime?: Date;
  createdAt?: Date;
  startedAt?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number; // in minutes
  billedAmount?: number; // in cents
  metrics?: any;
}

export interface EndSessionData {
  endReason: string;
  notes?: string;
}

export interface BillingResult {
  billedAmount: number;
  actualDuration: number;
}

export interface DatabaseStorage {
  createSession(data: CreateSessionRequest): Promise<{ id: number } & CreateSessionRequest>;
  updateSession(id: number, data: Partial<ActiveSession>): Promise<ActiveSession | null>;
  endSession(id: number, data: EndSessionData): Promise<BillingResult>;
  getSession(id: number): Promise<ActiveSession | null>;
}

export class SessionManager {
  private activeSessions = new Map<number, ActiveSession>();
  private billingTimers = new Map<number, NodeJS.Timeout>();

  constructor(
    private wsManager: WebSocketManager,
    private storage: DatabaseStorage
  ) {}

  /**
   * Create a new session and add participants
   */
  async createSession(sessionData: CreateSessionRequest): Promise<ActiveSession> {
    try {
      // Persist to database first
      const dbSession = await this.storage.createSession(sessionData);
      
      // Create active session in memory using DB-generated ID
      const activeSession: ActiveSession = {
        id: dbSession.id,
        userId: sessionData.userId,
        advisorId: sessionData.advisorId,
        sessionType: sessionData.sessionType,
        status: (sessionData.status as any) || 'connecting',
        participants: sessionData.participants || [sessionData.userId, sessionData.advisorId],
        ratePerMinute: sessionData.ratePerMinute,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        scheduledTime: sessionData.scheduledTime,
        createdAt: sessionData.createdAt,
        startedAt: sessionData.startedAt,
        metrics: sessionData.metrics
      };

      // Store in memory for fast access
      this.activeSessions.set(dbSession.id, activeSession);

      // Add participants to WebSocket session if active
      if (activeSession.status === 'active') {
        activeSession.participants.forEach(userId => {
          this.wsManager.addUserToSession(userId, dbSession.id);
        });
      }

      console.log(`Created session ${dbSession.id} between user ${sessionData.userId} and advisor ${sessionData.advisorId}`);
      
      return activeSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Add participant to existing session
   */
  addParticipant(sessionId: number, userId: number): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Check participant limit
    if (session.participants.length >= 10) {
      return false;
    }

    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
      this.wsManager.addUserToSession(userId, sessionId);
    }
    
    console.log(`Added user ${userId} to session ${sessionId}`);
    return true;
  }

  /**
   * Remove participant from session
   */
  removeParticipant(sessionId: number, userId: number): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    const index = session.participants.indexOf(userId);
    if (index > -1) {
      session.participants.splice(index, 1);
      this.wsManager.removeUserFromSession(userId, sessionId);
    }
    
    console.log(`Removed user ${userId} from session ${sessionId}`);
    return true;
  }

  /**
   * Check if user is in session
   */
  isUserInSession(sessionId: number, userId: number): boolean {
    const session = this.activeSessions.get(sessionId);
    return session ? session.participants.includes(userId) : false;
  }

  /**
   * Get participants in session
   */
  getSessionParticipants(sessionId: number): number[] {
    const session = this.activeSessions.get(sessionId);
    return session ? [...session.participants] : [];
  }

  /**
   * Update session notes
   */
  async updateSessionNotes(sessionId: number, notes: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // In a real implementation, this would update the database
    console.log(`Updated notes for session ${sessionId}: ${notes}`);
  }

  /**
   * Update session status and notify participants
   */
  async updateSessionStatus(
    sessionId: number, 
    status: ActiveSession['status']
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const previousStatus = session.status;
    session.status = status;

    // Handle status transitions
    if (status === 'active' && previousStatus === 'connecting') {
      session.actualStartTime = new Date();
      this.startBillingTimer(sessionId);
    } else if (status === 'completed' || status === 'ending') {
      session.actualEndTime = new Date();
      if (session.actualStartTime) {
        const durationMs = session.actualEndTime.getTime() - session.actualStartTime.getTime();
        session.actualDuration = Math.ceil(durationMs / (1000 * 60)); // Round up to nearest minute
      }
      this.stopBillingTimer(sessionId);
    }

    // Update in database
    await this.storage.updateSession(sessionId, {
      status,
      actualStartTime: session.actualStartTime,
      actualEndTime: session.actualEndTime,
      actualDuration: session.actualDuration
    });

    // Notify participants of status change
    const participants = this.wsManager.getUsersInSession(sessionId);
    participants.forEach(userId => {
      this.wsManager.sendToUser(userId, {
        type: WebSocketMessageType.SESSION_UPDATE,
        payload: {
          sessionId,
          status,
          participants: Array.from(session.participants),
          duration: session.actualDuration
        }
      });
    });

    console.log(`Updated session ${sessionId} status to ${status}`);
  }

  /**
   * End session and calculate final billing
   */
  async endSession(sessionId: number, endData: any): Promise<BillingResult | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`Attempted to end non-existent session ${sessionId}`);
      return null;
    }

    // Stop billing timer
    this.stopBillingTimer(sessionId);

    // Set end time if not already set
    if (!session.actualEndTime) {
      session.actualEndTime = new Date();
      if (session.actualStartTime) {
        const durationMs = session.actualEndTime.getTime() - session.actualStartTime.getTime();
        session.actualDuration = Math.ceil(durationMs / (1000 * 60));
      }
    }

    // Calculate billing
    const actualDuration = session.actualDuration || 0;
    const billedAmount = actualDuration * (session.ratePerMinute || 0);

    // Update status
    session.status = 'completed';

    // Remove participants from WebSocket session
    session.participants.forEach(userId => {
      this.wsManager.removeUserFromSession(userId, sessionId);
    });

    // Try to persist to storage
    try {
      const result = await this.storage.endSession(sessionId, endData);
      // Remove from active sessions
      this.activeSessions.delete(sessionId);
      console.log(`Ended session ${sessionId}`);
      return result;
    } catch (error) {
      // If storage fails, still return calculated billing
      this.activeSessions.delete(sessionId);
      console.log(`Ended session ${sessionId}`);
      return {
        billedAmount,
        actualDuration
      };
    }
  }

  /**
   * Get active session by ID
   */
  getActiveSession(sessionId: number): ActiveSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions
   */
  getAllActiveSessions(): ActiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get active sessions for a specific user
   */
  getUserActiveSessions(userId: number): ActiveSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId || session.participants.includes(userId));
  }

  /**
   * Get active sessions for a specific advisor
   */
  getAdvisorActiveSessions(advisorId: number): ActiveSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.advisorId === advisorId);
  }

  /**
   * Clean up orphaned sessions (sessions with no connected participants)
   */
  async cleanupOrphanedSessions(): Promise<number[]> {
    const orphanedSessions: number[] = [];

    for (const [sessionId, session] of this.activeSessions) {
      const connectedParticipants = this.wsManager.getUsersInSession(sessionId);
      
      // If no participants are connected, mark as orphaned
      if (connectedParticipants.length === 0) {
        orphanedSessions.push(sessionId);
        
        // End the orphaned session
        await this.endSession(sessionId, {
          endReason: 'orphaned_cleanup',
          notes: 'Session cleaned up due to no connected participants'
        });
      }
    }

    if (orphanedSessions.length > 0) {
      console.log(`Cleaned up ${orphanedSessions.length} orphaned sessions: ${orphanedSessions.join(', ')}`);
    }

    return orphanedSessions;
  }

  /**
   * Start billing timer for active session
   */
  private startBillingTimer(sessionId: number): void {
    // Clear any existing timer
    this.stopBillingTimer(sessionId);

    // Start new timer that updates billing every minute
    const timer = setInterval(() => {
      this.updateSessionBilling(sessionId);
    }, 60000); // 1 minute

    this.billingTimers.set(sessionId, timer);
  }

  /**
   * Stop billing timer for session
   */
  private stopBillingTimer(sessionId: number): void {
    const timer = this.billingTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.billingTimers.delete(sessionId);
    }
  }

  /**
   * Update billing for ongoing session
   */
  private async updateSessionBilling(sessionId: number): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active' || !session.actualStartTime) {
      return;
    }

    const now = new Date();
    const durationMs = now.getTime() - session.actualStartTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    
    session.actualDuration = durationMinutes;
    session.billedAmount = durationMinutes * session.ratePerMinute;

    // Update database with current billing
    await this.storage.updateSession(sessionId, {
      actualDuration: session.actualDuration,
      billedAmount: session.billedAmount
    });
  }

  /**
   * Get session statistics for monitoring
   */
  getSessionStats(): any {
    const sessions = Array.from(this.activeSessions.values());
    
    return {
      totalActiveSessions: sessions.length,
      sessionsByStatus: {
        connecting: sessions.filter(s => s.status === 'connecting').length,
        active: sessions.filter(s => s.status === 'active').length,
        ending: sessions.filter(s => s.status === 'ending').length
      },
      sessionsByType: {
        chat: sessions.filter(s => s.sessionType === 'chat').length,
        audio: sessions.filter(s => s.sessionType === 'audio').length,
        video: sessions.filter(s => s.sessionType === 'video').length
      },
      averageSessionDuration: this.calculateAverageSessionDuration(sessions),
      totalActiveBillingAmount: this.calculateTotalActiveBilling(sessions)
    };
  }

  /**
   * Calculate average session duration for active sessions
   */
  private calculateAverageSessionDuration(sessions: ActiveSession[]): number {
    const activeSessions = sessions.filter(s => s.actualDuration);
    if (activeSessions.length === 0) return 0;
    
    const totalDuration = activeSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
    return totalDuration / activeSessions.length;
  }

  /**
   * Calculate total billing amount for active sessions
   */
  private calculateTotalActiveBilling(sessions: ActiveSession[]): number {
    return sessions.reduce((sum, s) => sum + (s.billedAmount || 0), 0);
  }
}