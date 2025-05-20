import { db } from "../server/db";
import { 
  specialties, 
  SpecialtyCategory, 
  users, 
  UserType, 
  sessions, 
  SessionType 
} from "../shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcrypt";

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

async function addSpecialties() {
  console.log("Adding specialties...");
  
  const specialtyData = [
    { name: "Tarot Reading", icon: "tarot-card", category: SpecialtyCategory.DIVINATION },
    { name: "Astrology", icon: "stars", category: SpecialtyCategory.ASTROLOGY },
    { name: "Psychic Reading", icon: "crystal-ball", category: SpecialtyCategory.DIVINATION },
    { name: "Energy Healing", icon: "energy", category: SpecialtyCategory.HEALING },
    { name: "Mediumship", icon: "medium", category: SpecialtyCategory.MEDIUM },
    { name: "Dream Interpretation", icon: "dream", category: SpecialtyCategory.DREAM_INTERPRETATION },
    { name: "Spiritual Guidance", icon: "spirit", category: SpecialtyCategory.SPIRITUAL_GUIDANCE },
    { name: "Past Life Reading", icon: "past-life", category: SpecialtyCategory.PAST_LIVES },
    { name: "Chakra Balancing", icon: "chakra", category: SpecialtyCategory.ENERGY_WORK },
    { name: "Numerology", icon: "numbers", category: SpecialtyCategory.DIVINATION }
  ];
  
  for (const specialty of specialtyData) {
    try {
      const result = await db.insert(specialties).values(specialty).returning();
      console.log(`Added specialty: ${specialty.name}`);
    } catch (error) {
      console.log(`Specialty already exists: ${specialty.name}`);
    }
  }
}

async function addUsers() {
  console.log("Adding users...");
  
  // Add regular users
  const regularUsers = [
    { username: "user1", name: "John Doe", email: "john@example.com" },
    { username: "user2", name: "Jane Smith", email: "jane@example.com" },
    { username: "user3", name: "Michael Johnson", email: "michael@example.com" },
    { username: "user4", name: "Emily Davis", email: "emily@example.com" },
    { username: "user5", name: "Robert Wilson", email: "robert@example.com" }
  ];
  
  for (const user of regularUsers) {
    try {
      const hashedPassword = await hashPassword(`${user.username}123`);
      await db.insert(users).values({
        username: user.username,
        password: hashedPassword,
        name: user.name,
        email: user.email,
        userType: UserType.USER,
        isAdvisor: false,
        accountBalance: Math.floor(Math.random() * 10000), // 0-100 dollars
        profileCompleted: true
      }).returning();
      console.log(`Added regular user: ${user.name}`);
    } catch (error) {
      console.log(`User already exists: ${user.username}`);
    }
  }
  
  // Add advisors
  const advisors = [
    { 
      username: "advisor1", 
      name: "Mystic Sarah", 
      email: "sarah@angelguides.ai",
      specialties: [1, 2, 3],
      bio: "I have been reading tarot cards for over 15 years and have a special connection to the spirit realm."
    },
    { 
      username: "advisor2", 
      name: "Astrologist Mike", 
      email: "mike@angelguides.ai",
      specialties: [2, 4, 6],
      bio: "As a certified astrologist with expertise in natal charts, I can provide guidance on your life's path."
    },
    { 
      username: "advisor3", 
      name: "Healer Luna", 
      email: "luna@angelguides.ai",
      specialties: [4, 7, 9],
      bio: "My energy healing practice combines ancient wisdom with modern techniques to align your chakras."
    }
  ];
  
  for (const advisor of advisors) {
    try {
      const hashedPassword = await hashPassword(`${advisor.username}123`);
      await db.insert(users).values({
        username: advisor.username,
        password: hashedPassword,
        name: advisor.name,
        email: advisor.email,
        userType: UserType.ADVISOR,
        isAdvisor: true,
        bio: advisor.bio,
        specialties: advisor.specialties,
        chatRate: 99 + Math.floor(Math.random() * 50),
        audioRate: 149 + Math.floor(Math.random() * 50),
        videoRate: 199 + Math.floor(Math.random() * 50),
        rating: 4 + Math.random(),
        reviewCount: 5 + Math.floor(Math.random() * 20),
        online: Math.random() > 0.5,
        profileCompleted: true
      }).returning();
      console.log(`Added advisor: ${advisor.name}`);
    } catch (error) {
      console.log(`Advisor already exists: ${advisor.username}`);
    }
  }
  
  // Add admin
  try {
    const hashedPassword = await hashPassword("admin123");
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      email: "admin@angelguides.ai",
      userType: UserType.ADMIN,
      isAdvisor: false,
      profileCompleted: true
    }).returning();
    console.log("Added admin user");
  } catch (error) {
    console.log("Admin user already exists");
  }
}

async function addSessions() {
  console.log("Adding sessions...");
  
  try {
    // Get user IDs
    const regularUsersResult = await db.select().from(users).where(eq(users.userType, UserType.USER));
    if (regularUsersResult.length === 0) {
      console.log("No regular users found. Skipping sessions.");
      return;
    }
    
    // Get advisor IDs
    const advisorsResult = await db.select().from(users).where(eq(users.userType, UserType.ADVISOR));
    if (advisorsResult.length === 0) {
      console.log("No advisors found. Skipping sessions.");
      return;
    }
    
    // Create sessions with different statuses
    const sessionTypes = [SessionType.CHAT, SessionType.AUDIO, SessionType.VIDEO];
    const statuses = ["scheduled", "in_progress", "completed", "canceled"];
    
    for (let i = 0; i < 20; i++) {
      const user = regularUsersResult[Math.floor(Math.random() * regularUsersResult.length)];
      const advisor = advisorsResult[Math.floor(Math.random() * advisorsResult.length)];
      const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Random date within the last 30 days for start
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 30));
      
      // Session lasts 30-60 minutes
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30 + Math.floor(Math.random() * 30));
      
      // Rate based on session type
      let ratePerMinute;
      if (sessionType === SessionType.CHAT) {
        ratePerMinute = advisor.chatRate || 99;
      } else if (sessionType === SessionType.AUDIO) {
        ratePerMinute = advisor.audioRate || 149;
      } else {
        ratePerMinute = advisor.videoRate || 199;
      }
      
      await db.insert(sessions).values({
        userId: user.id,
        advisorId: advisor.id,
        startTime,
        endTime,
        sessionType,
        status,
        ratePerMinute,
        notes: `Session between ${user.name} and ${advisor.name}`
      }).returning();
    }
    
    console.log("Added 20 sessions");
  } catch (error) {
    console.error("Error adding sessions:", error);
  }
}

async function populateDatabase() {
  try {
    await addSpecialties();
    await addUsers();
    await addSessions();
    console.log("Database successfully populated with test data");
  } catch (error) {
    console.error("Error populating database:", error);
  }
}

// Execute the function
populateDatabase();

// For importing in other files if needed
export { populateDatabase };