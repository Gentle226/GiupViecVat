import express from "express";
import { Payment, Review } from "../models/index";
import { Task } from "../models/Task";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Create payment (simulated)
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskId, amount } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    } // Only task poster can create payment
    if (task.postedBy.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create payment for this task",
      });
    }

    if (!task.assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Task must be assigned before payment",
      });
    }

    // Simulate Stripe payment intent
    const mockPaymentIntentId = `pi_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const payment = new Payment({
      taskId,
      payerId: req.userId,
      payeeId: task.assignedTo,
      amount,
      status: "completed", // Simulating successful payment
      stripePaymentIntentId: mockPaymentIntentId,
      completedAt: new Date(),
    });

    await payment.save();

    // Update task status
    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    res.status(201).json({
      success: true,
      data: payment,
      message: "Payment processed successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message,
    });
  }
});

// Get payment history
router.get("/history", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type = "all", page = 1, limit = 20 } = req.query;
    let query: any = {};
    if (type === "sent") {
      query.payerId = req.userId;
    } else if (type === "received") {
      query.payeeId = req.userId;
    } else {
      query.$or = [{ payerId: req.userId }, { payeeId: req.userId }];
    }

    const payments = await Payment.find(query)
      .populate("taskId", "title description")
      .populate("payerId", "firstName lastName")
      .populate("payeeId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
});

export default router;
