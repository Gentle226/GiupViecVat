import React from "react";
import { User, Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: {
    _id: string;
    content: string;
    messageType?: "text" | "image";
    images?: string[];
    timestamp: string | Date;
    readBy?: string[];
    senderId:
      | string
      | {
          _id: string;
          firstName: string;
          lastName: string;
          avatar?: string;
        };
  };
  isOwnMessage: boolean;
  currentUserId?: string;
  showAvatar?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  currentUserId,
  showAvatar = true,
}) => {
  const getSenderName = () => {
    if (typeof message.senderId === "string") return "";
    return `${message.senderId.firstName} ${message.senderId.lastName}`;
  };

  const getSenderAvatar = () => {
    if (typeof message.senderId === "string") return null;
    return message.senderId.avatar;
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isRead =
    message.readBy && currentUserId
      ? message.readBy.includes(currentUserId)
      : false;

  return (
    <div
      className={`flex items-start gap-2 mb-4 ${
        isOwnMessage ? "flex-row-reverse" : ""
      }`}
    >
      {" "}
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0">
          {getSenderAvatar() ? (
            <img
              src={getSenderAvatar() || ""}
              alt={getSenderName()}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          )}
        </div>
      )}
      <div
        className={`flex flex-col max-w-xs lg:max-w-md ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        {/* Sender name (for received messages) */}
        {!isOwnMessage && showAvatar && (
          <span className="text-xs text-gray-500 mb-1 ml-2">
            {getSenderName()}
          </span>
        )}

        {/* Message content */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwnMessage
              ? "bg-blue-500 text-white rounded-br-none"
              : "bg-gray-100 text-gray-900 rounded-bl-none"
          }`}
        >
          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div className={`grid gap-2 ${message.content ? "mt-2" : ""}`}>
              {message.images.map((imageUrl, index) => (
                <img
                  key={index}
                  src={`${
                    import.meta.env.VITE_API_URL || "http://localhost:5000"
                  }${imageUrl}`}
                  alt={`Shared image ${index + 1}`}
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    // Open image in new tab or modal
                    window.open(
                      `${
                        import.meta.env.VITE_API_URL || "http://localhost:5000"
                      }${imageUrl}`,
                      "_blank"
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Message metadata */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
            isOwnMessage ? "flex-row-reverse" : ""
          }`}
        >
          <span>{formatTime(message.timestamp)}</span>
          {isOwnMessage && (
            <div className="flex items-center">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
