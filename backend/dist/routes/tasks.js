"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Task_1 = require("../models/Task");
const Bid_1 = require("../models/Bid");
const auth_1 = require("../middleware/auth");
const adapter_1 = require("../data/adapter");
const router = express_1.default.Router();
// Get all tasks with filters
router.get("/", async (req, res) => {
    try {
        const { category, status = "open", lat, lng, radius = 50, // km
        page = 1, limit = 20, search, } = req.query;
        const query = {};
        if (category) {
            query.category = category;
        }
        if (status) {
            query.status = status;
        }
        // Search by title or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }
        // Location-based search
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: parseInt(radius) * 1000, // Convert km to meters
                },
            };
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
            message: "Failed to fetch tasks",
            error: error.message,
        });
    }
});
// Get single task
router.get("/:id", async (req, res) => {
    try {
        const task = await Task_1.Task.findById(req.params.id)
            .populate("postedBy", "firstName lastName rating reviewCount avatar bio")
            .populate("assignedTo", "firstName lastName rating reviewCount avatar bio");
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }
        res.json({
            success: true,
            data: task,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch task",
            error: error.message,
        });
    }
});
// Create new task
router.post("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            postedBy: req.user._id,
        };
        const task = await adapter_1.db.createTask(taskData);
        res.status(201).json({
            success: true,
            data: task,
            message: "Task created successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create task",
            error: error.message,
        });
    }
});
// Update task
router.put("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const task = await Task_1.Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }
        // Only task owner can update
        if (task.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this task",
            });
        }
        const updatedTask = await Task_1.Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate("postedBy", "firstName lastName rating reviewCount avatar")
            .populate("assignedTo", "firstName lastName rating reviewCount avatar");
        res.json({
            success: true,
            data: updatedTask,
            message: "Task updated successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update task",
            error: error.message,
        });
    }
});
// Delete task
router.delete("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const task = await Task_1.Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }
        // Only task owner can delete
        if (task.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this task",
            });
        }
        await Task_1.Task.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: "Task deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete task",
            error: error.message,
        });
    }
});
// Get task bids
router.get("/:id/bids", auth_1.authenticateToken, async (req, res) => {
    try {
        const task = await Task_1.Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }
        // Only task owner can view bids
        if (task.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view bids for this task",
            });
        }
        const bids = await Bid_1.Bid.find({ taskId: req.params.id })
            .populate("bidderId", "firstName lastName rating reviewCount avatar bio skills")
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: bids,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch bids",
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map