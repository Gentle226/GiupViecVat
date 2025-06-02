import bcrypt from "bcryptjs";
import {
  User,
  Task,
  Bid,
  Message,
  Conversation,
  Review,
  Payment,
  UserType,
  TaskStatus,
  TaskCategory,
  BidStatus,
  PaymentStatus,
} from "../types";

// In-memory storage
const users: User[] = [];
const tasks: Task[] = [];
const bids: Bid[] = [];
const messages: Message[] = [];
const conversations: Conversation[] = [];
const reviews: Review[] = [];
const payments: Payment[] = [];

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// User operations
export const createUser = async (
  userData: Omit<User, "_id" | "createdAt" | "rating" | "completedTasks">
): Promise<User> => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user: User = {
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

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return users.find((user) => user.email === email) || null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  return users.find((user) => user._id === id) || null;
};

export const getAllUsers = async (): Promise<User[]> => {
  return users;
};

export const updateUser = async (
  id: string,
  updates: Partial<User>
): Promise<User | null> => {
  const userIndex = users.findIndex((user) => user._id === id);
  if (userIndex === -1) return null;

  users[userIndex] = { ...users[userIndex], ...updates };
  return users[userIndex];
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const userIndex = users.findIndex((user) => user._id === id);
  if (userIndex === -1) return false;

  users.splice(userIndex, 1);
  return true;
};

// Task operations
export const createTask = async (
  taskData: Omit<Task, "_id" | "createdAt" | "status">
): Promise<Task> => {
  const task: Task = {
    _id: generateId(),
    ...taskData,
    createdAt: new Date(),
    status: TaskStatus.OPEN,
  };
  tasks.push(task);
  return task;
};

export const findTaskById = async (id: string): Promise<Task | null> => {
  const task = tasks.find((task) => task._id === id);
  if (!task) return null;

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
      } as any,
    };
  }

  return task;
};

export const getAllTasks = async (filters?: any): Promise<Task[]> => {
  let filteredTasks = [...tasks];

  if (filters?.category) {
    filteredTasks = filteredTasks.filter(
      (task) => task.category === filters.category
    );
  }

  if (filters?.status) {
    filteredTasks = filteredTasks.filter(
      (task) => task.status === filters.status
    );
  }

  if (filters?.postedBy) {
    filteredTasks = filteredTasks.filter(
      (task) => task.postedBy === filters.postedBy
    );
  }

  if (filters?.location) {
    filteredTasks = filteredTasks.filter((task) =>
      task.location.toLowerCase().includes(filters.location.toLowerCase())
    );
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
        } as any,
      };
    }
    return task;
  });
};

export const updateTask = async (
  id: string,
  updates: Partial<Task>
): Promise<Task | null> => {
  const taskIndex = tasks.findIndex((task) => task._id === id);
  if (taskIndex === -1) return null;

  tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
  return tasks[taskIndex];
};

export const deleteTask = async (id: string): Promise<boolean> => {
  const taskIndex = tasks.findIndex((task) => task._id === id);
  if (taskIndex === -1) return false;

  tasks.splice(taskIndex, 1);
  return true;
};

// Bid operations
export const createBid = async (
  bidData: Omit<Bid, "_id" | "createdAt" | "status">
): Promise<Bid> => {
  const bid: Bid = {
    _id: generateId(),
    ...bidData,
    createdAt: new Date(),
    status: BidStatus.PENDING,
  };
  bids.push(bid);
  return bid;
};

export const findBidById = async (id: string): Promise<Bid | null> => {
  return bids.find((bid) => bid._id === id) || null;
};

export const getBidsByTask = async (taskId: string): Promise<Bid[]> => {
  return bids.filter((bid) => bid.taskId === taskId);
};

export const getBidsByTasker = async (taskerId: string): Promise<Bid[]> => {
  return bids.filter((bid) => bid.taskerId === taskerId);
};

export const updateBid = async (
  id: string,
  updates: Partial<Bid>
): Promise<Bid | null> => {
  const bidIndex = bids.findIndex((bid) => bid._id === id);
  if (bidIndex === -1) return null;

  bids[bidIndex] = { ...bids[bidIndex], ...updates };
  return bids[bidIndex];
};

export const deleteBid = async (id: string): Promise<boolean> => {
  const bidIndex = bids.findIndex((bid) => bid._id === id);
  if (bidIndex === -1) return false;

  bids.splice(bidIndex, 1);
  return true;
};

// Message operations
export const createMessage = async (
  messageData: Omit<Message, "_id" | "timestamp">
): Promise<Message> => {
  const message: Message = {
    _id: generateId(),
    ...messageData,
    timestamp: new Date(),
  };
  messages.push(message);
  return message;
};

