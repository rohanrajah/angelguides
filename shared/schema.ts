import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (both regular users and advisors)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isAdvisor: boolean("is_advisor").default(false),
  avatar: text("avatar"),
  bio: text("bio"),
  chatRate: integer("chat_rate"), // Per minute rate for chat services in cents
  audioRate: integer("audio_rate"), // Per minute rate for audio calls in cents
  videoRate: integer("video_rate"), // Per minute rate for video calls in cents
  rating: integer("rating"),
  reviewCount: integer("review_count"),
  availability: text("availability"),
  online: boolean("online").default(false),
  accountBalance: integer("account_balance").default(0), // Account balance in cents
  stripeCustomerId: text("stripe_customer_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  isAdvisor: true,
  avatar: true,
  bio: true,
  chatRate: true,
  audioRate: true,
  videoRate: true,
  availability: true,
});

// Specialties schema
export const specialties = pgTable("specialties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  category: text("category").default("general"), // Categories like "Divination", "Healing", "Spiritual Guidance", etc.
});

export const insertSpecialtySchema = createInsertSchema(specialties).pick({
  name: true,
  icon: true,
});

// Advisor specialties join table
export const advisorSpecialties = pgTable("advisor_specialties", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id").notNull(),
  specialtyId: integer("specialty_id").notNull(),
});

export const insertAdvisorSpecialtySchema = createInsertSchema(advisorSpecialties).pick({
  advisorId: true,
  specialtyId: true,
});

// Session/booking schema
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  advisorId: integer("advisor_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  sessionType: text("session_type").notNull(), // chat, audio, video
  status: text("status").notNull().default("scheduled"), // scheduled, completed, canceled
  notes: text("notes"),
  ratePerMinute: integer("rate_per_minute").notNull(), // The rate that was applied for this session
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  advisorId: true,
  startTime: true,
  endTime: true,
  sessionType: true,
  ratePerMinute: true,
  notes: true,
});

// Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  read: boolean("read").default(false),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
});

// AI Concierge (Angela) conversation history
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  messages: jsonb("messages").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  userId: true,
  messages: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Specialty = typeof specialties.$inferSelect;
export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;

export type AdvisorSpecialty = typeof advisorSpecialties.$inferSelect;
export type InsertAdvisorSpecialty = z.infer<typeof insertAdvisorSpecialtySchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Session type enum
export enum SessionType {
  CHAT = 'chat',
  AUDIO = 'audio',
  VIDEO = 'video'
}
