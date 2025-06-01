import { Server, Socket } from "socket.io";
import { db } from "../data/adapter";

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`User ${user.firstName} ${user.lastName} connected`);

    // Join user to their personal room
    socket.join(`user:${user._id}`);

    // Join conversation
    socket.on("join-conversation", async (conversationId: string) => {
      try {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${user._id} joined conversation ${conversationId}`);
      } catch (error) {
        console.error("Error joining conversation:", error);
      }
    });

    // Leave conversation
    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${user._id} left conversation ${conversationId}`);
    });

    // Send message
    socket.on(
      "send-message",
      async (data: { conversationId: string; content: string }) => {
        try {
          // Create message using database adapter
          const message = await db.createMessage({
            conversationId: data.conversationId,
            senderId: user._id,
            content: data.content,
          });

          // Emit to all users in the conversation room
          io.to(`conversation:${data.conversationId}`).emit(
            "new-message",
            message
          );

          console.log(`Message sent in conversation ${data.conversationId}`);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Mark messages as read
    socket.on("mark-as-read", async (data: { conversationId: string }) => {
      try {
        // Mark messages as read using database adapter
        // This would need to be implemented in the adapter
        console.log(
          `Messages marked as read in conversation ${data.conversationId}`
        );
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${user.firstName} ${user.lastName} disconnected`);
    });

    // Handle user online/offline status
    socket.on("user-online", () => {
      socket.broadcast.emit("user-status-change", {
        userId: user._id,
        isOnline: true,
      });
    });

    socket.on("user-offline", () => {
      socket.broadcast.emit("user-status-change", {
        userId: user._id,
        isOnline: false,
      });
    });

    // Task updates
    socket.on(
      "task-bid-submitted",
      (data: { taskId: string; bidId: string }) => {
        // Notify task owner
        socket.broadcast.emit("new-bid-notification", {
          taskId: data.taskId,
          bidId: data.bidId,
        });
      }
    );

    socket.on("bid-accepted", (data: { taskId: string; bidderId: string }) => {
      // Notify the tasker
      io.to(`user:${data.bidderId}`).emit("bid-accepted-notification", {
        taskId: data.taskId,
      });
    });

    socket.on(
      "task-completed",
      (data: { taskId: string; clientId: string }) => {
        // Notify the client
        io.to(`user:${data.clientId}`).emit("task-completed-notification", {
          taskId: data.taskId,
        });
      }
    );
  });
};
