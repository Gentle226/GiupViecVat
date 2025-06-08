import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTask } from "../contexts/TaskContext";
import { tasksAPI, bidsAPI, messagesAPI } from "../services/api";
import type { Task, TaskBid } from "../../../shared/types";
import {
  TaskStatus,
  TaskCategory,
  TimingType,
  TimeOfDay,
  LocationType,
} from "../../../shared/types";
import {
  MapPin,
  Calendar,
  User,
  Star,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import RatingModal from "../components/RatingModal";

const formatDate = (date: Date | undefined): string => {
  if (!date) return "Not specified";
  return new Date(date).toLocaleDateString();
};

const formatTiming = (task: Task): string => {
  if (!task.timingType) return "Timing: Not specified";

  switch (task.timingType) {
    case TimingType.FLEXIBLE:
      return "Timing: Flexible";
    case TimingType.ON_DATE:
      if (task.specificDate) {
        const dateStr = formatDate(task.specificDate);
        if (
          task.needsSpecificTime &&
          task.timeOfDay &&
          task.timeOfDay.length > 0
        ) {
          const timeLabel = getTimeOfDayLabel(task.timeOfDay);
          return `Timing: On ${dateStr} (${timeLabel})`;
        }
        return `Timing: On ${dateStr}`;
      }
      return "Timing: On specific date";
    case TimingType.BEFORE_DATE:
      if (task.specificDate) {
        const dateStr = formatDate(task.specificDate);
        if (
          task.needsSpecificTime &&
          task.timeOfDay &&
          task.timeOfDay.length > 0
        ) {
          const timeLabel = getTimeOfDayLabel(task.timeOfDay);
          return `Timing: Before ${dateStr} (${timeLabel})`;
        }
        return `Timing: Before ${dateStr}`;
      }
      return "Timing: Before specific date";
    default:
      return "Timing: Not specified";
  }
};

const getTimeOfDayLabel = (timeOfDay: TimeOfDay[]): string => {
  if (!timeOfDay || timeOfDay.length === 0) return "Any time";

  const labels = timeOfDay.map((time) => {
    switch (time) {
      case TimeOfDay.MORNING:
        return "Morning";
      case TimeOfDay.MIDDAY:
        return "Midday";
      case TimeOfDay.AFTERNOON:
        return "Afternoon";
      case TimeOfDay.EVENING:
        return "Evening";
      default:
        return time;
    }
  });

  return labels.join(", ");
};

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cancelTask, updateTask, deleteTask } = useTask();
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<TaskBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [completingTask, setCompletingTask] = useState(false);
  const [cancellingTask, setCancellingTask] = useState(false);
  const [showCompleteConfirmation, setShowCompleteConfirmation] =
    useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
    suggestedPrice: "",
    location: "",
    locationType: "",
    dueDate: "",
    // New timing fields
    timingType: TimingType.FLEXIBLE as string,
    specificDate: "",
    needsSpecificTime: false,
    timeOfDay: [] as string[],
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<
    Array<{ _id: string; title: string }>
  >([]);
  // MongoDB ObjectId format validation (24 character hex string)
  const isValidTaskIdFormat = (taskId: string): boolean => {
    return /^[a-f\d]{24}$/i.test(taskId);
  };

  useEffect(() => {
    if (!id) return;

    const fetchTaskDetails = async () => {
      try {
        setLoading(true);

        // Validate task ID format before making API calls
        if (!isValidTaskIdFormat(id)) {
          setError("Invalid task ID format");
          // Fetch available tasks for suggestions
          try {
            const tasksResponse = await tasksAPI.getTasks();
            if (tasksResponse.data?.tasks) {
              setAvailableTasks(tasksResponse.data.tasks.slice(0, 5)); // Show up to 5 suggestions
            }
          } catch (e) {
            console.error("Error fetching available tasks:", e);
          }
          setLoading(false);
          return;
        }
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
      } catch (err: unknown) {
        // Enhanced error handling with suggestions
        console.error("Error fetching task details:", err);

        const error = err as { response?: { status?: number } };
        if (error.response?.status === 404) {
          setError("Task not found");
          // Fetch available tasks for suggestions
          try {
            const tasksResponse = await tasksAPI.getTasks();
            if (tasksResponse.data?.tasks) {
              setAvailableTasks(tasksResponse.data.tasks.slice(0, 5)); // Show up to 5 suggestions
            }
          } catch (e) {
            console.error("Error fetching available tasks:", e);
          }
        } else {
          setError("Failed to load task details");
        }
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
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      console.error("Error submitting bid:", err);
      console.error("Error details:", error.response?.data);

      if (
        error.response?.status === 403 &&
        error.response?.data?.message?.includes("Tasker")
      ) {
        alert(
          "Only taskers can place bids on tasks. Please switch to a tasker account to bid."
        );
      } else if (error.response?.status === 400) {
        // Show the specific 400 error message from the server
        const message = error.response?.data?.message || "Bad request";
        alert(`Failed to submit bid: ${message}`);
      } else {
        alert("Failed to submit bid");
      }
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
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (
        error.response?.status === 403 &&
        error.response?.data?.message?.includes("Client")
      ) {
        alert("Only clients can accept bids on their tasks.");
      } else {
        alert("Failed to accept bid");
      }
      console.error("Error accepting bid:", err);
    }
  };
  const handleViewProfile = (bid: TaskBid) => {
    const userId =
      typeof bid.bidderId === "string" ? bid.bidderId : bid.bidderId._id;
    navigate(`/profile/${userId}`);
  };

  const handleViewTaskOwnerProfile = () => {
    if (!task) return;
    const ownerId =
      typeof task.postedBy === "string" ? task.postedBy : task.postedBy._id;
    navigate(`/profile/${ownerId}`);
  };
  const handleMessage = async (bid: TaskBid) => {
    try {
      const userId =
        typeof bid.bidderId === "string" ? bid.bidderId : bid.bidderId._id;

      // Create or get conversation with the bidder, linked to this task
      const response = await messagesAPI.createConversation(userId, task?._id);

      if (response.data) {
        // Navigate to messages page
        navigate("/messages");
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
      alert("Failed to start conversation. Please try again.");
    }
  };
  const handleCompleteTask = async () => {
    if (!task) return;

    try {
      setCompletingTask(true);
      const response = await tasksAPI.completeTask(task._id);

      if (response.data) {
        setTask(response.data);
        setShowCompleteConfirmation(false);

        // Show rating modal for the assigned tasker
        if (task.assignedTo) {
          const assignedTasker = bids.find((bid) => {
            const bidderId =
              typeof bid.bidderId === "string"
                ? bid.bidderId
                : bid.bidderId._id;
            return bidderId === task.assignedTo && bid.status === "accepted";
          });

          if (assignedTasker) {
            const taskerName =
              typeof assignedTasker.bidderId === "string"
                ? "Tasker"
                : `${assignedTasker.bidderId.firstName} ${assignedTasker.bidderId.lastName}`;

            setRatingTarget({
              userId: task.assignedTo,
              name: taskerName,
            });
            setShowRatingModal(true);
          }
        }

        alert("Task completed successfully!");
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      console.error("Error completing task:", err);

      if (error.response?.status === 403) {
        alert("Only task owners can complete their tasks.");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Invalid task status";
        alert(`Failed to complete task: ${message}`);
      } else {
        alert("Failed to complete task. Please try again.");
      }
    } finally {
      setCompletingTask(false);
    }
  };
  const handleCancelTask = async () => {
    if (!task) return;

    try {
      setCancellingTask(true);
      await cancelTask(task._id);
      setShowCancelConfirmation(false);
      alert("Task cancelled successfully!");
      // Refresh task data to show updated status
      const response = await tasksAPI.getTask(task._id);
      if (response.data) {
        setTask(response.data);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      console.error("Error cancelling task:", err);

      if (error.response?.status === 403) {
        alert("Only task owners can cancel their tasks.");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Invalid task status";
        alert(`Failed to cancel task: ${message}`);
      } else {
        alert("Failed to cancel task. Please try again.");
      }
    } finally {
      setCancellingTask(false);
    }
  };
  const handleEditTask = () => {
    if (!task) return;

    // Populate edit form with current task data
    setEditFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      suggestedPrice: task.suggestedPrice.toString(),
      location:
        task.locationType === "online"
          ? "" // Don't show "Online" in the location field for online tasks
          : typeof task.location === "string"
          ? task.location
          : task.location.address,
      locationType: task.locationType || "in_person",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      // New timing fields
      timingType: task.timingType || TimingType.FLEXIBLE,
      specificDate: task.specificDate
        ? new Date(task.specificDate).toISOString().split("T")[0]
        : "",
      needsSpecificTime: task.needsSpecificTime || false,
      timeOfDay: task.timeOfDay || [],
    });
    setShowEditModal(true);
  };
  const handleEditFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditTimeOfDayChange = (time: string) => {
    setEditFormData((prev) => {
      const currentTimes = prev.timeOfDay;
      const isSelected = currentTimes.includes(time);

      const newTimes = isSelected
        ? currentTimes.filter((t) => t !== time)
        : [...currentTimes, time];

      return {
        ...prev,
        timeOfDay: newTimes,
      };
    });
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setEditLoading(true);
      const updatedTaskData = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        category: editFormData.category as TaskCategory,
        suggestedPrice: parseFloat(editFormData.suggestedPrice),
        location: {
          address:
            editFormData.locationType === "online"
              ? "Online"
              : editFormData.location.trim(),
          coordinates: [0, 0] as [number, number],
        },
        locationType: editFormData.locationType as LocationType,
        dueDate: editFormData.dueDate
          ? new Date(editFormData.dueDate)
          : undefined,
        // New timing fields
        timingType: editFormData.timingType as TimingType,
        specificDate: editFormData.specificDate
          ? new Date(editFormData.specificDate)
          : undefined,
        needsSpecificTime: editFormData.needsSpecificTime,
        timeOfDay:
          editFormData.timeOfDay.length > 0
            ? (editFormData.timeOfDay as TimeOfDay[])
            : undefined,
      };

      // Call the API directly to ensure we get the updated task data
      const response = await tasksAPI.updateTask(task._id, updatedTaskData);

      if (response.success && response.data) {
        // Update local state with the returned data
        setTask(response.data);

        // Also update TaskContext for consistency
        updateTask(task._id, updatedTaskData);

        setShowEditModal(false);
        alert("Task updated successfully!");
      } else {
        throw new Error(response.message || "Failed to update task");
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      console.error("Error updating task:", err);

      if (error.response?.status === 403) {
        alert("Only task owners can edit their tasks.");
      } else {
        alert("Failed to update task. Please try again.");
      }
    } finally {
      setEditLoading(false);
    }
  };
  const handleDeleteTask = async () => {
    if (!task) return;

    try {
      setDeleteLoading(true);
      await deleteTask(task._id);
      alert("Task deleted successfully!");
      navigate("/tasks");
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      console.error("Error deleting task:", err);

      if (error.response?.status === 403) {
        alert("Only task owners can delete their tasks.");
      } else {
        alert("Failed to delete task. Please try again.");
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.OPEN:
        return "bg-green-100 text-green-800";
      case TaskStatus.ASSIGNED:
        return "bg-yellow-100 text-yellow-800";
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
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Task Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error === "Invalid task ID format"
              ? "The task ID format is invalid. Task IDs should be alphanumeric."
              : error === "Task not found"
              ? `The task with ID "${id}" doesn't exist.`
              : error || "The task you're looking for doesn't exist."}
          </p>

          {availableTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Available Tasks
              </h3>
              <div className="space-y-2">
                {availableTasks.map((availableTask) => (
                  <button
                    key={availableTask._id}
                    onClick={() => navigate(`/tasks/${availableTask._id}`)}
                    className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="text-sm font-medium text-indigo-600 mb-1">
                      ID: {availableTask._id}
                    </div>
                    <div className="text-sm text-gray-700 truncate">
                      {availableTask.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/tasks")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }
  const isTaskOwner =
    user?._id ===
    (typeof task.postedBy === "string" ? task.postedBy : task.postedBy._id);

  const isAssignedTasker = user?._id === task.assignedTo;

  console.log("=== TASK DETAIL DEBUG ===");
  console.log("Current user ID:", user?._id);
  console.log(
    "Task posted by:",
    typeof task.postedBy === "string" ? task.postedBy : task.postedBy._id
  );
  console.log("Task assigned to:", task.assignedTo);
  console.log("Task status:", task.status);
  console.log("Is task owner:", isTaskOwner);
  console.log("Is assigned tasker:", isAssignedTasker);
  console.log(
    "Should show close button:",
    isTaskOwner &&
      (task.status === TaskStatus.ASSIGNED ||
        task.status === TaskStatus.IN_PROGRESS)
  );

  const hasUserBid = bids.some((bid) => {
    const bidderIdString =
      typeof bid.bidderId === "string" ? bid.bidderId : bid.bidderId._id;
    return bidderIdString === user?._id;
  });
  const canBid =
    isAuthenticated &&
    user?.isTasker && // Only taskers can bid
    !isTaskOwner &&
    !hasUserBid &&
    task.status === TaskStatus.OPEN;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        {/* Header */}{" "}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 pr-4 break-words">
                {task.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.replace("_", " ")}
                </span>{" "}
                {/* Task Owner Information - Show to all users */}
                <button
                  onClick={handleViewTaskOwnerProfile}
                  className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 mr-1" />
                  <span>
                    Posted by{" "}
                    {typeof task.postedBy === "string" || !task.postedBy
                      ? "User"
                      : `${task.postedBy.firstName} ${task.postedBy.lastName}`}
                  </span>
                </button>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-indigo-600">
                ${task.suggestedPrice}
              </div>
              <div className="text-sm text-gray-500">Budget</div>
            </div>
          </div>{" "}
          {/* Task Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {" "}
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{task.location.address}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{formatTiming(task)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2" />
              <span>Posted: {formatDate(task.createdAt!)}</span>
            </div>
          </div>
          {/* Show Preferred Time of Day separately if specified */}
          {task.needsSpecificTime &&
            task.timeOfDay &&
            task.timeOfDay.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    Preferred Time of Day: {getTimeOfDayLabel(task.timeOfDay)}
                  </span>
                </div>
              </div>
            )}{" "}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Description
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>{" "}
          <div className="flex flex-wrap gap-2 mb-4">
            {task.category && (
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                {task.category}
              </span>
            )}
          </div>
          {/* Task Action Buttons - Bottom Right */}
          <div className="flex justify-end">
            <div className="flex flex-wrap gap-2">
              {/* Edit Task Button - for task owners on editable tasks */}
              {isTaskOwner &&
                (task.status === TaskStatus.OPEN ||
                  task.status === TaskStatus.ASSIGNED) && (
                  <button
                    onClick={handleEditTask}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </button>
                )}
              {/* Delete Task Button - for task owners on deletable tasks */}
              {isTaskOwner &&
                (task.status === TaskStatus.COMPLETED ||
                  task.status === TaskStatus.CANCELLED) && (
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={deleteLoading}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteLoading ? "Deleting..." : "Delete Task"}
                  </button>
                )}
              {/* Rate Tasker Button - for completed tasks (clients only) */}
              {isTaskOwner &&
                task.status === TaskStatus.COMPLETED &&
                task.assignedTo && (
                  <button
                    onClick={() => {
                      const assignedTasker = bids.find((bid) => {
                        const bidderId =
                          typeof bid.bidderId === "string"
                            ? bid.bidderId
                            : bid.bidderId._id;
                        return (
                          bidderId === task.assignedTo &&
                          bid.status === "accepted"
                        );
                      });

                      if (assignedTasker && task.assignedTo) {
                        const taskerName =
                          typeof assignedTasker.bidderId === "string"
                            ? "Tasker"
                            : `${assignedTasker.bidderId.firstName} ${assignedTasker.bidderId.lastName}`;

                        setRatingTarget({
                          userId: task.assignedTo,
                          name: taskerName,
                        });
                        setShowRatingModal(true);
                      }
                    }}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center text-sm"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Rate Tasker
                  </button>
                )}
              {/* Rate Client Button - for completed tasks (taskers only) */}
              {isAssignedTasker && task.status === TaskStatus.COMPLETED && (
                <button
                  onClick={() => {
                    const clientId =
                      typeof task.postedBy === "string"
                        ? task.postedBy
                        : task.postedBy._id;
                    const clientName =
                      typeof task.postedBy === "string"
                        ? "Client"
                        : `${task.postedBy.firstName} ${task.postedBy.lastName}`;

                    setRatingTarget({
                      userId: clientId,
                      name: clientName,
                    });
                    setShowRatingModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate Client
                </button>
              )}
              {/* Complete Task Button - for assigned/in_progress tasks (clients only) */}
              {isTaskOwner &&
                (task.status === TaskStatus.ASSIGNED ||
                  task.status === TaskStatus.IN_PROGRESS) && (
                  <button
                    onClick={() => setShowCompleteConfirmation(true)}
                    disabled={completingTask}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center text-sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {completingTask ? "Closing..." : "Close Task"}
                  </button>
                )}
              {/* Cancel Task Button - for task owners on cancellable tasks */}
              {isTaskOwner &&
                (task.status === TaskStatus.OPEN ||
                  task.status === TaskStatus.ASSIGNED ||
                  task.status === TaskStatus.IN_PROGRESS) && (
                  <button
                    onClick={() => setShowCancelConfirmation(true)}
                    disabled={cancellingTask}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {cancellingTask ? "Cancelling..." : "Cancel Task"}
                  </button>
                )}
            </div>
          </div>
        </div>{" "}
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
            </form>{" "}
          </div>
        )}
        {/* Message for clients who can't bid */}
        {isAuthenticated &&
          !user?.isTasker &&
          !isTaskOwner &&
          task.status === TaskStatus.OPEN && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    Client Account
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    As a client, you can post tasks but cannot bid on them.
                    Switch to a tasker account to bid on tasks.
                  </p>
                </div>
              </div>
            </div>
          )}
        {/* Bids Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bids ({bids.length})
            {isTaskOwner && bids.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                - Choose the best bid for your task
              </span>
            )}
          </h2>{" "}
          {bids.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {user?.isTasker && !isTaskOwner
                  ? "No bids yet. Be the first to bid on this task!"
                  : "No bids yet. Taskers will be able to see and bid on your task."}
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
                      </div>{" "}
                      <div className="ml-3">
                        <button
                          onClick={() => handleViewProfile(bid)}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {typeof bid.bidderId === "string"
                            ? "Tasker"
                            : `${bid.bidderId.firstName} ${bid.bidderId.lastName}`}
                        </button>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          {typeof bid.bidderId === "string"
                            ? "4.8 (12 reviews)"
                            : `${bid.bidderId.rating || 0} (${
                                bid.bidderId.reviewCount || 0
                              } reviews)`}
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
                  <p className="text-gray-700 mb-3">{bid.message}</p>{" "}
                  {bid.status === "accepted" && (
                    <div className="flex items-center text-green-600 mb-3">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Accepted Bid</span>
                    </div>
                  )}
                  {/* Action buttons - Always show View Profile and Message for authenticated users */}
                  {isAuthenticated && (
                    <div className="flex space-x-3">
                      {/* Accept Bid button - Only for task owners */}
                      {isTaskOwner &&
                        task.status === TaskStatus.OPEN &&
                        bid.status === "pending" && (
                          <button
                            onClick={() => handleAcceptBid(bid._id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                          >
                            Accept Bid
                          </button>
                        )}

                      {/* View Profile and Message buttons - Available to all authenticated users */}
                      <button
                        onClick={() => handleViewProfile(bid)}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleMessage(bid)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        Message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>{" "}
      </div>
      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label
                  htmlFor="edit-title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* Description */}
              <div>
                <label
                  htmlFor="edit-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description *
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* Category and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category *
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.values(TaskCategory).map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() +
                          category.slice(1).replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="edit-price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Budget ($) *
                  </label>
                  <input
                    type="number"
                    id="edit-price"
                    name="suggestedPrice"
                    value={editFormData.suggestedPrice}
                    onChange={handleEditFormChange}
                    min="1"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>{" "}
              </div>{" "}
              {/* Location Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tell us where *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <label
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      editFormData.locationType === "in_person"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="locationType"
                      value="in_person"
                      checked={editFormData.locationType === "in_person"}
                      onChange={handleEditFormChange}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">In-person</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Select this if you need the Tasker physically there
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      editFormData.locationType === "online"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="locationType"
                      value="online"
                      checked={editFormData.locationType === "online"}
                      onChange={handleEditFormChange}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Online</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Select this if the Tasker can do it from home
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              {/* Location - Only show for in-person tasks */}
              {editFormData.locationType === "in_person" && (
                <div>
                  <label
                    htmlFor="edit-location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Location *
                  </label>
                  <input
                    type="text"
                    id="edit-location"
                    name="location"
                    value={editFormData.location}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Downtown Seattle, WA"
                  />
                </div>
              )}
              {/* Timing Section */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  When do you need this done?
                </h4>
                {/* Timing Type */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center">
                    <input
                      id="edit-on-date"
                      name="timingType"
                      type="radio"
                      value={TimingType.ON_DATE}
                      checked={editFormData.timingType === TimingType.ON_DATE}
                      onChange={handleEditFormChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label
                      htmlFor="edit-on-date"
                      className="ml-3 block text-sm text-gray-700"
                    >
                      On a specific date
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="edit-before-date"
                      name="timingType"
                      type="radio"
                      value={TimingType.BEFORE_DATE}
                      checked={
                        editFormData.timingType === TimingType.BEFORE_DATE
                      }
                      onChange={handleEditFormChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label
                      htmlFor="edit-before-date"
                      className="ml-3 block text-sm text-gray-700"
                    >
                      Before a specific date
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="edit-flexible"
                      name="timingType"
                      type="radio"
                      value={TimingType.FLEXIBLE}
                      checked={editFormData.timingType === TimingType.FLEXIBLE}
                      onChange={handleEditFormChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label
                      htmlFor="edit-flexible"
                      className="ml-3 block text-sm text-gray-700"
                    >
                      I'm flexible
                    </label>
                  </div>
                </div>
                {/* Date Selection */}
                {(editFormData.timingType === TimingType.ON_DATE ||
                  editFormData.timingType === TimingType.BEFORE_DATE) && (
                  <div className="mb-4">
                    <label
                      htmlFor="edit-specificDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Select Date *
                    </label>
                    <input
                      type="date"
                      id="edit-specificDate"
                      name="specificDate"
                      value={editFormData.specificDate}
                      onChange={handleEditFormChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}{" "}
                {/* Time of Day Selection - Available for all timing types */}
                <div className="mb-4">
                  <div className="flex items-center mb-3">
                    {" "}
                    <input
                      id="edit-needsSpecificTime"
                      name="needsSpecificTime"
                      type="checkbox"
                      checked={editFormData.needsSpecificTime}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditFormData((prev) => ({
                          ...prev,
                          needsSpecificTime: checked,
                          timeOfDay: checked ? prev.timeOfDay : [],
                        }));
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="edit-needsSpecificTime"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      I need this done at a specific time of day
                    </label>
                  </div>

                  {editFormData.needsSpecificTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time of Day *
                      </label>{" "}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.values(TimeOfDay).map((time) => (
                          <div key={time} className="flex items-center">
                            <input
                              id={`edit-time-${time}`}
                              type="checkbox"
                              value={time}
                              checked={editFormData.timeOfDay.includes(time)}
                              onChange={() => handleEditTimeOfDayChange(time)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`edit-time-${time}`}
                              className="ml-2 block text-sm text-gray-700 capitalize"
                            >
                              {time.toLowerCase()}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex space-x-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  {editLoading ? "Updating..." : "Update Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Task Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <Trash2 className="h-8 w-8 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Task
              </h3>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to permanently delete this task? This action
              cannot be undone. All associated bids and messages will also be
              removed.
            </p>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteLoading ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Complete Task Confirmation Dialog */}
      {showCompleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Close Task
              </h3>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to close this task? This action will mark
              the task as completed and cannot be undone.
            </p>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowCompleteConfirmation(false)}
                disabled={completingTask}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleCompleteTask}
                disabled={completingTask}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {completingTask ? "Closing..." : "Close Task"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Task Confirmation Dialog */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <X className="h-8 w-8 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Cancel Task
              </h3>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel this task? This action cannot be
              undone.
            </p>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowCancelConfirmation(false)}
                disabled={cancellingTask}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                No, keep it
              </button>
              <button
                onClick={handleCancelTask}
                disabled={cancellingTask}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {cancellingTask ? "Cancelling..." : "Yes, cancel task"}
              </button>
            </div>
          </div>
        </div>
      )}{" "}
      {/* Rating Modal */}
      {showRatingModal && task && ratingTarget && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingTarget(null);
          }}
          task={task}
          revieweeId={ratingTarget.userId}
          revieweeName={ratingTarget.name}
          onReviewSubmitted={() => {
            // Optionally refresh task data or show success message
            console.log("Review submitted successfully");
          }}
        />
      )}
    </div>
  );
};

export default TaskDetail;
