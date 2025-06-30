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
import { 
  WebSocketMessage, 
  WebSocketMessageType,
  SignalingOffer,
  SignalingAnswer,
  SignalingIceCandidate,
  SignalingEnd,
  ChatMessagePayload 
} from "@shared/websocket-types";
import { WebSocketManager } from "./websocket-manager";
import { SignalingService } from "./signaling-service";
import { MessageService } from "./message-service";
import { SessionAPI } from "./session-api";
import { SessionManager } from "./session-manager";
import { BillingService } from "./billing-service";
import { startAdvisorMatchingFlow, getNextMatchingQuestion, generateAdvisorRecommendations } from "./openai";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time communications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const wsManager = new WebSocketManager();
  const signalingService = new SignalingService(wsManager);
  const messageService = new MessageService(storage);
  const sessionManager = new SessionManager(wsManager, storage as any);
  const billingService = new BillingService(storage);
  const sessionAPI = new SessionAPI(sessionManager, billingService);
  
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

  // Message API endpoints
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const { senderId, receiverId, content } = req.body;
      
      if (!senderId || !receiverId || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const message = await messageService.createMessage({
        senderId,
        receiverId,
        content
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create message" });
    }
  });

  app.get("/api/messages/:userId1/:userId2", async (req: Request, res: Response) => {
    try {
      const userId1 = parseInt(req.params.userId1);
      const userId2 = parseInt(req.params.userId2);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      const messages = await messageService.getConversationHistory(userId1, userId2, {
        page,
        limit,
        sortOrder
      });

      res.json(messages);
    } catch (error) {
      console.error("Error getting conversation history:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get conversation history" });
    }
  });

  app.get("/api/messages/search", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const query = req.query.query as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }

      const searchResults = await messageService.searchMessages({
        userId,
        query,
        startDate,
        endDate,
        limit,
        offset
      });

      res.json(searchResults);
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to search messages" });
    }
  });

  app.delete("/api/messages/:id", async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = parseInt(req.body.userId);

      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      const success = await messageService.deleteMessage(messageId, userId);
      
      if (success) {
        res.json({ success: true, message: "Message deleted successfully" });
      } else {
        res.status(404).json({ error: "Message not found or unauthorized" });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to delete message" });
    }
  });

  app.put("/api/messages/:id/read", async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = parseInt(req.body.userId);

      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      const success = await messageService.markAsRead(messageId, userId);
      
      if (success) {
        res.json({ success: true, message: "Message marked as read" });
      } else {
        res.status(404).json({ error: "Message not found or unauthorized" });
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to mark message as read" });
    }
  });

  app.get("/api/users/:userId/messages/unread-count", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const count = await messageService.getUnreadMessageCount(userId);
      
      res.json({ unreadCount: count });
    } catch (error) {
      console.error("Error getting unread message count:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get unread message count" });
    }
  });

  app.post("/api/messages/mark-multiple-read", async (req: Request, res: Response) => {
    try {
      const { messageIds, userId } = req.body;

      if (!Array.isArray(messageIds) || !userId) {
        return res.status(400).json({ error: "Invalid request data" });
      }

      const success = await messageService.markMultipleAsRead(messageIds, userId);
      
      res.json({ success, message: success ? "Messages marked as read" : "Some messages failed to update" });
    } catch (error) {
      console.error("Error marking multiple messages as read:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to mark messages as read" });
    }
  });

  app.get("/api/users/:userId/message-stats", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const stats = await messageService.getMessageStats(userId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error getting message stats:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to get message stats" });
    }
  });

  // Session API endpoints
  app.post("/api/sessions/start", async (req: Request, res: Response) => {
    try {
      const { userId, advisorId, sessionType, scheduledTime, ratePerMinute } = req.body;
      
      if (!userId || !advisorId || !sessionType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const startRequest = {
        userId: parseInt(userId),
        advisorId: parseInt(advisorId),
        sessionType,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        ratePerMinute: ratePerMinute || 0
      };

      const result = await sessionAPI.startSession(startRequest);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/sessions/:id/status", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      
      const status = await sessionAPI.getSessionStatus(sessionId);
      
      res.json(status);
    } catch (error) {
      console.error("Error getting session status:", error);
      
      if (error instanceof Error && error.message === 'Session not found') {
        res.status(404).json({ error: "Session not found" });
      } else {
        res.status(500).json({ error: "Failed to get session status" });
      }
    }
  });

  app.post("/api/sessions/:id/join", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      const result = await sessionAPI.joinSession(sessionId, parseInt(userId));
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Error joining session:", error);
      res.status(500).json({ error: "Failed to join session" });
    }
  });

  app.post("/api/sessions/:id/leave", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      await sessionAPI.leaveSession(sessionId, parseInt(userId));
      
      res.status(200).json({ success: true, message: "Left session successfully" });
    } catch (error) {
      console.error("Error leaving session:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to leave session" });
    }
  });

  app.post("/api/sessions/:id/end", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { endedBy, reason, notes } = req.body;
      
      if (!endedBy || !reason) {
        return res.status(400).json({ error: "endedBy and reason are required" });
      }

      const endData = {
        endedBy: parseInt(endedBy),
        reason,
        notes
      };

      const result = await sessionAPI.endSession(sessionId, endData);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  app.put("/api/sessions/:id/notes", async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { notes, userId } = req.body;
      
      if (!notes || !userId) {
        return res.status(400).json({ error: "Notes and userId are required" });
      }

      await sessionAPI.updateSessionNotes(sessionId, notes, parseInt(userId));
      
      res.status(200).json({ success: true, message: "Notes updated successfully" });
    } catch (error) {
      console.error("Error updating session notes:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          res.status(403).json({ error: error.message });
        } else if (error.message.includes('Cannot update notes')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Failed to update notes" });
        }
      } else {
        res.status(500).json({ error: "Failed to update notes" });
      }
    }
  });

  // WebSocket connection handler with user authentication
  wss.on('connection', (socket: WebSocket, request) => {
    console.log('New WebSocket connection established');
    
    let userId: number | null = null;
    let isAuthenticated = false;

    socket.on('message', async (data) => {
      try {
        const rawMessage = data.toString();
        
        // Handle simple ping/pong
        if (rawMessage === 'ping') {
          socket.send('pong');
          return;
        }

        const message: WebSocketMessage = JSON.parse(rawMessage);
        
        // Handle authentication for new connections
        if (!isAuthenticated && message.type !== 'auth') {
          socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { code: 'AUTH_REQUIRED', message: 'Authentication required' }
          }));
          return;
        }

        // Handle authentication
        if (message.type === 'auth') {
          const { userId: authUserId } = message.payload;
          if (authUserId && typeof authUserId === 'number') {
            userId = authUserId;
            isAuthenticated = true;
            wsManager.handleConnection(socket, userId);
            
            socket.send(JSON.stringify({
              type: 'auth_success',
              payload: { userId }
            }));
          } else {
            socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { code: 'INVALID_AUTH', message: 'Invalid authentication data' }
            }));
          }
          return;
        }

        // Validate signaling messages
        if ([WebSocketMessageType.SIGNAL_OFFER, WebSocketMessageType.SIGNAL_ANSWER, 
             WebSocketMessageType.SIGNAL_ICE_CANDIDATE, WebSocketMessageType.SIGNAL_END].includes(message.type)) {
          const validatedMessage = signalingService.validateSignalingMessage(message);
          if (!validatedMessage) {
            socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { code: 'INVALID_SIGNALING', message: 'Invalid signaling message format' }
            }));
            return;
          }
        }

        // Route authenticated messages
        await handleWebSocketMessage(wsManager, signalingService, userId!, message);
        
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({
          type: WebSocketMessageType.ERROR,
          payload: { 
            code: 'MESSAGE_ERROR', 
            message: 'Failed to process message',
            details: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    });
    
    socket.on('close', () => {
      if (userId) {
        wsManager.handleDisconnection(userId);
      }
      console.log('WebSocket connection closed');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (userId) {
        wsManager.handleDisconnection(userId);
      }
    });
  });

  // Message handler for authenticated WebSocket messages
  async function handleWebSocketMessage(
    wsManager: WebSocketManager,
    signalingService: SignalingService,
    fromUserId: number, 
    message: WebSocketMessage
  ): Promise<void> {
    switch (message.type) {
      case WebSocketMessageType.SIGNAL_OFFER:
        await signalingService.handleOffer(fromUserId, message.payload as SignalingOffer);
        break;
        
      case WebSocketMessageType.SIGNAL_ANSWER:
        await signalingService.handleAnswer(fromUserId, message.payload as SignalingAnswer);
        break;
        
      case WebSocketMessageType.SIGNAL_ICE_CANDIDATE:
        await signalingService.handleIceCandidate(fromUserId, message.payload as SignalingIceCandidate);
        break;
        
      case WebSocketMessageType.SIGNAL_END:
        await signalingService.handleCallEnd(fromUserId, message.payload as SignalingEnd);
        break;
        
      case WebSocketMessageType.CHAT_MESSAGE:
        await handleChatMessage(wsManager, fromUserId, message.payload as ChatMessagePayload);
        break;
        
      default:
        console.warn(`Unhandled message type: ${message.type}`);
    }
  }

  // Chat message handler

  async function handleChatMessage(
    wsManager: WebSocketManager, 
    fromUserId: number, 
    payload: ChatMessagePayload
  ): Promise<void> {
    const { sessionId, content, messageType } = payload;
    
    // Store message in database
    const participants = wsManager.getUsersInSession(sessionId);
    const targetUserId = participants.find(id => id !== fromUserId);
    
    if (targetUserId) {
      try {
        // Save to database
        await storage.sendMessage({
          senderId: fromUserId,
          receiverId: targetUserId,
          content
        });
        
        // Send to target user via WebSocket
        wsManager.sendToUser(targetUserId, {
          type: WebSocketMessageType.CHAT_MESSAGE,
          payload: { sessionId, content, messageType },
          from: fromUserId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Failed to handle chat message:', error);
      }
    }
  }

  return httpServer;
}