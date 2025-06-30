import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageDeliveryService } from '@server/message-delivery';
import { WebSocketManager } from '@server/websocket-manager';
import { MessageService } from '@server/message-service';
import { WebSocketMessageType } from '@shared/websocket-types';

// Mock dependencies
vi.mock('@server/websocket-manager');
vi.mock('@server/message-service');

describe('MessageDeliveryService', () => {
  let messageDeliveryService: MessageDeliveryService;
  let mockWsManager: WebSocketManager;
  let mockMessageService: MessageService;

  beforeEach(() => {
    mockWsManager = {
      getUsersInSession: vi.fn(),
      sendToUser: vi.fn(),
      isUserConnected: vi.fn(),
      addUserToSession: vi.fn(),
      removeUserFromSession: vi.fn()
    } as any;

    mockMessageService = {
      createMessage: vi.fn(),
      markAsRead: vi.fn()
    } as any;
    
    messageDeliveryService = new MessageDeliveryService(mockWsManager, mockMessageService);
  });

  describe('Real-time Message Delivery', () => {
    it('should deliver message in real-time via WebSocket', async () => {
      const message = {
        id: 'msg-123',
        sessionId: 789,
        senderId: 123,
        receiverId: 456,
        content: 'Hello there!',
        messageType: 'text' as const,
        timestamp: new Date()
      };

      const savedMessage = {
        id: 1,
        senderId: 123,
        receiverId: 456,
        content: 'Hello there!',
        timestamp: new Date(),
        read: false
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);
      (mockWsManager.isUserConnected as any).mockReturnValue(true);
      (mockMessageService.createMessage as any).mockResolvedValue(savedMessage);

      const result = await messageDeliveryService.sendMessage(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(1);
      
      // Should save to database
      expect(mockMessageService.createMessage).toHaveBeenCalledWith({
        senderId: 123,
        receiverId: 456,
        content: 'Hello there!'
      });

      // Should send via WebSocket
      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(456, {
        type: WebSocketMessageType.CHAT_MESSAGE,
        payload: expect.objectContaining({
          sessionId: 789,
          content: 'Hello there!',
          messageType: 'text'
        }),
        from: 123,
        timestamp: expect.any(Date)
      });
    });

    it('should handle offline message queuing', async () => {
      const message = {
        id: 'msg-456',
        sessionId: 789,
        senderId: 123,
        receiverId: 456,
        content: 'Are you there?',
        messageType: 'text' as const,
        timestamp: new Date()
      };

      const savedMessage = {
        id: 2,
        senderId: 123,
        receiverId: 456,
        content: 'Are you there?',
        timestamp: new Date(),
        read: false
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);
      (mockWsManager.isUserConnected as any).mockReturnValue(false); // User offline
      (mockMessageService.createMessage as any).mockResolvedValue(savedMessage);

      const result = await messageDeliveryService.sendMessage(message);

      expect(result.success).toBe(true);
      expect(result.queued).toBe(true);
      
      // Should save to database
      expect(mockMessageService.createMessage).toHaveBeenCalled();
      
      // Should queue message for offline delivery
      const queuedMessages = messageDeliveryService.getQueuedMessages(456);
      expect(queuedMessages).toHaveLength(1);
    });

    it('should validate message before sending', async () => {
      const invalidMessage = {
        id: 'msg-invalid',
        sessionId: 0, // Invalid session ID
        senderId: 123,
        receiverId: 456,
        content: '',
        messageType: 'text' as const,
        timestamp: new Date()
      };

      const result = await messageDeliveryService.sendMessage(invalidMessage);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid message data');
    });
  });

  describe('Message Delivery Confirmation', () => {
    it('should handle delivery confirmation', async () => {
      const messageId = 'msg-123';
      const userId = 456;

      messageDeliveryService.confirmDelivery(messageId, userId);

      // Should track delivery confirmation
      const deliveryStatus = messageDeliveryService.getDeliveryStatus(messageId);
      expect(deliveryStatus.delivered).toBe(true);
      expect(deliveryStatus.deliveredAt).toBeDefined();
    });

    it('should send delivery confirmation to sender', async () => {
      const messageId = 'msg-123';
      const receiverUserId = 456;
      const senderUserId = 123;

      // Set up message tracking
      messageDeliveryService.trackMessage(messageId, senderUserId, receiverUserId);
      
      messageDeliveryService.confirmDelivery(messageId, receiverUserId);

      // Should notify sender of delivery
      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(senderUserId, {
        type: 'message_delivered',
        payload: {
          messageId,
          deliveredAt: expect.any(Date)
        }
      });
    });
  });

  describe('Typing Indicators', () => {
    it('should handle typing indicator start', () => {
      const sessionId = 789;
      const userId = 123;
      
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);

      messageDeliveryService.handleTypingIndicator(sessionId, userId, true);

      // Should notify other participants
      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(456, {
        type: WebSocketMessageType.TYPING_INDICATOR,
        payload: {
          sessionId,
          isTyping: true
        },
        from: userId
      });
    });

    it('should handle typing indicator stop', () => {
      const sessionId = 789;
      const userId = 123;
      
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);

      messageDeliveryService.handleTypingIndicator(sessionId, userId, false);

      // Should notify other participants
      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(456, {
        type: WebSocketMessageType.TYPING_INDICATOR,
        payload: {
          sessionId,
          isTyping: false
        },
        from: userId
      });
    });

    it('should auto-stop typing indicator after timeout', (done) => {
      const sessionId = 789;
      const userId = 123;
      
      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);

      messageDeliveryService.handleTypingIndicator(sessionId, userId, true);

      // Should auto-stop after timeout
      setTimeout(() => {
        expect(mockWsManager.sendToUser).toHaveBeenCalledWith(456, {
          type: WebSocketMessageType.TYPING_INDICATOR,
          payload: {
            sessionId,
            isTyping: false
          },
          from: userId
        });
        done();
      }, 5100); // Should stop after 5 seconds
    }, 6000);
  });

  describe('Offline Message Delivery', () => {
    it('should deliver queued messages when user comes online', async () => {
      const userId = 456;
      const queuedMessage = {
        type: WebSocketMessageType.CHAT_MESSAGE,
        payload: {
          sessionId: 789,
          content: 'Hello',
          messageType: 'text'
        },
        from: 123,
        timestamp: new Date()
      };

      // Queue a message
      await messageDeliveryService.queueOfflineMessage(userId, queuedMessage);

      // User comes online
      await messageDeliveryService.deliverQueuedMessages(userId);

      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(userId, queuedMessage);
      
      // Queue should be empty after delivery
      const remainingMessages = messageDeliveryService.getQueuedMessages(userId);
      expect(remainingMessages).toHaveLength(0);
    });

    it('should handle message ordering in queue', async () => {
      const userId = 456;
      
      const message1 = {
        type: WebSocketMessageType.CHAT_MESSAGE,
        payload: { sessionId: 789, content: 'First', messageType: 'text' },
        from: 123,
        timestamp: new Date(Date.now() - 1000)
      };
      
      const message2 = {
        type: WebSocketMessageType.CHAT_MESSAGE,
        payload: { sessionId: 789, content: 'Second', messageType: 'text' },
        from: 123,
        timestamp: new Date()
      };

      await messageDeliveryService.queueOfflineMessage(userId, message1);
      await messageDeliveryService.queueOfflineMessage(userId, message2);

      await messageDeliveryService.deliverQueuedMessages(userId);

      // Should deliver in correct order (oldest first)
      expect(mockWsManager.sendToUser).toHaveBeenNthCalledWith(1, userId, message1);
      expect(mockWsManager.sendToUser).toHaveBeenNthCalledWith(2, userId, message2);
    });

    it('should limit queue size to prevent memory issues', async () => {
      const userId = 456;
      const maxQueueSize = 100; // Assuming this is the limit

      // Try to queue more than the limit
      for (let i = 0; i < maxQueueSize + 10; i++) {
        await messageDeliveryService.queueOfflineMessage(userId, {
          type: WebSocketMessageType.CHAT_MESSAGE,
          payload: { sessionId: 789, content: `Message ${i}`, messageType: 'text' },
          from: 123,
          timestamp: new Date()
        });
      }

      const queuedMessages = messageDeliveryService.getQueuedMessages(userId);
      expect(queuedMessages.length).toBeLessThanOrEqual(maxQueueSize);
    });
  });

  describe('Message Read Receipts', () => {
    it('should handle read receipt', async () => {
      const messageId = 1;
      const userId = 456;
      const senderId = 123;

      (mockMessageService.markAsRead as any).mockResolvedValue(true);

      await messageDeliveryService.handleReadReceipt(messageId, userId, senderId);

      // Should mark as read in database
      expect(mockMessageService.markAsRead).toHaveBeenCalledWith(messageId, userId);

      // Should notify sender
      expect(mockWsManager.sendToUser).toHaveBeenCalledWith(senderId, {
        type: 'message_read',
        payload: {
          messageId,
          readBy: userId,
          readAt: expect.any(Date)
        }
      });
    });
  });

  describe('Delivery Statistics', () => {
    it('should track delivery statistics', () => {
      const stats = messageDeliveryService.getDeliveryStats();

      expect(stats).toEqual({
        totalMessagesSent: 0,
        totalMessagesDelivered: 0,
        totalMessagesQueued: 0,
        averageDeliveryTime: 0,
        deliverySuccessRate: 100
      });
    });

    it('should update statistics after message delivery', async () => {
      const message = {
        id: 'msg-stats',
        sessionId: 789,
        senderId: 123,
        receiverId: 456,
        content: 'Test stats',
        messageType: 'text' as const,
        timestamp: new Date()
      };

      (mockWsManager.getUsersInSession as any).mockReturnValue([123, 456]);
      (mockWsManager.isUserConnected as any).mockReturnValue(true);
      (mockMessageService.createMessage as any).mockResolvedValue({
        id: 1,
        senderId: 123,
        receiverId: 456,
        content: 'Test stats',
        timestamp: new Date(),
        read: false
      });

      await messageDeliveryService.sendMessage(message);

      const stats = messageDeliveryService.getDeliveryStats();
      expect(stats.totalMessagesSent).toBe(1);
    });
  });
});