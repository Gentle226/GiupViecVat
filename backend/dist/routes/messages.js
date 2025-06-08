"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const Message_1 = require("../models/Message");
const auth_1 = require("../middleware/auth");
const ResponseHelper_1 = __importDefault(require("../utils/ResponseHelper"));
const router = express_1.default.Router();
// Get user's conversations
router.get("/conversations", auth_1.authenticateToken, async (req, res) => {
    try {
        const conversations = await Message_1.Conversation.find({
            participants: new mongoose_1.default.Types.ObjectId(req.userId),
        })
            .populate("participants", "firstName lastName avatar")
            .populate("lastMessage")
            .populate("taskId", "title status")
            .sort({ updatedAt: -1 });
        res.json({
            success: true,
            data: conversations,
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Get messages for a conversation
router.get("/conversations/:id/messages", auth_1.authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        // Check if user is participant
        const conversation = await Message_1.Conversation.findById(req.params.id);
        if (!conversation ||
            !conversation.participants.includes(new mongoose_1.default.Types.ObjectId(req.userId))) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view this conversation",
            });
        }
        const messages = await Message_1.Message.find({ conversationId: req.params.id })
            .populate("senderId", "firstName lastName avatar")
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        // Mark messages as read
        await Message_1.Message.updateMany({
            conversationId: req.params.id,
            senderId: { $ne: new mongoose_1.default.Types.ObjectId(req.userId) },
            readBy: { $ne: new mongoose_1.default.Types.ObjectId(req.userId) },
        }, { $push: { readBy: new mongoose_1.default.Types.ObjectId(req.userId) } });
        res.json({
            success: true,
            data: messages.reverse(), // Return in chronological order
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Create or get conversation
router.post("/conversations", auth_1.authenticateToken, async (req, res) => {
    try {
        const { participantId, taskId } = req.body;
        // Check if conversation already exists
        let conversation = await Message_1.Conversation.findOne({
            participants: {
                $all: [
                    new mongoose_1.default.Types.ObjectId(req.userId),
                    new mongoose_1.default.Types.ObjectId(participantId),
                ],
            },
            taskId: taskId ? new mongoose_1.default.Types.ObjectId(taskId) : null,
        });
        if (!conversation) {
            conversation = new Message_1.Conversation({
                participants: [
                    new mongoose_1.default.Types.ObjectId(req.userId),
                    new mongoose_1.default.Types.ObjectId(participantId),
                ],
                taskId: taskId ? new mongoose_1.default.Types.ObjectId(taskId) : null,
            });
            await conversation.save();
        }
        await conversation.populate("participants", "firstName lastName avatar");
        await conversation.populate("taskId", "title status");
        return ResponseHelper_1.default.success(res, req, 'messages.conversationCreated', conversation);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Send message to a conversation
router.post("/conversations/:id/messages", auth_1.authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const conversationId = req.params.id; // Validate input
        if (!content || !content.trim()) {
            return ResponseHelper_1.default.error(res, req, 'messages.messageContentRequired', 400);
        }
        // Check if user is participant in the conversation
        const conversation = await Message_1.Conversation.findById(conversationId);
        if (!conversation ||
            !conversation.participants.includes(new mongoose_1.default.Types.ObjectId(req.userId))) {
            return ResponseHelper_1.default.forbidden(res, req, 'messages.unauthorizedAccess');
        }
        // Create the message
        const message = new Message_1.Message({
            conversationId: new mongoose_1.default.Types.ObjectId(conversationId),
            senderId: new mongoose_1.default.Types.ObjectId(req.userId),
            content: content.trim(),
        });
        await message.save();
        await message.populate("senderId", "firstName lastName avatar"); // Update conversation's last message
        await Message_1.Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            updatedAt: new Date(),
        });
        return ResponseHelper_1.default.success(res, req, 'messages.messageSent', message);
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Get unread message count for user
router.get("/unread-count", auth_1.authenticateToken, async (req, res) => {
    try {
        // Get all conversations for the user
        const conversations = await Message_1.Conversation.find({
            participants: new mongoose_1.default.Types.ObjectId(req.userId),
        });
        let totalUnreadCount = 0;
        const conversationCounts = {};
        // For each conversation, count unread messages
        for (const conversation of conversations) {
            const unreadCount = await Message_1.Message.countDocuments({
                conversationId: conversation._id,
                senderId: { $ne: new mongoose_1.default.Types.ObjectId(req.userId) },
                readBy: { $ne: new mongoose_1.default.Types.ObjectId(req.userId) },
            });
            if (unreadCount > 0) {
                totalUnreadCount += unreadCount;
                conversationCounts[conversation._id.toString()] = unreadCount;
            }
        }
        res.json({
            success: true,
            data: {
                count: totalUnreadCount,
                conversationCounts,
            },
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Mark conversation messages as read
router.post("/conversations/:id/mark-read", auth_1.authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.id;
        // Verify user is participant in the conversation
        const conversation = await Message_1.Conversation.findById(conversationId);
        if (!conversation ||
            !conversation.participants.includes(new mongoose_1.default.Types.ObjectId(req.userId))) {
            return ResponseHelper_1.default.forbidden(res, req, 'messages.unauthorizedAccess');
        }
        // Mark all messages in the conversation as read by this user
        await Message_1.Message.updateMany({
            conversationId: new mongoose_1.default.Types.ObjectId(conversationId),
            senderId: { $ne: new mongoose_1.default.Types.ObjectId(req.userId) },
            readBy: { $ne: new mongoose_1.default.Types.ObjectId(req.userId) },
        }, { $push: { readBy: new mongoose_1.default.Types.ObjectId(req.userId) } });
        res.json({
            success: true,
            data: { success: true },
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map