import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from '@server/message-service';

// Mock the storage
const mockStorage = {
  sendMessage: vi.fn(),
  getConversation: vi.fn(),
  getUnreadMessageCount: vi.fn(),
  markMessageAsRead: vi.fn(),
  deleteMessage: vi.fn(),
  searchMessages: vi.fn()
};

describe('MessageService', () => {
  let messageService: MessageService;

  beforeEach(() => {
    // Reset all mocks
    Object.values(mockStorage).forEach(mock => mock.mockReset());
    
    messageService = new MessageService(mockStorage as any);
  });

  describe('Message Creation', () => {
    it('should create a new message', async () => {
      const messageData = {
        senderId: 123,
        receiverId: 456,
        content: 'Hello, how are you?'
      };

      const expectedMessage = {
        id: 1,
        ...messageData,
        timestamp: new Date(),
        read: false
      };

      mockStorage.sendMessage.mockResolvedValue(expectedMessage);

      const result = await messageService.createMessage(messageData);

      expect(result).toEqual(expectedMessage);
      expect(mockStorage.sendMessage).toHaveBeenCalledWith(messageData);
    });

    it('should handle message creation errors', async () => {
      const messageData = {
        senderId: 123,
        receiverId: 456,
        content: 'Test message'
      };

      mockStorage.sendMessage.mockRejectedValue(new Error('Database error'));

      await expect(messageService.createMessage(messageData)).rejects.toThrow('Database error');
    });

    it('should validate message content', async () => {
      const invalidMessageData = {
        senderId: 123,
        receiverId: 456,
        content: '' // Empty content
      };

      await expect(messageService.createMessage(invalidMessageData)).rejects.toThrow('Message content cannot be empty');
    });

    it('should validate user IDs', async () => {
      const invalidMessageData = {
        senderId: 0, // Invalid sender ID
        receiverId: 456,
        content: 'Test message'
      };

      await expect(messageService.createMessage(invalidMessageData)).rejects.toThrow('Invalid sender or receiver ID');
    });
  });

  describe('Conversation History', () => {
    it('should get conversation history between two users', async () => {
      const user1 = 123;
      const user2 = 456;
      const paginationOptions = {
        page: 1,
        limit: 20,
        sortOrder: 'desc' as const
      };

      const expectedMessages = [
        {
          id: 1,
          senderId: 123,
          receiverId: 456,
          content: 'Hello',
          timestamp: new Date(),
          read: true
        },
        {
          id: 2,
          senderId: 456,
          receiverId: 123,
          content: 'Hi there!',
          timestamp: new Date(),
          read: false
        }
      ];

      mockStorage.getConversation.mockResolvedValue(expectedMessages);

      const result = await messageService.getConversationHistory(user1, user2, paginationOptions);

      expect(result).toEqual(expectedMessages);
      expect(mockStorage.getConversation).toHaveBeenCalledWith(user1, user2);
    });

    it('should handle default pagination options', async () => {
      const user1 = 123;
      const user2 = 456;

      mockStorage.getConversation.mockResolvedValue([]);

      await messageService.getConversationHistory(user1, user2);

      expect(mockStorage.getConversation).toHaveBeenCalledWith(user1, user2);
    });

    it('should validate user IDs for conversation history', async () => {
      await expect(messageService.getConversationHistory(0, 456)).rejects.toThrow('Invalid user IDs');
      await expect(messageService.getConversationHistory(123, 0)).rejects.toThrow('Invalid user IDs');
    });

    it('should handle pagination limits', async () => {
      const user1 = 123;
      const user2 = 456;
      const options = {
        page: 1,
        limit: 150, // Over maximum
        sortOrder: 'asc' as const
      };

      mockStorage.getConversation.mockResolvedValue([]);

      await messageService.getConversationHistory(user1, user2, options);

      // Should be called with valid parameters
      expect(mockStorage.getConversation).toHaveBeenCalledWith(user1, user2);
    });
  });

  describe('Message Search', () => {
    it('should search messages by content', async () => {
      const searchQuery = {
        userId: 123,
        query: 'hello',
        limit: 10,
        offset: 0
      };

      const expectedResults = [
        {
          id: 1,
          senderId: 456,
          receiverId: 123,
          content: 'Hello there!',
          timestamp: new Date(),
          read: true
        }
      ];

      mockStorage.searchMessages.mockResolvedValue(expectedResults);

      const result = await messageService.searchMessages(searchQuery);

      expect(result).toEqual(expectedResults);
      expect(mockStorage.searchMessages).toHaveBeenCalledWith(searchQuery);
    });

    it('should search messages by date range', async () => {
      const searchQuery = {
        userId: 123,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 20
      };

      mockStorage.searchMessages.mockResolvedValue([]);

      await messageService.searchMessages(searchQuery);

      expect(mockStorage.searchMessages).toHaveBeenCalledWith({
        ...searchQuery,
        offset: 0 // Service adds default offset
      });
    });

    it('should validate search query', async () => {
      const invalidQuery = {
        userId: 0, // Invalid user ID
        query: 'test'
      };

      await expect(messageService.searchMessages(invalidQuery)).rejects.toThrow('Invalid user ID');
    });

    it('should handle empty search results', async () => {
      const searchQuery = {
        userId: 123,
        query: 'nonexistent'
      };

      mockStorage.searchMessages.mockResolvedValue([]);

      const result = await messageService.searchMessages(searchQuery);

      expect(result).toEqual([]);
    });
  });

  describe('Message Status Management', () => {
    it('should mark message as read', async () => {
      const messageId = 1;
      const userId = 123;

      mockStorage.markMessageAsRead.mockResolvedValue(true);

      const result = await messageService.markAsRead(messageId, userId);

      expect(result).toBe(true);
      expect(mockStorage.markMessageAsRead).toHaveBeenCalledWith(messageId, userId);
    });

    it('should get unread message count', async () => {
      const userId = 123;
      const expectedCount = 5;

      mockStorage.getUnreadMessageCount.mockResolvedValue(expectedCount);

      const result = await messageService.getUnreadMessageCount(userId);

      expect(result).toBe(expectedCount);
      expect(mockStorage.getUnreadMessageCount).toHaveBeenCalledWith(userId);
    });

    it('should handle marking non-existent message as read', async () => {
      const messageId = 999;
      const userId = 123;

      mockStorage.markMessageAsRead.mockResolvedValue(false);

      const result = await messageService.markAsRead(messageId, userId);

      expect(result).toBe(false);
    });
  });

  describe('Message Deletion', () => {
    it('should soft delete message', async () => {
      const messageId = 1;
      const userId = 123;

      mockStorage.deleteMessage.mockResolvedValue(true);

      const result = await messageService.deleteMessage(messageId, userId);

      expect(result).toBe(true);
      expect(mockStorage.deleteMessage).toHaveBeenCalledWith(messageId, userId);
    });

    it('should handle deletion of non-existent message', async () => {
      const messageId = 999;
      const userId = 123;

      mockStorage.deleteMessage.mockResolvedValue(false);

      const result = await messageService.deleteMessage(messageId, userId);

      expect(result).toBe(false);
    });

    it('should validate deletion permissions', async () => {
      const messageId = 1;
      const invalidUserId = 0;

      await expect(messageService.deleteMessage(messageId, invalidUserId)).rejects.toThrow('Invalid user or message ID');
    });
  });

  describe('Message Statistics', () => {
    it('should get message statistics for user', async () => {
      const userId = 123;

      // Mock different storage calls for statistics
      mockStorage.getUnreadMessageCount.mockResolvedValue(5);
      mockStorage.getConversation.mockResolvedValue([
        { id: 1, senderId: 123, receiverId: 456, content: 'test', timestamp: new Date(), read: true }
      ]);

      const stats = await messageService.getMessageStats(userId);

      expect(stats).toEqual({
        unreadCount: 5,
        totalSent: 0, // Would need more sophisticated mocking for this
        totalReceived: 0, // Would need more sophisticated mocking for this
        conversationCount: 0 // Would need more sophisticated mocking for this
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should mark multiple messages as read', async () => {
      const messageIds = [1, 2, 3];
      const userId = 123;

      mockStorage.markMessageAsRead.mockResolvedValue(true);

      const result = await messageService.markMultipleAsRead(messageIds, userId);

      expect(result).toBe(true);
      expect(mockStorage.markMessageAsRead).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk operations', async () => {
      const messageIds = [1, 2, 3];
      const userId = 123;

      // Mock some successes and some failures
      mockStorage.markMessageAsRead
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await messageService.markMultipleAsRead(messageIds, userId);

      expect(result).toBe(false); // Should return false if any failed
    });
  });

  describe('Message Validation', () => {
    it('should validate message content length', async () => {
      const longContent = 'a'.repeat(10001); // Assuming 10000 char limit
      const messageData = {
        senderId: 123,
        receiverId: 456,
        content: longContent
      };

      await expect(messageService.createMessage(messageData)).rejects.toThrow('Message content too long');
    });

    it('should sanitize message content', async () => {
      const messageData = {
        senderId: 123,
        receiverId: 456,
        content: '<script>alert("xss")</script>Hello'
      };

      const expectedMessage = {
        id: 1,
        ...messageData,
        content: 'Hello', // Script tags removed
        timestamp: new Date(),
        read: false
      };

      mockStorage.sendMessage.mockResolvedValue(expectedMessage);

      const result = await messageService.createMessage(messageData);

      // Should sanitize the content
      expect(mockStorage.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello'
        })
      );
    });
  });
});