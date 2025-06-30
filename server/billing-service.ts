export interface SessionBillingData {
  sessionId: number;
  advisorId: number;
  userId?: number;
  startTime: Date;
  endTime: Date;
  ratePerMinute: number;
  sessionType?: string;
}

export interface BillingResult {
  duration: number; // minutes
  cost: number;
  breakdown: {
    baseRate: number;
    minutes: number;
    total: number;
    discount?: number;
  };
  isFree?: boolean;
}

export interface PaymentData {
  sessionId: number;
  userId: number;
  amount: number;
  paymentMethod: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  error?: string;
}

export interface RefundData {
  sessionId: number;
  userId: number;
  amount: number;
  reason: string;
}

export interface BillingStatus {
  status: 'pending' | 'completed' | 'disputed' | 'refunded';
  totalAmount: number;
  pendingAmount?: number;
  hasDispute?: boolean;
  transactions: any[];
}

export interface AdvisorPayoutData {
  sessionId: number;
  advisorId: number;
  totalAmount: number;
  platformFee: number;
}

export interface PayoutResult {
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  feePercentage: number;
}

export interface PayoutProcessData {
  advisorId: number;
  sessionId: number;
  amount: number;
  payoutMethod: string;
}

export interface BillingReport {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
}

export interface BillingMetrics {
  averageSessionCost: number;
  totalProcessedAmount: number;
  successRate: number;
}

export class BillingService {
  constructor(private storage: any) {}

  /**
   * Calculate session cost based on duration and rate
   */
  async calculateSessionCost(sessionData: SessionBillingData): Promise<BillingResult> {
    try {
      this.validateBillingData(sessionData);

      const durationMs = sessionData.endTime.getTime() - sessionData.startTime.getTime();
      let durationMinutes = Math.ceil(durationMs / (1000 * 60)); // Round up to next minute

      // Minimum billing duration of 1 minute
      if (durationMinutes < 1) {
        durationMinutes = 1;
      }

      // Handle free sessions
      if (sessionData.ratePerMinute === 0 || sessionData.sessionType === 'free_consultation') {
        return {
          duration: durationMinutes,
          cost: 0,
          breakdown: {
            baseRate: 0,
            minutes: durationMinutes,
            total: 0
          },
          isFree: true
        };
      }

      let totalCost = durationMinutes * sessionData.ratePerMinute;
      const breakdown: any = {
        baseRate: sessionData.ratePerMinute,
        minutes: durationMinutes,
        total: totalCost
      };

      // Apply user discount if applicable
      if (sessionData.userId) {
        const user = await this.storage.getUser(sessionData.userId);
        if (user?.discountRate) {
          const discount = totalCost * user.discountRate;
          totalCost -= discount;
          breakdown.discount = discount;
          breakdown.total = totalCost;
        }
      }

      return {
        duration: durationMinutes,
        cost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
        breakdown
      };

    } catch (error) {
      console.error('Error calculating session cost:', error);
      throw error;
    }
  }

  /**
   * Process payment for session
   */
  async processSessionPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      // Check user balance
      const userBalance = await this.storage.getUserBalance(paymentData.userId);
      
      if (userBalance < paymentData.amount) {
        return {
          success: false,
          error: 'Insufficient funds'
        };
      }

      // Create transaction
      const transaction = await this.storage.createTransaction({
        sessionId: paymentData.sessionId,
        userId: paymentData.userId,
        amount: paymentData.amount,
        type: 'payment',
        paymentMethod: paymentData.paymentMethod,
        status: 'completed'
      });

      // Update user balance
      const newBalance = userBalance - paymentData.amount;
      await this.storage.updateUserBalance(paymentData.userId, newBalance);

