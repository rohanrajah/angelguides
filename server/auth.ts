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
    const [hashedPassword, salt] = storedPassword.split(".");
    
    if (!hashedPassword || !salt) {
      return false;
    }
    
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
    
    return hashedPasswordBuf.length === suppliedPasswordBuf.length && 
      timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}