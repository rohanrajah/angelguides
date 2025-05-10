import { 
  users, type User, type InsertUser,
  specialties, type Specialty, type InsertSpecialty,
  advisorSpecialties, type AdvisorSpecialty, type InsertAdvisorSpecialty,
  sessions, type Session, type InsertSession,
  messages, type Message, type InsertMessage,
  reviews, type Review, type InsertReview,
  conversations, type Conversation, type InsertConversation, type ChatMessage,
  transactions, type Transaction, type InsertTransaction,
  SessionType, SpecialtyCategory, TransactionType, UserType
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, gt, lt, gte, lte, not, isNull, inArray } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

// Interface for advisor with specialties list for AI recommendations
export interface AdvisorWithSpecialties extends User {
  specialtiesList?: Specialty[];
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdvisors(): Promise<User[]>;
  getAdvisorById(id: number): Promise<User | undefined>;
  getRegularUsers(): Promise<User[]>;
  getAdminUsers(): Promise<User[]>;
  getAdvisorsBySpecialty(specialtyId: number): Promise<User[]>;
  updateUserStatus(id: number, online: boolean): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getAdvisorsWithSpecialties(limit?: number): Promise<AdvisorWithSpecialties[]>;
  deleteUser(id: number): Promise<void>;
  
  // Admin methods
  getAllTransactions(): Promise<Transaction[]>;
  getPendingPayouts(): Promise<any[]>; // Returns advisor payout requests
  completeAdvisorPayout(advisorId: number): Promise<any>;
  
  // Angela AI chat message methods
  createAngelaMessage(message: { userId: number, content: string, role: string }): Promise<ChatMessage>;
  
  // Account balance methods
  addUserBalance(userId: number, amount: number): Promise<User | undefined>; // amount in cents
  deductUserBalance(userId: number, amount: number): Promise<User | undefined>; // amount in cents
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  updateStripeConnectId(userId: number, stripeConnectId: string): Promise<User | undefined>;
  
  // Advisor earnings methods
  addAdvisorEarnings(advisorId: number, amount: number): Promise<User | undefined>; // amount in cents
  deductAdvisorEarnings(advisorId: number, amount: number): Promise<User | undefined>; // amount in cents
  getAdvisorEarningsBalance(advisorId: number): Promise<number>; // returns balance in cents
  getTotalAdvisorEarnings(advisorId: number): Promise<number>; // returns total earnings in cents
  setPendingPayout(advisorId: number, isPending: boolean): Promise<User | undefined>;
  
  // Specialty methods
  getAllSpecialties(): Promise<Specialty[]>;
  getSpecialty(id: number): Promise<Specialty | undefined>;
  createSpecialty(specialty: InsertSpecialty): Promise<Specialty>;
  getSpecialtiesByCategory(category: string): Promise<Specialty[]>;
  getAdvisorsByCategory(category: string): Promise<User[]>;
  
  // Advisor Specialty methods
  assignSpecialtyToAdvisor(advisorSpecialty: InsertAdvisorSpecialty): Promise<AdvisorSpecialty>;
  getAdvisorSpecialties(advisorId: number): Promise<Specialty[]>;
  
  // AI Concierge methods
  getOrCreateConversation(userId: number): Promise<Conversation>;
  updateConversation(id: number, messages: ChatMessage[]): Promise<Conversation>;
  
  // Call Center methods
  getAdvisorWorkingHours(advisorId: number): Promise<any[]>;
  addAdvisorWorkingHours(advisorId: number, workingHour: any): Promise<any>;
  updateAdvisorStatusMessage(advisorId: number, message: string): Promise<any>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getReviewById(id: number): Promise<Review | undefined>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  getReviewsByAdvisor(advisorId: number): Promise<Review[]>;
  getReviewBySession(sessionId: number): Promise<Review | undefined>;
  getAverageRatingForAdvisor(advisorId: number): Promise<number>;
  addResponseToReview(reviewId: number, response: string): Promise<Review | undefined>;
  updateAdvisorRating(advisorId: number): Promise<User | undefined>;
  
