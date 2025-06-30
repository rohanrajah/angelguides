import { WebSocketManager } from './websocket-manager';
import { MessageService } from './message-service';
import { WebSocketMessage, WebSocketMessageType } from '@shared/websocket-types';

export interface ChatMessage {
  id?: string;
  sessionId: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType: 'text' | 'system';
  timestamp: Date;
}

export interface DeliveryResult {
  success: boolean;
  delivered?: boolean;
  messageId?: number | string;
  queued?: boolean;
  persisted?: boolean;
  error?: string;
  timestamp?: Date;
}

export interface DeliveryStatus {
  delivered: boolean;
  deliveredAt?: Date;
  read?: boolean;
  readAt?: Date;
}

export interface DeliveryStats {
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesQueued: number;
  averageDeliveryTime: number;
  deliverySuccessRate: number;
}

export class MessageDeliveryService {
  private messageQueue = new Map<number, WebSocketMessage[]>(); // userId -> queued messages
  private deliveryStatus = new Map<string, DeliveryStatus>(); // messageId -> delivery status
  private messageTracking = new Map<string, { senderId: number; receiverId: number }>(); // messageId -> participants
  private typingTimeouts = new Map<string, NodeJS.Timeout>(); // sessionId:userId -> timeout
  private stats: DeliveryStats = {
    totalMessagesSent: 0,
    totalMessagesDelivered: 0,
    totalMessagesQueued: 0,
    averageDeliveryTime: 0,
    deliverySuccessRate: 100
  };

  private readonly MAX_QUEUE_SIZE = 100;
  private readonly TYPING_TIMEOUT = 5000; // 5 seconds

  constructor(
    private wsManager: WebSocketManager,
    private messageService: MessageService
  ) {}

  /**
   * Send message with real-time delivery and offline queuing
   */
  async sendMessage(message: ChatMessage): Promise<DeliveryResult> {
    let savedMessage: any = null;
    let persistenceError: string | undefined = undefined;
    
    try {
      // Validate message
      this.validateMessage(message);

      // Try to save message to database
      try {
        savedMessage = await this.messageService.createMessage({
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content
        });
      } catch (dbError) {
        console.error('Database persistence failed:', dbError);
        persistenceError = dbError instanceof Error ? dbError.message : 'Database error';
        // Continue with delivery even if persistence fails
        savedMessage = { id: message.id || `temp-${Date.now()}` };
      }

      this.stats.totalMessagesSent++;

      // Track message for delivery confirmation
      if (message.id) {
        this.trackMessage(message.id, message.senderId, message.receiverId);
      }

      // Check if receiver is online
      const isReceiverOnline = this.wsManager.isUserConnected(message.receiverId);

      if (isReceiverOnline) {
        // Send immediately via WebSocket
        const success = this.wsManager.sendToUser(message.receiverId, {
          type: WebSocketMessageType.CHAT_MESSAGE,
          payload: {
            sessionId: message.sessionId,
            content: message.content,
            messageType: message.messageType
          },
          from: message.senderId,
          timestamp: new Date()
        });

        if (success) {
          this.stats.totalMessagesDelivered++;
          return {
            success: true,
            delivered: true,
            messageId: savedMessage.id,
            persisted: !persistenceError,
            error: persistenceError,
            timestamp: new Date()
          };
        }
      }

      // Queue for offline delivery
      await this.queueOfflineMessage(message.receiverId, {
        type: WebSocketMessageType.CHAT_MESSAGE,
        payload: {
          sessionId: message.sessionId,
          content: message.content,
          messageType: message.messageType
        },
        from: message.senderId,
        timestamp: new Date()
      });

      this.stats.totalMessagesQueued++;

      return {
        success: true,
        delivered: false,
        messageId: savedMessage.id,
        queued: true,
        persisted: !persistenceError,
        error: persistenceError,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        delivered: false,
        persisted: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Queue message for offline user
   */
  async queueOfflineMessage(userId: number, message: WebSocketMessage): Promise<void> {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }

    const queue = this.messageQueue.get(userId)!;
    
    // Add message to queue
    queue.push(message);

    // Enforce queue size limit
    if (queue.length > this.MAX_QUEUE_SIZE) {
      queue.shift(); // Remove oldest message
    }

    console.log(`Queued message for offline user ${userId}. Queue size: ${queue.length}`);
  }

  /**
   * Deliver all queued messages when user comes online
   */
  async deliverQueuedMessages(userId: number): Promise<void> {
    const queue = this.messageQueue.get(userId);
    if (!queue || queue.length === 0) {
      return;
    }

    console.log(`Delivering ${queue.length} queued messages to user ${userId}`);

    // Sort messages by timestamp to ensure correct order
    queue.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });

    // Deliver all messages
    for (const message of queue) {
      const success = this.wsManager.sendToUser(userId, message);
      if (success) {
        this.stats.totalMessagesDelivered++;
        this.stats.totalMessagesQueued--;
      }
    }

    // Clear the queue
    this.messageQueue.delete(userId);
  }

