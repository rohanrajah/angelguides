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
  
  // AI Concierge methods
  getOrCreateConversation(userId: number): Promise<Conversation>;
  updateConversation(id: number, messages: ChatMessage[]): Promise<Conversation>;
  
  // Review methods
  createReview(review: InsertReview): Promise<Review>;
  getReviewById(id: number): Promise<Review | undefined>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  getReviewsByAdvisor(advisorId: number): Promise<Review[]>;
  getReviewBySession(sessionId: number): Promise<Review | undefined>;
  getAverageRatingForAdvisor(advisorId: number): Promise<number>;
  addResponseToReview(reviewId: number, response: string): Promise<Review | undefined>;
  updateAdvisorRating(advisorId: number): Promise<User | undefined>;
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
  
  private userIdCounter: number;
  private specialtyIdCounter: number;
  private advisorSpecialtyIdCounter: number;
  private sessionIdCounter: number;
  private messageIdCounter: number;
  private conversationIdCounter: number;
  private reviewIdCounter: number;
  private transactionIdCounter: number;
  
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
    
    this.userIdCounter = 1;
    this.specialtyIdCounter = 1;
    this.advisorSpecialtyIdCounter = 1;
    this.sessionIdCounter = 1;
    this.messageIdCounter = 1;
    this.conversationIdCounter = 1;
    this.reviewIdCounter = 1;
    this.transactionIdCounter = 1;
    
    // Initialize in-memory session store
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create specialties with categories
    const specialtyData: InsertSpecialty[] = [
      { name: "Tarot", icon: "cards", category: SpecialtyCategory.DIVINATION },
      { name: "Astrology", icon: "moon", category: SpecialtyCategory.ASTROLOGY },
      { name: "Meditation", icon: "spa", category: SpecialtyCategory.SPIRITUAL_GUIDANCE },
      { name: "Energy Healing", icon: "hands", category: SpecialtyCategory.HEALING },
      { name: "Psychic Reading", icon: "crystal-ball", category: SpecialtyCategory.DIVINATION },
      { name: "Reiki", icon: "hands", category: SpecialtyCategory.HEALING },
      { name: "Dream Analysis", icon: "moon", category: SpecialtyCategory.DREAM_INTERPRETATION },
      { name: "Clairvoyance", icon: "eye", category: SpecialtyCategory.MEDIUM },
      { name: "Chakra Balancing", icon: "spiral", category: SpecialtyCategory.ENERGY_WORK },
      { name: "Past Life Reading", icon: "clock", category: SpecialtyCategory.PAST_LIVES },
      { name: "Channeling", icon: "radio", category: SpecialtyCategory.CHANNELING },
      { name: "Pendulum", icon: "target", category: SpecialtyCategory.DIVINATION },
      { name: "Numerology", icon: "hash", category: SpecialtyCategory.DIVINATION }
    ];
    
    specialtyData.forEach(specialty => this.createSpecialty(specialty));
    
    // Create some sample advisors
    const advisorData: InsertUser[] = [
      {
        username: "sarahjohnson",
        password: "password123",
        name: "Sarah Johnson",
        email: "sarah@angelguides.ai",
        phone: "555-789-1234",
        userType: UserType.ADVISOR,
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Specializing in tarot readings that provide clarity and guidance for life's most challenging decisions.",
        introVideo: null,
        specialties: [],
        chatRate: 150,
        audioRate: 200,
        videoRate: 250,
        availability: "Mon-Fri, 9am-5pm",
        profileCompleted: true
      },
      {
        username: "michaelchen",
        password: "password123",
        name: "Michael Chen",
        email: "michael@angelguides.ai",
        phone: "555-456-7890",
        userType: UserType.ADVISOR,
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Helps clients achieve inner peace and personal growth through guided meditation and spiritual practices.",
        introVideo: null,
        specialties: [],
        chatRate: 175,
        audioRate: 225,
        videoRate: 275,
        availability: "Weekends, 10am-6pm",
        profileCompleted: true
      },
      {
        username: "elenapatel",
        password: "password123",
        name: "Elena Lovechild",
        email: "elena@angelguides.ai",
        phone: "555-234-5678",
        userType: UserType.ADVISOR,
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Provides insight into your life path and personal journey through astrology and numerology readings.",
        introVideo: null,
        specialties: [],
        chatRate: 160,
        audioRate: 210,
        videoRate: 260,
        availability: "Tue-Sat, 11am-7pm",
        profileCompleted: true
      },
      {
        username: "davidwilson",
        password: "password123",
        name: "David Wilson",
        email: "david@angelguides.ai",
        phone: "555-345-6789",
        userType: UserType.ADVISOR,
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Connects with energies and spirits to provide guidance and clarity about your past, present, and future.",
        introVideo: null,
        specialties: [],
        chatRate: 200,
        audioRate: 250,
        videoRate: 300,
        availability: "Mon-Thu, 12pm-8pm",
        profileCompleted: true
      }
    ];
    
    const advisors = advisorData.map(advisor => this.createUser(advisor));
    
    // Create regular user
    this.createUser({
      username: "johndoe",
      password: "password123",
      name: "John Doe",
      email: "john@example.com",
      phone: "555-123-4567",
      userType: UserType.USER,
      isAdvisor: false,
      avatar: "",
      bio: "",
      introVideo: null,
      specialties: [],
      chatRate: 0,
      audioRate: 0,
      videoRate: 0,
      availability: "",
      profileCompleted: false
    });
    
    // Assign specialties to advisors
    this.assignSpecialtyToAdvisor({ advisorId: 1, specialtyId: 1 }); // Sarah - Tarot
    this.assignSpecialtyToAdvisor({ advisorId: 1, specialtyId: 4 }); // Sarah - Energy Healing
    
    this.assignSpecialtyToAdvisor({ advisorId: 2, specialtyId: 3 }); // Michael - Meditation
    
    this.assignSpecialtyToAdvisor({ advisorId: 3, specialtyId: 2 }); // Elena - Astrology
    
    this.assignSpecialtyToAdvisor({ advisorId: 4, specialtyId: 5 }); // David - Psychic Reading
    
    // Create some sample sessions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startTime = new Date(tomorrow);
    startTime.setHours(14, 0, 0, 0);
    const endTime = new Date(tomorrow);
    endTime.setHours(15, 0, 0, 0);
    
    const friday = new Date();
    friday.setDate(friday.getDate() + (5 + 7 - friday.getDay()) % 7);
    const fridayStart = new Date(friday);
    fridayStart.setHours(10, 0, 0, 0);
    const fridayEnd = new Date(friday);
    fridayEnd.setHours(11, 30, 0, 0);
    
    this.createSession({
      userId: 5,
      advisorId: 1,
      startTime,
      endTime,
      sessionType: SessionType.CHAT,
      ratePerMinute: 150,
      notes: "Tarot Reading Session"
    });
    
    this.createSession({
      userId: 5,
      advisorId: 3,
      startTime: fridayStart,
      endTime: fridayEnd,
      sessionType: SessionType.VIDEO,
      ratePerMinute: 260,
      notes: "Astrology Reading Session"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Determine user type based on isAdvisor for backward compatibility
    const userType = user.userType ?? (user.isAdvisor ? UserType.ADVISOR : UserType.USER);
    
    const newUser: User = { 
      id,
      username: user.username,
      password: user.password,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      userType, // Set the new user type field
      isAdvisor: user.isAdvisor ?? (userType === UserType.ADVISOR), // Ensure isAdvisor matches userType
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
      introVideo: user.introVideo ?? null,
      specialties: user.specialties ?? [],
      chatRate: user.chatRate ?? null,
      audioRate: user.audioRate ?? null,
      videoRate: user.videoRate ?? null,
      rating: userType === UserType.ADVISOR ? 4 + Math.random() : 0,
      reviewCount: userType === UserType.ADVISOR ? Math.floor(Math.random() * 100) + 50 : 0,
      online: Math.random() > 0.5,
      accountBalance: 0,
      earningsBalance: 0,
      totalEarnings: 0,
      pendingPayout: false,
      availability: user.availability ?? null,
      stripeCustomerId: null,
      stripeConnectId: null,
      firebaseUid: user.firebaseUid ?? null,
      lastLogin: new Date(),
      profileCompleted: user.profileCompleted ?? false // Default to false - they'll need to complete profile setup
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getAdvisors(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.userType === UserType.ADVISOR || user.isAdvisor
    );
  }

  async getAdvisorById(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    return (user?.userType === UserType.ADVISOR || user?.isAdvisor) ? user : undefined;
  }
  
  async getAdminUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.userType === UserType.ADMIN
    );
  }
  
  async getRegularUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.userType === UserType.USER && !user.isAdvisor
    );
  }

  async getAdvisorsBySpecialty(specialtyId: number): Promise<User[]> {
    const advisorIds = new Set<number>();
    
    // Get all advisor IDs with this specialty
    Array.from(this.advisorSpecialties.values())
      .filter(as => as.specialtyId === specialtyId)
      .forEach(as => advisorIds.add(as.advisorId));
    
    // Return advisors with these IDs
    return Array.from(this.users.values())
      .filter(user => user.isAdvisor && advisorIds.has(user.id));
  }

  async updateUserStatus(id: number, online: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, online };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      // Handle userType and isAdvisor relationship for backward compatibility
      let updatedData = { ...data };
      
      if (data.userType !== undefined) {
        // If userType is changing, ensure isAdvisor flag is consistent
        updatedData.isAdvisor = data.userType === UserType.ADVISOR;
      } else if (data.isAdvisor !== undefined) {
        // If isAdvisor is changing but userType isn't specified, update userType to match
        updatedData.userType = data.isAdvisor ? UserType.ADVISOR : UserType.USER;
      }
      
      const updatedUser = { ...user, ...updatedData };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  // Account balance methods
  async addUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const currentBalance = user.accountBalance || 0;
      const updatedUser = { 
        ...user, 
        accountBalance: currentBalance + amount 
      };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async deductUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const currentBalance = user.accountBalance || 0;
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }
      const updatedUser = { 
        ...user, 
        accountBalance: currentBalance - amount 
      };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, stripeCustomerId };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
  
  async updateStripeConnectId(userId: number, stripeConnectId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, stripeConnectId };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
  
  // Advisor earnings methods
  async addAdvisorEarnings(advisorId: number, amount: number): Promise<User | undefined> {
    const advisor = this.users.get(advisorId);
    if (!advisor || !advisor.isAdvisor) {
      throw new Error('User is not an advisor');
    }
    
    const currentEarningsBalance = advisor.earningsBalance || 0;
    const currentTotalEarnings = advisor.totalEarnings || 0;
    
    const updatedAdvisor = { 
      ...advisor, 
      earningsBalance: currentEarningsBalance + amount,
      totalEarnings: currentTotalEarnings + amount
    };
    
    this.users.set(advisorId, updatedAdvisor);
    return updatedAdvisor;
  }
  
  async deductAdvisorEarnings(advisorId: number, amount: number): Promise<User | undefined> {
    const advisor = this.users.get(advisorId);
    if (!advisor || !advisor.isAdvisor) {
      throw new Error('User is not an advisor');
    }
    
    const currentEarningsBalance = advisor.earningsBalance || 0;
    if (currentEarningsBalance < amount) {
      throw new Error('Insufficient earnings balance');
    }
    
    const updatedAdvisor = { 
      ...advisor, 
      earningsBalance: currentEarningsBalance - amount
    };
    
    this.users.set(advisorId, updatedAdvisor);
    return updatedAdvisor;
  }
  
  async getAdvisorEarningsBalance(advisorId: number): Promise<number> {
    const advisor = this.users.get(advisorId);
    if (!advisor || !advisor.isAdvisor) {
      throw new Error('User is not an advisor');
    }
    return advisor.earningsBalance || 0;
  }
  
  async getTotalAdvisorEarnings(advisorId: number): Promise<number> {
    const advisor = this.users.get(advisorId);
    if (!advisor || !advisor.isAdvisor) {
      throw new Error('User is not an advisor');
    }
    return advisor.totalEarnings || 0;
  }
  
  async setPendingPayout(advisorId: number, isPending: boolean): Promise<User | undefined> {
    const advisor = this.users.get(advisorId);
    if (!advisor || !advisor.isAdvisor) {
      throw new Error('User is not an advisor');
    }
    
    const updatedAdvisor = { ...advisor, pendingPayout: isPending };
    this.users.set(advisorId, updatedAdvisor);
    return updatedAdvisor;
  }

  // Specialty methods
  async getAllSpecialties(): Promise<Specialty[]> {
    return Array.from(this.specialties.values());
  }

  async getSpecialty(id: number): Promise<Specialty | undefined> {
    return this.specialties.get(id);
  }

  async createSpecialty(specialty: InsertSpecialty): Promise<Specialty> {
    const id = this.specialtyIdCounter++;
    const newSpecialty: Specialty = { ...specialty, id, category: specialty.category || 'general' };
    this.specialties.set(id, newSpecialty);
    return newSpecialty;
  }
  
  async getSpecialtiesByCategory(category: string): Promise<Specialty[]> {
    return Array.from(this.specialties.values())
      .filter(specialty => specialty.category === category);
  }
  
  async getAdvisorsByCategory(category: string): Promise<User[]> {
    // First get all specialties in this category
    const specialtiesInCategory = await this.getSpecialtiesByCategory(category);
    const specialtyIds = specialtiesInCategory.map(s => s.id);
    
    // Get all advisor IDs with these specialties
    const advisorIds = new Set<number>();
    
    Array.from(this.advisorSpecialties.values())
      .filter(as => specialtyIds.includes(as.specialtyId))
      .forEach(as => advisorIds.add(as.advisorId));
    
    // Return advisors with these IDs
    return Array.from(this.users.values())
      .filter(user => user.isAdvisor && advisorIds.has(user.id));
  }

  // Advisor Specialty methods
  async assignSpecialtyToAdvisor(advisorSpecialty: InsertAdvisorSpecialty): Promise<AdvisorSpecialty> {
    const id = this.advisorSpecialtyIdCounter++;
    const newAdvisorSpecialty: AdvisorSpecialty = { ...advisorSpecialty, id };
    this.advisorSpecialties.set(id, newAdvisorSpecialty);
    return newAdvisorSpecialty;
  }

  async getAdvisorSpecialties(advisorId: number): Promise<Specialty[]> {
    // Get specialty IDs for this advisor
    const specialtyIds = Array.from(this.advisorSpecialties.values())
      .filter(as => as.advisorId === advisorId)
      .map(as => as.specialtyId);
    
    // Return specialties with these IDs
    return Array.from(this.specialties.values())
      .filter(specialty => specialtyIds.includes(specialty.id));
  }
  
  async getAdvisorsWithSpecialties(limit: number = 10): Promise<AdvisorWithSpecialties[]> {
    // Get all advisors
    const advisors = await this.getAdvisors();
    
    if (advisors.length === 0) {
      return [];
    }
    
    // Limit the number of advisors to avoid too many operations
    const limitedAdvisors = advisors.slice(0, limit);
    
    // Fetch specialties for each advisor
    const advisorsWithSpecialties: AdvisorWithSpecialties[] = [];
    
    for (const advisor of limitedAdvisors) {
      const specialtiesList = await this.getAdvisorSpecialties(advisor.id);
      advisorsWithSpecialties.push({
        ...advisor,
        specialtiesList
      });
    }
    
    return advisorsWithSpecialties;
  }

  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const newSession: Session = { 
      id,
      userId: session.userId,
      advisorId: session.advisorId,
      startTime: session.startTime,
      endTime: session.endTime,
      sessionType: session.sessionType,
      status: "scheduled",
      notes: session.notes ?? null,
      ratePerMinute: session.ratePerMinute,
      actualStartTime: null,
      actualEndTime: null,
      actualDuration: null,
      billedAmount: null,
      isPaid: false
    };
    this.sessions.set(id, newSession);
    return newSession;
  }
  
  async getSessionById(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessionsByUser(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async getSessionsByAdvisor(advisorId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.advisorId === advisorId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async getUpcomingSessionsByUser(userId: number): Promise<Session[]> {
    const now = new Date();
    return Array.from(this.sessions.values())
      .filter(session => 
        session.userId === userId && 
        new Date(session.startTime) > now &&
        session.status === "scheduled"
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
  
  async updateSessionStatus(sessionId: number, status: string, sessionType?: string): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      status,
      sessionType: sessionType || session.sessionType
    };
    this.sessions.set(sessionId, updatedSession);
    
    return updatedSession;
  }
  
  async updateSessionBilledAmount(sessionId: number, billedAmount: number): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { ...session, billedAmount };
    this.sessions.set(sessionId, updatedSession);
    
    return updatedSession;
  }
  
  async startSession(sessionId: number): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      status: "in_progress",
      actualStartTime: new Date() 
    };
    this.sessions.set(sessionId, updatedSession);
    
    return updatedSession;
  }
  
  async endSession(sessionId: number): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (!session.actualStartTime) {
      throw new Error('Session has not been started');
    }
    
    const actualEndTime = new Date();
    // Calculate duration in minutes, rounded up
    const durationMs = actualEndTime.getTime() - session.actualStartTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    
    // Calculate billed amount
    const billedAmount = durationMinutes * session.ratePerMinute;
    
    const updatedSession = { 
      ...session, 
      status: "completed",
      actualEndTime,
      actualDuration: durationMinutes,
      billedAmount
    };
    this.sessions.set(sessionId, updatedSession);
    
    // Deduct from client's balance and add to advisor's earnings
    try {
      // Create a transaction record for the session payment
      await this.createTransaction({
        type: TransactionType.SESSION_PAYMENT,
        userId: session.userId,
        advisorId: session.advisorId,
        sessionId: session.id,
        amount: billedAmount,
        description: `Payment for ${durationMinutes} minute ${session.sessionType} session with ${(await this.getAdvisorById(session.advisorId))?.name}`,
        paymentStatus: 'completed'
      });
      
      // Deduct from client
      await this.deductUserBalance(session.userId, billedAmount);
      
      // Add to advisor
      await this.addAdvisorEarnings(session.advisorId, billedAmount);
    } catch (error) {
      // If there's an error with payment processing, update session status accordingly
      updatedSession.status = "payment_failed";
      this.sessions.set(sessionId, updatedSession);
      throw error;
    }
    
    return updatedSession;
  }
  
  async markSessionPaid(sessionId: number): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    if (session.status !== "completed") {
      throw new Error('Cannot mark incomplete session as paid');
    }
    
    const updatedSession = { ...session, isPaid: true };
    this.sessions.set(sessionId, updatedSession);
    
    return updatedSession;
  }

  // Message methods
  async sendMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMessage: Message = { 
      ...message, 
      id, 
      timestamp: new Date(),
      read: false
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        (message.senderId === userId1 && message.receiverId === userId2) || 
        (message.senderId === userId2 && message.receiverId === userId1)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.read)
      .length;
  }

  // AI Concierge methods
  async getOrCreateConversation(userId: number): Promise<Conversation> {
    // Try to find existing conversation for this user
    const existingConversation = Array.from(this.conversations.values())
      .find(conv => conv.userId === userId);
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // Create new conversation if none exists
    const id = this.conversationIdCounter++;
    
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: "Hi! I'm Angela, your spiritual guide. How can I help you today?",
      timestamp: new Date()
    };
    
    const newConversation: Conversation = {
      id,
      userId,
      messages: [welcomeMessage],
      lastUpdated: new Date()
    };
    
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async updateConversation(id: number, messages: ChatMessage[]): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error(`Conversation with ID ${id} not found`);
    }
    
    const updatedConversation: Conversation = {
      ...conversation,
      messages,
      lastUpdated: new Date()
    };
    
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }
  
  async createAngelaMessage(message: { userId: number, content: string, role: string }): Promise<ChatMessage> {
    // Get or create a conversation for this user
    const conversation = await this.getOrCreateConversation(message.userId);
    
    // Create a new message
    const newMessage: ChatMessage = {
      id: Date.now(), // Use timestamp as ID
      content: message.content,
      role: message.role as 'system' | 'user' | 'assistant',
      timestamp: new Date()
    };
    
    // Add message to conversation
    const updatedMessages = [...conversation.messages, newMessage];
    await this.updateConversation(conversation.id, updatedMessages);
    
    return newMessage;
  }

  // Review methods
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const newReview: Review = {
      id,
      rating: review.rating,
      userId: review.userId,
      advisorId: review.advisorId,
      content: review.content ?? null,
      sessionId: review.sessionId,
      createdAt: new Date(),
      response: null,
      responseDate: null,
      isHidden: false
    };
    this.reviews.set(id, newReview);
    
    // Update the advisor's rating after a new review
    await this.updateAdvisorRating(review.advisorId);
    
    return newReview;
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByUser(userId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.userId === userId);
  }

  async getReviewsByAdvisor(advisorId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.advisorId === advisorId && !review.isHidden)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
  }

  async getReviewBySession(sessionId: number): Promise<Review | undefined> {
    return Array.from(this.reviews.values())
      .find(review => review.sessionId === sessionId);
  }

  async getAverageRatingForAdvisor(advisorId: number): Promise<number> {
    const reviews = await this.getReviewsByAdvisor(advisorId);
    if (reviews.length === 0) {
      return 0;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }

  async addResponseToReview(reviewId: number, response: string): Promise<Review | undefined> {
    const review = this.reviews.get(reviewId);
    if (!review) {
      return undefined;
    }
    
    const updatedReview = {
      ...review,
      response,
      responseDate: new Date()
    };
    
    this.reviews.set(reviewId, updatedReview);
    return updatedReview;
  }

  async updateAdvisorRating(advisorId: number): Promise<User | undefined> {
    const advisor = await this.getAdvisorById(advisorId);
    if (!advisor) {
      return undefined;
    }
    
    const reviews = await this.getReviewsByAdvisor(advisorId);
    const reviewCount = reviews.length;
    let rating = 0;
    
    if (reviewCount > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      rating = Math.round((totalRating / reviewCount) * 10) / 10; // Round to one decimal place
    }
    
    const updatedAdvisor = {
      ...advisor,
      rating,
      reviewCount
    };
    
    this.users.set(advisorId, updatedAdvisor);
    return updatedAdvisor;
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const newTransaction: Transaction = {
      id,
      type: transaction.type,
      userId: transaction.userId,
      advisorId: transaction.advisorId ?? null,
      sessionId: transaction.sessionId ?? null,
      amount: transaction.amount,
      description: transaction.description,
      timestamp: new Date(),
      paymentStatus: transaction.paymentStatus || 'completed',
      paymentReference: transaction.paymentReference ?? null
    };
    
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first
  }
  
  async getTransactionsByAdvisor(advisorId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.advisorId === advisorId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first
  }
  
  async getTransactionsBySession(sessionId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'sessions'
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAdvisors(): Promise<User[]> {
    return db.select().from(users).where(eq(users.userType, UserType.ADVISOR));
  }

  async getAdvisorById(id: number): Promise<User | undefined> {
    const [advisor] = await db.select().from(users).where(
      and(
        eq(users.id, id),
        eq(users.userType, UserType.ADVISOR)
      )
    );
    return advisor;
  }

  async getRegularUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.userType, UserType.USER));
  }

  async getAdminUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.userType, UserType.ADMIN));
  }
  
  async updateUserStatus(id: number, online: boolean): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ online })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    // Handle userType and isAdvisor relationship for backward compatibility
    let updatedData = { ...data };
    
    if (data.userType !== undefined) {
      // If userType is changing, ensure isAdvisor flag is consistent
      updatedData.isAdvisor = data.userType === UserType.ADVISOR;
    } else if (data.isAdvisor !== undefined) {
      // If isAdvisor is changing but userType isn't specified, update userType to match
      updatedData.userType = data.isAdvisor ? UserType.ADVISOR : UserType.USER;
    }
    
    const [updatedUser] = await db.update(users)
      .set(updatedData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAdvisorsBySpecialty(specialtyId: number): Promise<User[]> {
    const advisorIds = await db.select({ advisorId: advisorSpecialties.advisorId })
      .from(advisorSpecialties)
      .where(eq(advisorSpecialties.specialtyId, specialtyId));
    
    if (advisorIds.length === 0) return [];
    
    return db.select().from(users).where(
      and(
        inArray(users.id, advisorIds.map(a => a.advisorId)),
        eq(users.userType, UserType.ADVISOR)
      )
    );
  }



  // Account balance methods
  async addUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;

    const [updatedUser] = await db.update(users)
      .set({ accountBalance: (user.accountBalance || 0) + amount })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async deductUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || (user.accountBalance || 0) < amount) return undefined;

    const [updatedUser] = await db.update(users)
      .set({ accountBalance: (user.accountBalance || 0) - amount })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateStripeConnectId(userId: number, stripeConnectId: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ stripeConnectId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Advisor earnings methods
  async addAdvisorEarnings(advisorId: number, amount: number): Promise<User | undefined> {
    const [advisor] = await db.select().from(users).where(
      and(
        eq(users.id, advisorId),
        eq(users.userType, UserType.ADVISOR)
      )
    );
    if (!advisor) return undefined;

    const [updatedAdvisor] = await db.update(users)
      .set({ 
        earningsBalance: (advisor.earningsBalance || 0) + amount,
        totalEarnings: (advisor.totalEarnings || 0) + amount
      })
      .where(eq(users.id, advisorId))
      .returning();
    return updatedAdvisor;
  }

  async deductAdvisorEarnings(advisorId: number, amount: number): Promise<User | undefined> {
    const [advisor] = await db.select().from(users).where(
      and(
        eq(users.id, advisorId),
        eq(users.userType, UserType.ADVISOR)
      )
    );
    if (!advisor || (advisor.earningsBalance || 0) < amount) return undefined;

    const [updatedAdvisor] = await db.update(users)
      .set({ earningsBalance: (advisor.earningsBalance || 0) - amount })
      .where(eq(users.id, advisorId))
      .returning();
    return updatedAdvisor;
  }

  async getAdvisorEarningsBalance(advisorId: number): Promise<number> {
    const [advisor] = await db.select({ earningsBalance: users.earningsBalance })
      .from(users)
      .where(
        and(
          eq(users.id, advisorId),
          eq(users.userType, UserType.ADVISOR)
        )
      );
    return advisor?.earningsBalance || 0;
  }

  async getTotalAdvisorEarnings(advisorId: number): Promise<number> {
    const [advisor] = await db.select({ totalEarnings: users.totalEarnings })
      .from(users)
      .where(
        and(
          eq(users.id, advisorId),
          eq(users.userType, UserType.ADVISOR)
        )
      );
    return advisor?.totalEarnings || 0;
  }

  async setPendingPayout(advisorId: number, isPending: boolean): Promise<User | undefined> {
    const [updatedAdvisor] = await db.update(users)
      .set({ pendingPayout: isPending })
      .where(
        and(
          eq(users.id, advisorId),
          eq(users.userType, UserType.ADVISOR)
        )
      )
      .returning();
    return updatedAdvisor;
  }

  // Specialty methods
  async getAllSpecialties(): Promise<Specialty[]> {
    return db.select().from(specialties);
  }

  async getSpecialty(id: number): Promise<Specialty | undefined> {
    const [specialty] = await db.select().from(specialties).where(eq(specialties.id, id));
    return specialty;
  }

  async createSpecialty(specialty: InsertSpecialty): Promise<Specialty> {
    const [newSpecialty] = await db.insert(specialties).values(specialty).returning();
    return newSpecialty;
  }

  async getSpecialtiesByCategory(category: string): Promise<Specialty[]> {
    return db.select().from(specialties).where(eq(specialties.category, category));
  }

  async getAdvisorsByCategory(category: string): Promise<User[]> {
    const specialtiesInCategory = await this.getSpecialtiesByCategory(category);
    if (specialtiesInCategory.length === 0) return [];

    const specialtyIds = specialtiesInCategory.map(s => s.id);
    
    const advisorIds = await db.select({ advisorId: advisorSpecialties.advisorId })
      .from(advisorSpecialties)
      .where(inArray(advisorSpecialties.specialtyId, specialtyIds));
    
    if (advisorIds.length === 0) return [];
    
    // Convert to Set and back to array to get unique advisorIds
    const uniqueAdvisorIds = Array.from(new Set(advisorIds.map(a => a.advisorId)));
    
    return db.select().from(users).where(
      and(
        inArray(users.id, uniqueAdvisorIds),
        eq(users.userType, UserType.ADVISOR)
      )
    );
  }

  // Advisor Specialty methods
  async assignSpecialtyToAdvisor(advisorSpecialty: InsertAdvisorSpecialty): Promise<AdvisorSpecialty> {
    const [newAdvisorSpecialty] = await db.insert(advisorSpecialties)
      .values(advisorSpecialty)
      .returning();
    return newAdvisorSpecialty;
  }

  async getAdvisorSpecialties(advisorId: number): Promise<Specialty[]> {
    const specialtyIds = await db.select({ specialtyId: advisorSpecialties.specialtyId })
      .from(advisorSpecialties)
      .where(eq(advisorSpecialties.advisorId, advisorId));
    
    if (specialtyIds.length === 0) return [];
    
    return db.select().from(specialties).where(
      inArray(specialties.id, specialtyIds.map(s => s.specialtyId))
    );
  }
  
  async getAdvisorsWithSpecialties(limit: number = 10): Promise<AdvisorWithSpecialties[]> {
    // Get advisors
    const advisors = await this.getAdvisors();
    
    if (advisors.length === 0) {
      return [];
    }
    
    // Limit the number of advisors to avoid too many DB calls
    const limitedAdvisors = advisors.slice(0, limit);
    
    // Fetch specialties for each advisor
    const advisorsWithSpecialties: AdvisorWithSpecialties[] = [];
    
    for (const advisor of limitedAdvisors) {
      const specialtiesList = await this.getAdvisorSpecialties(advisor.id);
      advisorsWithSpecialties.push({
        ...advisor,
        specialtiesList
      });
    }
    
    return advisorsWithSpecialties;
  }

  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async getSessionsByUser(userId: number): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.userId, userId));
  }

  async getSessionsByAdvisor(advisorId: number): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.advisorId, advisorId));
  }

  async getUpcomingSessionsByUser(userId: number): Promise<Session[]> {
    const now = new Date();
    return db.select().from(sessions).where(
      and(
        eq(sessions.userId, userId),
        gt(sessions.startTime, now),
        not(eq(sessions.status, "canceled"))
      )
    ).orderBy(asc(sessions.startTime));
  }

  async getSessionById(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async updateSessionStatus(sessionId: number, status: string, sessionType?: string): Promise<Session | undefined> {
    const updateData: any = { status };
    if (sessionType) updateData.sessionType = sessionType;

    const [updatedSession] = await db.update(sessions)
      .set(updateData)
      .where(eq(sessions.id, sessionId))
      .returning();
    return updatedSession;
  }

  async updateSessionBilledAmount(sessionId: number, billedAmount: number): Promise<Session | undefined> {
    const [updatedSession] = await db.update(sessions)
      .set({ billedAmount })
      .where(eq(sessions.id, sessionId))
      .returning();
    return updatedSession;
  }

  async startSession(sessionId: number): Promise<Session | undefined> {
    const now = new Date();
    const [updatedSession] = await db.update(sessions)
      .set({ 
        actualStartTime: now,
        status: "in_progress"
      })
      .where(eq(sessions.id, sessionId))
      .returning();
    return updatedSession;
  }

  async endSession(sessionId: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session || !session.actualStartTime) return undefined;

    const now = new Date();
    const startTime = session.actualStartTime;
    const durationMs = now.getTime() - startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const billedAmount = durationMinutes * session.ratePerMinute;

    const [updatedSession] = await db.update(sessions)
      .set({ 
        actualEndTime: now,
        actualDuration: durationMinutes,
        billedAmount,
        status: "completed"
      })
      .where(eq(sessions.id, sessionId))
      .returning();
    return updatedSession;
  }

  async markSessionPaid(sessionId: number): Promise<Session | undefined> {
    const [updatedSession] = await db.update(sessions)
      .set({ isPaid: true })
      .where(eq(sessions.id, sessionId))
      .returning();
    return updatedSession;
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.timestamp));
  }

  async getTransactionsByAdvisor(advisorId: number): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(
        and(
          eq(transactions.advisorId, advisorId),
          not(isNull(transactions.advisorId))
        )
      )
      .orderBy(desc(transactions.timestamp));
  }

  async getTransactionsBySession(sessionId: number): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(
        and(
          eq(transactions.sessionId, sessionId),
          not(isNull(transactions.sessionId))
        )
      )
      .orderBy(desc(transactions.timestamp));
  }

  // Message methods
  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return db.select().from(messages).where(
      or(
        and(
          eq(messages.senderId, userId1),
          eq(messages.receiverId, userId2)
        ),
        and(
          eq(messages.senderId, userId2),
          eq(messages.receiverId, userId1)
        )
      )
    ).orderBy(asc(messages.timestamp));
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        )
      );
    return result[0].count;
  }

  // AI Concierge methods
  async getOrCreateConversation(userId: number): Promise<Conversation> {
    const [existingConversation] = await db.select().from(conversations)
      .where(eq(conversations.userId, userId));
    
    if (existingConversation) return existingConversation;

    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: 'Hello! I\'m Angela, your spiritual guide. How can I assist you today?',
      timestamp: new Date()
    };

    const [newConversation] = await db.insert(conversations).values({
      userId,
      messages: [welcomeMessage],
      lastUpdated: new Date()
    }).returning();

    return newConversation;
  }

  async updateConversation(id: number, messages: ChatMessage[]): Promise<Conversation> {
    const [updatedConversation] = await db.update(conversations)
      .set({ 
        messages,
        lastUpdated: new Date()
      })
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation;
  }
  
  async createAngelaMessage(message: { userId: number, content: string, role: string }): Promise<ChatMessage> {
    // Get or create a conversation for this user
    const conversation = await this.getOrCreateConversation(message.userId);
    
    // Create a new message
    const newMessage: ChatMessage = {
      id: Date.now(), // Use timestamp as ID
      content: message.content,
      role: message.role as 'system' | 'user' | 'assistant',
      timestamp: new Date()
    };
    
    // Add message to conversation
    const updatedMessages = [...conversation.messages, newMessage];
    await this.updateConversation(conversation.id, updatedMessages);
    
    return newMessage;
  }

  // Review methods
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update advisor rating
    await this.updateAdvisorRating(review.advisorId);
    
    return newReview;
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByUser(userId: number): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByAdvisor(advisorId: number): Promise<Review[]> {
    return db.select().from(reviews)
      .where(
        and(
          eq(reviews.advisorId, advisorId),
          eq(reviews.isHidden, false)
        )
      )
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewBySession(sessionId: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.sessionId, sessionId));
    return review;
  }

  async getAverageRatingForAdvisor(advisorId: number): Promise<number> {
    const result = await db.select({ 
      avgRating: sql<number>`avg(${reviews.rating})` 
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.advisorId, advisorId),
        eq(reviews.isHidden, false)
      )
    );
    
    return result[0]?.avgRating || 0;
  }

  async addResponseToReview(reviewId: number, response: string): Promise<Review | undefined> {
    const [updatedReview] = await db.update(reviews)
      .set({ 
        response,
        responseDate: new Date()
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return updatedReview;
  }

  async updateAdvisorRating(advisorId: number): Promise<User | undefined> {
    const avgRating = await this.getAverageRatingForAdvisor(advisorId);
    const reviewCount = await db.select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(
        and(
          eq(reviews.advisorId, advisorId),
          eq(reviews.isHidden, false)
        )
      );
    
    const [updatedAdvisor] = await db.update(users)
      .set({ 
        rating: Math.round(avgRating),
        reviewCount: reviewCount[0].count
      })
      .where(eq(users.id, advisorId))
      .returning();
    
    return updatedAdvisor;
  }
}

// Export an instance of the storage implementation
export const storage = new DatabaseStorage();