  // Session store for authentication
  sessionStore: session.Store;
  
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSessionsByUser(userId: number): Promise<Session[]>;
  getSessionsByAdvisor(advisorId: number): Promise<Session[]>;
  getUpcomingSessionsByUser(userId: number): Promise<Session[]>;
  getSessionById(id: number): Promise<Session | undefined>;
  updateSessionStatus(sessionId: number, status: string, sessionType?: string): Promise<Session | undefined>;
  updateSessionBilledAmount(sessionId: number, billedAmount: number): Promise<Session | undefined>;
  startSession(sessionId: number): Promise<Session | undefined>; // Set actualStartTime and status
  endSession(sessionId: number): Promise<Session | undefined>; // Set actualEndTime, actualDuration, and calculate billedAmount
  markSessionPaid(sessionId: number): Promise<Session | undefined>; // Mark session as paid to advisor
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  getTransactionsByAdvisor(advisorId: number): Promise<Transaction[]>;
  getTransactionsBySession(sessionId: number): Promise<Transaction[]>;
  
  // Message methods
  sendMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private specialties: Map<number, Specialty>;
  private advisorSpecialties: Map<number, AdvisorSpecialty>;
  private sessions: Map<number, Session>;
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  private reviews: Map<number, Review>;
  private transactions: Map<number, Transaction>;
  private workingHours: Map<number, any>;
  
  private userIdCounter: number;
  private specialtyIdCounter: number;
  private advisorSpecialtyIdCounter: number;
  private sessionIdCounter: number;
  private messageIdCounter: number;
  private conversationIdCounter: number;
  private reviewIdCounter: number;
  private transactionIdCounter: number;
  private workingHourIdCounter: number;
  
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.specialties = new Map();
    this.advisorSpecialties = new Map();
    this.sessions = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    this.reviews = new Map();
    this.transactions = new Map();
    this.workingHours = new Map();
    
    this.userIdCounter = 1;
    this.specialtyIdCounter = 1;
    this.advisorSpecialtyIdCounter = 1;
    this.sessionIdCounter = 1;
    this.messageIdCounter = 1;
    this.conversationIdCounter = 1;
    this.reviewIdCounter = 1;
    this.transactionIdCounter = 1;
    this.workingHourIdCounter = 1;
    
    // Initialize in-memory session store
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // ... rest of constructor
  }

  // ... existing methods

  // Call Center methods
  async getAdvisorWorkingHours(advisorId: number): Promise<any[]> {
    const workingHours = Array.from(this.workingHours.values());
    return workingHours.filter(hour => hour.advisorId === advisorId);
  }
  
  async addAdvisorWorkingHours(advisorId: number, workingHour: any): Promise<any> {
    // Check if there's already an entry for this date
    const existingHour = Array.from(this.workingHours.values()).find(
      h => h.advisorId === advisorId && h.date === workingHour.date
    );
    
    // Create the new working hour entry
    const id = existingHour?.id || this.workingHourIdCounter++;
    const newWorkingHour = {
      id,
      advisorId,
      ...workingHour
    };
    
    // Store in the map
    this.workingHours.set(id, newWorkingHour);
    
    return newWorkingHour;
  }
  
  async updateAdvisorStatusMessage(advisorId: number, message: string): Promise<any> {
    // Find the advisor
    const advisor = this.users.get(advisorId);
    
    if (!advisor) {
      throw new Error('Advisor not found');
    }
    
    // Check if the user is an advisor
    if (advisor.userType !== UserType.ADVISOR) {
      throw new Error('User is not an advisor');
    }
    
    // Update status message
    const updatedAdvisor = {
      ...advisor,
      statusMessage: message
    };
    
    this.users.set(advisorId, updatedAdvisor);
    
    return { success: true, message: 'Status message updated' };
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool: pool,
      tableName: 'session'
    });
  }

  // ... existing methods

  // Call Center methods
  async getAdvisorWorkingHours(advisorId: number): Promise<any[]> {
    // Note: In production, we would have a proper table for working hours
    // For now, we'll just return empty array in database implementation
    return [];
  }
  
  async addAdvisorWorkingHours(advisorId: number, workingHour: any): Promise<any> {
    // Note: In production, we would insert into a workingHours table
    // For now, we'll return a mock response
    return {
      id: 1,
      advisorId,
      ...workingHour
    };
  }
  
  async updateAdvisorStatusMessage(advisorId: number, message: string): Promise<any> {
    // Update the advisor's status message
    const [updatedUser] = await db
      .update(users)
      .set({ statusMessage: message })
      .where(eq(users.id, advisorId))
      .returning();
      
    if (!updatedUser) {
      throw new Error('Advisor not found');
    }
    
    return { success: true, message: 'Status message updated' };
  }
}

// Export storage instance
export const storage = new MemStorage();