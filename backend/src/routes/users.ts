import express from "express";
import { User } from "../models/User";
import { Task } from "../models/Task";
import { Review } from "../models/index";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { db } from "../data/adapter";
import ResponseHelper from "../utils/ResponseHelper";

const router = express.Router();

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

// Get user profile
router.get("/:id", async (req, res) => {
  try {
    const user = await db.findUserById(req.params.id);
    if (!user) {
      return ResponseHelper.notFound(res, req, "users.userNotFound");
    }

    // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    // For now, skip reviews since they might not work with memory store
    // TODO: Implement reviews in memory store if needed
    const reviews: any[] = [];
    return ResponseHelper.success(res, req, "users.profileRetrieved", {
      user: transformedUser,
      reviews,
    });
  } catch (error: any) {
    return ResponseHelper.serverError(res, req, error.message);
  }
});

// Get user's tasks
router.get("/:id/tasks", async (req, res) => {
  try {
    const { type = "posted", page = 1, limit = 20 } = req.query;

    let query: any = {};
    if (type === "posted") {
      query.postedBy = req.params.id;
    } else if (type === "assigned") {
      query.assignedTo = req.params.id;
    }

    const tasks = await Task.find(query)
      .populate("postedBy", "firstName lastName rating reviewCount avatar")
      .populate("assignedTo", "firstName lastName rating reviewCount avatar")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    const total = await Task.countDocuments(query);
    return ResponseHelper.success(res, req, "", {
      tasks,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    return ResponseHelper.serverError(res, req, error.message);
  }
});

export default router;
