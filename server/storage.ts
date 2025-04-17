import { 
  users, type User, type InsertUser,
  specialties, type Specialty, type InsertSpecialty,
  advisorSpecialties, type AdvisorSpecialty, type InsertAdvisorSpecialty,
  sessions, type Session, type InsertSession,
  messages, type Message, type InsertMessage,
  conversations, type Conversation, type InsertConversation, type ChatMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdvisors(): Promise<User[]>;
  getAdvisorById(id: number): Promise<User | undefined>;
  getAdvisorsBySpecialty(specialtyId: number): Promise<User[]>;
  updateUserStatus(id: number, online: boolean): Promise<User | undefined>;
  
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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Add default values for advisor ratings if applicable
    const userData = { 
      ...user,
      rating: user.isAdvisor ? 4 + Math.random() : 0,
      reviewCount: user.isAdvisor ? Math.floor(Math.random() * 100) + 50 : 0,
      online: Math.random() > 0.5
    };
    
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async getAdvisors(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isAdvisor, true));
  }

  async getAdvisorById(id: number): Promise<User | undefined> {
    const [advisor] = await db.select().from(users).where(
      and(eq(users.id, id), eq(users.isAdvisor, true))
    );
    return advisor || undefined;
  }

  async getAdvisorsBySpecialty(specialtyId: number): Promise<User[]> {
    // Get advisor IDs with this specialty
    const advisorSpecialtiesResult = await db.select({
      advisorId: advisorSpecialties.advisorId
    }).from(advisorSpecialties)
      .where(eq(advisorSpecialties.specialtyId, specialtyId));
    
    const advisorIds = advisorSpecialtiesResult.map(row => row.advisorId);
    
    if (advisorIds.length === 0) {
      return [];
    }
    
    // Return advisors with these IDs
    return db.select().from(users)
      .where(
        and(
          eq(users.isAdvisor, true),
          // Check if user ID is in the list of advisor IDs
          advisorIds.length === 1 
            ? eq(users.id, advisorIds[0])
            : users.id.in(advisorIds)
        )
      );
  }

  async updateUserStatus(id: number, online: boolean): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ online })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }

  // Specialty methods
  async getAllSpecialties(): Promise<Specialty[]> {
    return db.select().from(specialties);
  }

  async getSpecialty(id: number): Promise<Specialty | undefined> {
    const [specialty] = await db.select().from(specialties).where(eq(specialties.id, id));
    return specialty || undefined;
  }

  async createSpecialty(specialty: InsertSpecialty): Promise<Specialty> {
    const [newSpecialty] = await db.insert(specialties).values(specialty).returning();
    return newSpecialty;
  }

  // Advisor Specialty methods
  async assignSpecialtyToAdvisor(advisorSpecialty: InsertAdvisorSpecialty): Promise<AdvisorSpecialty> {
    const [newAdvisorSpecialty] = await db.insert(advisorSpecialties)
      .values(advisorSpecialty)
      .returning();
    
    return newAdvisorSpecialty;
  }

  async getAdvisorSpecialties(advisorId: number): Promise<Specialty[]> {
    // Get specialty IDs for this advisor
    const rows = await db.select({
      specialtyId: advisorSpecialties.specialtyId
    })
    .from(advisorSpecialties)
    .where(eq(advisorSpecialties.advisorId, advisorId));
    
    const specialtyIds = rows.map(row => row.specialtyId);
    
    if (specialtyIds.length === 0) {
      return [];
    }
    
    // Return specialties with these IDs
    return db.select()
      .from(specialties)
      .where(
        specialtyIds.length === 1
          ? eq(specialties.id, specialtyIds[0])
          : specialties.id.in(specialtyIds)
      );
  }

  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions)
      .values({ ...session, status: "scheduled" })
      .returning();
    
    return newSession;
  }

  async getSessionsByUser(userId: number): Promise<Session[]> {
    return db.select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(sessions.startTime);
  }

  async getSessionsByAdvisor(advisorId: number): Promise<Session[]> {
    return db.select()
      .from(sessions)
      .where(eq(sessions.advisorId, advisorId))
      .orderBy(sessions.startTime);
  }

  async getUpcomingSessionsByUser(userId: number): Promise<Session[]> {
    const now = new Date();
    
    return db.select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.status, "scheduled"),
          sessions.startTime.gte(now)
        )
      )
      .orderBy(sessions.startTime);
  }

  // Message methods
  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages)
      .values({
        ...message,
        timestamp: new Date(),
        read: false
      })
      .returning();
    
    return newMessage;
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(
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
      )
      .orderBy(messages.timestamp);
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db.select({
      count: sql<number>`count(*)`
    })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, userId),
        eq(messages.read, false)
      )
    );
    
    return result[0]?.count || 0;
  }

  // AI Concierge methods
  async getOrCreateConversation(userId: number): Promise<Conversation> {
    // Find existing conversation
    const [existing] = await db.select()
      .from(conversations)
      .where(eq(conversations.userId, userId));
    
    if (existing) {
      return existing;
    }
    
    // Create new conversation
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: 'Welcome to Angelguides.ai! I\'m Angela, your spiritual guide assistant. How can I help you today?',
      timestamp: new Date()
    };
    
    const [newConversation] = await db.insert(conversations)
      .values({
        userId,
        messages: [welcomeMessage],
        lastUpdated: new Date()
      })
      .returning();
    
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
    
    if (!updatedConversation) {
      throw new Error(`Conversation with ID ${id} not found`);
    }
    
    return updatedConversation;
  }
  
  // Helper method to initialize data
  async initializeData() {
    // Check if specialties exist already
    const existingSpecialties = await this.getAllSpecialties();
    if (existingSpecialties.length > 0) {
      return; // Data already initialized
    }
    
    // Create specialties
    const specialtyData: InsertSpecialty[] = [
      { name: "Tarot", icon: "cards" },
      { name: "Astrology", icon: "moon" },
      { name: "Meditation", icon: "spa" },
      { name: "Energy Healing", icon: "hands" },
      { name: "Psychic Reading", icon: "crystal-ball" }
    ];
    
    const specialtyPromises = specialtyData.map(specialty => this.createSpecialty(specialty));
    const specialties = await Promise.all(specialtyPromises);
    
    // Create some sample advisors
    const advisorData: InsertUser[] = [
      {
        username: "sarahjohnson",
        password: "password123",
        name: "Sarah Johnson",
        email: "sarah@etherealadvisors.com",
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Specializing in tarot readings that provide clarity and guidance for life's most challenging decisions.",
        hourlyRate: 45,
        availability: "Mon-Fri, 9am-5pm"
      },
      {
        username: "michaelchen",
        password: "password123",
        name: "Michael Chen",
        email: "michael@etherealadvisors.com",
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Helps clients achieve inner peace and personal growth through guided meditation and spiritual practices.",
        hourlyRate: 60,
        availability: "Weekends, 10am-6pm"
      },
      {
        username: "elenapatel",
        password: "password123",
        name: "Elena Patel",
        email: "elena@etherealadvisors.com",
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Provides insight into your life path and personal journey through astrology and numerology readings.",
        hourlyRate: 55,
        availability: "Tue-Sat, 11am-7pm"
      },
      {
        username: "davidwilson",
        password: "password123",
        name: "David Wilson",
        email: "david@etherealadvisors.com",
        isAdvisor: true,
        avatar: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        bio: "Connects with energies and spirits to provide guidance and clarity about your past, present, and future.",
        hourlyRate: 65,
        availability: "Mon-Thu, 12pm-8pm"
      }
    ];
    
    const advisorPromises = advisorData.map(advisor => this.createUser(advisor));
    const advisors = await Promise.all(advisorPromises);
    
    // Create regular user
    const user = await this.createUser({
      username: "johndoe",
      password: "password123",
      name: "John Doe",
      email: "john@example.com",
      isAdvisor: false,
      avatar: "",
      bio: "",
      hourlyRate: 0,
      availability: ""
    });
    
    // Assign specialties to advisors
    await this.assignSpecialtyToAdvisor({ advisorId: advisors[0].id, specialtyId: specialties[0].id }); // Sarah - Tarot
    await this.assignSpecialtyToAdvisor({ advisorId: advisors[0].id, specialtyId: specialties[3].id }); // Sarah - Energy Healing
    
    await this.assignSpecialtyToAdvisor({ advisorId: advisors[1].id, specialtyId: specialties[2].id }); // Michael - Meditation
    
    await this.assignSpecialtyToAdvisor({ advisorId: advisors[2].id, specialtyId: specialties[1].id }); // Elena - Astrology
    
    await this.assignSpecialtyToAdvisor({ advisorId: advisors[3].id, specialtyId: specialties[4].id }); // David - Psychic Reading
    
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
    
    await this.createSession({
      userId: user.id,
      advisorId: advisors[0].id,
      startTime,
      endTime,
      notes: "Tarot Reading Session"
    });
    
    await this.createSession({
      userId: user.id,
      advisorId: advisors[2].id,
      startTime: fridayStart,
      endTime: fridayEnd,
      notes: "Astrology Reading Session"
    });
  }
}

// Create database storage instance
export const storage = new DatabaseStorage();
