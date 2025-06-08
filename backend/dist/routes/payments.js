"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../models/index");
const Task_1 = require("../models/Task");
const auth_1 = require("../middleware/auth");
const ResponseHelper_1 = require("../utils/ResponseHelper");
const router = express_1.default.Router();
// Create payment (simulated)
router.post("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId, amount } = req.body;
        const task = await Task_1.Task.findById(taskId);
        if (!task) {
            return ResponseHelper_1.ResponseHelper.notFound(res, req, "tasks.taskNotFound");
        }
        // Only task poster can create payment
        if (task.postedBy.toString() !== req.userId.toString()) {
            return ResponseHelper_1.ResponseHelper.forbidden(res, req, "payments.unauthorizedAccess");
        }
        if (!task.assignedTo) {
            return ResponseHelper_1.ResponseHelper.error(res, req, "payments.taskNotCompleted", 400);
        }
        // Simulate Stripe payment intent
        const mockPaymentIntentId = `pi_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        const payment = new index_1.Payment({
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
        return ResponseHelper_1.ResponseHelper.success(res, req, "payments.paymentProcessed", payment, 201);
    }
    catch (error) {
        return ResponseHelper_1.ResponseHelper.error(res, req, "payments.paymentProcessingFailed", 500, error);
    }
});
// Get payment history
router.get("/history", auth_1.authenticateToken, async (req, res) => {
    try {
        const { type = "all", page = 1, limit = 20 } = req.query;
        let query = {};
        if (type === "sent") {
            query.payerId = req.userId;
        }
        else if (type === "received") {
            query.payeeId = req.userId;
        }
        else {
            query.$or = [{ payerId: req.userId }, { payeeId: req.userId }];
        }
        const payments = await index_1.Payment.find(query)
            .populate("taskId", "title description")
            .populate("payerId", "firstName lastName")
            .populate("payeeId", "firstName lastName")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await index_1.Payment.countDocuments(query);
        const responseData = {
            payments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        };
        return ResponseHelper_1.ResponseHelper.success(res, req, "general.operationSuccess", responseData);
    }
    catch (error) {
        return ResponseHelper_1.ResponseHelper.error(res, req, "general.operationFailed", 500, error);
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map