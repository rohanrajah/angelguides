import { db } from "../server/db";
import { users, specialties, advisorSpecialties, UserType } from "../shared/schema";
import { count } from "drizzle-orm";
import { eq } from "drizzle-orm";

async function verifyDatabase() {
  console.log("Verifying database contents...");
  
  // Check admin users
  const adminCount = await db.select({ count: count() })
    .from(users)
    .where(eq(users.userType, UserType.ADMIN));
  
  console.log(`Admin users: ${adminCount[0].count}`);
  
  // Check advisor users
  const advisorCount = await db.select({ count: count() })
    .from(users)
    .where(eq(users.userType, UserType.ADVISOR));
  
  console.log(`Advisor users: ${advisorCount[0].count}`);
  
  // Check regular users
  const userCount = await db.select({ count: count() })
    .from(users)
    .where(eq(users.userType, UserType.USER));
  
  console.log(`Regular users: ${userCount[0].count}`);
  
  // Check specialties
  const specialtyCount = await db.select({ count: count() })
    .from(specialties);
  
  console.log(`Specialties: ${specialtyCount[0].count}`);
  
  // Check advisor specialty assignments
  const advisorSpecialtyCount = await db.select({ count: count() })
    .from(advisorSpecialties);
  
  console.log(`Advisor specialty assignments: ${advisorSpecialtyCount[0].count}`);
  
  // List the first admin user
  const firstAdmin = await db.select()
    .from(users)
    .where(eq(users.userType, UserType.ADMIN))
    .limit(1);
  
  if (firstAdmin.length > 0) {
    console.log(`First admin user: ${firstAdmin[0].username} (ID: ${firstAdmin[0].id})`);
  }
}

// Run the function
verifyDatabase()
  .then(() => {
    console.log("Verification complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error verifying database:", error);
    process.exit(1);
  });