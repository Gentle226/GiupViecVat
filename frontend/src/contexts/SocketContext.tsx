import React, { createContext, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import type { Message } from "../../../shared/types";

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
  removeAllListeners: () => void;
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
      (socketRef.current as any).emit("joinConversation", conversationId);
    }
  };
  const leaveConversation = (conversationId: string) => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).emit("leaveConversation", conversationId);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).on("typing", callback);
    }
  };

  const removeAllListeners = () => {
    if (socketRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socketRef.current as any).removeAllListeners();
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
        removeAllListeners,
      }}
    >
      {children}{" "}
    </SocketContext.Provider>
  );
};
