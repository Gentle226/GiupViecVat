import React, { useState, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import { userStatus } from "../services/userStatus";
import OnlineStatus from "./OnlineStatus";

interface OnlineUsersListProps {
  conversationParticipants?: string[];
}

const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  conversationParticipants = [],
}) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { onUserStatus, getOnlineUsers } = useSocket();

  // Fetch initial online users
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        setLoading(true);
        if (getOnlineUsers) {
          getOnlineUsers((users: string[]) => {
            setOnlineUsers(users);
          });
        }

        // Also fetch via API as fallback
        const response = await userStatus.getOnlineUsers();
        if (response.success) {
          setOnlineUsers(response.data.onlineUsers);
        }
      } catch (error) {
        console.error("Error fetching online users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
  }, [getOnlineUsers]);

  // Listen for real-time status updates
  useEffect(() => {
    if (onUserStatus) {
      const handleUserStatus = (data: {
        userId: string;
        status: "online" | "offline";
      }) => {
        if (data.status === "online") {
          setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
        } else {
          setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
        }
      };

      onUserStatus(handleUserStatus);
    }
  }, [onUserStatus]);

  // Filter to show conversation participants if specified
  const displayUsers =
    conversationParticipants.length > 0
      ? onlineUsers.filter((userId) =>
          conversationParticipants.includes(userId)
        )
      : onlineUsers;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
        Loading...
      </div>
    );
  }

  if (displayUsers.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        {conversationParticipants.length > 0
          ? "No participants online"
          : "No users online"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">
        Online {conversationParticipants.length > 0 ? "Participants" : "Users"}{" "}
        ({displayUsers.length})
      </div>
      <div className="space-y-1">
        {displayUsers.map((userId) => (
          <div key={userId} className="flex items-center gap-2 text-sm">
            <OnlineStatus isOnline={true} size="sm" />
            <span className="text-gray-700">User {userId}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsersList;
