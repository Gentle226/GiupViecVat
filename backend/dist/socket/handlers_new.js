"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const adapter_1 = require("../data/adapter");
const setupSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        const user = socket.user;
        console.log(`User ${user.firstName} ${user.lastName} connected`);
        // Join user to their personal room
        socket.join(`user:${user._id}`);
        // Join conversation
        socket.on("join-conversation", async (conversationId) => {
            try {
                socket.join(`conversation:${conversationId}`);
                console.log(`User ${user._id} joined conversation ${conversationId}`);
            }
            catch (error) {
                console.error("Error joining conversation:", error);
            }
        });
        // Leave conversation
        socket.on("leave-conversation", (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
            console.log(`User ${user._id} left conversation ${conversationId}`);
        });
        // Send message
        socket.on("send-message", async (data) => {
            try {
                // Create message using database adapter
                const message = await adapter_1.db.createMessage({
                    conversationId: data.conversationId,
                    senderId: user._id,
                    content: data.content,
                });
                // Emit to all users in the conversation room
                io.to(`conversation:${data.conversationId}`).emit("new-message", message);
                console.log(`Message sent in conversation ${data.conversationId}`);
            }
            catch (error) {
                console.error("Error sending message:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });
        // Mark messages as read
        socket.on("mark-as-read", async (data) => {
            try {
                // Mark messages as read using database adapter
                // This would need to be implemented in the adapter
                console.log(`Messages marked as read in conversation ${data.conversationId}`);
            }
            catch (error) {
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
        socket.on("task-bid-submitted", (data) => {
            // Notify task owner
            socket.broadcast.emit("new-bid-notification", {
                taskId: data.taskId,
                bidId: data.bidId,
            });
        });
        socket.on("bid-accepted", (data) => {
            // Notify the tasker
            io.to(`user:${data.bidderId}`).emit("bid-accepted-notification", {
                taskId: data.taskId,
            });
        });
        socket.on("task-completed", (data) => {
            // Notify the client
            io.to(`user:${data.clientId}`).emit("task-completed-notification", {
                taskId: data.taskId,
            });
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=handlers_new.js.map