"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Bid_1 = require("../models/Bid");
const Task_1 = require("../models/Task");
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const adapter_1 = require("../data/adapter");
const router = express_1.default.Router();
// Create a bid
router.post("/", auth_1.authenticateToken, roleAuth_1.requireTasker, async (req, res) => {
    try {
        const { taskId, amount, message, estimatedDuration } = req.body;
        // Check if task exists and is open
        const task = await adapter_1.db.findTaskById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }
        if (task.status !== "open") {
            return res.status(400).json({
                success: false,
                message: "Task is no longer accepting bids",
            });
        } // Can't bid on own task
        if (task.postedBy.toString() === req.userId.toString()) {
            return res.status(400).json({
                success: false,
                message: "Cannot bid on your own task",
            });
        } // Check if user already has a pending bid
        const existingBids = await adapter_1.db.findBidsByTaskRaw(taskId);
        const existingBid = existingBids.find((bid) => bid.bidderId.toString() === req.userId.toString() && bid.status === "pending");
        if (existingBid) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending bid for this task",
            });
        }
        const bidData = {
            taskId,
            bidderId: req.userId,
            amount,
            message,
            estimatedDuration,
        };
        const bid = await adapter_1.db.createBid(bidData);
        res.status(201).json({
            success: true,
            data: bid,
            message: "Bid submitted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create bid",
            error: error.message,
        });
    }
});
// Get bids for a specific task
router.get("/task/:taskId", async (req, res) => {
    try {
        const { taskId } = req.params;
        // Check if task exists
        const task = await Task_1.Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }
        // Get all bids for this task
        const bids = await Bid_1.Bid.find({ taskId })
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
            message: "Failed to fetch task bids",
            error: error.message,
        });
    }
});
// Accept a bid
router.put("/:id/accept", auth_1.authenticateToken, async (req, res) => {
    try {
        const bid = await Bid_1.Bid.findById(req.params.id).populate("taskId");
        if (!bid) {
            return res.status(404).json({
                success: false,
                message: "Bid not found",
            });
        }
        const task = bid.taskId; // Only task owner can accept bids
        if (task.postedBy.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to accept this bid",
            });
        }
        if (bid.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Bid is no longer pending",
            });
        }
        // Update bid status
        bid.status = "accepted";
        await bid.save();
        // Update task
        task.status = "assigned";
        task.assignedTo = bid.bidderId;
        await task.save();
        // Reject all other pending bids for this task
        await Bid_1.Bid.updateMany({
            taskId: task._id,
            _id: { $ne: bid._id },
            status: "pending",
        }, { status: "rejected" });
        res.json({
            success: true,
            data: bid,
            message: "Bid accepted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to accept bid",
            error: error.message,
        });
    }
});
// Get user's bids
router.get("/my-bids", auth_1.authenticateToken, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = { bidderId: req.userId };
        if (status) {
            query.status = status;
        }
        const bids = await Bid_1.Bid.find(query)
            .populate("taskId", "title description category location suggestedPrice status")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await Bid_1.Bid.countDocuments(query);
        res.json({
            success: true,
            data: {
                bids,
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
            message: "Failed to fetch bids",
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=bids.js.map