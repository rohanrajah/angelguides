import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from '@server/billing-service';

// Mock storage
const mockStorage = {
  getUser: vi.fn(),
  getAdvisor: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  getTransactionsBySession: vi.fn(),
  getUserBalance: vi.fn(),
  updateUserBalance: vi.fn()
};

describe('BillingService', () => {
  let billingService: BillingService;

  beforeEach(() => {
    Object.values(mockStorage).forEach(mock => mock.mockReset());
    billingService = new BillingService(mockStorage as any);
  });

  describe('Session Cost Calculation', () => {
    it('should calculate session cost correctly', async () => {
      const sessionData = {
        sessionId: 1,
        advisorId: 456,
        startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        endTime: new Date(),
        ratePerMinute: 2.50
      };

      const result = await billingService.calculateSessionCost(sessionData);

      expect(result.duration).toBe(30);
      expect(result.cost).toBe(75.00);
      expect(result.breakdown.baseRate).toBe(2.50);
      expect(result.breakdown.minutes).toBe(30);
      expect(result.breakdown.total).toBe(75.00);
    });

    it('should handle fractional minutes', async () => {
      const sessionData = {
        sessionId: 1,
        advisorId: 456,
        startTime: new Date(Date.now() - 1.5 * 60 * 1000), // 1.5 minutes ago
        endTime: new Date(),
        ratePerMinute: 3.00
      };

      const result = await billingService.calculateSessionCost(sessionData);

      expect(result.duration).toBe(2); // Rounded up to 2 minutes
      expect(result.cost).toBe(6.00);
    });

    it('should apply minimum billing duration', async () => {
      const sessionData = {
        sessionId: 1,
        advisorId: 456,
        startTime: new Date(Date.now() - 30 * 1000), // 30 seconds ago
        endTime: new Date(),
        ratePerMinute: 2.00
      };

      const result = await billingService.calculateSessionCost(sessionData);

      expect(result.duration).toBe(1); // Minimum 1 minute
      expect(result.cost).toBe(2.00);
    });

    it('should handle free sessions', async () => {
      const sessionData = {
        sessionId: 1,
        advisorId: 456,
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(),
        ratePerMinute: 0, // Free session
        sessionType: 'free_consultation'
      };

      const result = await billingService.calculateSessionCost(sessionData);

      expect(result.duration).toBe(30);
      expect(result.cost).toBe(0);
      expect(result.isFree).toBe(true);
    });

    it('should apply discounts when applicable', async () => {
      const sessionData = {
        sessionId: 1,
        advisorId: 456,
        userId: 123,
        startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour
        endTime: new Date(),
        ratePerMinute: 2.00
      };

      mockStorage.getUser.mockResolvedValue({
        id: 123,
        subscriptionType: 'premium',
        discountRate: 0.1 // 10% discount
      });

      const result = await billingService.calculateSessionCost(sessionData);

      expect(result.duration).toBe(60);
      expect(result.cost).toBe(108.00); // 120 - 12 (10% discount)
      expect(result.breakdown.discount).toBe(12.00);
    });
  });

  describe('Payment Processing', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        sessionId: 1,
        userId: 123,
        amount: 75.00,
        paymentMethod: 'credit_card'
      };

      mockStorage.getUserBalance.mockResolvedValue(100.00);
      mockStorage.createTransaction.mockResolvedValue({
        id: 'txn_123',
        status: 'completed',
        amount: 75.00
      });
      mockStorage.updateUserBalance.mockResolvedValue(true);

      const result = await billingService.processSessionPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn_123');
      expect(result.amount).toBe(75.00);
      expect(mockStorage.updateUserBalance).toHaveBeenCalledWith(123, 25.00);
    });

    it('should handle insufficient funds', async () => {
      const paymentData = {
        sessionId: 1,
        userId: 123,
        amount: 100.00,
        paymentMethod: 'credit_card'
      };

      mockStorage.getUserBalance.mockResolvedValue(50.00);

      const result = await billingService.processSessionPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
    });

    it('should handle payment failures', async () => {
      const paymentData = {
        sessionId: 1,
        userId: 123,
        amount: 75.00,
        paymentMethod: 'credit_card'
      };

      mockStorage.getUserBalance.mockResolvedValue(100.00);
      mockStorage.createTransaction.mockRejectedValue(new Error('Payment gateway error'));

      const result = await billingService.processSessionPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment gateway error');
    });

    it('should process refunds correctly', async () => {
      const refundData = {
        sessionId: 1,
        userId: 123,
        amount: 50.00,
        reason: 'session_cancelled'
      };

      mockStorage.getUserBalance.mockResolvedValue(25.00);
      mockStorage.createTransaction.mockResolvedValue({
        id: 'refund_123',
        type: 'refund',
        amount: 50.00,
        status: 'completed'
      });
      mockStorage.updateUserBalance.mockResolvedValue(true);

      const result = await billingService.processRefund(refundData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('refund_123');
      expect(mockStorage.updateUserBalance).toHaveBeenCalledWith(123, 75.00);
    });
  });

  describe('Billing Status Management', () => {
    it('should get session billing status', async () => {
      const sessionId = 1;

      mockStorage.getTransactionsBySession.mockResolvedValue([
        {
          id: 'txn_123',
          sessionId: 1,
          amount: 75.00,
          status: 'completed',
          type: 'payment',
          createdAt: new Date()
        }
      ]);

      const result = await billingService.getSessionBilling(sessionId);

      expect(result.status).toBe('completed');
      expect(result.totalAmount).toBe(75.00);
      expect(result.transactions).toHaveLength(1);
    });

    it('should track pending payments', async () => {
      const sessionId = 1;

      mockStorage.getTransactionsBySession.mockResolvedValue([
        {
          id: 'txn_456',
          sessionId: 1,
          amount: 100.00,
          status: 'pending',
          type: 'payment',
          createdAt: new Date()
        }
      ]);

      const result = await billingService.getSessionBilling(sessionId);

      expect(result.status).toBe('pending');
      expect(result.totalAmount).toBe(100.00);
      expect(result.pendingAmount).toBe(100.00);
    });

    it('should handle billing disputes', async () => {
      const sessionId = 1;

      mockStorage.getTransactionsBySession.mockResolvedValue([
        {
          id: 'txn_789',
          sessionId: 1,
          amount: 75.00,
          status: 'disputed',
          type: 'payment',
          createdAt: new Date()
        }
      ]);

      const result = await billingService.getSessionBilling(sessionId);

      expect(result.status).toBe('disputed');
      expect(result.hasDispute).toBe(true);
    });
  });

  describe('Advisor Payouts', () => {
    it('should calculate advisor payout', async () => {
      const sessionData = {
        sessionId: 1,
        advisorId: 456,
        totalAmount: 100.00,
        platformFee: 0.15 // 15% platform fee
      };

      const result = await billingService.calculateAdvisorPayout(sessionData);

      expect(result.grossAmount).toBe(100.00);
      expect(result.platformFee).toBe(15.00);
      expect(result.netAmount).toBe(85.00);
      expect(result.feePercentage).toBe(15);
    });

    it('should handle different fee structures', async () => {
      const sessionData = {
        sessionId: 1,
        advisorId: 456,
        totalAmount: 200.00,
        platformFee: 0.10 // 10% platform fee for premium advisors
      };

      mockStorage.getAdvisor.mockResolvedValue({
        id: 456,
        tier: 'premium',
        customFeeRate: 0.10
      });

      const result = await billingService.calculateAdvisorPayout(sessionData);

      expect(result.platformFee).toBe(20.00);
      expect(result.netAmount).toBe(180.00);
    });

    it('should process advisor payout', async () => {
      const payoutData = {
        advisorId: 456,
        sessionId: 1,
        amount: 85.00,
        payoutMethod: 'bank_transfer'
      };

      mockStorage.createTransaction.mockResolvedValue({
        id: 'payout_123',
        type: 'payout',
        amount: 85.00,
        status: 'completed'
      });

      const result = await billingService.processAdvisorPayout(payoutData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('payout_123');
      expect(result.amount).toBe(85.00);
    });
  });

  describe('Billing Analytics', () => {
    it('should generate billing report', async () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      mockStorage.getTransactionsBySession.mockResolvedValue([
        { amount: 100.00, type: 'payment', status: 'completed' },
        { amount: 75.00, type: 'payment', status: 'completed' },
        { amount: 25.00, type: 'refund', status: 'completed' }
      ]);

      const result = await billingService.generateBillingReport(dateRange);

      expect(result.totalRevenue).toBe(175.00);
      expect(result.totalRefunds).toBe(25.00);
      expect(result.netRevenue).toBe(150.00);
      expect(result.transactionCount).toBe(3);
    });

    it('should track billing metrics', async () => {
      const sessionId = 1;

      const result = await billingService.getBillingMetrics(sessionId);

      expect(result).toHaveProperty('averageSessionCost');
      expect(result).toHaveProperty('totalProcessedAmount');
      expect(result).toHaveProperty('successRate');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const sessionData = {
        sessionId: 1,
        advisorId: 456,
        userId: 123,
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(),
        ratePerMinute: 2.00
      };

      mockStorage.getUser.mockRejectedValue(new Error('Database connection failed'));

      await expect(billingService.calculateSessionCost(sessionData)).rejects.toThrow('Database connection failed');
    });

    it('should validate billing data', async () => {
      const invalidData = {
        sessionId: 0, // Invalid session ID
        advisorId: 456,
        startTime: new Date(),
        endTime: new Date(),
        ratePerMinute: -1.00 // Invalid rate
      };

      await expect(billingService.calculateSessionCost(invalidData)).rejects.toThrow('Invalid billing data');
    });

    it('should handle concurrent payment processing', async () => {
      const paymentData = {
        sessionId: 1,
        userId: 123,
        amount: 75.00,
        paymentMethod: 'credit_card'
      };

      // Simulate concurrent payment attempts
      mockStorage.getUserBalance.mockResolvedValue(100.00);
      mockStorage.createTransaction.mockRejectedValue(new Error('Concurrent modification'));

      const result = await billingService.processSessionPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Concurrent modification');
    });
  });
});