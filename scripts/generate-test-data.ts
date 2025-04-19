import { storage } from "../server/storage";
import { UserType, InsertUser, SpecialtyCategory } from "../shared/schema";
import { randomUUID } from "crypto";

// List of specialty categories
const SPECIALTY_CATEGORIES = Object.values(SpecialtyCategory);

// Helper function to generate a random number within a range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get a random element from an array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate a random set of specialties (IDs between 1-20)
function generateRandomSpecialties(count: number): number[] {
  const specialties: number[] = [];
  const max = Math.min(count, 20);
  
  for (let i = 0; i < max; i++) {
    const id = randomInt(1, 20);
    if (!specialties.includes(id)) {
      specialties.push(id);
    }
  }
  
  return specialties;
}

// Generate a random name
function generateRandomName(): string {
  const firstNames = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia",
    "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Sofia", "Avery", "Ella", "Scarlett", "Grace",
    "James", "Benjamin", "Lucas", "Mason", "Ethan", "Alexander", "Henry", "Jacob", "Michael", "Daniel",
    "Logan", "Jackson", "Sebastian", "Jack", "Aiden", "Owen", "Samuel", "Matthew", "Joseph", "William"
  ];
  
  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
  ];
  
  return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

// Generate a random email based on name
function generateRandomEmail(name: string): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "angelguides.ai", "hotmail.com", "mail.com"];
  const sanitizedName = name.toLowerCase().replace(/\s+/g, ".");
  const randomNum = randomInt(1, 999);
  return `${sanitizedName}${randomNum}@${getRandomElement(domains)}`;
}

