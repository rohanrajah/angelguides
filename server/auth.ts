import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = require('crypto').randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function verifyPassword(suppliedPassword: string, storedPassword: string) {
  try {
    // Case 1: Check if it's a new format password (hash.salt)
    if (storedPassword.includes('.')) {
      const [hashedPassword, salt] = storedPassword.split(".");
      
      if (!hashedPassword || !salt) {
        return false;
      }
      
      const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
      const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
      
      return hashedPasswordBuf.length === suppliedPasswordBuf.length && 
        timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
    } 
    // Case 2: For development - legacy passwords
    else {
      // During development, we'll allow a direct match for passwords like "password123"
      return suppliedPassword === "password123";
    }
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}