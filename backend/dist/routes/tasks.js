"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const roleAuth_1 = require("../middleware/roleAuth");
const adapter_1 = require("../data/adapter");
const router = express_1.default.Router();
// Get all tasks with filters
router.get("/", async (req, res) => {
    try {
        const { category, status = "open", lat, lng, radius = 50, // km
        page = 1, limit = 20, search, } = req.query;
        const filter = {};
        if (category) {
            filter.category = category;
        }
        if (status) {
            filter.status = status;
        }
        if (search) {
            filter.search = search;
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
        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks",
            error: error.message,
        });
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
        res.status(500).json({
            success: false,
            message: "Failed to fetch your tasks",
            error: error.message,
        });
    }
});
// Get single task
router.get("/:id", async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
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
router.post("/", auth_1.authenticateToken, roleAuth_1.requireClient, async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            postedBy: req.userId, // Use req.userId instead of req.user._id
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
router.put("/:id", auth_1.authenticateToken, roleAuth_1.requireClient, async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        } // Only task owner can update
        if (task.postedBy.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this task",
            });
        }
        const updatedTask = await adapter_1.db.updateTask(req.params.id, req.body);
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
router.delete("/:id", auth_1.authenticateToken, roleAuth_1.requireClient, async (req, res) => {
    try {
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        } // Only task owner can delete
        if (task.postedBy.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this task",
            });
        }
        await adapter_1.db.deleteTask(req.params.id);
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
        const task = await adapter_1.db.findTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        } // Only task owner can view bids
        if (task.postedBy.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view bids for this task",
            });
        }
        const bids = await adapter_1.db.findBidsByTask(req.params.id);
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