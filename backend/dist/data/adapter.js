"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DatabaseAdapter = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const memoryStore_1 = require("./memoryStore");
const Models = __importStar(require("../models"));
class DatabaseAdapter {
    constructor() {
        this.useMemoryStore = false;
    }
    async initialize() {
        try {
            // Force memory store for testing
            throw new Error("Using memory store for testing");
            // Try to connect to MongoDB
            await mongoose_1.default.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/homeeasy");
            console.log("Connected to MongoDB");
            this.useMemoryStore = false;
        }
        catch (error) {
            console.warn("MongoDB connection failed, falling back to memory store");
            console.warn("Error:", error);
            this.useMemoryStore = true;
            // Seed demo data for memory store
            await memoryStore_1.memoryStore.seedDemoData();
        }
    }
    // User operations
    async createUser(userData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createUser(userData);
        }
        const user = new Models.User(userData);
        return await user.save();
    }
    async findUserByEmail(email) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.findUserByEmail(email);
        }
        return await Models.User.findOne({ email });
    }
    async findUserById(id) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.findUserById(id);
        }
        return await Models.User.findById(id);
    }
    async updateUser(id, updates) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.updateUser(id, updates);
        }
        return await Models.User.findByIdAndUpdate(id, updates, { new: true });
    }
    // Task operations
    async createTask(taskData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createTask(taskData);
        }
        const task = new Models.Task(taskData);
        return await task.save();
    }
    async findTasks(filter = {}, options = {}) {
        if (this.useMemoryStore) {
            let tasks = await memoryStore_1.memoryStore.getAllTasks(filter);
            // Apply search
            if (options.search) {
                tasks = tasks.filter((task) => task.title.toLowerCase().includes(options.search.toLowerCase()) ||
                    task.description
                        .toLowerCase()
                        .includes(options.search.toLowerCase()));
            } // Apply sorting
            if (options.sort) {
                tasks.sort((a, b) => {
                    if (options.sort === "createdAt") {
                        return (new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime());
                    }
                    if (options.sort === "budget") {
                        return options.sortOrder === "asc"
                            ? a.suggestedPrice - b.suggestedPrice
                            : b.suggestedPrice - a.suggestedPrice;
                    }
                    return 0;
                });
            }
            // Apply pagination
            const startIndex = ((options.page || 1) - 1) * (options.limit || 10);
            const endIndex = startIndex + (options.limit || 10);
            return {
                tasks: tasks.slice(startIndex, endIndex),
                total: tasks.length,
                page: options.page || 1,
                totalPages: Math.ceil(tasks.length / (options.limit || 10)),
            };
        }
        let query = Models.Task.find(filter);
        // Apply search
        if (options.search) {
            query = query.find({
                $or: [
                    { title: { $regex: options.search, $options: "i" } },
                    { description: { $regex: options.search, $options: "i" } },
                ],
            });
        }
        // Apply sorting
        if (options.sort) {
            const sortOrder = options.sortOrder === "asc" ? 1 : -1;
            query = query.sort({ [options.sort]: sortOrder });
        }
        // Apply pagination
        const page = options.page || 1;
        const limit = options.limit || 10;
        const skip = (page - 1) * limit;
        const [tasks, total] = await Promise.all([
            query.skip(skip).limit(limit),
            Models.Task.countDocuments(filter),
        ]);
        return {
            tasks,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findTaskById(id) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.findTaskById(id);
        }
        return await Models.Task.findById(id);
    }
    async updateTask(id, updates) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.updateTask(id, updates);
        }
        return await Models.Task.findByIdAndUpdate(id, updates, { new: true });
    }
    // Bid operations
    async createBid(bidData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createBid(bidData);
        }
        const bid = new Models.Bid(bidData);
        return await bid.save();
    }
    async findBidsByTask(taskId) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.getBidsByTask(taskId);
        }
        return await Models.Bid.find({ taskId });
    }
    async findBidById(id) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.findBidById(id);
        }
        return await Models.Bid.findById(id);
    }
    async updateBid(id, updates) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.updateBid(id, updates);
        }
        return await Models.Bid.findByIdAndUpdate(id, updates, { new: true });
    }
    // Message operations
    async createMessage(messageData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createMessage(messageData);
        }
        const message = new Models.Message(messageData);
        return await message.save();
    }
    async findMessagesByConversation(conversationId) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.getMessagesByConversation(conversationId);
        }
        return await Models.Message.find({ conversationId }).sort({ createdAt: 1 });
    }
    // Conversation operations
    async createConversation(conversationData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createConversation(conversationData);
        }
        const conversation = new Models.Conversation(conversationData);
        return await conversation.save();
    }
    async findConversationsByUser(userId) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.getConversationsByUser(userId);
        }
        return await Models.Conversation.find({ participants: userId });
    }
    async findConversationById(id) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.findConversationById(id);
        }
        return await Models.Conversation.findById(id);
    }
    async updateConversation(id, updates) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.updateConversation(id, updates);
        }
        return await Models.Conversation.findByIdAndUpdate(id, updates, {
            new: true,
        });
    }
    // Review operations
    async createReview(reviewData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createReview(reviewData);
        }
        const review = new Models.Review(reviewData);
        return await review.save();
    }
    async findReviewsByUser(userId) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.getReviewsByTasker(userId);
        }
        return await Models.Review.find({ revieweeId: userId });
    }
    // Payment operations
    async createPayment(paymentData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createPayment(paymentData);
        }
        const payment = new Models.Payment(paymentData);
        return await payment.save();
    }
    async findPaymentsByTask(taskId) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.getPaymentsByUser(taskId);
        }
        return await Models.Payment.find({ taskId });
    }
}
exports.DatabaseAdapter = DatabaseAdapter;
exports.db = new DatabaseAdapter();
//# sourceMappingURL=adapter.js.map