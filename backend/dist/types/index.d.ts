export interface User {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    userType: "client" | "tasker";
    rating: number;
    reviewCount: number;
    bio?: string;
    skills?: string[];
    location: {
        address: string;
        coordinates: [number, number];
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
    postedBy: string;
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
    completedAt?: Date;
}
export interface Bid {
    _id: string;
    taskId: string;
    bidderId: string;
    amount: number;
    message: string;
    estimatedDuration: number;
    status: BidStatus;
    createdAt: Date;
}
export interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: Date;
    readBy: string[];
}
export interface Conversation {
    _id: string;
    participants: string[];
    taskId?: string;
    lastMessage?: Message;
    createdAt: Date;
    updatedAt: Date;
}
export interface Review {
    _id: string;
    taskId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment: string;
    createdAt: Date;
}
export interface Payment {
    _id: string;
    taskId: string;
    payerId: string;
    payeeId: string;
    amount: number;
    status: PaymentStatus;
    stripePaymentIntentId: string;
    createdAt: Date;
    completedAt?: Date;
}
export declare enum TaskCategory {
    HOUSEHOLD = "household",
    TECH = "tech",
    TRANSPORTATION = "transportation",
    REPAIRS = "repairs",
    CLEANING = "cleaning",
    GARDENING = "gardening",
    MOVING = "moving",
    HANDYMAN = "handyman",
    OTHER = "other"
}
export declare enum TaskStatus {
    OPEN = "open",
    ASSIGNED = "assigned",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum BidStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    WITHDRAWN = "withdrawn"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum UserType {
    CLIENT = "client",
    TASKER = "tasker"
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
}
export interface CreateBidRequest {
    taskId: string;
    amount: number;
    message: string;
    estimatedDuration: number;
}
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
//# sourceMappingURL=index.d.ts.map