import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAngelaResponse, startAdvisorMatchingFlow } from "./openai";
import { z } from "zod";
import { insertUserSchema, insertSessionSchema, insertMessageSchema, insertReviewSchema } from "@shared/schema";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Check if Stripe API key is available
  let stripe: Stripe | undefined;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
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
  
  // Get advisors by category
  app.get("/api/advisors/category/:category", async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const advisors = await storage.getAdvisorsByCategory(category);
      res.json(advisors);
    } catch (error) {
      console.error("Error fetching advisors by category:", error);
      res.status(500).json({ message: "Failed to fetch advisors by category" });
    }
  });
  
  // Get specialties by category
  app.get("/api/specialties/category/:category", async (req: Request, res: Response) => {
    try {
      const category = req.params.category;
      const specialties = await storage.getSpecialtiesByCategory(category);
      res.json(specialties);
    } catch (error) {
      console.error("Error fetching specialties by category:", error);
      res.status(500).json({ message: "Failed to fetch specialties by category" });
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
  
  // Start the advisor matching flow
  app.get("/api/angela/:userId/start-matching", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get or create a conversation for this user
      const conversation = await storage.getOrCreateConversation(userId);
      
      // Start the advisor matching flow
      const matchingResponse = await startAdvisorMatchingFlow();
      
      // Add Angela's response to the conversation
      const updatedMessages = [
        ...(conversation.messages as any[]),
        {
          role: "assistant",
          content: matchingResponse.message,
          timestamp: new Date()
        }
      ];
      
      // Update the conversation in storage
      await storage.updateConversation(conversation.id, updatedMessages);
      
      // Return the response
      res.json(matchingResponse);
    } catch (error) {
      console.error("Error starting matching flow:", error);
      res.status(500).json({ message: "Failed to start advisor matching" });
    }
  });

  // Send message to Angela AI
  app.post("/api/angela/:userId/message", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { message, emotionalSupportEnabled = true } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Get existing conversation
      const conversation = await storage.getOrCreateConversation(userId);
      
      // Format conversation history for OpenAI
      const conversationHistory = (conversation.messages as any[]).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Get response from Angela, passing the emotional support mode flag
      const angelaResponse = await getAngelaResponse(message, conversationHistory, emotionalSupportEnabled);
      
      // Add user message and Angela's response to conversation
      const updatedMessages = [
        ...(conversation.messages as any[]),
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
        conversation: updatedConversation,
        isMatchingQuestion: angelaResponse.isMatchingQuestion || false,
        questionNumber: angelaResponse.questionNumber,
        totalQuestions: angelaResponse.totalQuestions,
        recommendedAdvisors: angelaResponse.recommendedAdvisors || [],
        // Emotional support metadata
        emotionalTone: angelaResponse.emotionalTone || 'supportive',
        detectedEmotion: angelaResponse.detectedEmotion || null,
        empathyLevel: angelaResponse.empathyLevel || 3
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

  // Get user balance
  app.get("/api/users/:userId/balance", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        balance: user.accountBalance || 0,
        formattedBalance: `$${((user.accountBalance || 0) / 100).toFixed(2)}`
      });
    } catch (error) {
      console.error("Error fetching user balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Create a payment intent for account top-up
  app.post("/api/topup", async (req: Request, res: Response) => {
    try {
      const { userId, amountUsd } = req.body;
      
      if (!userId || !amountUsd) {
        return res.status(400).json({ message: "User ID and amount are required" });
      }

      // Validate minimum top-up amount of $10
      if (amountUsd < 10) {
        return res.status(400).json({ message: "Minimum top-up amount is $10" });
      }
      
      // Convert USD to cents
      const amountCents = Math.round(amountUsd * 100);
      
      // Check if Stripe is initialized
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment service is unavailable. Please contact support." 
        });
      }
      
      // Get user info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create or retrieve customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id.toString()
          }
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }
      
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        metadata: {
          userId: userId.toString(),
          type: 'topup'
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: amountCents,
        amountUsd
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to process payment request" });
    }
  });

  // Webhook to handle successful payments
  app.post('/api/stripe-webhook', async (req: Request, res: Response) => {
    const payload = req.body;
    
    // In production, you would verify this is coming from Stripe
    try {
      // Handle the event
      if (payload.type === 'payment_intent.succeeded') {
        const paymentIntent = payload.data.object;
        const metadata = paymentIntent.metadata;
        
        if (metadata && metadata.type === 'topup' && metadata.userId) {
          const userId = parseInt(metadata.userId);
          const amount = paymentIntent.amount; // amount in cents
          
          // Add to user's balance
          await storage.addUserBalance(userId, amount);
          
          console.log(`Successfully topped up user ${userId} with ${amount} cents`);
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Review routes
  // Create a review for a session
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
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: "Failed to create review" });
    }
  });

  // Get reviews for an advisor
  app.get("/api/advisors/:advisorId/reviews", async (req: Request, res: Response) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      
      // Check if advisor exists
      const advisor = await storage.getAdvisorById(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: "Advisor not found" });
      }
      
      const reviews = await storage.getReviewsByAdvisor(advisorId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching advisor reviews:", error);
      res.status(500).json({ message: "Failed to fetch advisor reviews" });
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

  // Advisor: Add response to a review
  app.post("/api/reviews/:id/response", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { response, advisorId } = req.body;
      
      if (!response || !advisorId) {
        return res.status(400).json({ message: "Response and advisorId are required" });
      }
      
      // Get the review
      const review = await storage.getReviewById(id);
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
      
      const updatedReview = await storage.addResponseToReview(id, response);
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
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
