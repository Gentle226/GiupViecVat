import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance for user status
const userStatusAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
userStatusAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserStatus {
  isOnline: boolean;
  lastSeen?: Date;
}

export interface UsersStatusResponse {
  [userId: string]: UserStatus;
}

export const userStatus = {
  // Get all online users
  getOnlineUsers: async () => {
    const response = await userStatusAPI.get("/api/messages/online-users");
    return response.data;
  },

  // Get status for specific users
  getUsersStatus: async (userIds: string[]) => {
    const response = await userStatusAPI.post("/api/messages/users-status", {
      userIds,
    });
    return response.data;
  },
};
