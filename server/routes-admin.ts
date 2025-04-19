import { Express, Response } from "express";
import { storage } from "./storage";
import { generateAllTestData } from "../scripts/generate-test-data.js";
import { User } from "@shared/schema";

// Define custom Request type that includes user
interface Request extends Express.Request {
  user?: User;
  body: any;
  params: any;
}

export function registerAdminRoutes(app: Express) {
  // Endpoint to generate test data
  app.post("/api/admin/generate-data", async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.userType !== 'admin') {
        return res.status(403).json({ error: "Only administrators can generate data" });
      }
      
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
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.userType !== 'admin') {
        return res.status(403).json({ error: "Only administrators can view stats" });
      }
      
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
}