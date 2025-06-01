import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { tasksAPI, bidsAPI } from "../services/api";
import type { Task, TaskBid } from "../../../shared/types";
import { TaskStatus } from "../../../shared/types";
import {
  MapPin,
  Calendar,
  User,
  Star,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const formatDate = (date: Date | undefined): string => {
  if (!date) return "Not specified";
  return new Date(date).toLocaleDateString();
};

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<TaskBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const [taskResponse, bidsResponse] = await Promise.all([
          tasksAPI.getTask(id),
          bidsAPI.getTaskBids(id),
        ]);
        if (taskResponse.data) {
          setTask(taskResponse.data);
        }
        if (bidsResponse.data) {
          setBids(bidsResponse.data);
        }
      } catch (err) {
        setError("Failed to load task details");
        console.error("Error fetching task details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !user || !bidAmount || !bidMessage) return;

    try {
      setSubmittingBid(true);
      const response = await bidsAPI.createBid({
        taskId: task._id,
        amount: parseFloat(bidAmount),
        message: bidMessage,
        estimatedDuration: 1, // Default, could be added to form
      });

      if (response.data) {
        setBids([...bids, response.data]);
      }
      setBidAmount("");
      setBidMessage("");
      alert("Bid submitted successfully!");
    } catch (err) {
      alert("Failed to submit bid");
      console.error("Error submitting bid:", err);
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!task) return;

    try {
      await bidsAPI.acceptBid(bidId);
      // Refresh task data
      const response = await tasksAPI.getTask(task._id);
      if (response.data) {
        setTask(response.data);
      }
      alert("Bid accepted successfully!");
    } catch (err) {
      alert("Failed to accept bid");
      console.error("Error accepting bid:", err);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.OPEN:
        return "bg-green-100 text-green-800";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case TaskStatus.COMPLETED:
        return "bg-gray-100 text-gray-800";
      case TaskStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Task Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The task you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => navigate("/tasks")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }
  const isTaskOwner = user?._id === task.postedBy;
  const hasUserBid = bids.some((bid) => bid.bidderId === user?._id);
  const canBid =
    isAuthenticated &&
    !isTaskOwner &&
    !hasUserBid &&
    task.status === TaskStatus.OPEN;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {task.title}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status.replace("_", " ")}
              </span>
            </div>{" "}
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                ${task.suggestedPrice}
              </div>
              <div className="text-sm text-gray-500">Budget</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {" "}
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{task.location.address}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2" />
              <span>Due: {formatDate(task.dueDate)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2" />
              <span>Posted: {formatDate(task.createdAt!)}</span>
            </div>
          </div>{" "}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Description
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>{" "}
          <div className="flex flex-wrap gap-2">
            {task.category && (
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                {task.category}
              </span>
            )}
          </div>
        </div>

        {/* Bid Section */}
        {canBid && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Submit Your Bid
            </h2>
            <form onSubmit={handleSubmitBid}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="bidAmount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bid Amount ($)
                  </label>
                  <input
                    type="number"
                    id="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your bid amount"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label
                  htmlFor="bidMessage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message to Client
                </label>
                <textarea
                  id="bidMessage"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Explain why you're the best fit for this task..."
                />
              </div>
              <button
                type="submit"
                disabled={submittingBid}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingBid ? "Submitting..." : "Submit Bid"}
              </button>
            </form>
          </div>
        )}

        {/* Bids Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bids ({bids.length})
          </h2>

          {bids.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No bids yet. Be the first to bid on this task!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div
                  key={bid._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          Tasker
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          4.8 (12 reviews)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-600">
                        ${bid.amount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(bid.createdAt!)}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{bid.message}</p>

                  {bid.status === "accepted" && (
                    <div className="flex items-center text-green-600 mb-3">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Accepted Bid</span>
                    </div>
                  )}

                  {isTaskOwner &&
                    task.status === TaskStatus.OPEN &&
                    bid.status === "pending" && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAcceptBid(bid._id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                        >
                          Accept Bid
                        </button>
                        <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm">
                          View Profile
                        </button>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                          Message
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