export const getMessagesByConversation = async (
  conversationId: string
): Promise<Message[]> => {
  return messages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

// Conversation operations
export const createConversation = async (
  conversationData: Omit<Conversation, "_id" | "createdAt" | "lastMessage">
): Promise<Conversation> => {
  const conversation: Conversation = {
    _id: generateId(),
    ...conversationData,
    createdAt: new Date(),
    lastMessage: null,
  };
  conversations.push(conversation);
  return conversation;
};

export const findConversationById = async (
  id: string
): Promise<Conversation | null> => {
  return conversations.find((conv) => conv._id === id) || null;
};

export const getConversationsByUser = async (
  userId: string
): Promise<Conversation[]> => {
  return conversations.filter((conv) => conv.participants.includes(userId));
};

export const updateConversation = async (
  id: string,
  updates: Partial<Conversation>
): Promise<Conversation | null> => {
  const convIndex = conversations.findIndex((conv) => conv._id === id);
  if (convIndex === -1) return null;

  conversations[convIndex] = { ...conversations[convIndex], ...updates };
  return conversations[convIndex];
};

// Review operations
export const createReview = async (
  reviewData: Omit<Review, "_id" | "createdAt">
): Promise<Review> => {
  const review: Review = {
    _id: generateId(),
    ...reviewData,
    createdAt: new Date(),
  };
  reviews.push(review);
  return review;
};

export const getReviewsByTasker = async (
  taskerId: string
): Promise<Review[]> => {
  return reviews.filter((review) => review.taskerId === taskerId);
};

export const getReviewsByTask = async (taskId: string): Promise<Review[]> => {
  return reviews.filter((review) => review.taskId === taskId);
};

// Payment operations
export const createPayment = async (
  paymentData: Omit<Payment, "_id" | "createdAt">
): Promise<Payment> => {
  const payment: Payment = {
    _id: generateId(),
    ...paymentData,
    createdAt: new Date(),
  };
  payments.push(payment);
  return payment;
};

export const findPaymentById = async (id: string): Promise<Payment | null> => {
  return payments.find((payment) => payment._id === id) || null;
};

export const getPaymentsByUser = async (userId: string): Promise<Payment[]> => {
  return payments.filter(
    (payment) => payment.fromUserId === userId || payment.toUserId === userId
  );
};

export const updatePayment = async (
  id: string,
  updates: Partial<Payment>
): Promise<Payment | null> => {
  const paymentIndex = payments.findIndex((payment) => payment._id === id);
  if (paymentIndex === -1) return null;

  payments[paymentIndex] = { ...payments[paymentIndex], ...updates };
  return payments[paymentIndex];
};

// Seed demo data
export const seedDemoData = async () => {
  // Clear existing data
  users.length = 0;
  tasks.length = 0;
  bids.length = 0;
  messages.length = 0;
  conversations.length = 0;
  reviews.length = 0;
  payments.length = 0;

  // Create demo users
  const clientUser = await createUser({
    name: "Demo Client",
    email: "client@demo.com",
    password: "password123",
    userType: UserType.CLIENT,
    phone: "+1234567890",
    location: "New York, NY",
  });

  const taskerUser = await createUser({
    name: "Demo Tasker",
    email: "tasker@demo.com",
    password: "password123",
    userType: UserType.TASKER,
    phone: "+1234567891",
    location: "New York, NY",
    skills: ["Cleaning", "Handyman", "Moving"],
    hourlyRate: 25,
    availability: "Weekdays: 9AM-5PM, Weekends: 10AM-4PM",
  });

  // Create demo tasks
  const cleaningTask = await createTask({
    title: "Deep Clean 2-Bedroom Apartment",
    description:
      "Need a thorough deep cleaning of my 2-bedroom apartment. Kitchen, bathrooms, living room, and bedrooms need attention. Approximately 3-4 hours of work.",
    category: TaskCategory.CLEANING,
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

  const handymanTask = await createTask({
    title: "Mount TV and Install Shelves",
    description:
      "Need someone to mount a 55-inch TV on the wall and install 3 floating shelves in the living room. All hardware provided.",
    category: TaskCategory.HANDYMAN,
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
  await createBid({
    taskId: cleaningTask._id,
    taskerId: taskerUser._id,
    amount: 140,
    estimatedDuration: 4,
    message:
      "Hi! I have 5 years of professional cleaning experience and can complete this job with high quality. I bring all eco-friendly supplies.",
  });

  console.log("Demo data seeded successfully!");
  console.log(`Client User: ${clientUser.email} (password: password123)`);
  console.log(`Tasker User: ${taskerUser.email} (password: password123)`);
};

// Export the complete memory store
export const memoryStore = {
  // User operations
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  updateUser,
  deleteUser,

  // Task operations
  createTask,
  findTaskById,
  getAllTasks,
  updateTask,
  deleteTask,

  // Bid operations
  createBid,
  findBidById,
  getBidsByTask,
  getBidsByTasker,
  updateBid,
  deleteBid,

  // Message operations
  createMessage,
  getMessagesByConversation,

  // Conversation operations
  createConversation,
  findConversationById,
  getConversationsByUser,
  updateConversation,

  // Review operations
  createReview,
  getReviewsByTasker,
  getReviewsByTask,

  // Payment operations
  createPayment,
  findPaymentById,
  getPaymentsByUser,
  updatePayment,

  // Utility
  seedDemoData,
};

// Default export
export default memoryStore;
