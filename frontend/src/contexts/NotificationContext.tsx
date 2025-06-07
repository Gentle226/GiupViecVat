import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "../hooks/useSocket";
import { messagesAPI } from "../services/api";
import type { Message } from "../../../shared/types";

interface MessageNotification {
  conversationId: string;
  message: Message;
  senderName?: string;
}

interface NotificationContextType {
  unreadCount: number;
  newMessageNotifications: { [conversationId: string]: number };
  markConversationAsRead: (conversationId: string) => void;
  markAllAsRead: () => void;
  incrementUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessageNotifications, setNewMessageNotifications] = useState<{
    [conversationId: string]: number;
  }>({});

  // Fetch initial unread count
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, user]);
  // Listen for new messages via socket
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: Message) => {
        // Only count as unread if message is not from current user
        if (message.senderId !== user?._id) {
          setUnreadCount((prev) => prev + 1);
          setNewMessageNotifications((prev) => ({
            ...prev,
            [message.conversationId]: (prev[message.conversationId] || 0) + 1,
          }));
        }
      };

      const handleMessageNotification = (notification: MessageNotification) => {
        // Handle notification for messages sent while user is online but not in the conversation
        if (notification.message?.senderId !== user?._id) {
          setUnreadCount((prev) => prev + 1);
          setNewMessageNotifications((prev) => ({
            ...prev,
            [notification.conversationId]:
              (prev[notification.conversationId] || 0) + 1,
          }));
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on("newMessage", handleNewMessage);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on("message_notification", handleMessageNotification);

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off("newMessage", handleNewMessage);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off("message_notification", handleMessageNotification);
      };
    }
  }, [socket, user?._id]);
  const fetchUnreadCount = async () => {
    try {
      const response = await messagesAPI.getUnreadCount();
      if (response.data) {
        setUnreadCount(response.data.count || 0);
        setNewMessageNotifications(response.data.conversationCounts || {});
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markConversationAsRead = (conversationId: string) => {
    // Remove unread count for this conversation
    const conversationUnread = newMessageNotifications[conversationId] || 0;
    setUnreadCount((prev) => Math.max(0, prev - conversationUnread));
    setNewMessageNotifications((prev) => {
      const updated = { ...prev };
      delete updated[conversationId];
      return updated;
    });
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNewMessageNotifications({});
  };

  const incrementUnreadCount = () => {
    setUnreadCount((prev) => prev + 1);
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        newMessageNotifications,
        markConversationAsRead,
        markAllAsRead,
        incrementUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
