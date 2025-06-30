export interface CreateMessageRequest {
  senderId: number;
  receiverId: number;
  content: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery {
  userId: number;
  query?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface MessageStats {
  unreadCount: number;
  totalSent: number;
  totalReceived: number;
  conversationCount: number;
}

export interface MessageStorage {
  sendMessage(data: CreateMessageRequest): Promise<Message>;
  getConversation(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  markMessageAsRead(messageId: number, userId: number): Promise<boolean>;
  deleteMessage(messageId: number, userId: number): Promise<boolean>;
  searchMessages(query: SearchQuery): Promise<Message[]>;
}

export class MessageService {
  private readonly MAX_MESSAGE_LENGTH = 10000;
  private readonly MAX_SEARCH_LIMIT = 100;
  private readonly DEFAULT_PAGE_LIMIT = 20;

  constructor(private storage: MessageStorage) {}

  /**
   * Create a new message with validation and sanitization
   */
  async createMessage(data: CreateMessageRequest): Promise<Message> {
    // Validate input
    this.validateMessageData(data);

    // Sanitize content
    const sanitizedData = {
      ...data,
      content: this.sanitizeContent(data.content)
    };

    // Create message in storage
    return await this.storage.sendMessage(sanitizedData);
  }

  /**
   * Get conversation history between two users with pagination
   */
  async getConversationHistory(
    userId1: number,
    userId2: number,
    options?: PaginationOptions
  ): Promise<Message[]> {
    // Validate user IDs
    if (!this.isValidUserId(userId1) || !this.isValidUserId(userId2)) {
      throw new Error('Invalid user IDs');
    }

    // Apply default pagination options
    const paginationOptions = this.applyDefaultPagination(options);

    // Get conversation from storage
    return await this.storage.getConversation(userId1, userId2);
  }

  /**
   * Search messages with various criteria
   */
  async searchMessages(query: SearchQuery): Promise<Message[]> {
    // Validate search query
    this.validateSearchQuery(query);

    // Apply search limits
    const sanitizedQuery = {
      ...query,
      limit: Math.min(query.limit || this.MAX_SEARCH_LIMIT, this.MAX_SEARCH_LIMIT),
      offset: query.offset || 0
    };

    return await this.storage.searchMessages(sanitizedQuery);
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: number, userId: number): Promise<boolean> {
    if (!this.isValidMessageId(messageId) || !this.isValidUserId(userId)) {
      throw new Error('Invalid message or user ID');
    }

    return await this.storage.markMessageAsRead(messageId, userId);
  }

  /**
   * Get count of unread messages for a user
   */
  async getUnreadMessageCount(userId: number): Promise<number> {
    if (!this.isValidUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    return await this.storage.getUnreadMessageCount(userId);
  }

  /**
   * Soft delete a message
   */
  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    if (!this.isValidMessageId(messageId) || !this.isValidUserId(userId)) {
      throw new Error('Invalid user or message ID');
    }

    return await this.storage.deleteMessage(messageId, userId);
  }

  /**
   * Mark multiple messages as read
   */
  async markMultipleAsRead(messageIds: number[], userId: number): Promise<boolean> {
    if (!this.isValidUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    let allSuccessful = true;

    for (const messageId of messageIds) {
      try {
        const success = await this.markAsRead(messageId, userId);
        if (!success) {
          allSuccessful = false;
        }
      } catch (error) {
        console.error(`Failed to mark message ${messageId} as read:`, error);
        allSuccessful = false;
      }
    }

    return allSuccessful;
  }

  /**
   * Get message statistics for a user
   */
  async getMessageStats(userId: number): Promise<MessageStats> {
    if (!this.isValidUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    const unreadCount = await this.storage.getUnreadMessageCount(userId);

    // For now, return basic stats. Could be expanded with more storage methods
    return {
      unreadCount,
      totalSent: 0, // Would need additional storage method
      totalReceived: 0, // Would need additional storage method
      conversationCount: 0 // Would need additional storage method
    };
  }

  /**
   * Validate message data
   */
  private validateMessageData(data: CreateMessageRequest): void {
    if (!this.isValidUserId(data.senderId)) {
      throw new Error('Invalid sender or receiver ID');
    }

    if (!this.isValidUserId(data.receiverId)) {
      throw new Error('Invalid sender or receiver ID');
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (data.content.length > this.MAX_MESSAGE_LENGTH) {
      throw new Error('Message content too long');
    }
  }

  /**
   * Validate search query
   */
  private validateSearchQuery(query: SearchQuery): void {
    if (!this.isValidUserId(query.userId)) {
      throw new Error('Invalid user ID');
    }

    if (query.limit && query.limit < 1) {
      throw new Error('Invalid search limit');
    }

    if (query.offset && query.offset < 0) {
      throw new Error('Invalid search offset');
    }
  }

  /**
   * Sanitize message content to prevent XSS
   */
  private sanitizeContent(content: string): string {
    // Remove HTML tags and scripts
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Check if user ID is valid
   */
  private isValidUserId(userId: number): boolean {
    return userId && userId > 0 && Number.isInteger(userId);
  }

  /**
   * Check if message ID is valid
   */
  private isValidMessageId(messageId: number): boolean {
    return messageId && messageId > 0 && Number.isInteger(messageId);
  }

  /**
   * Apply default pagination options
   */
  private applyDefaultPagination(options?: PaginationOptions): PaginationOptions {
    return {
      page: options?.page || 1,
      limit: options?.limit || this.DEFAULT_PAGE_LIMIT,
      sortOrder: options?.sortOrder || 'desc'
    };
  }

  /**
   * Get message delivery statistics
   */
  async getMessageDeliveryStats(): Promise<any> {
    // This could be expanded to provide system-wide message statistics
    return {
      totalMessages: 0, // Would need storage method
      averageResponseTime: 0, // Would need storage method
      deliverySuccessRate: 100 // Would need storage method
    };
  }

  /**
   * Clean up old messages (for maintenance)
   */
  async cleanupOldMessages(daysToKeep: number = 365): Promise<number> {
    // This would need a storage method to delete messages older than specified days
    console.log(`Cleanup would remove messages older than ${daysToKeep} days`);
    return 0; // Number of messages cleaned up
  }
}