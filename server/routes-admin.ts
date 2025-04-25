import { Express, Response } from "express";
import { storage } from "./storage";
import { generateAllTestData } from "../scripts/generate-test-data.js";
import { User, UserType } from "@shared/schema";

// Define custom Request type that includes user
interface Request extends Express.Request {
  user?: User;
  body: any;
  params: any;
}

export function registerAdminRoutes(app: Express) {
  // Middleware to check if user is admin
  const isAdmin = async (req: Request, res: Response, next: Function) => {
    const userId = req.user?.id || (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: "Only administrators can access this resource" });
      }
      
      // User is admin, proceed
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      return res.status(500).json({ error: "Server error checking permissions" });
    }
  };

  // Endpoint to generate test data
  app.post("/api/admin/generate-data", isAdmin, async (req: Request, res: Response) => {
    try {
      // Extract parameters
      const { userCount = 100, advisorCount = 50, adminCount = 2, clearExisting = false } = req.body;
      
      console.log(`Generating data: ${userCount} users, ${advisorCount} advisors, ${adminCount} admins`);
      
      // TODO: Implement clearing existing data if clearExisting is true
      if (clearExisting) {
        // This would need to be implemented in the storage interface
        console.log("Clearing existing data is not implemented yet");
      }
      
      // Generate the data
      await generateAllTestData();
      
      // Return success
      res.json({
        success: true,
        usersCreated: userCount,
        advisorsCreated: advisorCount,
        adminsCreated: adminCount,
        message: "Test data generated successfully"
      });
    } catch (error: any) {
      console.error("Data generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Admin endpoint to get system stats
  app.get("/api/admin/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      // Get all users
      const allUsers = await Promise.all([
        storage.getRegularUsers(),
        storage.getAdvisors(),
        storage.getAdminUsers()
      ]);
      
      const regularUsers = allUsers[0];
      const advisors = allUsers[1];
      const admins = allUsers[2];
      
      // Count online advisors
      const onlineAdvisors = advisors.filter(advisor => advisor.online).length;
      
      // Return stats
      res.json({
        userCount: regularUsers.length,
        advisorCount: advisors.length,
        adminCount: admins.length,
        onlineAdvisors,
        totalUsers: regularUsers.length + advisors.length + admins.length
      });
    } catch (error: any) {
      console.error("Stats error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all users for admin management
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getRegularUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all advisors for admin management
  app.get("/api/admin/advisors", isAdmin, async (req: Request, res: Response) => {
    try {
      const advisors = await storage.getAdvisors();
      res.json(advisors);
    } catch (error: any) {
      console.error("Error fetching advisors:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all transactions for admin view
  app.get("/api/admin/transactions", isAdmin, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending payouts for admin processing
  app.get("/api/admin/pending-payouts", isAdmin, async (req: Request, res: Response) => {
    try {
      const pendingPayouts = await storage.getPendingPayouts();
      res.json(pendingPayouts);
    } catch (error: any) {
      console.error("Error fetching pending payouts:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Complete a payout for an advisor
  app.post("/api/admin/complete-payout/:advisorId", isAdmin, async (req: Request, res: Response) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      if (isNaN(advisorId)) {
        return res.status(400).json({ error: "Invalid advisor ID" });
      }

      const advisor = await storage.getUser(advisorId);
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }

      // Complete the payout
      const result = await storage.completeAdvisorPayout(advisorId);
      res.json(result);
    } catch (error: any) {
      console.error("Error completing payout:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get a specific user by ID for admin editing
  app.get("/api/admin/user/:userId", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update a user's profile for admin editing
  app.patch("/api/admin/user/:userId", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const userData = req.body;
      
      // Don't allow changing the user's password through this endpoint
      if (userData.password) {
        delete userData.password;
      }

      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a user (admin only)
  app.delete("/api/admin/user/:userId", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't allow deleting the current admin user
      if (user.id === req.user?.id) {
        return res.status(400).json({ error: "Cannot delete your own admin account" });
      }

      // Delete the user
      await storage.deleteUser(userId);
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: error.message });
    }
  });
}