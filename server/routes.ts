import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { verifyPassword, hashPassword } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertSessionSchema, 
  insertMessageSchema, 
  insertReviewSchema,
  TransactionType,
  UserType
} from "@shared/schema";
import { startAdvisorMatchingFlow, getNextMatchingQuestion, generateAdvisorRecommendations } from "./openai";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time communications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Register profile and admin routes if available
  try {
    const { registerProfileRoutes } = require('./routes-profile');
    registerProfileRoutes(app);
  } catch (error) {
    console.log('Profile routes not available, skipping');
  }
  
  try {
    const { registerAdminRoutes } = require('./routes-admin');
    registerAdminRoutes(app);
  } catch (error) {
    console.log('Admin routes not available, skipping');
  }
  
  // Set up Stripe if API key is available
  let stripe: Stripe | undefined;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

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
        res.status(404).json({ message: "Advisor not found" });
        return;
      }
      
      res.json(advisor);
    } catch (error) {
      console.error("Error fetching advisor:", error);
      res.status(500).json({ message: "Failed to fetch advisor" });
    }
  });
  
  // Get user sessions
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

  // Create a review
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      
      // Check if session exists
      const session = await storage.getSessionById(reviewData.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if user is the one who booked the session
      if (session.userId !== reviewData.userId) {
        return res.status(403).json({ message: "You can only review sessions you booked" });
      }
      
      // Check if review already exists for this session
      const existingReview = await storage.getReviewBySession(reviewData.sessionId);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this session" });
      }
      
      const review = await storage.createReview(reviewData);
      
      // Update advisor's average rating
      await storage.updateAdvisorRating(reviewData.advisorId);
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Failed to create review" });
    }
  });
  
  // Get all reviews for an advisor
  app.get("/api/advisors/:advisorId/reviews", async (req: Request, res: Response) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      const reviews = await storage.getReviewsByAdvisor(advisorId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching advisor reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  
  // Get a review by session ID
  app.get("/api/reviews/session/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const review = await storage.getReviewBySession(sessionId);
      
      if (!review) {
        return res.status(404).json({ message: "No review found for this session" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching review by session:", error);
      res.status(500).json({ message: "Failed to fetch review for session" });
    }
  });
  
  // Get a review by ID
  app.get("/api/reviews/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.getReviewById(id);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });
  
  // Add a response to a review (for advisors)
  app.post("/api/reviews/:id/response", async (req: Request, res: Response) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { response, advisorId } = req.body;
      
      if (!response || !advisorId) {
        return res.status(400).json({ message: "Response and advisorId are required" });
      }
      
      // Get the review
      const review = await storage.getReviewById(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Check if the review is for this advisor
      if (review.advisorId !== advisorId) {
        return res.status(403).json({ message: "You can only respond to reviews for your profile" });
      }
      
      // Check if response already exists
      if (review.response) {
        return res.status(400).json({ message: "You have already responded to this review" });
      }
      
      const updatedReview = await storage.addResponseToReview(reviewId, response);
      res.json(updatedReview);
    } catch (error) {
      console.error("Error adding review response:", error);
      res.status(500).json({ message: "Failed to add review response" });
    }
  });
  
  // Get reviews by user
  app.get("/api/users/:userId/reviews", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const reviews = await storage.getReviewsByUser(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Login
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login
      const updatedUser = await storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Remove the password from the response
      const { password: _, ...userWithoutPassword } = updatedUser || user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Get current user
  app.get("/api/me", async (req: Request, res: Response) => {
    try {
      // If you're using sessions, you'd get the user from req.session here
      // For now, we'll just return a dummy user
      const userId = 5; // Elena Lovechild (non-admin account)
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove the password from the response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });
  
  // Angela AI advisor matching endpoints
  
  // Start the advisor matching flow
  app.get("/api/angela/:userId/start-matching", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get first question in the matching flow
      const matchingQuestion = await startAdvisorMatchingFlow();
      
      res.json(matchingQuestion);
    } catch (error) {
      console.error("Error starting advisor matching flow:", error);
      
      // Return a fallback question if there's an error
      const fallbackQuestion = {
        message: "What type of spiritual guidance are you seeking today?",
        questionNumber: 1,
        totalQuestions: 5,
        isMatchingQuestion: true
      };
      
      res.json(fallbackQuestion);
    }
  });
  
  // Continue the advisor matching flow
  app.post("/api/angela/:userId/matching", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { message, conversationHistory } = req.body;
      
      if (!message || !conversationHistory) {
        return res.status(400).json({ message: "Message and conversation history are required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if this is the final question
      const currentQuestionNumber = conversationHistory.filter(msg => 
        msg.role === "assistant" && msg.content.includes("question")
      ).length;
      
      if (currentQuestionNumber >= 5) {
        // Generate advisor recommendations
        const advisors = await storage.getAdvisors();
        const specialties = await storage.getAllSpecialties();
        
        const recommendations = await generateAdvisorRecommendations(
          user,
          conversationHistory,
          advisors,
          specialties
        );
        
        return res.json(recommendations);
      }
      
      // Get next question in the matching flow
      const nextQuestion = await getNextMatchingQuestion(
        message,
        conversationHistory,
        currentQuestionNumber
      );
      
      res.json(nextQuestion);
    } catch (error) {
      console.error("Error in advisor matching flow:", error);
      
      // Return a fallback response
      const fallbackResponse = {
        message: "I'd like to understand more about what you're looking for. Could you share more about your spiritual needs?",
        questionNumber: 2,
        totalQuestions: 5,
        isMatchingQuestion: true
      };
      
      res.json(fallbackResponse);
    }
  });

  // WebSocket connection handler
  wss.on('connection', (socket: WebSocket) => {
    console.log('New WebSocket connection established');
    
    socket.on('message', (message) => {
      // Basic ping/pong for keeping connection alive
      if (message.toString() === 'ping') {
        socket.send('pong');
      }
    });
    
    socket.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}