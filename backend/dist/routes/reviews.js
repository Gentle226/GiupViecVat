"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../models/index");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Create review
router.post("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId, revieweeId, rating, comment } = req.body;
        const task = await Task_1.Task.findById(taskId);
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
        const isTasker = task.assignedTo && task.assignedTo.toString() === req.userId.toString();
        if (!isTaskPoster && !isTasker) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to review this task",
            });
        } // Check if review already exists
        const existingReview = await index_1.Review.findOne({
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
        const review = new index_1.Review({
            taskId,
            reviewerId: req.userId,
            revieweeId,
            rating,
            comment,
        });
        await review.save();
        // Update reviewee's rating
        const reviews = await index_1.Review.find({ revieweeId });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;
        await User_1.User.findByIdAndUpdate(revieweeId, {
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
    }
    catch (error) {
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
        const reviews = await index_1.Review.find({ revieweeId: req.params.id })
            .populate("reviewerId", "firstName lastName avatar")
            .populate("taskId", "title")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await index_1.Review.countDocuments({ revieweeId: req.params.id });
        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=reviews.js.map