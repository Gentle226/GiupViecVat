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

interface BidNotificationData {
  taskId: string;
  bidId: string;
  taskTitle: string;
  bidderName: string;
  amount: number;
  message: string;
  read?: boolean; // Add read status
  timestamp?: string; // Add timestamp for ordering
}

interface TaskCancellationNotificationData {
  taskId: string;
  taskTitle: string;
  message: string;
  type: "assigned_task_cancelled" | "bid_rejected_due_to_cancellation";
  bidAmount?: number;
  read?: boolean;
  timestamp?: string;
}

interface NotificationContextType {
  unreadCount: number;
  newMessageNotifications: { [conversationId: string]: number };
  bidNotifications: BidNotificationData[];
  taskCancellationNotifications: TaskCancellationNotificationData[];
  unreadBidCount: number; // Add unread bid count
  unreadTaskCancellationCount: number;
  markConversationAsRead: (conversationId: string) => void;
  markAllAsRead: () => void;
  incrementUnreadCount: () => void;
  addBidNotification: (notification: BidNotificationData) => void;
  removeBidNotification: (bidId: string) => void;
  clearAllBidNotifications: () => void;
  markBidAsRead: (bidId: string) => void; // Add mark bid as read
  markAllBidsAsRead: () => void; // Add mark all bids as read
  addTaskCancellationNotification: (
    notification: TaskCancellationNotificationData
  ) => void;
  removeTaskCancellationNotification: (taskId: string) => void;
  clearAllTaskCancellationNotifications: () => void;
  markTaskCancellationAsRead: (taskId: string) => void;
  markAllTaskCancellationsAsRead: () => void;
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
  const [bidNotifications, setBidNotifications] = useState<
    BidNotificationData[]
  >([]);
  const [taskCancellationNotifications, setTaskCancellationNotifications] =
    useState<TaskCancellationNotificationData[]>([]);

  // Calculate unread bid count
  const unreadBidCount = bidNotifications.filter((notif) => !notif.read).length;

  // Calculate unread task cancellation count
  const unreadTaskCancellationCount = taskCancellationNotifications.filter(
    (notif) => !notif.read
  ).length;

  // Load persisted notifications on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedNotifications = localStorage.getItem(
        `bid_notifications_${user._id}`
      );
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          setBidNotifications(parsed);
        } catch (error) {
          console.error("Error parsing saved notifications:", error);
          localStorage.removeItem(`bid_notifications_${user._id}`);
        }
      }
    }
  }, [isAuthenticated, user]);
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (isAuthenticated && user && bidNotifications.length >= 0) {
      localStorage.setItem(
        `bid_notifications_${user._id}`,
        JSON.stringify(bidNotifications)
      );
    }
  }, [bidNotifications, isAuthenticated, user]);

  // Fetch initial unread count
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, user]); // Listen for new messages via socket
  useEffect(() => {
    if (socket) {
      const handleNewMessage = () => {
        // Don't increment counts here - let message_notification handle that
        // This event is just for real-time message display in conversations
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
      const handleBidNotification = (notification: BidNotificationData) => {
        setBidNotifications((prev) => {
          const enrichedNotification = {
            ...notification,
            read: false,
            timestamp: new Date().toISOString(),
          };
          const updated = [enrichedNotification, ...prev];
          return updated;
        });
      };

      const handleTaskCancellationNotification = (
        notification: TaskCancellationNotificationData
      ) => {
        setTaskCancellationNotifications((prev) => {
          const enrichedNotification = {
            ...notification,
            read: false,
            timestamp: new Date().toISOString(),
          };
          const updated = [enrichedNotification, ...prev];
          return updated;
        });
      }; // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on("newMessage", handleNewMessage);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on("message_notification", handleMessageNotification);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on("new_bid_notification", handleBidNotification);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on(
        "task_cancelled_notification",
        handleTaskCancellationNotification
      );

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off("newMessage", handleNewMessage);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off("message_notification", handleMessageNotification);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off("new_bid_notification", handleBidNotification);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off(
          "task_cancelled_notification",
          handleTaskCancellationNotification
        );
      };
    }
  }, [socket, user]);
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

  const addBidNotification = (notification: BidNotificationData) => {
    setBidNotifications((prev) => [notification, ...prev]);
  };

  const removeBidNotification = (bidId: string) => {
    setBidNotifications((prev) =>
      prev.filter((notif) => notif.bidId !== bidId)
    );
  };
  const clearAllBidNotifications = () => {
    setBidNotifications([]);
  };

  const markBidAsRead = (bidId: string) => {
    setBidNotifications((prev) =>
      prev.map((notif) =>
        notif.bidId === bidId ? { ...notif, read: true } : notif
      )
    );
  };
  const markAllBidsAsRead = () => {
    setBidNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  };

  // Task cancellation notification methods
  const addTaskCancellationNotification = (
    notification: TaskCancellationNotificationData
  ) => {
    setTaskCancellationNotifications((prev) => [notification, ...prev]);
  };

  const removeTaskCancellationNotification = (taskId: string) => {
    setTaskCancellationNotifications((prev) =>
      prev.filter((notif) => notif.taskId !== taskId)
    );
  };

  const clearAllTaskCancellationNotifications = () => {
    setTaskCancellationNotifications([]);
  };

  const markTaskCancellationAsRead = (taskId: string) => {
    setTaskCancellationNotifications((prev) =>
      prev.map((notif) =>
        notif.taskId === taskId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllTaskCancellationsAsRead = () => {
    setTaskCancellationNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  };
  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        newMessageNotifications,
        bidNotifications,
        taskCancellationNotifications,
        unreadBidCount,
        unreadTaskCancellationCount,
        markConversationAsRead,
        markAllAsRead,
        incrementUnreadCount,
        addBidNotification,
        removeBidNotification,
        clearAllBidNotifications,
        markBidAsRead,
        markAllBidsAsRead,
        addTaskCancellationNotification,
        removeTaskCancellationNotification,
        clearAllTaskCancellationNotifications,
        markTaskCancellationAsRead,
        markAllTaskCancellationsAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
