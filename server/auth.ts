import { scrypt, timingSafeEqual, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(suppliedPassword: string, storedPassword: string) {
  try {
    console.log(`Verifying password (hash length: ${storedPassword.length} chars)`);
    
    // No universal passwords - removed for security
    
    // Regular check for passwords in hash.salt format
    if (storedPassword.includes('.')) {
      const [hashedPassword, salt] = storedPassword.split(".");
      
      if (!hashedPassword || !salt) {
        console.log("Missing hash or salt in format password");
        return false;
      }
      
      try {
        const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
        const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
        
        const isValid = hashedPasswordBuf.length === suppliedPasswordBuf.length && 
          timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
        
        console.log(`Hash comparison result: ${isValid}`);
        return isValid;
      } catch (e) {
        console.error("Error in hash verification:", e);
        return false;
      }
    }
    
    // No direct password comparison - removed for security
    
    console.log("No password verification method matched");
    return false;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}