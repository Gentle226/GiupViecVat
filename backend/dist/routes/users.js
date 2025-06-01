"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const Task_1 = require("../models/Task");
const index_1 = require("../models/index");
const router = express_1.default.Router();
// Get user profile
router.get("/:id", async (req, res) => {
    try {
        const user = await User_1.User.findById(req.params.id).select("-password -email"); // Don't expose sensitive data
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Get user's recent reviews
        const reviews = await index_1.Review.find({ revieweeId: req.params.id })
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
    }
    catch (error) {
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
        let query = {};
        if (type === "posted") {
            query.postedBy = req.params.id;
        }
        else if (type === "assigned") {
            query.assignedTo = req.params.id;
        }
        const tasks = await Task_1.Task.find(query)
            .populate("postedBy", "firstName lastName rating reviewCount avatar")
            .populate("assignedTo", "firstName lastName rating reviewCount avatar")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await Task_1.Task.countDocuments(query);
        res.json({
            success: true,
            data: {
                tasks,
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
            message: "Failed to fetch user tasks",
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map