import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User type enum
export enum UserType {
  USER = 'user',
  ADVISOR = 'advisor',
  ADMIN = 'admin'
}

// User schema (users, advisors, admins)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  userType: text("user_type").notNull().default(UserType.USER), // New field for user type
  isAdvisor: boolean("is_advisor").default(false), // Keeping for backward compatibility
  avatar: text("avatar"),
  bio: text("bio"),
  chatRate: integer("chat_rate"), // Per minute rate for chat services in cents
  audioRate: integer("audio_rate"), // Per minute rate for audio calls in cents
  videoRate: integer("video_rate"), // Per minute rate for video calls in cents
  rating: integer("rating"),
  reviewCount: integer("review_count"),
  availability: text("availability"),
  online: boolean("online").default(false),
  accountBalance: integer("account_balance").default(0), // Account balance in cents for all users
  earningsBalance: integer("earnings_balance").default(0), // Pending earnings in cents for advisors
  totalEarnings: integer("total_earnings").default(0), // All-time earnings in cents for advisors
  pendingPayout: boolean("pending_payout").default(false), // Flag for requested payouts
  stripeCustomerId: text("stripe_customer_id"), // For payments
  stripeConnectId: text("stripe_connect_id"), // For payouts
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  userType: true,
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
  category: true,
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
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, canceled
  notes: text("notes"),
  ratePerMinute: integer("rate_per_minute").notNull(), // The rate that was applied for this session
  actualStartTime: timestamp("actual_start_time"), // When the session actually started
  actualEndTime: timestamp("actual_end_time"), // When the session actually ended
  actualDuration: integer("actual_duration"), // In minutes
  billedAmount: integer("billed_amount"), // Total amount billed in cents
  isPaid: boolean("is_paid").default(false), // Whether the advisor has been paid for this session
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
// Reviews schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  advisorId: integer("advisor_id").notNull(),
  sessionId: integer("session_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  content: text("content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  response: text("response"), // Advisor's response to the review
  responseDate: timestamp("response_date"),
  isHidden: boolean("is_hidden").default(false), // For moderation purposes
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  advisorId: true,
  sessionId: true,
  rating: true,
  content: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

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

// Advisor specialty categories
export enum SpecialtyCategory {
  DIVINATION = 'divination',
  HEALING = 'healing',
  SPIRITUAL_GUIDANCE = 'spiritual-guidance',
  MEDIUM = 'mediumship',
  ASTROLOGY = 'astrology',
  DREAM_INTERPRETATION = 'dream-interpretation',
  ENERGY_WORK = 'energy-work',
  PAST_LIVES = 'past-lives',
  CHANNELING = 'channeling',
  GENERAL = 'general'
}

// Transaction types
export enum TransactionType {
  SESSION_PAYMENT = 'session_payment',
  ADVISOR_PAYOUT = 'advisor_payout',
  USER_TOPUP = 'user_topup'
}

// Transactions for tracking all money movements
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // session_payment, advisor_payout, user_topup
  userId: integer("user_id").notNull(), // User who the transaction is for
  advisorId: integer("advisor_id"), // Optional, only for session payments
  sessionId: integer("session_id"), // Optional, only for session payments
  amount: integer("amount").notNull(), // Amount in cents (positive for earnings, negative for payments)
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  paymentStatus: text("payment_status").notNull().default("completed"), // pending, completed, failed
  paymentReference: text("payment_reference"), // Reference to external payment processor
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  type: true,
  userId: true,
  advisorId: true,
  sessionId: true,
  amount: true,
  description: true,
  paymentStatus: true,
  paymentReference: true,
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
