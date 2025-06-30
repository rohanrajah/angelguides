import { db } from "./db-local";
import { users, UserType } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createUsers() {
  console.log("Creating users...");
  
  // User 1: Admin user - rohan555
  console.log("Checking if admin user 'rohan555' exists...");
  const existingAdmin = await db.select()
    .from(users)
    .where(eq(users.username, "rohan555"))
    .limit(1);
  
  if (existingAdmin.length === 0) {
    console.log("Creating admin user 'rohan555'...");
    const adminUser = {
      username: "rohan555",
      password: await hashPassword("Trinity@1083"),
      name: "Rohan Admin",
      email: "rohan555@angelguides.ai",
      userType: UserType.ADMIN,
      profileCompleted: true,
      bio: "System Administrator",
      avatar: null,
      timezone: "America/New_York",
      isOnline: false,
      lastSeenAt: new Date()
    };
    
    const insertedAdmin = await db.insert(users)
      .values(adminUser)
      .returning();
    
    console.log("✅ Admin user 'rohan555' created successfully with ID:", insertedAdmin[0].id);
  } else {
    console.log("ℹ️ Admin user 'rohan555' already exists.");
  }

  // User 2: Regular user - elenalovc2
  console.log("Checking if user 'elenalovc2' exists...");
  const existingUser = await db.select()
    .from(users)
    .where(eq(users.username, "elenalovc2"))
    .limit(1);
  
  if (existingUser.length === 0) {
    console.log("Creating user 'elenalovc2'...");
    const regularUser = {
      username: "elenalovc2",
      password: await hashPassword("Trinity@1083"),
      name: "Elena Love",
      email: "elenalovc2@angelguides.ai",
      userType: UserType.USER,
      profileCompleted: true,
      bio: "Spiritual seeker looking for guidance",
      avatar: null,
      timezone: "America/Los_Angeles",
      isOnline: false,
      lastSeenAt: new Date()
    };
    
    const insertedUser = await db.insert(users)
      .values(regularUser)
      .returning();
    
    console.log("✅ User 'elenalovc2' created successfully with ID:", insertedUser[0].id);
  } else {
    console.log("ℹ️ User 'elenalovc2' already exists.");
  }
  
  console.log("🎉 User creation completed!");
}

// Run the function
createUsers()
  .then(() => {
    console.log("Done! Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error creating users:", error);
    process.exit(1);
  });