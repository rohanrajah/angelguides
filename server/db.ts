import dotenv from "dotenv";
dotenv.config();

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use postgres-js for local PostgreSQL (works for both local and remote PostgreSQL)
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

// For compatibility with existing code that expects pool
export const pool = null;
