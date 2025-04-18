import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { getAngelaResponse, startAdvisorMatchingFlow } from "./openai";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertSessionSchema, 
  insertMessageSchema, 
  insertReviewSchema,
  TransactionType 
} from "@shared/schema";
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
  
  // Update session status
  app.patch("/api/sessions/:id/status", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedSession = await storage.updateSessionStatus(sessionId, status);
      
      if (!updatedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(updatedSession);
    } catch (error: any) {
      console.error("Error updating session status:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Start a session
  app.post("/api/sessions/:id/start", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.status !== "scheduled") {
        return res.status(400).json({ message: "Session cannot be started" });
      }
      
      const startedSession = await storage.startSession(sessionId);
      res.status(200).json(startedSession);
    } catch (error: any) {
      console.error("Error starting session:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // End a session and process payment
  app.post("/api/sessions/:id/end", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.status !== "in_progress") {
        return res.status(400).json({ message: "Session is not in progress" });
      }
      
      const endedSession = await storage.endSession(sessionId);
      res.status(200).json(endedSession);
    } catch (error: any) {
      console.error("Error ending session:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Advisor earnings and payout endpoints
  app.get("/api/advisors/:advisorId/earnings", async (req: Request, res: Response) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      const advisor = await storage.getAdvisorById(advisorId);
      
      if (!advisor) {
        return res.status(404).json({ message: "Advisor not found" });
      }
      
      const earningsBalance = await storage.getAdvisorEarningsBalance(advisorId);
      const totalEarnings = await storage.getTotalAdvisorEarnings(advisorId);
      const transactions = await storage.getTransactionsByAdvisor(advisorId);
      const completedSessions = (await storage.getSessionsByAdvisor(advisorId))
        .filter(session => session.status === "completed");
      
      res.status(200).json({
        earningsBalance,
        totalEarnings,
        pendingPayout: advisor.pendingPayout,
        transactions,
        completedSessions
      });
    } catch (error: any) {
      console.error("Error fetching advisor earnings:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Request a payout
  app.post("/api/advisors/:advisorId/request-payout", async (req: Request, res: Response) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      const advisor = await storage.getAdvisorById(advisorId);
      
      if (!advisor) {
        return res.status(404).json({ message: "Advisor not found" });
      }
      
      if (advisor.pendingPayout) {
        return res.status(400).json({ message: "Payout already requested" });
      }
      
      const earningsBalance = await storage.getAdvisorEarningsBalance(advisorId);
      if (earningsBalance <= 0) {
        return res.status(400).json({ message: "No earnings available for payout" });
      }
      
      const updatedAdvisor = await storage.setPendingPayout(advisorId, true);
      
      // Create a transaction record for the payout request
      await storage.createTransaction({
        type: TransactionType.ADVISOR_PAYOUT,
        userId: advisorId,
        amount: earningsBalance,
        description: `Payout request for $${(earningsBalance / 100).toFixed(2)}`,
        paymentStatus: 'pending'
      });
      
      res.status(200).json({
        message: "Payout requested successfully",
        pendingPayout: true,
        amount: earningsBalance
      });
    } catch (error: any) {
      console.error("Error requesting payout:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin: Complete a payout request
  app.post("/api/advisors/:advisorId/complete-payout", async (req: Request, res: Response) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      const advisor = await storage.getAdvisorById(advisorId);
      
      if (!advisor) {
        return res.status(404).json({ message: "Advisor not found" });
      }
      
      if (!advisor.pendingPayout) {
        return res.status(400).json({ message: "No pending payout" });
      }
      
      const earningsBalance = await storage.getAdvisorEarningsBalance(advisorId);
      
      // Deduct from advisor's earnings balance
      await storage.deductAdvisorEarnings(advisorId, earningsBalance);
      
      // Update the pending payout flag
      await storage.setPendingPayout(advisorId, false);
      
      // Create a transaction record for the completed payout
      await storage.createTransaction({
        type: TransactionType.ADVISOR_PAYOUT,
        userId: advisorId,
        amount: earningsBalance,
        description: `Completed payout of $${(earningsBalance / 100).toFixed(2)}`,
        paymentStatus: 'completed'
      });
      
      res.status(200).json({
        message: "Payout completed successfully",
        amount: earningsBalance
      });
    } catch (error: any) {
      console.error("Error completing payout:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // User transaction history
  app.get("/api/users/:userId/transactions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const transactions = await storage.getTransactionsByUser(userId);
      
      res.status(200).json(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: error.message });
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
          
          // Create transaction record
          await storage.createTransaction({
            type: TransactionType.USER_TOPUP,
            userId,
            amount,
            description: `Account top-up of $${(amount / 100).toFixed(2)}`,
            paymentStatus: 'completed',
            paymentReference: paymentIntent.id
          });
          
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
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
  });
  
  // Store active connections and user data
  interface UserConnection {
    userId: number;
    userType: string;
    socket: WebSocket;
    isAlive: boolean;
  }

  const userConnections = new Map<number, UserConnection>();
  const advisorSessions = new Map<number, Set<number>>(); // advisorId -> Set of session IDs
  
  // Set up connection handling
  wss.on('connection', (socket: WebSocket) => {
    let userId: number | null = null;
    
    // Handle messages
    socket.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data.type);
        
        switch (data.type) {
          case 'authenticate':
            // Store user connection
            userId = data.payload.userId;
            const userType = data.payload.userType;
            
            if (userId) {
              userConnections.set(userId, {
                userId,
                userType,
                socket,
                isAlive: true
              });
              
              // Notify client of successful authentication
              socket.send(JSON.stringify({
                type: 'auth_success',
                payload: { userId }
              }));
              
              // Broadcast user's online status if they are an advisor
              if (userType === 'advisor') {
                broadcastAdvisorStatus(userId, true);
                
                // Update advisor status in database
                await storage.updateUserStatus(userId, true);
              }
            }
            break;
            
          case 'start_session':
            if (!userId) break;
            
            const { sessionId, participantId } = data.payload;
            const userConn = userConnections.get(userId);
            const participantConn = userConnections.get(participantId);
            
            if (userConn && participantConn) {
              // Add session to tracking
              if (!advisorSessions.has(userId)) {
                advisorSessions.set(userId, new Set());
              }
              advisorSessions.get(userId)?.add(sessionId);
              
              // Notify both parties
              socket.send(JSON.stringify({
                type: 'session_started',
                payload: { sessionId, participantId }
              }));
              
              participantConn.socket.send(JSON.stringify({
                type: 'session_started',
                payload: { sessionId, participantId: userId }
              }));
            }
            break;
            
          case 'end_session':
            if (!userId) break;
            
            const { sessionId: endSessionId, participantId: endParticipantId } = data.payload;
            const endParticipantConn = userConnections.get(endParticipantId);
            
            // Remove session from tracking
            advisorSessions.get(userId)?.delete(endSessionId);
            
            // Notify the other party if they're connected
            if (endParticipantConn) {
              endParticipantConn.socket.send(JSON.stringify({
                type: 'session_ended',
                payload: { sessionId: endSessionId }
              }));
            }
            break;
            
          case 'chat_message':
            if (!userId) break;
            
            const { recipientId, content, sessionId: chatSessionId } = data.payload;
            const recipientConn = userConnections.get(recipientId);
            
            if (recipientConn) {
              recipientConn.socket.send(JSON.stringify({
                type: 'chat_message',
                payload: {
                  senderId: userId,
                  content,
                  sessionId: chatSessionId,
                  timestamp: new Date().toISOString()
                }
              }));
            }
            
            // Store message in database
            await storage.sendMessage({
              senderId: userId,
              receiverId: recipientId,
              content
            });
            break;
            
          case 'signal_offer':
          case 'signal_answer':
          case 'signal_ice_candidate':
            if (!userId) break;
            
            const { target, signal, sessionId: signalSessionId } = data.payload;
            const targetConn = userConnections.get(target);
            
            if (targetConn) {
              targetConn.socket.send(JSON.stringify({
                type: data.type,
                payload: {
                  from: userId,
                  signal,
                  sessionId: signalSessionId
                }
              }));
            }
            break;
            
          case 'pong':
            if (userId && userConnections.has(userId)) {
              const conn = userConnections.get(userId)!;
              conn.isAlive = true;
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    socket.on('close', async () => {
      if (userId && userConnections.has(userId)) {
        const connection = userConnections.get(userId)!;
        
        // Clean up connection
        userConnections.delete(userId);
        
        // If advisor, clean up sessions and notify status change
        if (connection.userType === 'advisor') {
          broadcastAdvisorStatus(userId, false);
          advisorSessions.delete(userId);
          
          // Update advisor status in database
          await storage.updateUserStatus(userId, false);
        }
      }
    });
    
    // Set up ping for connection health check
    socket.send(JSON.stringify({ type: 'ping' }));
  });
  
  // Set up regular ping to keep connections alive and detect disconnections
  const pingInterval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      
      socket.send(JSON.stringify({ type: 'ping' }));
    });
    
    // Check for dead connections
    userConnections.forEach(async (conn, userId) => {
      if (!conn.isAlive) {
        console.log(`Connection to user ${userId} lost, cleaning up`);
        conn.socket.terminate();
        userConnections.delete(userId);
        
        // If advisor, clean up sessions and notify status change
        if (conn.userType === 'advisor') {
          broadcastAdvisorStatus(userId, false);
          advisorSessions.delete(userId);
          
          // Update advisor status in database
          await storage.updateUserStatus(userId, false);
        }
      } else {
        conn.isAlive = false; // Reset for next ping
      }
    });
  }, 30000);
  
  // Clean up on server close
  wss.on('close', () => {
    clearInterval(pingInterval);
  });
  
  // Helper function to broadcast advisor status changes
  function broadcastAdvisorStatus(advisorId: number, isOnline: boolean) {
    userConnections.forEach((conn) => {
      if (conn.socket.readyState === WebSocket.OPEN) {
        conn.socket.send(JSON.stringify({
          type: 'advisor_status_change',
          payload: { advisorId, isOnline }
        }));
      }
    });
  }
  
  return httpServer;
}
