import express from "express";
import { User } from "../models/User";
import { Task } from "../models/Task";
import { Review } from "../models/index";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Get user profile
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -email"); // Don't expose sensitive data

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's recent reviews
    const reviews = await Review.find({ revieweeId: req.params.id })
      .populate("reviewerId", "firstName lastName avatar")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        user,
        reviews,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
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

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user tasks",
      error: error.message,
    });
  }
});

export default router;
