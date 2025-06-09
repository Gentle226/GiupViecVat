import express from "express";
import mongoose from "mongoose";
import { Message, Conversation } from "../models/Message";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { uploadMultiple, processImages } from "../middleware/upload";
import ResponseHelper from "../utils/ResponseHelper";
import { getSocketInstance } from "../services/socketService";

const router = express.Router();

// Get user's conversations
router.get(
  "/conversations",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const conversations = await Conversation.find({
        participants: new mongoose.Types.ObjectId(req.userId),
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
      return ResponseHelper.serverError(res, req, error.message);
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
      if (
        !conversation ||
        !conversation.participants.includes(
          new mongoose.Types.ObjectId(req.userId)
        )
      ) {
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
          senderId: { $ne: new mongoose.Types.ObjectId(req.userId) },
          readBy: { $ne: new mongoose.Types.ObjectId(req.userId) },
        },
        { $push: { readBy: new mongoose.Types.ObjectId(req.userId) } }
      );
      res.json({
        success: true,
        data: messages.reverse(), // Return in chronological order
      });
    } catch (error: any) {
      return ResponseHelper.serverError(res, req, error.message);
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
        participants: {
          $all: [
            new mongoose.Types.ObjectId(req.userId),
            new mongoose.Types.ObjectId(participantId),
          ],
        },
        taskId: taskId ? new mongoose.Types.ObjectId(taskId) : null,
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [
            new mongoose.Types.ObjectId(req.userId),
            new mongoose.Types.ObjectId(participantId),
          ],
          taskId: taskId ? new mongoose.Types.ObjectId(taskId) : null,
        });
        await conversation.save();
      }
      await conversation.populate("participants", "firstName lastName avatar");
      await conversation.populate("taskId", "title status");

      return ResponseHelper.success(
        res,
        req,
        "messages.conversationCreated",
        conversation
      );
    } catch (error: any) {
      return ResponseHelper.serverError(res, req, error.message);
    }
  }
);

// Send message to a conversation
router.post(
  "/conversations/:id/messages",
  authenticateToken,
  uploadMultiple,
  processImages,
  async (req: AuthRequest, res) => {
    try {
      const { content } = req.body;
      const conversationId = req.params.id;
      const images = req.body.images || [];

      // Validate input - either content or images must be provided
      if ((!content || !content.trim()) && images.length === 0) {
        return ResponseHelper.error(
          res,
          req,
          "messages.messageContentRequired",
          400
        );
      }

      // Check if user is participant in the conversation
      const conversation = await Conversation.findById(conversationId);
      if (
        !conversation ||
        !conversation.participants.includes(
          new mongoose.Types.ObjectId(req.userId)
        )
      ) {
        return ResponseHelper.forbidden(
          res,
          req,
          "messages.unauthorizedAccess"
        );
      } // Create the message
      const message = new Message({
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: new mongoose.Types.ObjectId(req.userId),
        content: content ? content.trim() : "",
        messageType: images.length > 0 ? "image" : "text",
        images: images,
      });

      await message.save();
      await message.populate("senderId", "firstName lastName avatar");

      // Update conversation's last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });

      // Emit real-time message via socket
      const io = getSocketInstance();
      if (io) {
        // Emit to conversation room for real-time updates
        io.to(`conversation_${conversationId}`).emit("newMessage", message); // Also emit to individual user rooms for notifications
        conversation.participants.forEach((participantId) => {
          const participantIdStr = participantId.toString();
          if (participantIdStr !== req.userId) {
            const senderName =
              (message.senderId as any)?.firstName &&
              (message.senderId as any)?.lastName
                ? `${(message.senderId as any).firstName} ${
                    (message.senderId as any).lastName
                  }`
                : "Unknown User";

            io.to(`user_${participantIdStr}`).emit("message_notification", {
              conversationId,
              message,
              senderName,
            });
          }
        });

        console.log(
          `Message emitted to conversation_${conversationId} and participant rooms`
        );
      } else {
        console.warn(
          "Socket instance not available for real-time message emission"
        );
      }

      return ResponseHelper.success(res, req, "messages.messageSent", message);
    } catch (error: any) {
      return ResponseHelper.serverError(res, req, error.message);
    }
  }
);

// Get unread message count for user
router.get(
  "/unread-count",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      // Get all conversations for the user
      const conversations = await Conversation.find({
        participants: new mongoose.Types.ObjectId(req.userId),
      });

      let totalUnreadCount = 0;
      const conversationCounts: { [key: string]: number } = {};

      // For each conversation, count unread messages
      for (const conversation of conversations) {
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: new mongoose.Types.ObjectId(req.userId) },
          readBy: { $ne: new mongoose.Types.ObjectId(req.userId) },
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
    } catch (error: any) {
      return ResponseHelper.serverError(res, req, error.message);
    }
  }
);

// Mark conversation messages as read
router.post(
  "/conversations/:id/mark-read",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const conversationId = req.params.id;

      // Verify user is participant in the conversation
      const conversation = await Conversation.findById(conversationId);
      if (
        !conversation ||
        !conversation.participants.includes(
          new mongoose.Types.ObjectId(req.userId)
        )
      ) {
        return ResponseHelper.forbidden(
          res,
          req,
          "messages.unauthorizedAccess"
        );
      }

      // Mark all messages in the conversation as read by this user
      await Message.updateMany(
        {
          conversationId: new mongoose.Types.ObjectId(conversationId),
          senderId: { $ne: new mongoose.Types.ObjectId(req.userId) },
          readBy: { $ne: new mongoose.Types.ObjectId(req.userId) },
        },
        { $push: { readBy: new mongoose.Types.ObjectId(req.userId) } }
      );
      res.json({
        success: true,
        data: { success: true },
      });
    } catch (error: any) {
      return ResponseHelper.serverError(res, req, error.message);
    }
  }
);

export default router;
