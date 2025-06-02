export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isTasker: boolean;
  rating: number;
  reviewCount: number;
  bio?: string;
  skills?: string[];
  location: {
    address: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  category: TaskCategory;
  location: {
    address: string;
    coordinates: [number, number];
  };
  suggestedPrice: number;
  status: TaskStatus;
  postedBy: string | PopulatedUser; // User ID or populated user data
  assignedTo?: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

export interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
  rating: number;
  reviewCount: number;
  avatar?: string;
}

export interface TaskBid {
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
  reviewerId: string; // User ID
  revieweeId: string; // User ID
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
}

export interface Payment {
  _id: string;
  taskId: string;
  payerId: string; // User ID
  payeeId: string; // User ID
  amount: number;
  status: PaymentStatus;
  stripePaymentIntentId: string;
  createdAt: Date;
  completedAt?: Date;
}

export const TaskCategory = {
  HOUSEHOLD: "household",
  TECH: "tech",
  TRANSPORTATION: "transportation",
  REPAIRS: "repairs",
  CLEANING: "cleaning",
  GARDENING: "gardening",
  MOVING: "moving",
  HANDYMAN: "handyman",
  OTHER: "other",
} as const;

export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

export const TaskStatus = {
  OPEN: "open",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const BidStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
} as const;

export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus];

export const PaymentStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

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
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  location?: {
    address: string;
    coordinates: [number, number];
  };
  suggestedPrice?: number;
  dueDate?: Date;
  status?: TaskStatus;
}

export interface CreateBidRequest {
  taskId: string;
  amount: number;
  message: string;
  estimatedDuration: number;
}

export const UserType = {
  CLIENT: "client",
  TASKER: "tasker",
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];
