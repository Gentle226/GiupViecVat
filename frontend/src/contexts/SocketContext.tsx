import React, { createContext, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import type {
  Message,
  Call,
  CallSignaling,
  CallType,
} from "../../../shared/types";

interface SocketContextType {
  socket: unknown | null;
  isConnected: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  onNewMessage: (callback: (message: Message) => void) => void;
  onTyping: (
    callback: (data: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => void
  ) => void;
  onUserStatus: (
    callback: (data: {
      userId: string;
      status: "online" | "offline";
      timestamp: Date;
    }) => void
  ) => void;
  getOnlineUsers: (callback: (users: string[]) => void) => void;
  getUsersStatus: (
    userIds: string[],
    callback: (status: {
      [userId: string]: { isOnline: boolean; lastSeen?: Date };
    }) => void
  ) => void;
  removeAllListeners: () => void;
  // Call methods
  initiateCall: (
    receiverId: string,
    callType: CallType,
    conversationId: string
  ) => void;
  answerCall: (callId: string) => void;
  declineCall: (callId: string) => void;
  endCall: (callId: string) => void;
  sendCallSignal: (signaling: CallSignaling) => void;
  onIncomingCall: (callback: (call: Call) => void) => void;
  onCallInitiated: (
    callback: (data: { call: Call; status: string }) => void
  ) => void;
  onCallStatusUpdate: (
    callback: (data: { callId: string; status: string }) => void
  ) => void;
  onCallSignal: (callback: (signaling: CallSignaling) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export { SocketContext };

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<unknown | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
      socketRef.current = io(socketUrl, {
        auth: {
          token: localStorage.getItem("token"),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const socket = socketRef.current as any;

      socket.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });
      socket.on("error", (error: unknown) => {
        console.error("Socket error:", error);
      });

      return () => {
        if (socket) {
          socket.disconnect();
          socketRef.current = null;
          setIsConnected(false);
        }
      };
    }
  }, [isAuthenticated, user]);
  const joinConversation = (conversationId: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("join_conversation", conversationId);
    }
  };
  const leaveConversation = (conversationId: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("leave_conversation", conversationId);
    }
  };

  const sendMessage = (conversationId: string, content: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("sendMessage", {
        conversationId,
        content,
      });
    }
  };

  const startTyping = (conversationId: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("typing", {
        conversationId,
        isTyping: true,
      });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("typing", {
        conversationId,
        isTyping: false,
      });
    }
  };
  const onNewMessage = (callback: (message: Message) => void) => {
    if (socketRef.current) {
      // Remove existing listener first to prevent duplicates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).off("newMessage", callback);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on("newMessage", callback);
    }
  };
  const onTyping = (
    callback: (data: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => void
  ) => {
    if (socketRef.current) {
      // Remove existing listener first to prevent duplicates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).off("typing", callback);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on("typing", callback);
    }
  };

  const onUserStatus = (
    callback: (data: {
      userId: string;
      status: "online" | "offline";
      timestamp: Date;
    }) => void
  ) => {
    if (socketRef.current) {
      // Remove existing listener first to prevent duplicates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).off("user_status", callback);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on("user_status", callback);
    }
  };

  const getOnlineUsers = (callback: (users: string[]) => void) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("get_online_users", callback);
    }
  };

  const getUsersStatus = (
    userIds: string[],
    callback: (status: {
      [userId: string]: { isOnline: boolean; lastSeen?: Date };
    }) => void
  ) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit(
        "get_users_status",
        { userIds },
        callback
      );
    }
  };
  const removeAllListeners = () => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).removeAllListeners();
    }
  };

  // Call methods
  const initiateCall = (
    receiverId: string,
    callType: CallType,
    conversationId: string
  ) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("call:initiate", {
        receiverId,
        callType,
        conversationId,
      });
    }
  };

  const answerCall = (callId: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("call:answer", { callId });
    }
  };

  const declineCall = (callId: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("call:decline", { callId });
    }
  };

  const endCall = (callId: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("call:end", { callId });
    }
  };

  const sendCallSignal = (signaling: CallSignaling) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("call:signal", signaling);
    }
  };
  const onIncomingCall = (callback: (call: Call) => void) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).off("call:incoming", callback);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on("call:incoming", callback);
    }
  };

  const onCallInitiated = (
    callback: (data: { call: Call; status: string }) => void
  ) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).off("call:initiated", callback);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on("call:initiated", callback);
    }
  };

  const onCallStatusUpdate = (
    callback: (data: { callId: string; status: string }) => void
  ) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).off("call:status_update", callback);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on("call:status_update", callback);
    }
  };

  const onCallSignal = (callback: (signaling: CallSignaling) => void) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).off("call:signal", callback);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on("call:signal", callback);
    }
  };
  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        onNewMessage,
        onTyping,
        onUserStatus,
        getOnlineUsers,
        getUsersStatus,
        removeAllListeners,
        initiateCall,
        answerCall,
        declineCall,
        endCall,
        sendCallSignal,
        onIncomingCall,
        onCallInitiated,
        onCallStatusUpdate,
        onCallSignal,
      }}
    >
      {children}{" "}
    </SocketContext.Provider>
  );
};
