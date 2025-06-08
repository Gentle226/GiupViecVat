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
      categories, // Support array of categories
      status = "open",
      locationType,
      lat,
      lng,
      radius = 50, // km
      priceMin,
      priceMax,
      availableOnly,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const filter: any = {};

    // Handle categories (can be single or array)
    if (categories) {
      filter.category = Array.isArray(categories) ? categories : [categories];
    } else if (category) {
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
      filter.priceMin = parseFloat(priceMin as string);
    }

    if (priceMax !== undefined) {
      filter.priceMax = parseFloat(priceMax as string);
    }

    if (availableOnly === "true") {
      filter.availableOnly = true;
    }

    // Add location filtering if coordinates are provided
    if (lat && lng) {
      filter.location = {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string),
        radius: parseFloat(radius as string),
      };
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
      }

      // Only task owner can update
      // Handle both populated and non-populated postedBy field
      const postedById = (task.postedBy as any)?._id || task.postedBy;
      const isTaskOwner = postedById.toString() === req.userId.toString();

      if (!isTaskOwner) {
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
      console.error("Update task error:", error);
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
      }

      // Only task owner can delete
      // Handle both populated and non-populated postedBy field
      const postedById = (task.postedBy as any)?._id || task.postedBy;
      if (postedById.toString() !== req.userId.toString()) {
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
    }

    // Only task owner can view bids
    // Handle both populated and non-populated postedBy field
    const postedById = (task.postedBy as any)?._id || task.postedBy;
    if (postedById.toString() !== req.userId.toString()) {
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
  requireClient,
  async (req: AuthRequest, res) => {
    try {
      const task = await db.findTaskById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Only task owner (client) can complete tasks
      const postedById = (task.postedBy as any)?._id || task.postedBy;
      const isTaskOwner = postedById.toString() === req.userId.toString();

      if (!isTaskOwner) {
        return res.status(403).json({
          success: false,
          message: "Only the task owner can complete this task",
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

// Cancel task
router.patch(
  "/:id/cancel",
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
      }

      // Only task owner can cancel
      const postedById = (task.postedBy as any)?._id || task.postedBy;
      const isTaskOwner = postedById.toString() === req.userId.toString();

      if (!isTaskOwner) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel this task",
        });
      }

      // Can only cancel open or assigned tasks (not completed or already cancelled)
      if (task.status === "completed" || task.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a task that is already ${task.status}`,
        });
      } // Update task status to cancelled
      const updatedTask = await db.updateTask(req.params.id, {
        status: "cancelled",
      });

      // Handle cancellation business logic:
      // 1. Reject all pending bids
      await Bid.updateMany(
        {
          taskId: req.params.id,
          status: "pending",
        },
        { status: "rejected" }
      );

      // 2. Get all bidders to notify them
      const affectedBids = await Bid.find({
        taskId: req.params.id,
        status: "rejected",
      }).populate("bidderId", "firstName lastName");

      // 3. Notify assigned tasker (if any) and all bidders
      try {
        // Import emitToUser dynamically to avoid circular dependency issues
        const { emitToUser } = await import("../services/socketService");

        // Notify assigned tasker if there was one
        if (task.assignedTo) {
          emitToUser(
            task.assignedTo.toString(),
            "task_cancelled_notification",
            {
              taskId: req.params.id,
              taskTitle: task.title,
              message:
                "A task you were assigned to has been cancelled by the client.",
              type: "assigned_task_cancelled",
            }
          );
        }

        // Notify all bidders whose bids were rejected due to cancellation
        for (const bid of affectedBids) {
          const bidder = bid.bidderId as any;
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
      } catch (notificationError) {
        console.error(
          "Error sending cancellation notifications:",
          notificationError
        );
        // Don't fail the cancellation if notifications fail
      }

      res.json({
        success: true,
        data: updatedTask,
        message: "Task cancelled successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to cancel task",
        error: error.message,
      });
    }
  }
);

export default router;
