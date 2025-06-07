import React, { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { bidNotifications, removeBidNotification, clearAllBidNotifications } =
    useNotifications();
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
    removeBidNotification(bidId);
    setIsOpen(false);
  };

  const handleRemoveNotification = (e: React.MouseEvent, bidId: string) => {
    e.stopPropagation();
    removeBidNotification(bidId);
  };

  const handleClearAll = () => {
    clearAllBidNotifications();
  };

  const totalNotifications = bidNotifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {totalNotifications > 99 ? "99+" : totalNotifications}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
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

          <div className="max-h-80 overflow-y-auto">
            {totalNotifications === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              bidNotifications.map((notification) => (
                <div
                  key={notification.bidId}
                  onClick={() =>
                    handleNotificationClick(
                      notification.taskId,
                      notification.bidId
                    )
                  }
                  className="p-4 border-b hover:bg-gray-50 cursor-pointer relative group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        New bid on "{notification.taskTitle}"
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.bidderName} bid ${notification.amount}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          "{notification.message}"
                        </p>
                      )}
                    </div>
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
