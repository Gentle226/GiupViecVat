import React from "react";

interface OnlineStatusProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  lastSeen?: Date | string;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({
  isOnline,
  size = "md",
  showText = false,
  lastSeen,
}) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };
  const formatLastSeen = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - dateObj.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return dateObj.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          } ${isOnline ? "animate-pulse" : ""}`}
        />
        {isOnline && (
          <div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-20`}
          />
        )}
      </div>
      {showText && (
        <span className="text-xs text-gray-500">
          {isOnline ? (
            <span className="text-green-600 font-medium">Online</span>
          ) : lastSeen ? (
            `Last seen ${formatLastSeen(lastSeen)}`
          ) : (
            <span className="text-gray-500">Offline</span>
          )}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
