import React, { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    bidNotifications,
    taskCancellationNotifications,
    bidAcceptedNotifications,
    unreadBidCount,
    unreadTaskCancellationCount,
    unreadBidAcceptedCount,
    removeBidNotification,
    clearAllBidNotifications,
    markBidAsRead,
    markAllBidsAsRead,
    removeTaskCancellationNotification,
    clearAllTaskCancellationNotifications,
    markTaskCancellationAsRead,
    markAllTaskCancellationsAsRead,
    removeBidAcceptedNotification,
    clearAllBidAcceptedNotifications,
    markBidAcceptedAsRead,
    markAllBidAcceptedAsRead,
  } = useNotifications();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleNotificationClick = (taskId: string, bidId: string) => {
    navigate(`/tasks/${taskId}`);
    markBidAsRead(bidId); // Mark as read when clicked
    setIsOpen(false);
  };

  const handleRemoveNotification = (e: React.MouseEvent, bidId: string) => {
    e.stopPropagation();
    removeBidNotification(bidId);
  };
  const handleClearAll = () => {
    clearAllBidNotifications();
    clearAllTaskCancellationNotifications();
    clearAllBidAcceptedNotifications();
  };

  const totalNotifications =
    bidNotifications.length +
    taskCancellationNotifications.length +
    bidAcceptedNotifications.length;
  const totalUnreadCount =
    unreadBidCount + unreadTaskCancellationCount + unreadBidAcceptedCount;
  const handleTaskCancellationClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
    markTaskCancellationAsRead(taskId);
    setIsOpen(false);
  };

  const handleRemoveTaskCancellationNotification = (
    e: React.MouseEvent,
    taskId: string
  ) => {
    e.stopPropagation();
    removeTaskCancellationNotification(taskId);
  };

  const handleBidAcceptedClick = (taskId: string, bidId: string) => {
    navigate(`/tasks/${taskId}`);
    markBidAcceptedAsRead(bidId);
    setIsOpen(false);
  };

  const handleRemoveBidAcceptedNotification = (
    e: React.MouseEvent,
    bidId: string
  ) => {
    e.stopPropagation();
    removeBidAcceptedNotification(bidId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
          {" "}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Notifications{" "}
                {totalUnreadCount > 0 && `(${totalUnreadCount} unread)`}
              </h3>
              <div className="flex gap-2">
                {" "}
                {totalUnreadCount > 0 && (
                  <button
                    onClick={() => {
                      markAllBidsAsRead();
                      markAllTaskCancellationsAsRead();
                      markAllBidAcceptedAsRead();
                    }}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    Mark all read
                  </button>
                )}
                {totalNotifications > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>{" "}
          <div className="max-h-80 overflow-y-auto">
            {totalNotifications === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              <>
                {/* Task Cancellation Notifications */}
                {taskCancellationNotifications.map((notification) => (
                  <div
                    key={`cancel-${notification.taskId}`}
                    onClick={() =>
                      handleTaskCancellationClick(notification.taskId)
                    }
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer relative group ${
                      notification.read ? "bg-gray-50 opacity-75" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-medium ${
                              notification.read
                                ? "text-gray-600"
                                : "text-red-900"
                            }`}
                          >
                            Task Cancelled: "{notification.taskTitle}"
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                        <p
                          className={`text-sm mt-1 ${
                            notification.read ? "text-gray-500" : "text-red-600"
                          }`}
                        >
                          {notification.message}
                        </p>
                        {notification.bidAmount && (
                          <p className="text-xs text-gray-500 mt-1">
                            Your bid: ${notification.bidAmount}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) =>
                          handleRemoveTaskCancellationNotification(
                            e,
                            notification.taskId
                          )
                        }
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Bid Notifications */}
                {bidNotifications.map((notification) => (
                  <div
                    key={notification.bidId}
                    onClick={() =>
                      handleNotificationClick(
                        notification.taskId,
                        notification.bidId
                      )
                    }
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer relative group ${
                      notification.read ? "bg-gray-50 opacity-75" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-medium ${
                              notification.read
                                ? "text-gray-600"
                                : "text-gray-900"
                            }`}
                          >
                            New bid on "{notification.taskTitle}"
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p
                          className={`text-sm mt-1 ${
                            notification.read
                              ? "text-gray-500"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.bidderName} bid ${notification.amount}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            "{notification.message}"
                          </p>
                        )}
                      </div>{" "}
                      <button
                        onClick={(e) =>
                          handleRemoveNotification(e, notification.bidId)
                        }
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Bid Accepted Notifications */}
                {bidAcceptedNotifications.map((notification) => (
                  <div
                    key={`accepted-${notification.bidId}`}
                    onClick={() =>
                      handleBidAcceptedClick(
                        notification.taskId,
                        notification.bidId
                      )
                    }
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer relative group ${
                      notification.read ? "bg-gray-50 opacity-75" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-medium ${
                              notification.read
                                ? "text-gray-600"
                                : "text-green-900"
                            }`}
                          >
                            🎉 Your bid was accepted!
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                        <p
                          className={`text-sm mt-1 ${
                            notification.read
                              ? "text-gray-500"
                              : "text-green-700"
                          }`}
                        >
                          Task: "{notification.taskTitle}"
                        </p>
                        <p
                          className={`text-sm mt-1 ${
                            notification.read
                              ? "text-gray-500"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.clientName} accepted your $
                          {notification.amount} bid
                        </p>
                      </div>
                      <button
                        onClick={(e) =>
                          handleRemoveBidAcceptedNotification(
                            e,
                            notification.bidId
                          )
                        }
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
