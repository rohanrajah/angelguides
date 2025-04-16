import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAngelaResponse } from "./openai";
import { z } from "zod";
import { insertUserSchema, insertSessionSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all advisors
  app.get("/api/advisors", async (req: Request, res: Response) => {
    try {
      const advisors = await storage.getAdvisors();
      res.json(advisors);
    } catch (error) {
      console.error("Error fetching advisors:", error);
      res.status(500).json({ message: "Failed to fetch advisors" });
    }
  });

  // Get advisor by ID
  app.get("/api/advisors/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const advisor = await storage.getAdvisorById(id);
      
      if (!advisor) {
        return res.status(404).json({ message: "Advisor not found" });
      }
      
      // Get specialties for this advisor
      const specialties = await storage.getAdvisorSpecialties(id);
      
      res.json({ ...advisor, specialties });
    } catch (error) {
      console.error("Error fetching advisor:", error);
      res.status(500).json({ message: "Failed to fetch advisor" });
    }
  });

  // Get advisors by specialty
  app.get("/api/advisors/specialty/:specialtyId", async (req: Request, res: Response) => {
    try {
      const specialtyId = parseInt(req.params.specialtyId);
      const advisors = await storage.getAdvisorsBySpecialty(specialtyId);
      res.json(advisors);
    } catch (error) {
      console.error("Error fetching advisors by specialty:", error);
      res.status(500).json({ message: "Failed to fetch advisors by specialty" });
    }
  });

  // Get all specialties
  app.get("/api/specialties", async (req: Request, res: Response) => {
    try {
      const specialties = await storage.getAllSpecialties();
      res.json(specialties);
    } catch (error) {
      console.error("Error fetching specialties:", error);
      res.status(500).json({ message: "Failed to fetch specialties" });
    }
  });

  // Get user sessions (upcoming)
  app.get("/api/users/:userId/sessions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getUpcomingSessionsByUser(userId);
      
      // Get advisor details for each session
      const sessionsWithAdvisors = await Promise.all(
        sessions.map(async (session) => {
          const advisor = await storage.getAdvisorById(session.advisorId);
          return { ...session, advisor };
        })
      );
      
      res.json(sessionsWithAdvisors);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Book a session with an advisor
  app.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error booking session:", error);
      res.status(400).json({ message: "Failed to book session" });
    }
  });

  // Send a message
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.sendMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Get conversation between two users
  app.get("/api/messages/:userId1/:userId2", async (req: Request, res: Response) => {
    try {
      const userId1 = parseInt(req.params.userId1);
      const userId2 = parseInt(req.params.userId2);
      const messages = await storage.getConversation(userId1, userId2);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Get or create Angela AI conversation
  app.get("/api/angela/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const conversation = await storage.getOrCreateConversation(userId);
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching Angela conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Send message to Angela AI
  app.post("/api/angela/:userId/message", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Get existing conversation
      const conversation = await storage.getOrCreateConversation(userId);
      
      // Format conversation history for OpenAI
      const conversationHistory = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Get response from Angela
      const angelaResponse = await getAngelaResponse(message, conversationHistory);
      
      // Add user message and Angela's response to conversation
      const updatedMessages = [
        ...conversation.messages,
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: angelaResponse.message, timestamp: new Date() }
      ];
      
      // Update conversation in storage
      const updatedConversation = await storage.updateConversation(
        conversation.id, 
        updatedMessages
      );
      
      res.json({ 
        message: angelaResponse.message, 
        suggestions: angelaResponse.suggestions,
        conversation: updatedConversation
      });
    } catch (error) {
      console.error("Error processing Angela message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // User registration
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  // Mock login (for demo purposes)
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // Get current user (mocked for development)
  app.get("/api/me", async (req: Request, res: Response) => {
    try {
      // For demo purposes, return the first regular user
      const user = await storage.getUser(5); // John Doe
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
