import { 
  users, type User, type InsertUser,
  specialties, type Specialty, type InsertSpecialty,
  advisorSpecialties, type AdvisorSpecialty, type InsertAdvisorSpecialty,
  sessions, type Session, type InsertSession,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation, type ChatMessage,
  SessionType
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdvisors(): Promise<User[]>;
  getAdvisorById(id: number): Promise<User | undefined>;
  getAdvisorsBySpecialty(specialtyId: number): Promise<User[]>;
  updateUserStatus(id: number, online: boolean): Promise<User | undefined>;
  
  // Account balance methods
  addUserBalance(userId: number, amount: number): Promise<User | undefined>; // amount in cents
  deductUserBalance(userId: number, amount: number): Promise<User | undefined>; // amount in cents
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  
  // Specialty methods
  getAllSpecialties(): Promise<Specialty[]>;
  getSpecialty(id: number): Promise<Specialty | undefined>;
  createSpecialty(specialty: InsertSpecialty): Promise<Specialty>;
  
  // Advisor Specialty methods
  assignSpecialtyToAdvisor(advisorSpecialty: InsertAdvisorSpecialty): Promise<AdvisorSpecialty>;
  getAdvisorSpecialties(advisorId: number): Promise<Specialty[]>;
  
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSessionsByUser(userId: number): Promise<Session[]>;
  getSessionsByAdvisor(advisorId: number): Promise<Session[]>;
  getUpcomingSessionsByUser(userId: number): Promise<Session[]>;
  
  // Message methods
  sendMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  
  // AI Concierge methods
  getOrCreateConversation(userId: number): Promise<Conversation>;
  updateConversation(id: number, messages: ChatMessage[]): Promise<Conversation>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private specialties: Map<number, Specialty>;
  private advisorSpecialties: Map<number, AdvisorSpecialty>;
  private sessions: Map<number, Session>;
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  
  private userIdCounter: number;
  private specialtyIdCounter: number;
  private advisorSpecialtyIdCounter: number;
  private sessionIdCounter: number;
  private messageIdCounter: number;
  private conversationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.specialties = new Map();
    this.advisorSpecialties = new Map();
    this.sessions = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    
    this.userIdCounter = 1;
    this.specialtyIdCounter = 1;
    this.advisorSpecialtyIdCounter = 1;
    this.sessionIdCounter = 1;
    this.messageIdCounter = 1;
    this.conversationIdCounter = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create specialties
    const specialtyData: InsertSpecialty[] = [
      { name: "Tarot", icon: "cards" },
      { name: "Astrology", icon: "moon" },
      { name: "Meditation", icon: "spa" },
      { name: "Energy Healing", icon: "hands" },
      { name: "Psychic Reading", icon: "crystal-ball" }
    ];
    
    specialtyData.forEach(specialty => this.createSpecialty(specialty));
    
    // Create some sample advisors
    const advisorData: InsertUser[] = [
      {
        username: "sarahjohnson",
        password: "password123",
        name: "Sarah Johnson",
        email: "sarah@angelguides.ai",
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Specializing in tarot readings that provide clarity and guidance for life's most challenging decisions.",
        chatRate: 150,
        audioRate: 200,
        videoRate: 250,
        availability: "Mon-Fri, 9am-5pm"
      },
      {
        username: "michaelchen",
        password: "password123",
        name: "Michael Chen",
        email: "michael@angelguides.ai",
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Helps clients achieve inner peace and personal growth through guided meditation and spiritual practices.",
        minuteRate: 2.00,
        availability: "Weekends, 10am-6pm"
      },
      {
        username: "elenapatel",
        password: "password123",
        name: "Elena Patel",
        email: "elena@angelguides.ai",
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Provides insight into your life path and personal journey through astrology and numerology readings.",
        minuteRate: 1.75,
        availability: "Tue-Sat, 11am-7pm"
      },
      {
        username: "davidwilson",
        password: "password123",
        name: "David Wilson",
        email: "david@angelguides.ai",
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Connects with energies and spirits to provide guidance and clarity about your past, present, and future.",
        minuteRate: 2.50,
        availability: "Mon-Thu, 12pm-8pm"
      }
    ];
    
    const advisors = advisorData.map(advisor => this.createUser(advisor));
    
    // Create regular user
    this.createUser({
      username: "johndoe",
      password: "password123",
      name: "John Doe",
      email: "john@example.com",
      isAdvisor: false,
      avatar: "",
      bio: "",
      minuteRate: 0,
      availability: ""
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
      notes: "Tarot Reading Session"
    });
    
    this.createSession({
      userId: 5,
      advisorId: 3,
      startTime: fridayStart,
      endTime: fridayEnd,
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
    const newUser: User = { 
      ...user, 
      id,
      rating: user.isAdvisor ? 4 + Math.random() : 0,
      reviewCount: user.isAdvisor ? Math.floor(Math.random() * 100) + 50 : 0,
      online: Math.random() > 0.5,
      accountBalance: 0,
      stripeCustomerId: null
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getAdvisors(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isAdvisor);
  }

  async getAdvisorById(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    return user?.isAdvisor ? user : undefined;
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

  // Specialty methods
  async getAllSpecialties(): Promise<Specialty[]> {
    return Array.from(this.specialties.values());
  }

  async getSpecialty(id: number): Promise<Specialty | undefined> {
    return this.specialties.get(id);
  }

  async createSpecialty(specialty: InsertSpecialty): Promise<Specialty> {
    const id = this.specialtyIdCounter++;
    const newSpecialty: Specialty = { ...specialty, id };
    this.specialties.set(id, newSpecialty);
    return newSpecialty;
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

  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const newSession: Session = { ...session, id, status: "scheduled" };
    this.sessions.set(id, newSession);
    return newSession;
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
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values())
      .filter(message => message.receiverId === userId && !message.read)
      .length;
  }

  // AI Concierge methods
  async getOrCreateConversation(userId: number): Promise<Conversation> {
    // Find existing conversation
    const existing = Array.from(this.conversations.values())
      .find(convo => convo.userId === userId);
    
    if (existing) {
      return existing;
    }
    
    // Create new conversation
    const id = this.conversationIdCounter++;
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: 'Welcome to Angel Guides! I\'m Angela AI, your spiritual guide assistant. How can I help you today?',
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
}

export const storage = new MemStorage();
