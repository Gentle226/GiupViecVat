import express from "express";
import { Payment, Review } from "../models/index";
import { Task } from "../models/Task";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { ResponseHelper } from "../utils/ResponseHelper";

const router = express.Router();

// Create payment (simulated)
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskId, amount } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return ResponseHelper.notFound(res, req, "tasks.taskNotFound");
    }

    // Only task poster can create payment
    if (task.postedBy.toString() !== req.userId.toString()) {
      return ResponseHelper.forbidden(res, req, "payments.unauthorizedAccess");
    }

    if (!task.assignedTo) {
      return ResponseHelper.error(res, req, "payments.taskNotCompleted", 400);
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

    return ResponseHelper.success(
      res,
      req,
      "payments.paymentProcessed",
      payment,
      201
    );
  } catch (error: any) {
    return ResponseHelper.error(
      res,
      req,
      "payments.paymentProcessingFailed",
      500,
      error
    );
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

    const responseData = {
      payments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    };

    return ResponseHelper.success(
      res,
      req,
      "general.operationSuccess",
      responseData
    );
  } catch (error: any) {
    return ResponseHelper.error(
      res,
      req,
      "general.operationFailed",
      500,
      error
    );
  }
});

export default router;
