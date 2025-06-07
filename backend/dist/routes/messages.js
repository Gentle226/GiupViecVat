"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const Message_1 = require("../models/Message");
const auth_1 = require("../middleware/auth");
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
        res.status(500).json({
            success: false,
            message: "Failed to fetch conversations",
            error: error.message,
        });
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
        res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
            error: error.message,
        });
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
        res.json({
            success: true,
            data: conversation,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create conversation",
            error: error.message,
        });
    }
});
// Send message to a conversation
router.post("/conversations/:id/messages", auth_1.authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const conversationId = req.params.id;
        // Validate input
        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message content is required",
            });
        }
        // Check if user is participant in the conversation
        const conversation = await Message_1.Conversation.findById(conversationId);
        if (!conversation ||
            !conversation.participants.includes(new mongoose_1.default.Types.ObjectId(req.userId))) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to send message to this conversation",
            });
        }
        // Create the message
        const message = new Message_1.Message({
            conversationId: new mongoose_1.default.Types.ObjectId(conversationId),
            senderId: new mongoose_1.default.Types.ObjectId(req.userId),
            content: content.trim(),
        });
        await message.save();
        await message.populate("senderId", "firstName lastName avatar");
        // Update conversation's last message
        await Message_1.Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            updatedAt: new Date(),
        });
        res.json({
            success: true,
            data: message,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map