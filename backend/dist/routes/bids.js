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
const socketService_1 = require("../services/socketService");
const ResponseHelper_1 = __importDefault(require("../utils/ResponseHelper"));
const router = express_1.default.Router();
// Create a bid
router.post("/", auth_1.authenticateToken, roleAuth_1.requireTasker, async (req, res) => {
    try {
        const { taskId, amount, message, estimatedDuration } = req.body; // Check if task exists and is open
        const task = await adapter_1.db.findTaskById(taskId);
        if (!task) {
            return ResponseHelper_1.default.notFound(res, req, 'tasks.taskNotFound');
        }
        if (task.status !== "open") {
            return ResponseHelper_1.default.error(res, req, 'bids.taskNotAcceptingBids', 400);
        }
        // Can't bid on own task
        if (task.postedBy.toString() === req.userId.toString()) {
            return ResponseHelper_1.default.error(res, req, 'bids.cannotBidOnOwnTask', 400);
        } // Check if user already has a pending bid
        const existingBids = await adapter_1.db.findBidsByTaskRaw(taskId);
        const existingBid = existingBids.find((bid) => bid.bidderId.toString() === req.userId.toString() &&
            bid.status === "pending");
        if (existingBid) {
            return ResponseHelper_1.default.error(res, req, 'bids.bidAlreadyExists', 400);
        }
        const bidData = {
            taskId,
            bidderId: req.userId,
            amount,
            message,
            estimatedDuration,
        };
        const bid = await adapter_1.db.createBid(bidData);
        // Get bidder information for notification
        const bidder = await adapter_1.db.findUserById(req.userId);
        const bidderName = bidder
            ? `${bidder.firstName} ${bidder.lastName}`
            : "Unknown User"; // Extract the task owner ID properly
        const taskOwnerId = typeof task.postedBy === "string"
            ? task.postedBy
            : task.postedBy._id?.toString() || task.postedBy.toString(); // Emit socket notification to task owner
        (0, socketService_1.emitToUser)(taskOwnerId, "new_bid_notification", {
            taskId,
            bidId: bid._id,
            taskTitle: task.title,
            bidderName,
            amount,
            message,
        });
        return ResponseHelper_1.default.success(res, req, 'bids.bidCreated', bid, 201);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Get bids for a specific task
router.get("/task/:taskId", async (req, res) => {
    try {
        const { taskId } = req.params; // Check if task exists
        const task = await Task_1.Task.findById(taskId);
        if (!task) {
            return ResponseHelper_1.default.notFound(res, req, 'tasks.taskNotFound');
        } // Get all bids for this task
        const bids = await Bid_1.Bid.find({ taskId })
            .populate("bidderId", "firstName lastName rating reviewCount avatar bio skills")
            .sort({ createdAt: -1 });
        return ResponseHelper_1.default.success(res, req, '', bids);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Accept a bid
router.put("/:id/accept", auth_1.authenticateToken, async (req, res) => {
    try {
        const bid = await Bid_1.Bid.findById(req.params.id).populate("taskId");
        if (!bid) {
            return ResponseHelper_1.default.notFound(res, req, 'bids.bidNotFound');
        }
        const task = bid.taskId;
        // Only task owner can accept bids
        if (task.postedBy.toString() !== req.userId.toString()) {
            return ResponseHelper_1.default.forbidden(res, req, 'bids.onlyTaskOwnerCanAccept');
        }
        if (bid.status !== "pending") {
            return ResponseHelper_1.default.error(res, req, 'bids.bidNotPending', 400);
        }
        // Update bid status
        bid.status = "accepted";
        await bid.save();
        // Update task
        task.status = "assigned";
        task.assignedTo = bid.bidderId;
        await task.save(); // Reject all other pending bids for this task
        await Bid_1.Bid.updateMany({
            taskId: task._id,
            _id: { $ne: bid._id },
            status: "pending",
        }, { status: "rejected" });
        // Send notification to the tasker whose bid was accepted
        try {
            // Get the client/task owner information
            const client = await adapter_1.db.findUserById(task.postedBy.toString());
            const clientName = client
                ? `${client.firstName} ${client.lastName}`
                : "Client";
            // Emit socket notification to the tasker
            (0, socketService_1.emitToUser)(bid.bidderId.toString(), "bid_accepted_notification", {
                taskId: task._id,
                bidId: bid._id,
                taskTitle: task.title,
                amount: bid.amount,
                clientName,
            });
        }
        catch (notificationError) {
            console.error("Error sending bid accepted notification:", notificationError); // Don't fail the bid acceptance if notification fails
        }
        return ResponseHelper_1.default.success(res, req, 'bids.bidAccepted', bid);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
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
        return ResponseHelper_1.default.success(res, req, '', {
            bids,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=bids.js.map