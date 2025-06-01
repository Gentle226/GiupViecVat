import React, { createContext, useReducer, useEffect } from "react";
import type {
  User,
  LoginRequest,
  RegisterRequest,
} from "../../../shared/types";
import { authAPI } from "../services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

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

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuth();
    }
  }, []);

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
  const login = async (credentials: LoginRequest) => {
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
      dispatch({
        type: "AUTH_FAILURE",
        payload: error instanceof Error ? error.message : "Login failed",
      });
    }
  };

  const register = async (userData: RegisterRequest) => {
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
  };

  const logout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

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

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
