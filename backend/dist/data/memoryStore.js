"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryStore = exports.seedDemoData = exports.updatePayment = exports.getPaymentsByUser = exports.findPaymentById = exports.createPayment = exports.getReviewsByTask = exports.getReviewsByTasker = exports.createReview = exports.updateConversation = exports.getConversationsByUser = exports.findConversationById = exports.createConversation = exports.getMessagesByConversation = exports.createMessage = exports.deleteBid = exports.updateBid = exports.getBidsByTasker = exports.getBidsByTask = exports.findBidById = exports.createBid = exports.deleteTask = exports.updateTask = exports.getAllTasks = exports.findTaskById = exports.createTask = exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.findUserById = exports.findUserByEmail = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const types_1 = require("../types");
// In-memory storage
const users = [];
const tasks = [];
const bids = [];
const messages = [];
const conversations = [];
const reviews = [];
const payments = [];
// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);
// User operations
const createUser = async (userData) => {
    const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
    const user = {
        _id: generateId(),
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        rating: 0,
        completedTasks: 0,
    };
    users.push(user);
    return user;
};
exports.createUser = createUser;
const findUserByEmail = async (email) => {
    return users.find((user) => user.email === email) || null;
};
exports.findUserByEmail = findUserByEmail;
const findUserById = async (id) => {
    return users.find((user) => user._id === id) || null;
};
exports.findUserById = findUserById;
const getAllUsers = async () => {
    return users;
};
exports.getAllUsers = getAllUsers;
const updateUser = async (id, updates) => {
    const userIndex = users.findIndex((user) => user._id === id);
    if (userIndex === -1)
        return null;
    users[userIndex] = { ...users[userIndex], ...updates };
    return users[userIndex];
};
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    const userIndex = users.findIndex((user) => user._id === id);
    if (userIndex === -1)
        return false;
    users.splice(userIndex, 1);
    return true;
};
exports.deleteUser = deleteUser;
// Task operations
const createTask = async (taskData) => {
    const task = {
        _id: generateId(),
        ...taskData,
        createdAt: new Date(),
        status: types_1.TaskStatus.OPEN,
    };
    tasks.push(task);
    return task;
};
exports.createTask = createTask;
const findTaskById = async (id) => {
    const task = tasks.find((task) => task._id === id);
    if (!task)
        return null;
    // Populate user data for postedBy field
    const postedByUser = users.find((user) => user._id === task.postedBy);
    if (postedByUser) {
        return {
            ...task,
            postedBy: {
                _id: postedByUser._id,
                firstName: postedByUser.name.split(" ")[0] || "User",
                lastName: postedByUser.name.split(" ")[1] || "",
                rating: postedByUser.rating,
                reviewCount: postedByUser.completedTasks, // Using completedTasks as reviewCount approximation
                avatar: postedByUser.avatar,
            },
        };
    }
    return task;
};
exports.findTaskById = findTaskById;
const getAllTasks = async (filters) => {
    let filteredTasks = [...tasks];
    if (filters?.category) {
        filteredTasks = filteredTasks.filter((task) => task.category === filters.category);
    }
    if (filters?.status) {
        filteredTasks = filteredTasks.filter((task) => task.status === filters.status);
    }
    if (filters?.postedBy) {
        filteredTasks = filteredTasks.filter((task) => task.postedBy === filters.postedBy);
    }
    if (filters?.location) {
        filteredTasks = filteredTasks.filter((task) => task.location.toLowerCase().includes(filters.location.toLowerCase()));
    }
    // Populate user data for each task
    return filteredTasks.map((task) => {
        const postedByUser = users.find((user) => user._id === task.postedBy);
        if (postedByUser) {
            return {
                ...task,
                postedBy: {
                    _id: postedByUser._id,
                    firstName: postedByUser.name.split(" ")[0] || "User",
                    lastName: postedByUser.name.split(" ")[1] || "",
                    rating: postedByUser.rating,
                    reviewCount: postedByUser.completedTasks, // Using completedTasks as reviewCount approximation
                    avatar: postedByUser.avatar,
                },
            };
        }
        return task;
    });
};
exports.getAllTasks = getAllTasks;
const updateTask = async (id, updates) => {
    const taskIndex = tasks.findIndex((task) => task._id === id);
    if (taskIndex === -1)
        return null;
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    return tasks[taskIndex];
};
exports.updateTask = updateTask;
const deleteTask = async (id) => {
    const taskIndex = tasks.findIndex((task) => task._id === id);
    if (taskIndex === -1)
        return false;
    tasks.splice(taskIndex, 1);
    return true;
};
exports.deleteTask = deleteTask;
// Bid operations
const createBid = async (bidData) => {
    const bid = {
        _id: generateId(),
        ...bidData,
        createdAt: new Date(),
        status: types_1.BidStatus.PENDING,
    };
    bids.push(bid);
    return bid;
};
exports.createBid = createBid;
const findBidById = async (id) => {
    return bids.find((bid) => bid._id === id) || null;
};
exports.findBidById = findBidById;
const getBidsByTask = async (taskId) => {
    return bids.filter((bid) => bid.taskId === taskId);
};
exports.getBidsByTask = getBidsByTask;
const getBidsByTasker = async (taskerId) => {
    return bids.filter((bid) => bid.taskerId === taskerId);
};
exports.getBidsByTasker = getBidsByTasker;
const updateBid = async (id, updates) => {
    const bidIndex = bids.findIndex((bid) => bid._id === id);
    if (bidIndex === -1)
        return null;
    bids[bidIndex] = { ...bids[bidIndex], ...updates };
    return bids[bidIndex];
};
exports.updateBid = updateBid;
const deleteBid = async (id) => {
    const bidIndex = bids.findIndex((bid) => bid._id === id);
    if (bidIndex === -1)
        return false;
    bids.splice(bidIndex, 1);
    return true;
};
exports.deleteBid = deleteBid;
// Message operations
const createMessage = async (messageData) => {
    const message = {
        _id: generateId(),
        ...messageData,
        timestamp: new Date(),
    };
    messages.push(message);
    return message;
};
exports.createMessage = createMessage;
const getMessagesByConversation = async (conversationId) => {
    return messages
        .filter((message) => message.conversationId === conversationId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};
exports.getMessagesByConversation = getMessagesByConversation;
// Conversation operations
const createConversation = async (conversationData) => {
    const conversation = {
        _id: generateId(),
        ...conversationData,
        createdAt: new Date(),
        lastMessage: null,
    };
    conversations.push(conversation);
    return conversation;
};
exports.createConversation = createConversation;
const findConversationById = async (id) => {
    return conversations.find((conv) => conv._id === id) || null;
};
exports.findConversationById = findConversationById;
const getConversationsByUser = async (userId) => {
    return conversations.filter((conv) => conv.participants.includes(userId));
};
exports.getConversationsByUser = getConversationsByUser;
const updateConversation = async (id, updates) => {
    const convIndex = conversations.findIndex((conv) => conv._id === id);
    if (convIndex === -1)
        return null;
    conversations[convIndex] = { ...conversations[convIndex], ...updates };
    return conversations[convIndex];
};
exports.updateConversation = updateConversation;
// Review operations
const createReview = async (reviewData) => {
    const review = {
        _id: generateId(),
        ...reviewData,
        createdAt: new Date(),
    };
    reviews.push(review);
    return review;
};
exports.createReview = createReview;
const getReviewsByTasker = async (taskerId) => {
    return reviews.filter((review) => review.taskerId === taskerId);
};
exports.getReviewsByTasker = getReviewsByTasker;
const getReviewsByTask = async (taskId) => {
    return reviews.filter((review) => review.taskId === taskId);
};
exports.getReviewsByTask = getReviewsByTask;
// Payment operations
const createPayment = async (paymentData) => {
    const payment = {
        _id: generateId(),
        ...paymentData,
        createdAt: new Date(),
    };
    payments.push(payment);
    return payment;
};
exports.createPayment = createPayment;
const findPaymentById = async (id) => {
    return payments.find((payment) => payment._id === id) || null;
};
exports.findPaymentById = findPaymentById;
const getPaymentsByUser = async (userId) => {
    return payments.filter((payment) => payment.fromUserId === userId || payment.toUserId === userId);
};
exports.getPaymentsByUser = getPaymentsByUser;
const updatePayment = async (id, updates) => {
    const paymentIndex = payments.findIndex((payment) => payment._id === id);
    if (paymentIndex === -1)
        return null;
    payments[paymentIndex] = { ...payments[paymentIndex], ...updates };
    return payments[paymentIndex];
};
exports.updatePayment = updatePayment;
// Seed demo data
const seedDemoData = async () => {
    // Clear existing data
    users.length = 0;
    tasks.length = 0;
    bids.length = 0;
    messages.length = 0;
    conversations.length = 0;
    reviews.length = 0;
    payments.length = 0;
    // Create demo users
    const clientUser = await (0, exports.createUser)({
        name: "Demo Client",
        email: "client@demo.com",
        password: "password123",
        userType: types_1.UserType.CLIENT,
        phone: "+1234567890",
        location: "New York, NY",
    });
    const taskerUser = await (0, exports.createUser)({
        name: "Demo Tasker",
        email: "tasker@demo.com",
        password: "password123",
        userType: types_1.UserType.TASKER,
        phone: "+1234567891",
        location: "New York, NY",
        skills: ["Cleaning", "Handyman", "Moving"],
        hourlyRate: 25,
        availability: "Weekdays: 9AM-5PM, Weekends: 10AM-4PM",
    });
    // Create demo tasks
    const cleaningTask = await (0, exports.createTask)({
        title: "Deep Clean 2-Bedroom Apartment",
        description: "Need a thorough deep cleaning of my 2-bedroom apartment. Kitchen, bathrooms, living room, and bedrooms need attention. Approximately 3-4 hours of work.",
        category: types_1.TaskCategory.CLEANING,
        suggestedPrice: 150,
        location: "Manhattan, New York, NY",
        postedBy: clientUser._id,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        requirements: [
            "Bring own cleaning supplies",
            "Available on weekends",
            "Non-smoking",
        ],
    });
    const handymanTask = await (0, exports.createTask)({
        title: "Mount TV and Install Shelves",
        description: "Need someone to mount a 55-inch TV on the wall and install 3 floating shelves in the living room. All hardware provided.",
        category: types_1.TaskCategory.HANDYMAN,
        suggestedPrice: 100,
        location: "Brooklyn, New York, NY",
        postedBy: clientUser._id,
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        requirements: [
            "Own tools required",
            "Experience with TV mounting",
            "References preferred",
        ],
    });
    // Create demo bid
    await (0, exports.createBid)({
        taskId: cleaningTask._id,
        taskerId: taskerUser._id,
        amount: 140,
        estimatedDuration: 4,
        message: "Hi! I have 5 years of professional cleaning experience and can complete this job with high quality. I bring all eco-friendly supplies.",
    });
    console.log("Demo data seeded successfully!");
    console.log(`Client User: ${clientUser.email} (password: password123)`);
    console.log(`Tasker User: ${taskerUser.email} (password: password123)`);
};
exports.seedDemoData = seedDemoData;
// Export the complete memory store
exports.memoryStore = {
    // User operations
    createUser: exports.createUser,
    findUserByEmail: exports.findUserByEmail,
    findUserById: exports.findUserById,
    getAllUsers: exports.getAllUsers,
    updateUser: exports.updateUser,
    deleteUser: exports.deleteUser,
    // Task operations
    createTask: exports.createTask,
    findTaskById: exports.findTaskById,
    getAllTasks: exports.getAllTasks,
    updateTask: exports.updateTask,
    deleteTask: exports.deleteTask,
    // Bid operations
    createBid: exports.createBid,
    findBidById: exports.findBidById,
    getBidsByTask: exports.getBidsByTask,
    getBidsByTasker: exports.getBidsByTasker,
    updateBid: exports.updateBid,
    deleteBid: exports.deleteBid,
    // Message operations
    createMessage: exports.createMessage,
    getMessagesByConversation: exports.getMessagesByConversation,
    // Conversation operations
    createConversation: exports.createConversation,
    findConversationById: exports.findConversationById,
    getConversationsByUser: exports.getConversationsByUser,
    updateConversation: exports.updateConversation,
    // Review operations
    createReview: exports.createReview,
    getReviewsByTasker: exports.getReviewsByTasker,
    getReviewsByTask: exports.getReviewsByTask,
    // Payment operations
    createPayment: exports.createPayment,
    findPaymentById: exports.findPaymentById,
    getPaymentsByUser: exports.getPaymentsByUser,
    updatePayment: exports.updatePayment,
    // Utility
    seedDemoData: exports.seedDemoData,
};
// Default export
exports.default = exports.memoryStore;
//# sourceMappingURL=memoryStore.js.map