  /**
   * Handle typing indicator
   */
  handleTypingIndicator(sessionId: number, userId: number, isTyping: boolean): void {
    const timeoutKey = `${sessionId}:${userId}`;

    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(timeoutKey);
    }

    // Get other participants in session
    const participants = this.wsManager.getUsersInSession(sessionId);
    const otherParticipants = participants.filter(id => id !== userId);

    // Send typing indicator to other participants
    otherParticipants.forEach(participantId => {
      this.wsManager.sendToUser(participantId, {
        type: WebSocketMessageType.TYPING_INDICATOR,
        payload: {
          sessionId,
          isTyping
        },
        from: userId
      });
    });

    // Set auto-stop timeout if typing started
    if (isTyping) {
      const timeout = setTimeout(() => {
        this.handleTypingIndicator(sessionId, userId, false);
      }, this.TYPING_TIMEOUT);

      this.typingTimeouts.set(timeoutKey, timeout);
    }

    console.log(`Typing indicator: User ${userId} ${isTyping ? 'started' : 'stopped'} typing in session ${sessionId}`);
  }

  /**
   * Confirm message delivery
   */
  confirmDelivery(messageId: string, userId: number): void {
    const status = this.deliveryStatus.get(messageId) || { delivered: false };
    status.delivered = true;
    status.deliveredAt = new Date();
    
    this.deliveryStatus.set(messageId, status);

    // Notify sender of delivery confirmation
    const tracking = this.messageTracking.get(messageId);
    if (tracking) {
      this.wsManager.sendToUser(tracking.senderId, {
        type: 'message_delivered',
        payload: {
          messageId,
          deliveredAt: status.deliveredAt
        }
      });
    }

    console.log(`Message ${messageId} delivery confirmed by user ${userId}`);
  }

  /**
   * Handle message read receipt
   */
  async handleReadReceipt(messageId: number, userId: number, senderId: number): Promise<void> {
    try {
      // Mark as read in database
      const success = await this.messageService.markAsRead(messageId, userId);
      
      if (success) {
        // Notify sender of read receipt
        this.wsManager.sendToUser(senderId, {
          type: 'message_read',
          payload: {
            messageId,
            readBy: userId,
            readAt: new Date()
          }
        });

        console.log(`Message ${messageId} marked as read by user ${userId}`);
      }
    } catch (error) {
      console.error(`Failed to handle read receipt for message ${messageId}:`, error);
    }
  }

  /**
   * Track message for delivery confirmation
   */
  trackMessage(messageId: string, senderId: number, receiverId: number): void {
    this.messageTracking.set(messageId, { senderId, receiverId });
    this.deliveryStatus.set(messageId, { delivered: false });
  }

  /**
   * Get delivery status for a message
   */
  getDeliveryStatus(messageId: string): DeliveryStatus {
    return this.deliveryStatus.get(messageId) || { delivered: false };
  }

  /**
   * Get queued messages for a user
   */
  getQueuedMessages(userId: number): WebSocketMessage[] {
    return this.messageQueue.get(userId) || [];
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): DeliveryStats {
    // Update success rate
    if (this.stats.totalMessagesSent > 0) {
      this.stats.deliverySuccessRate = (this.stats.totalMessagesDelivered / this.stats.totalMessagesSent) * 100;
    }

    return { ...this.stats };
  }

  /**
   * Validate message data
   */
  private validateMessage(message: ChatMessage): void {
    if (!message.sessionId || message.sessionId <= 0) {
      throw new Error('Invalid message data');
    }

    if (!message.senderId || message.senderId <= 0) {
      throw new Error('Invalid sender ID');
    }

    if (!message.receiverId || message.receiverId <= 0) {
      throw new Error('Invalid receiver ID');
    }

    if (!message.content || message.content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
  }

  /**
   * Clean up old delivery tracking data
   */
  cleanupOldTrackingData(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - olderThanMs;

    for (const [messageId, status] of this.deliveryStatus.entries()) {
      if (status.deliveredAt && status.deliveredAt.getTime() < cutoffTime) {
        this.deliveryStatus.delete(messageId);
        this.messageTracking.delete(messageId);
      }
    }

    console.log('Cleaned up old message tracking data');
  }

  /**
   * Get queue sizes for monitoring
   */
  getQueueSizes(): Map<number, number> {
    const sizes = new Map<number, number>();
    
    for (const [userId, queue] of this.messageQueue.entries()) {
      sizes.set(userId, queue.length);
    }

    return sizes;
  }

  /**
   * Clear queue for a specific user (for admin/debugging)
   */
  clearUserQueue(userId: number): number {
    const queue = this.messageQueue.get(userId);
    const queueSize = queue ? queue.length : 0;
    
    this.messageQueue.delete(userId);
    
    console.log(`Cleared message queue for user ${userId}. Removed ${queueSize} messages.`);
    return queueSize;
  }
}