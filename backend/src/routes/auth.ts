import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../data/adapter";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return jwt.sign({ userId: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  } as jwt.SignOptions);
};

// Transform user data to match frontend expected structure
const transformUser = (user: any) => {
  // Handle both memory store (backend User) and MongoDB (IUser) formats
  const isMemoryStoreUser = "userType" in user;
  const isMongoUser = "isTasker" in user;

  return {
    _id: user._id,
    email: user.email,
    firstName: isMemoryStoreUser
      ? user.firstName || (user.name ? user.name.split(" ")[0] : "User")
      : user.firstName,
    lastName: isMemoryStoreUser
      ? user.lastName ||
        (user.name ? user.name.split(" ").slice(1).join(" ") : "")
      : user.lastName,
    avatar: user.avatar,
    isTasker: isMemoryStoreUser ? user.userType === "tasker" : user.isTasker,
    rating: user.rating || 0,
    reviewCount: user.reviewCount || 0,
    bio: user.bio,
    skills: user.skills || [],
    hourlyRate: user.hourlyRate,
    availability: user.availability,
    location:
      typeof user.location === "string"
        ? { address: user.location, coordinates: [0, 0] }
        : user.location || { address: "Not specified", coordinates: [0, 0] },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || user.createdAt,
  };
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, isTasker, location } =
      req.body;

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create new user
    const user = await db.createUser({
      email,
      password,
      firstName,
      lastName,
      userType: isTasker ? "tasker" : "client",
      location: location || {
        address: "Not specified",
        coordinates: [0, 0] as [number, number],
      },
    }); // Generate token
    const token = generateToken(user._id as string);

    // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    res.status(201).json({
      success: true,
      data: {
        user: transformedUser,
        token,
      },
      message: "User registered successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    } // Generate token
    const token = generateToken(user._id as string);

    // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    res.json({
      success: true,
      data: {
        user: transformedUser,
        token,
      },
      message: "Login successful",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// Get current user profile
router.get("/me", authenticateToken, async (req: any, res) => {
  try {
    const user = await db.findUserById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    } // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    res.json({
      success: true,
      data: transformedUser,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req: any, res) => {
  try {
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates._id;
    delete updates.email;
    const user = await db.updateUser(req.userId, updates);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    } // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    res.json({
      success: true,
      data: transformedUser,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

export default router;
