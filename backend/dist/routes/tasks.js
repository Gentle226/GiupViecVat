"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Bid_1 = require("../models/Bid");
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const adapter_1 = require("../data/adapter");
const ResponseHelper_1 = __importDefault(require("../utils/ResponseHelper"));
const router = express_1.default.Router();
// Get all tasks with filters
router.get("/", async (req, res) => {
    try {
        const { category, categories, // Support array of categories
        status = "open", locationType, lat, lng, radius = 50, // km
        priceMin, priceMax, availableOnly, page = 1, limit = 20, search, } = req.query;
        const filter = {};
        // Handle categories (can be single or array)
        if (categories) {
            filter.category = Array.isArray(categories) ? categories : [categories];
        }
        else if (category) {
            filter.category = category;
        }
        if (status) {
            filter.status = status;
        }
        if (locationType) {
            filter.locationType = locationType;
        }
        if (search) {
            filter.search = search;
        }
        if (priceMin !== undefined) {
            filter.priceMin = parseFloat(priceMin);
        }
        if (priceMax !== undefined) {
            filter.priceMax = parseFloat(priceMax);
        }
        if (availableOnly === "true") {
            filter.availableOnly = true;
        }
        // Add location filtering if coordinates are provided
        if (lat && lng) {
            filter.location = {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                radius: parseFloat(radius),
            };
        }
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: "createdAt",
            order: "desc",
        };
        const result = await adapter_1.db.findTasks(filter, options);
        res.json({
            success: true,
            data: {
                tasks: result.tasks,
                total: result.total,
                pages: Math.ceil(result.total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Get user's tasks
router.get("/my-tasks", auth_1.authenticateToken, async (req, res) => {
    try {
        const filter = { postedBy: req.userId };
        const options = {
            sort: "createdAt",
            order: "desc",
        };
        const result = await adapter_1.db.findTasks(filter, options);
        res.json({
            success: true,
            data: result.tasks,
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Get single task
router.get("/:id", async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return ResponseHelper_1.default.notFound(res, req, "tasks.taskNotFound");
        }
        return ResponseHelper_1.default.success(res, req, "", task);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Create new task
router.post("/", auth_1.authenticateToken, roleAuth_1.requireClient, async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            postedBy: req.userId, // Use req.userId instead of req.user._id
        };
        const task = await adapter_1.db.createTask(taskData);
        return ResponseHelper_1.default.success(res, req, "tasks.taskCreated", task, 201);
    }
    catch (error) {
        return ResponseHelper_1.default.error(res, req, "tasks.taskCreationFailed", 500, error.message);
    }
});
// Update task
router.put("/:id", auth_1.authenticateToken, roleAuth_1.requireClient, async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return ResponseHelper_1.default.notFound(res, req, "tasks.taskNotFound");
        }
        // Only task owner can update
        // Handle both populated and non-populated postedBy field
        const postedById = task.postedBy?._id || task.postedBy;
        const isTaskOwner = postedById.toString() === req.userId.toString();
        if (!isTaskOwner) {
            return ResponseHelper_1.default.forbidden(res, req, "tasks.unauthorizedAccess");
        }
        const updatedTask = await adapter_1.db.updateTask(req.params.id, req.body);
        return ResponseHelper_1.default.success(res, req, "tasks.taskUpdated", updatedTask);
    }
    catch (error) {
        console.error("Update task error:", error);
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Delete task
router.delete("/:id", auth_1.authenticateToken, roleAuth_1.requireClient, async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return ResponseHelper_1.default.notFound(res, req, "tasks.taskNotFound");
        }
        // Only task owner can delete
        // Handle both populated and non-populated postedBy field
        const postedById = task.postedBy?._id || task.postedBy;
        if (postedById.toString() !== req.userId.toString()) {
            return ResponseHelper_1.default.forbidden(res, req, "tasks.unauthorizedAccess");
        }
        await adapter_1.db.deleteTask(req.params.id);
        return ResponseHelper_1.default.success(res, req, "tasks.taskDeleted");
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Get task bids
router.get("/:id/bids", auth_1.authenticateToken, async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return ResponseHelper_1.default.notFound(res, req, "tasks.taskNotFound");
        }
        // Only task owner can view bids
        // Handle both populated and non-populated postedBy field
        const postedById = task.postedBy?._id || task.postedBy;
        if (postedById.toString() !== req.userId.toString()) {
            return ResponseHelper_1.default.forbidden(res, req, "bids.unauthorizedViewBids");
        }
        const bids = await adapter_1.db.findBidsByTask(req.params.id);
        return ResponseHelper_1.default.success(res, req, "", bids);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Complete task
router.patch("/:id/complete", auth_1.authenticateToken, roleAuth_1.requireClient, async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return ResponseHelper_1.default.notFound(res, req, "tasks.taskNotFound");
        }
        // Only task owner (client) can complete tasks
        const postedById = task.postedBy?._id || task.postedBy;
        const isTaskOwner = postedById.toString() === req.userId.toString();
        if (!isTaskOwner) {
            return ResponseHelper_1.default.forbidden(res, req, "tasks.onlyOwnerCanComplete");
        }
        // Task must be assigned or in progress to be completed
        if (task.status !== "assigned" && task.status !== "in_progress") {
            return ResponseHelper_1.default.error(res, req, "tasks.invalidStatusForCompletion", 400);
        }
        const updatedTask = await adapter_1.db.updateTask(req.params.id, {
            status: "completed",
            completedAt: new Date(),
        });
        return ResponseHelper_1.default.success(res, req, "tasks.taskCompleted", updatedTask);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Cancel task
router.patch("/:id/cancel", auth_1.authenticateToken, roleAuth_1.requireClient, async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return ResponseHelper_1.default.notFound(res, req, "tasks.taskNotFound");
        }
        // Only task owner can cancel
        const postedById = task.postedBy?._id || task.postedBy;
        const isTaskOwner = postedById.toString() === req.userId.toString();
        if (!isTaskOwner) {
            return ResponseHelper_1.default.forbidden(res, req, "tasks.unauthorizedAccess");
        }
        // Can only cancel open or assigned tasks (not completed or already cancelled)
        if (task.status === "completed" || task.status === "cancelled") {
            return ResponseHelper_1.default.error(res, req, "tasks.cannotCancelTask", 400, `Cannot cancel a task that is already ${task.status}`);
        } // Update task status to cancelled
        const updatedTask = await adapter_1.db.updateTask(req.params.id, {
            status: "cancelled",
        });
        // Handle cancellation business logic:
        // 1. Reject all pending bids
        await Bid_1.Bid.updateMany({
            taskId: req.params.id,
            status: "pending",
        }, { status: "rejected" });
        // 2. Get all bidders to notify them
        const affectedBids = await Bid_1.Bid.find({
            taskId: req.params.id,
            status: "rejected",
        }).populate("bidderId", "firstName lastName");
        // 3. Notify assigned tasker (if any) and all bidders
        try {
            // Import emitToUser dynamically to avoid circular dependency issues
            const { emitToUser } = await Promise.resolve().then(() => __importStar(require("../services/socketService")));
            // Notify assigned tasker if there was one
            if (task.assignedTo) {
                emitToUser(task.assignedTo.toString(), "task_cancelled_notification", {
                    taskId: req.params.id,
                    taskTitle: task.title,
                    message: "A task you were assigned to has been cancelled by the client.",
                    type: "assigned_task_cancelled",
                });
            }
            // Notify all bidders whose bids were rejected due to cancellation
            for (const bid of affectedBids) {
                const bidder = bid.bidderId;
                const bidderName = bidder
                    ? `${bidder.firstName} ${bidder.lastName}`
                    : "Unknown";
                emitToUser(bid.bidderId.toString(), "task_cancelled_notification", {
                    taskId: req.params.id,
                    taskTitle: task.title,
                    message: `The task "${task.title}" has been cancelled by the client. Your bid has been automatically rejected.`,
                    type: "bid_rejected_due_to_cancellation",
                    bidAmount: bid.amount,
                });
            }
        }
        catch (notificationError) {
            console.error("Error sending cancellation notifications:", notificationError);
            // Don't fail the cancellation if notifications fail
        }
        return ResponseHelper_1.default.success(res, req, "tasks.taskCancelled", updatedTask);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map