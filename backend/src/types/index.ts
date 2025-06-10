// Copy of shared types for backend use
export interface User {
  _id: string;
  email: string;
  password: string; // Only in backend
  name: string; // Combined firstName/lastName or just name
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  googleId?: string; // Google OAuth ID
  emailVerified?: boolean; // Email verification status
  userType: UserType;
  rating: number;
  reviewCount?: number;
  completedTasks: number;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  availability?: string;
  location: string; // Simplified to string for now
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: TaskCategory;
  location: string | { address: string; coordinates: [number, number] }; // Support both string and object
  locationType?: LocationType; // Add this field
  suggestedPrice: number;
  status: TaskStatus;
  postedBy: string; // User ID
  assignedTo?: string; // User ID
  createdAt: Date;
  updatedAt?: Date;
  scheduledDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  requirements?: string[];
  // New timing fields
  timingType: TimingType;
  specificDate?: Date;
  timeOfDay?: TimeOfDay[];
  needsSpecificTime: boolean;
}

export interface Bid {
  _id: string;
  taskId: string;
  bidderId: string; // User ID
  amount: number;
  message: string;
  estimatedDuration: number; // in hours
  status: BidStatus;
  createdAt: Date;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  readBy: string[]; // User IDs who have read the message
}

export interface Conversation {
  _id: string;
  participants: string[]; // User IDs
  taskId?: string; // Optional task reference
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  _id: string;
  taskId: string;
  taskerId: string; // User ID being reviewed
  reviewerId: string; // User ID
  revieweeId: string; // User ID
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}

export interface Payment {
  _id: string;
  taskId: string;
  fromUserId: string; // User ID (payer)
  toUserId: string; // User ID (payee)
  payerId: string; // User ID
  payeeId: string; // User ID
  amount: number;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export enum TaskCategory {
  HOUSEHOLD = "household",
  TECH = "tech",
  TRANSPORTATION = "transportation",
  REPAIRS = "repairs",
  CLEANING = "cleaning",
  GARDENING = "gardening",
  MOVING = "moving",
  HANDYMAN = "handyman",
  OTHER = "other",
}

export enum TimingType {
  ON_DATE = "on_date",
  BEFORE_DATE = "before_date",
  FLEXIBLE = "flexible",
}

export enum TimeOfDay {
  MORNING = "morning",
  MIDDAY = "midday",
  AFTERNOON = "afternoon",
  EVENING = "evening",
}

export enum LocationType {
  IN_PERSON = "in_person",
  ONLINE = "online",
}

export enum TaskStatus {
  OPEN = "open",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum BidStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum UserType {
  CLIENT = "client",
  TASKER = "tasker",
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isTasker: boolean;
  location: {
    address: string;
    coordinates: [number, number];
  };
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  category: TaskCategory;
  location: {
    address: string;
    coordinates: [number, number];
  };
  suggestedPrice: number;
  dueDate?: Date;
  // New timing fields
  timingType: TimingType;
  specificDate?: Date;
  timeOfDay?: TimeOfDay;
  needsSpecificTime: boolean;
}

export interface CreateBidRequest {
  taskId: string;
  amount: number;
  message: string;
  estimatedDuration: number;
}

// Database interfaces for operations
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "client" | "tasker";
  location: {
    address: string;
    coordinates: [number, number];
  };
  avatar?: string;
  bio?: string;
  skills?: string[];
}
