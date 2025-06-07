import express from "express";
import { Task } from "../models/Task";
import { Bid } from "../models/Bid";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { requireClient } from "../middleware/roleAuth";
import { db } from "../data/adapter";

const router = express.Router();

// Get all tasks with filters
router.get("/", async (req, res) => {
  try {
    const {
      category,
      status = "open",
      lat,
      lng,
      radius = 50, // km
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const filter: any = {};

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
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: "createdAt",
      order: "desc",
    };

    const result = await db.findTasks(filter, options);

    res.json({
      success: true,
      data: {
        tasks: result.tasks,
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
});

// Get user's tasks
router.get("/my-tasks", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const filter = { postedBy: req.userId };
    const options = {
      sort: "createdAt",
      order: "desc",
    };

    const result = await db.findTasks(filter, options);

    res.json({
      success: true,
      data: result.tasks,
    });
  } catch (error: any) {
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
    const task = await db.findTaskById(req.params.id);

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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
      error: error.message,
    });
  }
});

// Create new task
router.post(
  "/",
  authenticateToken,
  requireClient,
  async (req: AuthRequest, res) => {
    try {
      const taskData = {
        ...req.body,
        postedBy: req.userId, // Use req.userId instead of req.user._id
      };

      const task = await db.createTask(taskData);

      res.status(201).json({
        success: true,
        data: task,
        message: "Task created successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create task",
        error: error.message,
      });
    }
  }
);

// Update task
router.put(
  "/:id",
  authenticateToken,
  requireClient,
  async (req: AuthRequest, res) => {
    try {
      const task = await db.findTaskById(req.params.id);

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

      const updatedTask = await db.updateTask(req.params.id, req.body);

      res.json({
        success: true,
        data: updatedTask,
        message: "Task updated successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update task",
        error: error.message,
      });
    }
  }
);

// Delete task
router.delete(
  "/:id",
  authenticateToken,
  requireClient,
  async (req: AuthRequest, res) => {
    try {
      const task = await db.findTaskById(req.params.id);

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

      await db.deleteTask(req.params.id);

      res.json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete task",
        error: error.message,
      });
    }
  }
);

// Get task bids
router.get("/:id/bids", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const task = await db.findTaskById(req.params.id);

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

    const bids = await db.findBidsByTask(req.params.id);

    res.json({
      success: true,
      data: bids,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bids",
      error: error.message,
    });
  }
});

// Complete task
router.patch(
  "/:id/complete",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      console.log("=== COMPLETE TASK DEBUG ===");
      console.log("User ID:", req.userId);
      console.log("Task ID:", req.params.id);

      const task = await db.findTaskById(req.params.id);

      if (!task) {
        console.log("Task not found");
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }
      console.log("Task found:", {
        taskId: task._id,
        postedBy: task.postedBy,
        postedByType: typeof task.postedBy,
        postedById: (task.postedBy as any)?._id || task.postedBy,
        assignedTo: task.assignedTo,
        status: task.status,
      }); // Only task owner (client) or assigned tasker can complete
      const postedById = (task.postedBy as any)?._id || task.postedBy;
      const isTaskOwner = postedById.toString() === req.userId.toString();
      const isAssignedTasker =
        task.assignedTo && task.assignedTo.toString() === req.userId.toString();

      console.log("Authorization check:", {
        isTaskOwner,
        isAssignedTasker,
        postedById: postedById.toString(),
        assignedTo: task.assignedTo?.toString(),
        currentUserId: req.userId.toString(),
      });

      if (!isTaskOwner && !isAssignedTasker) {
        console.log("Authorization failed");
        return res.status(403).json({
          success: false,
          message: "Not authorized to complete this task",
        });
      }

      // Task must be assigned or in progress to be completed
      if (task.status !== "assigned" && task.status !== "in_progress") {
        return res.status(400).json({
          success: false,
          message: "Task must be assigned or in progress to be completed",
        });
      }

      const updatedTask = await db.updateTask(req.params.id, {
        status: "completed",
        completedAt: new Date(),
      });

      res.json({
        success: true,
        data: updatedTask,
        message: "Task completed successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to complete task",
        error: error.message,
      });
    }
  }
);

export default router;
