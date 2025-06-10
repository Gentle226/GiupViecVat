import express from "express";
import { Bid } from "../models/Bid";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { requireTasker } from "../middleware/roleAuth";
import { db } from "../data/adapter";
import { emitToUser } from "../services/socketService";
import ResponseHelper from "../utils/ResponseHelper";

const router = express.Router();

// Create a bid
router.post(
  "/",
  authenticateToken,
  requireTasker,
  async (req: AuthRequest, res) => {
    try {
      const { taskId, amount, message, estimatedDuration } = req.body; // Check if task exists and is open
      const task = await db.findTaskById(taskId);
      if (!task) {
        return ResponseHelper.notFound(res, req, "tasks.taskNotFound");
      }
      if (task.status !== "open") {
        return ResponseHelper.error(res, req, "bids.taskNotAcceptingBids", 400);
      }

      // Can't bid on own task
      if (task.postedBy.toString() === req.userId.toString()) {
        return ResponseHelper.error(res, req, "bids.cannotBidOnOwnTask", 400);
      } // Check if user already has a pending bid
      const existingBids = await db.findBidsByTaskRaw(taskId);
      const existingBid = existingBids.find(
        (bid: any) =>
          bid.bidderId.toString() === req.userId.toString() &&
          bid.status === "pending"
      );
      if (existingBid) {
        return ResponseHelper.error(res, req, "bids.bidAlreadyExists", 400);
      }

      const bidData = {
        taskId,
        bidderId: req.userId,
        amount,
        message,
        estimatedDuration,
      };
      const bid = await db.createBid(bidData);

      // Get bidder information for notification
      const bidder = await db.findUserById(req.userId);
      const bidderName = bidder
        ? `${bidder.firstName} ${bidder.lastName}`
        : "Unknown User"; // Extract the task owner ID properly
      const taskOwnerId =
        typeof task.postedBy === "string"
          ? task.postedBy
          : task.postedBy._id?.toString() || task.postedBy.toString(); // Emit socket notification to task owner
      emitToUser(taskOwnerId, "new_bid_notification", {
        taskId,
        bidId: bid._id,
        taskTitle: task.title,
        bidderName,
        amount,
        message,
      });

      return ResponseHelper.success(res, req, "bids.bidCreated", bid, 201);
    } catch (error: any) {
      return ResponseHelper.serverError(res, req, error.message);
    }
  }
);

// Get bids for a specific task
router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params; // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return ResponseHelper.notFound(res, req, "tasks.taskNotFound");
    } // Get all bids for this task
    const bids = await Bid.find({ taskId })
      .populate(
        "bidderId",
        "firstName lastName rating reviewCount avatar bio skills"
      )
      .sort({ createdAt: -1 });

    return ResponseHelper.success(res, req, "", bids);
  } catch (error: any) {
    return ResponseHelper.serverError(res, req, error.message);
  }
});

// Accept a bid
router.put("/:id/accept", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate("taskId");
    if (!bid) {
      return ResponseHelper.notFound(res, req, "bids.bidNotFound");
    }

    const task = bid.taskId as any;
    // Only task owner can accept bids
    if (task.postedBy.toString() !== req.userId.toString()) {
      return ResponseHelper.forbidden(res, req, "bids.onlyTaskOwnerCanAccept");
    }

    if (bid.status !== "pending") {
      return ResponseHelper.error(res, req, "bids.bidNotPending", 400);
    }

    // Update bid status
    bid.status = "accepted";
    await bid.save();

    // Update task
    task.status = "assigned";
    task.assignedTo = bid.bidderId;
    await task.save(); // Reject all other pending bids for this task
    await Bid.updateMany(
      {
        taskId: task._id,
        _id: { $ne: bid._id },
        status: "pending",
      },
      { status: "rejected" }
    );

    // Send notification to the tasker whose bid was accepted
    try {
      // Get the client/task owner information
      const client = await db.findUserById(task.postedBy.toString());
      const clientName = client
        ? `${client.firstName} ${client.lastName}`
        : "Client";

      // Emit socket notification to the tasker
      emitToUser(bid.bidderId.toString(), "bid_accepted_notification", {
        taskId: task._id,
        bidId: bid._id,
        taskTitle: task.title,
        amount: bid.amount,
        clientName,
      });
    } catch (notificationError) {
      console.error(
        "Error sending bid accepted notification:",
        notificationError
      ); // Don't fail the bid acceptance if notification fails
    }

    return ResponseHelper.success(res, req, "bids.bidAccepted", bid);
  } catch (error: any) {
    return ResponseHelper.serverError(res, req, error.message);
  }
});

// Get user's bids
router.get("/my-bids", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = { bidderId: req.userId };
    if (status) {
      query.status = status;
    }

    const bids = await Bid.find(query)
      .populate(
        "taskId",
        "title description category location suggestedPrice status"
      )
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));
    const total = await Bid.countDocuments(query);

    return ResponseHelper.success(res, req, "", {
      bids,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    return ResponseHelper.serverError(res, req, error.message);
  }
});

export default router;
