import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { messagesAPI } from "../services/api";
import type { PopulatedConversation, Message } from "../../../shared/types";
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  User,
  Check,
  CheckCheck,
} from "lucide-react";

// Extended message type that handles populated senderId
interface PopulatedMessage extends Omit<Message, "senderId"> {
  senderId:
    | string
    | { _id: string; firstName: string; lastName: string; avatar?: string };
}

const Messages: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { socket, sendMessage, joinConversation } = useSocket();
  const [conversations, setConversations] = useState<PopulatedConversation[]>(
    []
  );
  const [activeConversation, setActiveConversation] =
    useState<PopulatedConversation | null>(null);
  const [messages, setMessages] = useState<PopulatedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [usersTyping, setUsersTyping] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Utility function to extract sender ID from message
  const getSenderId = (message: PopulatedMessage): string => {
    return typeof message.senderId === "string"
      ? message.senderId
      : message.senderId._id;
  };
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket && activeConversation) {
      joinConversation(activeConversation._id);
      const handleNewMessage = (message: PopulatedMessage) => {
        if (message.conversationId === activeConversation._id) {
          setMessages((prev) => [...prev, message]);
        }
        // Update conversation list with latest message
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === message.conversationId
              ? { ...conv, lastMessage: message as Message }
              : conv
          )
        );
      };

      const handleTyping = (data: {
        conversationId: string;
        userId: string;
        isTyping: boolean;
      }) => {
        if (
          data.conversationId === activeConversation._id &&
          data.userId !== user?._id
        ) {
          setIsTyping(data.isTyping);
          if (data.isTyping) {
            setUsersTyping((prev) => [
              ...prev.filter((id) => id !== data.userId),
              data.userId,
            ]);
          } else {
            setUsersTyping((prev) => prev.filter((id) => id !== data.userId));
          }
        }
      }; // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on("newMessage", handleNewMessage);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).on("typing", handleTyping);

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off("newMessage", handleNewMessage);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).off("typing", handleTyping);
      };
    }
  }, [socket, activeConversation, joinConversation, user?._id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversations();
      setConversations(response.data || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await messagesAPI.getMessages(conversationId);
      setMessages(response.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };
  const handleConversationSelect = async (
    conversation: PopulatedConversation
  ) => {
    setActiveConversation(conversation);
    await fetchMessages(conversation._id);
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;

    try {
      setSendingMessage(true);

      // Send message via socket for real-time delivery to all participants
      sendMessage(activeConversation._id, newMessage.trim());

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };
  const handleTyping = () => {
    if (!activeConversation || !socket) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).emit("typing", {
      conversationId: activeConversation._id,
      userId: user?._id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).emit("stopTyping", {
        conversationId: activeConversation._id,
        userId: user?._id,
      });
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };
  const filteredConversations = conversations.filter(
    (conv) =>
      // Filter based on search term - you might want to include participant names here
      conv.lastMessage?.content
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      conv._id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (loading || authLoading || !user) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <p>No conversations yet</p>
              <p className="text-sm">Start a conversation with a Tasker!</p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation._id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    activeConversation?._id === conversation._id
                      ? "bg-indigo-50 border-indigo-200"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      {" "}
                      <div className="flex items-center justify-between">
                        {" "}
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.participants
                            .filter((p) => p._id !== user?._id)
                            .map((p) => `${p.firstName} ${p.lastName}`)
                            .join(", ") || "Other User"}
                        </p>{" "}
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </p>
                        )}
                      </div>{" "}
                      {/* Show task context if available */}
                      {conversation.taskId && (
                        <p className="text-xs text-indigo-600 truncate">
                          Task: {conversation.taskId.title}
                        </p>
                      )}
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>{" "}
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeConversation.participants
                      .filter((p) => p._id !== user?._id)
                      .map((p) => `${p.firstName} ${p.lastName}`)
                      .join(", ") || "Other User"}
                  </h2>
                  {activeConversation.taskId && (
                    <p className="text-sm text-indigo-600">
                      Task: {activeConversation.taskId.title}
                    </p>
                  )}
                  <p className="text-sm text-green-600">Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Video className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>{" "}
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const senderId = getSenderId(message);
              const isOwnMessage = senderId === user?._id && user?._id != null;

              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div
                      className={`flex items-center justify-between mt-1 ${
                        isOwnMessage ? "text-indigo-200" : "text-gray-500"
                      }`}
                    >
                      {" "}
                      <span className="text-xs">
                        {formatTime(message.timestamp)}
                      </span>
                      {isOwnMessage && (
                        <div className="ml-2">
                          {message.readBy && message.readBy.length > 1 ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && usersTyping.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center space-x-3"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* No Conversation Selected */
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a conversation
            </h3>
            <p className="text-gray-500">
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
