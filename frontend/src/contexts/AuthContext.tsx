import React, { useReducer, useEffect, useCallback } from "react";
import type { LoginRequest, RegisterRequest } from "../../../shared/types";
import { authAPI } from "../services/api";
import { AuthContext, type AuthState, type AuthAction } from "./AuthContext";

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: localStorage.getItem("token") ? true : false, // Show loading if token exists
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: "AUTH_START" });
        const response = await authAPI.me();
        if (response.success && response.data) {
          dispatch({
            type: "AUTH_SUCCESS",
            payload: {
              user: response.data,
              token: localStorage.getItem("token")!,
            },
          });
        } else {
          localStorage.removeItem("token");
          dispatch({ type: "AUTH_FAILURE", payload: "Invalid token" });
        }
      } catch {
        localStorage.removeItem("token");
        dispatch({ type: "AUTH_FAILURE", payload: "Authentication failed" });
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      checkAuth();
    }
  }, []); // Empty dependency array - this effect should only run once on mount

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      dispatch({ type: "AUTH_START" });
      console.log("Login attempt with:", credentials.email);
      const response = await authAPI.login(credentials);
      console.log("Login response:", response);

      if (response.success && response.data) {
        localStorage.setItem("token", response.data.token);
        console.log("Login successful, dispatching AUTH_SUCCESS");
        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
      } else {
        console.log("Login failed:", response.message);
        dispatch({
          type: "AUTH_FAILURE",
          payload: response.message || "Login failed",
        });
      }
    } catch (error: unknown) {
      console.log("Login error:", error);
      // Extract error message from axios error response
      let errorMessage = "Login failed";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      dispatch({
        type: "AUTH_FAILURE",
        payload: errorMessage,
      });
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      dispatch({ type: "AUTH_START" });
      const response = await authAPI.register(userData);

      if (response.success && response.data) {
        localStorage.setItem("token", response.data.token);
        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
      } else {
        dispatch({
          type: "AUTH_FAILURE",
          payload: response.message || "Registration failed",
        });
      }
    } catch (error: unknown) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error instanceof Error ? error.message : "Registration failed",
      });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
