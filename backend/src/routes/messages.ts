import express from "express";
import { Message, Conversation } from "../models/Message";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Get user's conversations
router.get(
  "/conversations",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const conversations = await Conversation.find({
        participants: req.user._id,
      })
        .populate("participants", "firstName lastName avatar")
        .populate("lastMessage")
        .populate("taskId", "title status")
        .sort({ updatedAt: -1 });

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch conversations",
        error: error.message,
      });
    }
  }
);

// Get messages for a conversation
router.get(
  "/conversations/:id/messages",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;

      // Check if user is participant
      const conversation = await Conversation.findById(req.params.id);
      if (!conversation || !conversation.participants.includes(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this conversation",
        });
      }

      const messages = await Message.find({ conversationId: req.params.id })
        .populate("senderId", "firstName lastName avatar")
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string))
        .skip((parseInt(page as string) - 1) * parseInt(limit as string));

      // Mark messages as read
      await Message.updateMany(
        {
          conversationId: req.params.id,
          senderId: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
        },
        { $push: { readBy: req.user._id } }
      );

      res.json({
        success: true,
        data: messages.reverse(), // Return in chronological order
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
        error: error.message,
      });
    }
  }
);

// Create or get conversation
router.post(
  "/conversations",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { participantId, taskId } = req.body;

      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, participantId] },
        taskId: taskId || null,
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [req.user._id, participantId],
          taskId: taskId || null,
        });
        await conversation.save();
      }

      await conversation.populate("participants", "firstName lastName avatar");
      await conversation.populate("taskId", "title status");

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create conversation",
        error: error.message,
      });
    }
  }
);

export default router;
