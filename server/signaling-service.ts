import { WebSocketManager } from './websocket-manager';
import { 
  WebSocketMessage,
  WebSocketMessageType,
  SignalingOffer,
  SignalingAnswer,
  SignalingIceCandidate,
  SignalingEnd
} from '@shared/websocket-types';

export class SignalingService {
  constructor(private wsManager: WebSocketManager) {}

  /**
   * Handle WebRTC offer from caller to receiver
   */
  async handleOffer(fromUserId: number, payload: SignalingOffer): Promise<void> {
    const { sessionId, offer, callType } = payload;
    
    // Get session participants
    const participants = this.wsManager.getUsersInSession(sessionId);
    const targetUserId = participants.find(id => id !== fromUserId);
    
    if (targetUserId) {
      this.wsManager.sendToUser(targetUserId, {
        type: WebSocketMessageType.SIGNAL_OFFER,
        payload: { sessionId, offer, callType },
        from: fromUserId
      });
      
      console.log(`Routed WebRTC offer from user ${fromUserId} to user ${targetUserId} for session ${sessionId}`);
    } else {
      console.warn(`No target user found for offer in session ${sessionId}`);
    }
  }

  /**
   * Handle WebRTC answer from receiver to caller
   */
  async handleAnswer(fromUserId: number, payload: SignalingAnswer): Promise<void> {
    const { sessionId, answer } = payload;
    
    const participants = this.wsManager.getUsersInSession(sessionId);
    const targetUserId = participants.find(id => id !== fromUserId);
    
    if (targetUserId) {
      this.wsManager.sendToUser(targetUserId, {
        type: WebSocketMessageType.SIGNAL_ANSWER,
        payload: { sessionId, answer },
        from: fromUserId
      });
      
      console.log(`Routed WebRTC answer from user ${fromUserId} to user ${targetUserId} for session ${sessionId}`);
    } else {
      console.warn(`No target user found for answer in session ${sessionId}`);
    }
  }

  /**
   * Handle ICE candidate exchange between peers
   */
  async handleIceCandidate(fromUserId: number, payload: SignalingIceCandidate): Promise<void> {
    const { sessionId, candidate } = payload;
    
    const participants = this.wsManager.getUsersInSession(sessionId);
    const targetUserId = participants.find(id => id !== fromUserId);
    
    if (targetUserId) {
      this.wsManager.sendToUser(targetUserId, {
        type: WebSocketMessageType.SIGNAL_ICE_CANDIDATE,
        payload: { sessionId, candidate },
        from: fromUserId
      });
      
      console.log(`Routed ICE candidate from user ${fromUserId} to user ${targetUserId} for session ${sessionId}`);
    } else {
      console.warn(`No target user found for ICE candidate in session ${sessionId}`);
    }
  }

  /**
   * Handle call termination signal
   */
  async handleCallEnd(fromUserId: number, payload: SignalingEnd): Promise<void> {
    const { sessionId, reason } = payload;
    
    const participants = this.wsManager.getUsersInSession(sessionId);
    
    // Notify all other participants that the call has ended
    participants.forEach(userId => {
      if (userId !== fromUserId) {
        this.wsManager.sendToUser(userId, {
          type: WebSocketMessageType.SIGNAL_END,
          payload: { sessionId, reason },
          from: fromUserId
        });
      }
    });
    
    console.log(`Call ended by user ${fromUserId} for session ${sessionId}, reason: ${reason || 'none'}`);
  }

  /**
   * Validate signaling message structure and content
   */
  validateSignalingMessage(message: any): WebSocketMessage | null {
    try {
      if (!message || typeof message !== 'object') {
        return null;
      }

      const { type, payload } = message;

      // Check if it's a signaling message type
      const signalingTypes = [
        WebSocketMessageType.SIGNAL_OFFER,
        WebSocketMessageType.SIGNAL_ANSWER,
        WebSocketMessageType.SIGNAL_ICE_CANDIDATE,
        WebSocketMessageType.SIGNAL_END
      ];

      if (!signalingTypes.includes(type)) {
        return null;
      }

      // Validate payload structure based on type
      if (!payload || typeof payload !== 'object') {
        return null;
      }

      // All signaling messages must have a sessionId
      if (typeof payload.sessionId !== 'number') {
        return null;
      }

      // Type-specific validation
      switch (type) {
        case WebSocketMessageType.SIGNAL_OFFER:
          if (!this.validateOfferPayload(payload)) {
            return null;
          }
          break;

        case WebSocketMessageType.SIGNAL_ANSWER:
          if (!this.validateAnswerPayload(payload)) {
            return null;
          }
          break;

        case WebSocketMessageType.SIGNAL_ICE_CANDIDATE:
          if (!this.validateIceCandidatePayload(payload)) {
            return null;
          }
          break;

        case WebSocketMessageType.SIGNAL_END:
          if (!this.validateEndPayload(payload)) {
            return null;
          }
          break;

        default:
          return null;
      }

      return message as WebSocketMessage;

    } catch (error) {
      console.error('Error validating signaling message:', error);
      return null;
    }
  }

  /**
   * Validate WebRTC offer payload
   */
  private validateOfferPayload(payload: any): boolean {
    return (
      payload.offer &&
      typeof payload.offer === 'object' &&
      payload.offer.type === 'offer' &&
      typeof payload.offer.sdp === 'string' &&
      payload.callType &&
      ['audio', 'video'].includes(payload.callType)
    );
  }

  /**
   * Validate WebRTC answer payload
   */
  private validateAnswerPayload(payload: any): boolean {
    return (
      payload.answer &&
      typeof payload.answer === 'object' &&
      payload.answer.type === 'answer' &&
      typeof payload.answer.sdp === 'string'
    );
  }

  /**
   * Validate ICE candidate payload
   */
  private validateIceCandidatePayload(payload: any): boolean {
    return (
      payload.candidate &&
      typeof payload.candidate === 'object' &&
      typeof payload.candidate.candidate === 'string'
    );
  }

  /**
   * Validate call end payload
   */
  private validateEndPayload(payload: any): boolean {
    // sessionId is already validated in main function
    // reason is optional
    return true;
  }

  /**
   * Get session statistics for monitoring
   */
  getSessionStats(sessionId: number): any {
    const participants = this.wsManager.getUsersInSession(sessionId);
    
    return {
      sessionId,
      participantCount: participants.length,
      participants,
      isActive: participants.length > 0
    };
  }

  /**
   * Clean up stale signaling sessions
   */
  cleanupStaleSessions(): void {
    // This could be implemented to clean up sessions that have been
    // inactive for too long or have no participants
    console.log('Cleaning up stale signaling sessions...');
  }
}