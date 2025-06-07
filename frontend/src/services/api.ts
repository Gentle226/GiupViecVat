import axios from "axios";
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Task,
  CreateTaskRequest,
  TaskBid,
  CreateBidRequest,
  Message,
  PopulatedConversation,
  Payment,
  Review,
  TaskStatus,
  TaskCategory,
} from "../../../shared/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login for auth endpoints (login/register) - let them handle their own errors
    const isAuthEndpoint =
      error.config?.url?.includes("/api/auth/login") ||
      error.config?.url?.includes("/api/auth/register");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Handle role-based access errors (403)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message;
      if (
        errorMessage?.includes("Client") ||
        errorMessage?.includes("Tasker")
      ) {
        // Let the calling component handle role-based errors
        error.isRoleError = true;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (
    credentials: LoginRequest
  ): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post("/api/auth/login", credentials);
    return response.data;
  },

  register: async (
    userData: RegisterRequest
  ): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put("/api/auth/profile", updates);
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getTasks: async (params?: {
    category?: TaskCategory;
    status?: TaskStatus;
    location?: { lat: number; lng: number; radius: number };
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{ tasks: Task[]; total: number; pages: number }>> => {
    const response = await api.get("/api/tasks", { params });
    return response.data;
  },

  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },

  createTask: async (
    taskData: CreateTaskRequest
  ): Promise<ApiResponse<Task>> => {
    const response = await api.post("/api/tasks", taskData);
    return response.data;
  },
  updateTask: async (
    id: string,
    updates: Partial<CreateTaskRequest>
  ): Promise<ApiResponse<Task>> => {
    const response = await api.put(`/api/tasks/${id}`, updates);
    return response.data;
  },

  deleteTask: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },

  getMyTasks: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get("/api/tasks/my-tasks");
    return response.data;
  },

  completeTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await api.patch(`/api/tasks/${id}/complete`);
    return response.data;
  },

  cancelTask: async (id: string): Promise<ApiResponse<Task>> => {
    const response = await api.patch(`/api/tasks/${id}/cancel`);
    return response.data;
  },
};

// Bids API
export const bidsAPI = {
  createBid: async (
    bidData: CreateBidRequest
  ): Promise<ApiResponse<TaskBid>> => {
    const response = await api.post("/api/bids", bidData);
    return response.data;
  },

  acceptBid: async (bidId: string): Promise<ApiResponse<TaskBid>> => {
    const response = await api.put(`/api/bids/${bidId}/accept`);
    return response.data;
  },

  getTaskBids: async (taskId: string): Promise<ApiResponse<TaskBid[]>> => {
    const response = await api.get(`/api/bids/task/${taskId}`);
    return response.data;
  },

  getMyBids: async (): Promise<ApiResponse<TaskBid[]>> => {
    const response = await api.get("/api/bids/my-bids");
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUser: async (
    id: string
  ): Promise<ApiResponse<{ user: User; reviews: Review[] }>> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  getUserTasks: async (userId: string): Promise<ApiResponse<Task[]>> => {
    const response = await api.get(`/api/users/${userId}/tasks`);
    return response.data;
  },

  getUserReviews: async (userId: string): Promise<ApiResponse<Review[]>> => {
    const response = await api.get(`/api/users/${userId}/reviews`);
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  getConversations: async (): Promise<ApiResponse<PopulatedConversation[]>> => {
    const response = await api.get("/api/messages/conversations");
    return response.data;
  },

  getMessages: async (
    conversationId: string
  ): Promise<ApiResponse<Message[]>> => {
    const response = await api.get(
      `/api/messages/conversations/${conversationId}/messages`
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string
  ): Promise<ApiResponse<Message>> => {
    const response = await api.post(
      `/api/messages/conversations/${conversationId}/messages`,
      {
        content,
      }
    );
    return response.data;
  },
  createConversation: async (
    participantId: string,
    taskId?: string
  ): Promise<ApiResponse<PopulatedConversation>> => {
    const response = await api.post("/api/messages/conversations", {
      participantId,
      taskId,
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<
    ApiResponse<{
      count: number;
      conversationCounts: { [key: string]: number };
    }>
  > => {
    const response = await api.get("/api/messages/unread-count");
    return response.data;
  },
  markConversationAsRead: async (
    conversationId: string
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await api.post(
      `/api/messages/conversations/${conversationId}/mark-read`
    );
    return response.data;
  },
};

// Payments API
export const paymentsAPI = {
  createPayment: async (paymentData: {
    taskId: string;
    amount: number;
  }): Promise<ApiResponse<Payment>> => {
    const response = await api.post("/api/payments", paymentData);
    return response.data;
  },

  getPayments: async (): Promise<ApiResponse<Payment[]>> => {
    const response = await api.get("/api/payments");
    return response.data;
  },

  getPayment: async (id: string): Promise<ApiResponse<Payment>> => {
    const response = await api.get(`/api/payments/${id}`);
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  createReview: async (reviewData: {
    taskId: string;
    rating: number;
    comment: string;
    revieweeId: string;
  }): Promise<ApiResponse<Review>> => {
    const response = await api.post("/api/reviews", reviewData);
    return response.data;
  },
  getUserReviews: async (userId: string): Promise<ApiResponse<Review[]>> => {
    const response = await api.get(`/api/reviews/user/${userId}`);
    // Backend returns reviews in data.reviews, but we want to return just the reviews
    return {
      ...response.data,
      data: response.data.data.reviews,
    };
  },
};

export default api;
