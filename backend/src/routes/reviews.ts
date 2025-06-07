import express from "express";
import { Review } from "../models/index";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Create review
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskId, revieweeId, rating, comment } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if task is completed
    if (task.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed tasks",
      });
    } // Check if user is involved in the task
    const isTaskPoster = task.postedBy.toString() === req.userId.toString();
    const isTasker =
      task.assignedTo && task.assignedTo.toString() === req.userId.toString();

    if (!isTaskPoster && !isTasker) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to review this task",
      });
    } // Check if review already exists
    const existingReview = await Review.findOne({
      taskId,
      reviewerId: req.userId,
      revieweeId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this task",
      });
    }
    const review = new Review({
      taskId,
      reviewerId: req.userId,
      revieweeId,
      rating,
      comment,
    });

    await review.save();

    // Update reviewee's rating
    const reviews = await Review.find({ revieweeId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(revieweeId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length,
    });

    await review.populate("reviewerId", "firstName lastName avatar");
    await review.populate("taskId", "title");

    res.status(201).json({
      success: true,
      data: review,
      message: "Review submitted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
});

// Get reviews for a user
router.get("/user/:id", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find({ revieweeId: req.params.id })
      .populate("reviewerId", "firstName lastName avatar")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    const total = await Review.countDocuments({ revieweeId: req.params.id });

    res.json({
      success: true,
      data: {
        reviews,
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
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});

export default router;