// Generate a random phone number
function generateRandomPhone(): string {
  return `(${randomInt(100, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

// Generate a random bio for advisors
function generateRandomBio(): string {
  const intros = [
    "I am a gifted spiritual advisor with over",
    "I've been practicing spiritual healing for",
    "With a natural talent for psychic readings and",
    "I discovered my spiritual gifts",
    "My journey into the spiritual realm began",
    "I have been blessed with the ability to connect with spirits for"
  ];
  
  const years = randomInt(3, 30);
  
  const skills = [
    "tarot readings",
    "energy healing",
    "aura cleansing",
    "spiritual guidance",
    "angel communication",
    "past life regression",
    "astral projection guidance",
    "chakra alignment",
    "crystal healing",
    "mediumship",
    "clairvoyance",
    "empathic healing"
  ];
  
  const promises = [
    "I promise to guide you on your spiritual journey with compassion and wisdom.",
    "My goal is to help you find clarity and peace in your life.",
    "I'm here to connect you with your higher self and spiritual guides.",
    "Let me help you discover your true path and purpose.",
    "I can help you heal from past wounds and embrace your future.",
    "Together, we'll unlock the spiritual insights you've been seeking."
  ];
  
  return `${getRandomElement(intros)} ${years} years. I specialize in ${getRandomElement(skills)} and ${getRandomElement(skills)}. ${getRandomElement(promises)}`;
}

// Generate test specialties
async function generateSpecialties() {
  console.log("Generating specialties...");
  
  const specialtyList = [
    { name: "Tarot Reading", icon: "tarot", category: SpecialtyCategory.DIVINATION },
    { name: "Palm Reading", icon: "palm", category: SpecialtyCategory.DIVINATION },
    { name: "Astrology", icon: "stars", category: SpecialtyCategory.ASTROLOGY },
    { name: "Energy Healing", icon: "energy", category: SpecialtyCategory.HEALING },
    { name: "Chakra Alignment", icon: "chakra", category: SpecialtyCategory.ENERGY_WORK },
    { name: "Spirit Communication", icon: "spirit", category: SpecialtyCategory.MEDIUM },
    { name: "Angel Guidance", icon: "angel", category: SpecialtyCategory.SPIRITUAL_GUIDANCE },
    { name: "Dream Interpretation", icon: "dream", category: SpecialtyCategory.DREAM_INTERPRETATION },
    { name: "Past Life Reading", icon: "pastlife", category: SpecialtyCategory.PAST_LIVES },
    { name: "Numerology", icon: "numbers", category: SpecialtyCategory.DIVINATION },
    { name: "Crystal Healing", icon: "crystal", category: SpecialtyCategory.HEALING },
    { name: "Aura Reading", icon: "aura", category: SpecialtyCategory.ENERGY_WORK },
    { name: "Spiritual Counseling", icon: "counsel", category: SpecialtyCategory.SPIRITUAL_GUIDANCE },
    { name: "Reiki", icon: "reiki", category: SpecialtyCategory.HEALING },
    { name: "Channeling", icon: "channel", category: SpecialtyCategory.CHANNELING },
    { name: "Mediumship", icon: "medium", category: SpecialtyCategory.MEDIUM },
    { name: "Natal Chart Reading", icon: "natalchart", category: SpecialtyCategory.ASTROLOGY },
    { name: "Shamanic Healing", icon: "shamanic", category: SpecialtyCategory.HEALING },
    { name: "Akashic Records", icon: "akashic", category: SpecialtyCategory.PAST_LIVES },
    { name: "Sound Healing", icon: "sound", category: SpecialtyCategory.HEALING }
  ];
  
  for (const specialty of specialtyList) {
    await storage.createSpecialty(specialty);
  }
  
  console.log(`Created ${specialtyList.length} specialties.`);
}

// Generate users
async function generateUsers(count: number) {
  console.log(`Generating ${count} regular users...`);
  
  for (let i = 0; i < count; i++) {
    const name = generateRandomName();
    const user: InsertUser = {
      username: `user${i + 1}`,
      password: `password${i + 1}`,
      name,
      email: generateRandomEmail(name),
      phone: generateRandomPhone(),
      userType: UserType.USER,
      isAdvisor: false,
      profileCompleted: true,
      bio: "Regular user account",
    };
    
    await storage.createUser(user);
    
    // Add some balance to users for testing
    if (i % 5 === 0) {
      await storage.addUserBalance(i + 1, randomInt(1000, 10000)); // $10-$100
    }
  }
  
  console.log(`Created ${count} regular users.`);
}

// Generate advisors
async function generateAdvisors(count: number) {
  console.log(`Generating ${count} advisors...`);
  
  for (let i = 0; i < count; i++) {
    const name = generateRandomName();
    const chatRate = randomInt(100, 500); // $1-$5 per minute
    const audioRate = chatRate + randomInt(50, 150); // A bit more than chat
    const videoRate = audioRate + randomInt(100, 300); // A bit more than audio
    
    const advisor: InsertUser = {
      username: `advisor${i + 101}`, // Start from 101 to not overlap with users
      password: `password${i + 101}`,
      name,
      email: generateRandomEmail(name),
      phone: generateRandomPhone(),
      userType: UserType.ADVISOR,
      isAdvisor: true,
      profileCompleted: true,
      bio: generateRandomBio(),
      specialties: generateRandomSpecialties(randomInt(2, 5)),
      chatRate,
      audioRate,
      videoRate,
      // We'll update these after creating the user
      // rating: randomInt(35, 50), // 3.5 to 5.0 stars (stored as 35 to 50)
      // reviewCount: randomInt(5, 100),
      // online: Math.random() > 0.7, // 30% chance of being online
    };
    
    const newAdvisor = await storage.createUser(advisor);
    
    // Set rating and online status after user creation
    if (newAdvisor && newAdvisor.id) {
      const rating = randomInt(35, 50); // 3.5 to 5.0 stars (stored as 35 to 50)
      const reviewCount = randomInt(5, 100);
      const online = Math.random() > 0.7; // 30% chance of being online
      
      await storage.updateUser(newAdvisor.id, {
        rating,
        reviewCount,
        online
      });
    }
    
    // Assign specialties to advisors
    for (const specialtyId of advisor.specialties as number[]) {
      await storage.assignSpecialtyToAdvisor({
        advisorId: i + 101,
        specialtyId
      });
    }
    
    // Add some earnings to advisors for testing
    if (i % 3 === 0) {
      await storage.addAdvisorEarnings(i + 101, randomInt(5000, 50000)); // $50-$500
    }
  }
  
  console.log(`Created ${count} advisors.`);
}

// Generate admins
async function generateAdmins(count: number) {
  console.log(`Generating ${count} admins...`);
  
  for (let i = 0; i < count; i++) {
    const name = generateRandomName();
    const admin: InsertUser = {
      username: `admin${i + 1}`,
      password: `admin${i + 1}pass`,
      name,
      email: `admin${i + 1}@angelguides.ai`,
      phone: generateRandomPhone(),
      userType: UserType.ADMIN,
      isAdvisor: false,
      profileCompleted: true,
      bio: "Administrator account",
    };
    
    await storage.createUser(admin);
  }
  
  console.log(`Created ${count} admins.`);
}

// Main function to generate all test data
async function generateAllTestData() {
  try {
    console.log("Starting data generation...");
    
    // First generate specialties
    await generateSpecialties();
    
    // Generate users, advisors, and admins
    await generateUsers(100);
    await generateAdvisors(50);
    await generateAdmins(2);
    
    console.log("Data generation complete!");
  } catch (error) {
    console.error("Error generating data:", error);
  }
}

// Export the function to be called from elsewhere
export { generateAllTestData };

// This logic would only execute if this file is run directly
// Since we're using ES modules, we need different approach than require.main === module
// The exported generateAllTestData function will be used by other files