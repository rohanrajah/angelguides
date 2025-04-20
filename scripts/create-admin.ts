import { db } from "../server/db";
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

async function createAdminUser() {
  console.log("Checking if admin user exists...");
  
  // Check if the admin user exists
  const existingAdmin = await db.select()
    .from(users)
    .where(eq(users.username, "rchitnis"))
    .limit(1);
  
  if (existingAdmin.length > 0) {
    console.log("Admin user 'rchitnis' already exists.");
    return;
  }
  
  console.log("Creating admin user 'rchitnis'...");
  
  // Create the admin user with the required credentials
  const adminUser = {
    username: "rchitnis",
    password: await hashPassword("Angela123"),
    name: "Admin User",
    email: "admin@angelguides.ai",
    userType: UserType.ADMIN,
    profileCompleted: true
  };
  
  const insertedAdmin = await db.insert(users)
    .values(adminUser)
    .returning();
  
  console.log("Admin user created successfully with ID:", insertedAdmin[0].id);
}

// Run the function
createAdminUser()
  .then(() => {
    console.log("Done! Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error creating admin user:", error);
    process.exit(1);
  });