import { Request, Response } from "express";
import { Express } from "express";
import { storage } from "./storage";
import { UserType } from "../shared/schema";

// In-memory storage for uploaded files (would use S3 or similar in production)
const uploadedFiles = new Map<string, Buffer>();

export function registerProfileRoutes(app: Express) {
  // Update user profile
  app.patch("/api/users/profile", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Only admins can change userType
      if (req.body.userType && req.body.userType !== currentUser.userType && currentUser.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: "Only administrators can change user types" });
      }
      
      // Update user and ensure isAdvisor flag is consistent with userType
      const userData = { 
        ...req.body,
        isAdvisor: req.body.userType === UserType.ADVISOR 
      };
      
      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  
  // Upload profile picture
  app.post("/api/upload/avatar", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // In a real implementation, this would store the file and return a URL
      // For demo purposes, we'll simulate successful upload
      const fileId = `avatar-${userId}-${Date.now()}`;
      uploadedFiles.set(fileId, Buffer.from('dummy-image-data'));
      
      // Return a simulated URL that could be used to access the file
      const avatarUrl = `/api/files/${fileId}`;
      
      // Update the user's avatar URL in the database
      await storage.updateUser(userId, { avatar: avatarUrl });
      
      res.json({ url: avatarUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });
  
  // Upload intro video
  app.post("/api/upload/video", async (req: Request, res: Response) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // Check if user is an advisor or admin
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.userType !== UserType.ADVISOR && user.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: "Only advisors can upload intro videos" });
      }
      
      // In a real implementation, this would store the file and return a URL
      // For demo purposes, we'll simulate successful upload
      const fileId = `video-${userId}-${Date.now()}`;
      uploadedFiles.set(fileId, Buffer.from('dummy-video-data'));
      
      // Return a simulated URL that could be used to access the file
      const videoUrl = `/api/files/${fileId}`;
      
      // Update the user's introVideo URL in the database
      await storage.updateUser(userId, { introVideo: videoUrl });
      
      res.json({ url: videoUrl });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  });
  
  // Serve uploaded files
  app.get("/api/files/:fileId", (req: Request, res: Response) => {
    const { fileId } = req.params;
    const fileData = uploadedFiles.get(fileId);
    
    if (!fileData) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // In a real implementation, you'd set proper content type and serve actual file data
    // For demo purposes, we're just confirming the file exists
    res.json({ message: "File exists", fileId });
  });
  
  // Make one of our users an admin (for demo purposes)
  app.get("/api/make-admin", async (req: Request, res: Response) => {
    // This is a demo endpoint that would usually be secured
    try {
      // Get the current user
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Update the user to be an admin
      await storage.updateUser(userId, { 
        userType: UserType.ADMIN,
        isAdvisor: false
      });
      
      res.json({ success: true, message: "You are now an admin" });
    } catch (error) {
      console.error('Error making user admin:', error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });
}