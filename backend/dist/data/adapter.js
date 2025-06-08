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
// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
class DatabaseAdapter {
    constructor() {
        this.useMemoryStore = false;
    }
    async initialize() {
        try {
            // Try to connect to MongoDB
            await mongoose_1.default.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/giupviecvat");
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
    } // User operations
    async createUser(userData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createUser(userData);
        } // For MongoDB, ensure we have the correct field format
        const mongoUserData = {
            ...userData,
            isTasker: userData.isTasker !== undefined
                ? userData.isTasker
                : userData.userType === "tasker",
        };
        delete mongoUserData.userType; // Remove userType as MongoDB uses isTasker
        const user = new Models.User(mongoUserData);
        const savedUser = await user.save();
        return savedUser;
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
            }
            // Apply location filtering
            if (filter.location) {
                const { lat, lng, radius } = filter.location;
                tasks = tasks.filter((task) => {
                    if (!task.location?.coordinates)
                        return false;
                    const [taskLng, taskLat] = task.location.coordinates;
                    const distance = calculateDistance(lat, lng, taskLat, taskLng);
                    return distance <= radius;
                });
            }
            // Apply sorting
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
        // MongoDB queries - create base filter excluding location for now
        const mongoFilter = { ...filter };
        const locationFilter = mongoFilter.location;
        delete mongoFilter.location;
        let query = Models.Task.find(mongoFilter);
        // Apply search
        if (options.search) {
            query = query.find({
                $or: [
                    { title: { $regex: options.search, $options: "i" } },
                    { description: { $regex: options.search, $options: "i" } },
                ],
            });
        }
        // Apply location filtering using MongoDB's geospatial queries
        if (locationFilter) {
            const { lat, lng, radius } = locationFilter;
            query = query.find({
                "location.coordinates": {
                    $geoWithin: {
                        $centerSphere: [[lng, lat], radius / 6371], // radius in radians (Earth radius = 6371 km)
                    },
                },
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
        let countQuery = Models.Task.find(mongoFilter);
        if (options.search) {
            countQuery = countQuery.find({
                $or: [
                    { title: { $regex: options.search, $options: "i" } },
                    { description: { $regex: options.search, $options: "i" } },
                ],
            });
        }
        if (locationFilter) {
            const { lat, lng, radius } = locationFilter;
            countQuery = countQuery.find({
                "location.coordinates": {
                    $geoWithin: {
                        $centerSphere: [[lng, lat], radius / 6371],
                    },
                },
            });
        }
        const [tasks, total] = await Promise.all([
            query
                .populate("postedBy", "firstName lastName rating reviewCount avatar")
                .skip(skip)
                .limit(limit),
            countQuery.countDocuments(),
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
        return await Models.Task.findById(id).populate("postedBy", "firstName lastName rating reviewCount avatar");
    }
    async updateTask(id, updates) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.updateTask(id, updates);
        }
        return await Models.Task.findByIdAndUpdate(id, updates, { new: true });
    }
    async deleteTask(id) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.deleteTask(id);
        }
        return await Models.Task.findByIdAndDelete(id);
    }
    // Bid operations
    async createBid(bidData) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.createBid(bidData);
        }
        const bid = new Models.Bid(bidData);
        await bid.save();
        // Populate the bid with user information
        await bid.populate("bidderId", "firstName lastName rating reviewCount avatar bio skills");
        return bid;
    }
    async findBidsByTask(taskId) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.getBidsByTask(taskId);
        }
        return await Models.Bid.find({ taskId }).populate("bidderId", "firstName lastName rating reviewCount avatar bio skills");
    }
    async findBidsByTaskRaw(taskId) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.getBidsByTaskRaw(taskId);
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
    async findConversationByParticipantsAndTask(participant1, participant2, taskId) {
        if (this.useMemoryStore) {
            return await memoryStore_1.memoryStore.findConversationByParticipantsAndTask(participant1, participant2, taskId);
        }
        if (taskId) {
            return await Models.Conversation.findOne({
                participants: { $all: [participant1, participant2] },
                taskId: taskId,
            });
        }
        else {
            return await Models.Conversation.findOne({
                participants: { $all: [participant1, participant2] },
                taskId: null,
            });
        }
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