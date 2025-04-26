import { Express, Response } from "express";
import { storage } from "./storage";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { User } from "@shared/schema";

// Define custom Request type that includes user
interface Request extends Express.Request {
  user?: User;
  body: any;
  file?: any;
  params: any;
}

// Setup file directories if they don't exist
const UPLOAD_DIR = "./uploads";
const AVATAR_DIR = path.join(UPLOAD_DIR, "avatars");
const VIDEO_DIR = path.join(UPLOAD_DIR, "videos");

// Create upload directories if they don't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR);
}
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR);
}

// Configure storage for uploaded files
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine if this is an avatar or video upload
    const isAvatar = req.originalUrl.includes('/upload/avatar');
    const destination = isAvatar ? AVATAR_DIR : VIDEO_DIR;
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with the original extension
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${randomUUID()}${fileExt}`;
    cb(null, fileName);
  }
});

// Setup upload middleware with file type filtering
const upload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const isAvatar = req.originalUrl.includes('/upload/avatar');
    
    if (isAvatar) {
      // Image files for avatars
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for avatars'));
      }
    } else {
      // Video files for intro videos
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for intro videos'));
      }
    }
  }
});

export function registerProfileRoutes(app: Express) {
  // Update user profile
  app.patch("/api/users/profile", async (req: Request, res: Response) => {
    try {
      // Get user ID from the authenticated session
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get the current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Extract fields to update
      const {
        name,
        email,
        phone,
        bio,
        specialties,
        birthDate,
        birthTime,
        birthPlace,
        vedicChart,
        humanDesignData,
        chatRate,
        audioRate,
        videoRate,
        userType,
        availability,
        profileCompleted
      } = req.body;
      
      // Create update object
      const updateData: Partial<User> = {};
      
      // Basic fields for all users
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;
      
      // Only admins can change user type for other users
      // Regular users can only switch between USER and ADVISOR
      if (userType !== undefined) {
        if (currentUser.userType === 'admin' || (userType === 'user' || userType === 'advisor')) {
          updateData.userType = userType;
        } else {
          return res.status(403).json({ error: "Unauthorized user type change" });
        }
      }
      
      // Advisor-specific fields
      if (specialties !== undefined) updateData.specialties = specialties;
      if (chatRate !== undefined) updateData.chatRate = chatRate;
      if (audioRate !== undefined) updateData.audioRate = audioRate;
      if (videoRate !== undefined) updateData.videoRate = videoRate;
      if (availability !== undefined) updateData.availability = availability;
      
      // Profile completion status
      if (profileCompleted !== undefined) updateData.profileCompleted = profileCompleted;
      
      // Spiritual profile data
      if (birthDate !== undefined) updateData.birthDate = birthDate;
      if (birthTime !== undefined) updateData.birthTime = birthTime;
      if (birthPlace !== undefined) updateData.birthPlace = birthPlace;
      if (vedicChart !== undefined) updateData.vedicChart = vedicChart;
      if (humanDesignData !== undefined) updateData.humanDesignData = humanDesignData;
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Remove sensitive data before sending the response
      if (updatedUser) {
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Upload avatar
  app.post("/api/upload/avatar", upload.single('avatar'), async (req: Request, res: Response) => {
    try {
      // Get user ID from the authenticated session
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No avatar file provided" });
      }
      
      // Get the file path
      const filePath = `/api/files/${req.file.filename}`;
      
      // Update user avatar
      const updatedUser = await storage.updateUser(userId, { avatar: filePath });
      
      if (updatedUser) {
        res.json({ url: filePath });
      } else {
        res.status(500).json({ error: "Failed to update avatar" });
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Upload intro video (for advisors)
  app.post("/api/upload/video", upload.single('video'), async (req: Request, res: Response) => {
    try {
      // Get user ID from the authenticated session
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }
      
      // Get the file path
      const filePath = `/api/files/${req.file.filename}`;
      
      // Update user intro video
      const updatedUser = await storage.updateUser(userId, { introVideo: filePath });
      
      if (updatedUser) {
        res.json({ url: filePath });
      } else {
        res.status(500).json({ error: "Failed to update intro video" });
      }
    } catch (error: any) {
      console.error("Video upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Serve uploaded files
  app.get("/api/files/:fileId", (req: Request, res: Response) => {
    const fileId = req.params.fileId;
    
    // Check if the file exists
    const avatarPath = path.join(AVATAR_DIR, fileId);
    const videoPath = path.join(VIDEO_DIR, fileId);
    
    if (fs.existsSync(avatarPath)) {
      res.sendFile(avatarPath);
    } else if (fs.existsSync(videoPath)) {
      res.sendFile(videoPath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });
  
  // Make user an admin (for testing purposes)
  app.get("/api/make-admin", async (req: Request, res: Response) => {
    try {
      // Get user ID from the authenticated session
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Make the user an admin
      const updatedUser = await storage.updateUser(userId, { userType: "admin" });
      
      if (updatedUser) {
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    } catch (error: any) {
      console.error("Admin update error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}