import { db } from "./db-local";
import { 
  users, specialties, advisorSpecialties, 
  UserType, SpecialtyCategory, 
  type InsertUser, type InsertSpecialty, type InsertAdvisorSpecialty
} from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Helper function to generate a random integer in a range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function populateDatabase() {
  console.log("Starting database population...");

  // Create specialty categories
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

  console.log("Inserting specialties...");
  const insertedSpecialties = await db.insert(specialties).values(specialtyData).returning();
  console.log(`Inserted ${insertedSpecialties.length} specialties.`);

  // Create admin users
  console.log("Creating admin users...");
  const adminUsers: InsertUser[] = [
    {
      username: "rchitnis",
      password: await hashPassword("Angela123"),
      name: "Admin User",
      email: "admin@angelguides.ai",
      userType: UserType.ADMIN,
      profileCompleted: true
    },
    {
      username: "admin2",
      password: await hashPassword("Admin123"),
      name: "Secondary Admin",
      email: "admin2@angelguides.ai",
      userType: UserType.ADMIN,
      profileCompleted: true
    }
  ];

  const insertedAdmins = await db.insert(users).values(adminUsers).returning();
  console.log(`Inserted ${insertedAdmins.length} admin users.`);

  // Create advisor users
  console.log("Creating advisor users...");
  const advisorUsers: InsertUser[] = [];
  const advisorNames = [
    "Sarah Johnson", "Michael Chen", "Elena Lovechild", "David Wilson", 
    "Maria Rodriguez", "James Smith", "Aisha Kumar", "Thomas Brown",
    "Sophia Martinez", "John Williams", "Zara Ali", "Robert Thompson",
    "Emma Garcia", "Daniel Lee", "Olivia Clark", "William Davis",
    "Isabella Hernandez", "Alexander White", "Charlotte Lewis", "Henry Moore"
  ];

  const advisorBios = [
    "Specializing in tarot readings that provide clarity and guidance for life's most challenging decisions.",
    "Helps clients achieve inner peace and personal growth through guided meditation and spiritual practices.",
    "Provides insight into your life path and personal journey through astrology and numerology readings.",
    "Connects with energies and spirits to provide guidance and clarity about your past, present, and future.",
    "Expert in energy healing to help balance your chakras and promote overall wellbeing.",
    "Skilled in dream interpretation to uncover hidden messages and meanings in your subconscious.",
    "Offers personalized psychic readings to help you navigate important life decisions.",
    "Specializes in past life readings to help you understand patterns in your current life.",
    "Channeling messages from spiritual guides to provide direction and comfort.",
    "Helping you connect with loved ones who have passed with respectful and comforting readings."
  ];

  const avatarUrls = [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1553514029-1318c9127859?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1546456073-6712f79251bb?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1593529467220-9d721ceb9a78?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
  ];

  // Create 50 advisors
  for (let i = 0; i < 50; i++) {
    const nameIndex = i % advisorNames.length;
    const bioIndex = i % advisorBios.length;
    const avatarIndex = i % avatarUrls.length;
    
    const name = advisorNames[nameIndex];
    const nameParts = name.toLowerCase().split(" ");
    const username = `${nameParts[0]}${nameParts[1].charAt(0)}${i}`;
    
    const chatRate = randomInt(100, 300);
    const audioRate = chatRate + randomInt(20, 100);
    const videoRate = audioRate + randomInt(20, 100);
    
    advisorUsers.push({
      username,
      password: await hashPassword("Advisor123"),
      name,
      email: `${username}@angelguides.ai`,
      phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      userType: UserType.ADVISOR,
      isAdvisor: true,
      avatar: avatarUrls[avatarIndex],
      bio: advisorBios[bioIndex],
      chatRate,
      audioRate,
      videoRate,
      availability: "Mon-Fri, 9am-5pm",
      profileCompleted: true,
      specialties: []
    });
  }

  const insertedAdvisors = await db.insert(users).values(advisorUsers).returning();
  console.log(`Inserted ${insertedAdvisors.length} advisor users.`);

  // Assign specialties to advisors
  console.log("Assigning specialties to advisors...");
  const advisorSpecialtyAssignments: InsertAdvisorSpecialty[] = [];

  for (const advisor of insertedAdvisors) {
    // Each advisor gets 2-4 specialties
    const numSpecialties = randomInt(2, 4);
    const specialtyIndices = new Set<number>();
    
    while (specialtyIndices.size < numSpecialties) {
      specialtyIndices.add(randomInt(0, insertedSpecialties.length - 1));
    }
    
    for (const index of specialtyIndices) {
      advisorSpecialtyAssignments.push({
        advisorId: advisor.id,
        specialtyId: insertedSpecialties[index].id
      });
    }
  }

  const insertedAssignments = await db.insert(advisorSpecialties).values(advisorSpecialtyAssignments).returning();
  console.log(`Assigned ${insertedAssignments.length} specialties to advisors.`);

  // Create regular users
  console.log("Creating regular users...");
  const regularUsers: InsertUser[] = [];
  const firstNames = ["John", "Jane", "Alex", "Emily", "Sam", "Lisa", "Mark", "Anna", "Chris", "Laura"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson"];

  // Create 100 regular users (reduced from 1000 for performance)
  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;
    
    regularUsers.push({
      username,
      password: await hashPassword("User123"),
      name,
      email: `${username}@example.com`,
      phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
      userType: UserType.USER,
      isAdvisor: false,
      profileCompleted: true
    });
  }

  // Insert users in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < regularUsers.length; i += batchSize) {
    const batch = regularUsers.slice(i, i + batchSize);
    await db.insert(users).values(batch);
    console.log(`Inserted users ${i + 1} to ${Math.min(i + batchSize, regularUsers.length)}.`);
  }

  console.log("Database population completed!");
}

// Run the function
populateDatabase()
  .then(() => {
    console.log("Done! Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error populating database:", error);
    process.exit(1);
  });