import { Pool, neonConfig } from '@neondatabase/serverless';
import crypto from 'crypto';
import { promisify } from 'util';
import ws from 'ws';

// Configure Neon to use ws for WebSocket
neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(crypto.scrypt);

// Get database details from environment variables
const dbConfig = {
  connectionString: process.env.DATABASE_URL
};

const pool = new Pool(dbConfig);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdmin() {
  try {
    const username = 'rohan555';
    const password = 'Trinity@1083';
    const hashedPassword = await hashPassword(password);
    
    // Update the user with properly hashed password
    const res = await pool.query(
      `UPDATE users 
      SET password = $1 
      WHERE username = $2 
      RETURNING id, username, user_type`,
      [hashedPassword, username]
    );
    
    console.log('Admin user updated successfully:', res.rows[0]);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdmin().catch(console.error);