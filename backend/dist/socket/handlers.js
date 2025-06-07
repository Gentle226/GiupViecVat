"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const adapter_1 = require("../data/adapter");
const auth_1 = require("../middleware/auth");
const setupSocketHandlers = (io) => {
    // Authentication middleware for socket connections
    io.use(auth_1.authenticateSocket);
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user?.userId}`);
        // Join user to their own room for private messages
        const userId = socket.user?.userId;
        if (userId) {
            socket.join(`user_${userId}`);
        }
        // Handle joining conversation rooms
        socket.on("join_conversation", (conversationId) => {
            socket.join(`conversation_${conversationId}`);
            console.log(`User ${userId} joined conversation ${conversationId}`);
        }); // Handle leaving conversation rooms
        socket.on("leave_conversation", (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
            console.log(`User ${userId} left conversation ${conversationId}`);
        });
        // Handle sending messages
        socket.on("sendMessage", async (data) => {
            try {
                const { conversationId, content, messageType = "text" } = data;
                // Verify user is participant in conversation
                const conversation = await adapter_1.db.findConversationById(conversationId);
                if (!conversation || !conversation.participants.includes(userId)) {
                    socket.emit("error", {
                        message: "Unauthorized to send message to this conversation",
                    });
                    return;
                } // Create message
                const message = await adapter_1.db.createMessage({
                    conversationId,
                    senderId: userId,
                    content,
                    messageType,
                });
                console.log('Created message:', message);
                console.log('Message ID:', message._id);
                // Update conversation's last message
                await adapter_1.db.updateConversation(conversationId, {
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
                            senderName: socket.user?.name || "Unknown User",
                        });
                    }
                });
            }
            catch (error) {
                console.error("Error sending message:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });
        // Handle typing indicators
        socket.on("typing_start", (conversationId) => {
            socket.to(`conversation_${conversationId}`).emit("user_typing", {
                userId,
                userName: socket.user?.name || "Unknown User",
            });
        });
        socket.on("typing_stop", (conversationId) => {
            socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
                userId,
            });
        });
        // Handle task updates (for real-time notifications)
        socket.on("task_update", async (data) => {
            try {
                const { taskId, type, details } = data;
                const task = await adapter_1.db.findTaskById(taskId);
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
            }
            catch (error) {
                console.error("Error handling task update:", error);
                socket.emit("error", { message: "Failed to process task update" });
            }
        });
        // Handle bid notifications
        socket.on("new_bid", async (data) => {
            try {
                const { taskId, bidId } = data;
                const task = await adapter_1.db.findTaskById(taskId);
                const bid = await adapter_1.db.findBidById(bidId);
                if (!task || !bid) {
                    socket.emit("error", { message: "Task or bid not found" });
                    return;
                }
                // Notify task owner about new bid
                io.to(`user_${task.postedBy}`).emit("new_bid_notification", {
                    taskId,
                    taskTitle: task.title,
                    bid,
                    bidderName: socket.user?.name || "Unknown User",
                });
            }
            catch (error) {
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
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=handlers.js.map