      return {
        success: true,
        transactionId: transaction.id,
        amount: paymentData.amount
      };

    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Process refund for session
   */
  async processRefund(refundData: RefundData): Promise<PaymentResult> {
    try {
      // Get current user balance
      const userBalance = await this.storage.getUserBalance(refundData.userId);

      // Create refund transaction
      const transaction = await this.storage.createTransaction({
        sessionId: refundData.sessionId,
        userId: refundData.userId,
        amount: refundData.amount,
        type: 'refund',
        reason: refundData.reason,
        status: 'completed'
      });

      // Update user balance
      const newBalance = userBalance + refundData.amount;
      await this.storage.updateUserBalance(refundData.userId, newBalance);

      return {
        success: true,
        transactionId: transaction.id,
        amount: refundData.amount
      };

    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed'
      };
    }
  }

  /**
   * Get billing status for session
   */
  async getSessionBilling(sessionId: number): Promise<BillingStatus> {
    try {
      const transactions = await this.storage.getTransactionsBySession(sessionId);
      
      let totalAmount = 0;
      let pendingAmount = 0;
      let hasDispute = false;
      let status: BillingStatus['status'] = 'pending';

      for (const transaction of transactions) {
        if (transaction.type === 'payment') {
          totalAmount += transaction.amount;
          if (transaction.status === 'pending') {
            pendingAmount += transaction.amount;
          }
        } else if (transaction.type === 'refund') {
          totalAmount -= transaction.amount;
        }

        if (transaction.status === 'disputed') {
          hasDispute = true;
          status = 'disputed';
        } else if (transaction.status === 'completed' && status !== 'disputed') {
          status = 'completed';
        }
      }

      if (pendingAmount > 0 && status !== 'disputed') {
        status = 'pending';
      }

      return {
        status,
        totalAmount: Math.round(totalAmount * 100) / 100,
        pendingAmount: pendingAmount > 0 ? Math.round(pendingAmount * 100) / 100 : undefined,
        hasDispute,
        transactions
      };

    } catch (error) {
      console.error('Error getting session billing:', error);
      throw error;
    }
  }

  /**
   * Calculate advisor payout
   */
  async calculateAdvisorPayout(data: AdvisorPayoutData): Promise<PayoutResult> {
    try {
      let platformFeeRate = data.platformFee;

      // Check if advisor has custom fee rate
      const advisor = await this.storage.getAdvisor(data.advisorId);
      if (advisor?.customFeeRate) {
        platformFeeRate = advisor.customFeeRate;
      }

      const platformFee = data.totalAmount * platformFeeRate;
      const netAmount = data.totalAmount - platformFee;

      return {
        grossAmount: data.totalAmount,
        platformFee: Math.round(platformFee * 100) / 100,
        netAmount: Math.round(netAmount * 100) / 100,
        feePercentage: Math.round(platformFeeRate * 100)
      };

    } catch (error) {
      console.error('Error calculating advisor payout:', error);
      throw error;
    }
  }

  /**
   * Process advisor payout
   */
  async processAdvisorPayout(payoutData: PayoutProcessData): Promise<PaymentResult> {
    try {
      const transaction = await this.storage.createTransaction({
        advisorId: payoutData.advisorId,
        sessionId: payoutData.sessionId,
        amount: payoutData.amount,
        type: 'payout',
        payoutMethod: payoutData.payoutMethod,
        status: 'completed'
      });

      return {
        success: true,
        transactionId: transaction.id,
        amount: payoutData.amount
      };

    } catch (error) {
      console.error('Error processing advisor payout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payout processing failed'
      };
    }
  }

  /**
   * Generate billing report for date range
   */
  async generateBillingReport(dateRange: { startDate: Date; endDate: Date }): Promise<BillingReport> {
    try {
      const transactions = await this.storage.getTransactionsBySession();
      
      let totalRevenue = 0;
      let totalRefunds = 0;
      let transactionCount = 0;

      for (const transaction of transactions) {
        if (transaction.status === 'completed') {
          transactionCount++;
          if (transaction.type === 'payment') {
            totalRevenue += transaction.amount;
          } else if (transaction.type === 'refund') {
            totalRefunds += transaction.amount;
          }
        }
      }

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalRefunds: Math.round(totalRefunds * 100) / 100,
        netRevenue: Math.round((totalRevenue - totalRefunds) * 100) / 100,
        transactionCount
      };

    } catch (error) {
      console.error('Error generating billing report:', error);
      throw error;
    }
  }

  /**
   * Get billing metrics
   */
  async getBillingMetrics(sessionId?: number): Promise<BillingMetrics> {
    // Placeholder implementation
    return {
      averageSessionCost: 0,
      totalProcessedAmount: 0,
      successRate: 100
    };
  }

  /**
   * Validate billing data
   */
  private validateBillingData(data: SessionBillingData): void {
    if (!data.sessionId || data.sessionId <= 0) {
      throw new Error('Invalid billing data');
    }

    if (!data.advisorId || data.advisorId <= 0) {
      throw new Error('Invalid billing data');
    }

    if (data.ratePerMinute < 0) {
      throw new Error('Invalid billing data');
    }

    if (!data.startTime || !data.endTime) {
      throw new Error('Invalid billing data');
    }

    if (data.endTime <= data.startTime) {
      throw new Error('Invalid billing data');
    }
  }
}