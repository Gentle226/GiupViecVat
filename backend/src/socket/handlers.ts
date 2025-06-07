import { Server, Socket } from "socket.io";
import { db } from "../data/adapter";
import { authenticateSocket } from "../middleware/auth";

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(authenticateSocket);
  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).user?.userId;
    console.log(`=== SOCKET CONNECTION DEBUG ===`);
    console.log(`User connected: ${userId}`);

    // Join user to their own room for private messages
    if (userId) {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`User ${userId} joined room: ${room}`);

      // Log all rooms this socket is in
      console.log(`Socket rooms for user ${userId}:`, Array.from(socket.rooms));
    } else {
      console.error("No userId found in socket connection!");
    }

    // Handle joining conversation rooms
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    }); // Handle leaving conversation rooms
    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on(
      "sendMessage",
      async (data: {
        conversationId: string;
        content: string;
        messageType?: "text" | "image" | "file";
      }) => {
        try {
          const { conversationId, content, messageType = "text" } = data;

          // Verify user is participant in conversation
          const conversation = await db.findConversationById(conversationId);
          if (!conversation || !conversation.participants.includes(userId)) {
            socket.emit("error", {
              message: "Unauthorized to send message to this conversation",
            });
            return;
          } // Create message
          const message = await db.createMessage({
            conversationId,
            senderId: userId,
            content,
            messageType,
          });

          console.log("Created message:", message);
          console.log("Message ID:", message._id);

          // Update conversation's last message
          await db.updateConversation(conversationId, {
            lastMessage: message._id,
          });

          // Emit message to all participants in the conversation
          io.to(`conversation_${conversationId}`).emit("newMessage", message);

          // Also emit to individual user rooms for notifications
          conversation.participants.forEach((participantId) => {
            if (participantId !== userId) {
              io.to(`user_${participantId}`).emit("message_notification", {
                conversationId,
                message,
                senderName: (socket as any).user?.name || "Unknown User",
              });
            }
          });
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Handle typing indicators
    socket.on("typing_start", (conversationId: string) => {
      socket.to(`conversation_${conversationId}`).emit("user_typing", {
        userId,
        userName: (socket as any).user?.name || "Unknown User",
      });
    });

    socket.on("typing_stop", (conversationId: string) => {
      socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
        userId,
      });
    });

    // Handle task updates (for real-time notifications)
    socket.on(
      "task_update",
      async (data: {
        taskId: string;
        type: "new_bid" | "bid_accepted" | "task_completed" | "status_change";
        details?: any;
      }) => {
        try {
          const { taskId, type, details } = data;

          const task = await db.findTaskById(taskId);
          if (!task) {
            socket.emit("error", { message: "Task not found" });
            return;
          }

          // Emit to task owner
          io.to(`user_${task.postedBy}`).emit("task_notification", {
            type,
            taskId,
            taskTitle: task.title,
            details,
          });

          // If it's a bid-related update, also notify the bidder
          if (type === "bid_accepted" && details?.bidderId) {
            io.to(`user_${details.bidderId}`).emit("bid_notification", {
              type: "accepted",
              taskId,
              taskTitle: task.title,
              details,
            });
          }
        } catch (error) {
          console.error("Error handling task update:", error);
          socket.emit("error", { message: "Failed to process task update" });
        }
      }
    );

    // Handle bid notifications
    socket.on("new_bid", async (data: { taskId: string; bidId: string }) => {
      try {
        const { taskId, bidId } = data;

        const task = await db.findTaskById(taskId);
        const bid = await db.findBidById(bidId);

        if (!task || !bid) {
          socket.emit("error", { message: "Task or bid not found" });
          return;
        }

        // Notify task owner about new bid
        io.to(`user_${task.postedBy}`).emit("new_bid_notification", {
          taskId,
          taskTitle: task.title,
          bid,
          bidderName: (socket as any).user?.name || "Unknown User",
        });
      } catch (error) {
        console.error("Error handling new bid notification:", error);
        socket.emit("error", { message: "Failed to process bid notification" });
      }
    });

    // Handle user presence
    socket.on("user_online", () => {
      socket.broadcast.emit("user_status", {
        userId,
        status: "online",
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      socket.broadcast.emit("user_status", {
        userId,
        status: "offline",
      });
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
};
