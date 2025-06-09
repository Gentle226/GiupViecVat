import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import {
  usersAPI,
  tasksAPI,
  reviewsAPI,
  messagesAPI,
  authAPI,
  bidsAPI,
} from "../services/api";
import type { PopulatedTaskBid } from "../services/api";
import type { User, Task, Review } from "../../../shared/types";
import {
  User as UserIcon,
  MapPin,
  Star,
  Calendar,
  Mail,
  Edit,
  MessageCircle,
  DollarSign,
  Key,
} from "lucide-react";
import RatingDisplay from "../components/RatingDisplay";
import ChangePasswordModal from "../components/ChangePasswordModal";
import LocationInputWithGPS from "../components/LocationInputWithGPS";

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [userBids, setUserBids] = useState<PopulatedTaskBid[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "reviews">(
    "overview"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    skills: [] as string[],
    location: "",
  });

  const isOwnProfile = !userId || userId === currentUser?._id;
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser?._id;
      if (!targetUserId) {
        setLoading(false);
        return;
      } // Fetch user profile
      const userResponse = await usersAPI.getUser(targetUserId);
      if (userResponse.data && userResponse.data.user) {
        setUser(userResponse.data.user);
      }

      // Fetch user's tasks or bids based on user type
      if (userResponse.data?.user?.isTasker && isOwnProfile) {
        // For taskers viewing their own profile, fetch their bids
        try {
          const bidsResponse = await bidsAPI.getMyBids();
          if (bidsResponse.success && bidsResponse.data?.bids) {
            setUserBids(bidsResponse.data.bids);
            setUserTasks([]); // Clear tasks for taskers
          } else {
            console.warn("Bids data is not valid:", bidsResponse.data);
            setUserBids([]);
            setUserTasks([]);
          }
        } catch (bidsError) {
          console.error("Error fetching bids:", bidsError);
          setUserBids([]);
          setUserTasks([]);
        }
      } else {
        // For clients or viewing other profiles, fetch tasks
        try {
          const tasksResponse = await tasksAPI.getMyTasks();
          if (tasksResponse.data && Array.isArray(tasksResponse.data)) {
            setUserTasks(tasksResponse.data);
            setUserBids([]); // Clear bids for clients
          } else {
            console.warn("Tasks data is not an array:", tasksResponse.data);
            setUserTasks([]);
            setUserBids([]);
          }
        } catch (tasksError) {
          console.error("Error fetching tasks:", tasksError);
          setUserTasks([]);
          setUserBids([]);
        }
      } // Fetch user's reviews
      try {
        const reviewsResponse = await reviewsAPI.getUserReviews(targetUserId);
        if (reviewsResponse.data && Array.isArray(reviewsResponse.data)) {
          setUserReviews(reviewsResponse.data);
        } else {
          console.warn("Reviews data is not an array:", reviewsResponse.data);
          setUserReviews([]);
        }
      } catch (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        setUserReviews([]);
      } // Set edit form data
      if (isOwnProfile && userResponse.data?.user) {
        setEditForm({
          firstName: userResponse.data.user.firstName,
          lastName: userResponse.data.user.lastName,
          bio: userResponse.data.user.bio || "",
          skills: userResponse.data.user.skills || [],
          location: userResponse.data.user.location.address || "",
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser, isOwnProfile]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      // Prepare update data
      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        bio: editForm.bio,
        skills: editForm.skills,
        location: {
          address: editForm.location,
          coordinates: user.location.coordinates, // Keep existing coordinates
        },
      };

      // Call the API to update profile
      const response = await authAPI.updateProfile(updateData);

      if (response.success && response.data) {
        // Update local state with the returned data
        setUser(response.data);
        setIsEditing(false);
        alert("Profile updated successfully!");

        // Refresh the data to ensure consistency
        await fetchUserData();
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      console.error("Error updating profile:", error);
      const errorMessage =
        error.message ||
        error.response?.data?.message ||
        "Unknown error occurred";
      alert(`Failed to update profile: ${errorMessage}`);
    }
  };
  const handleMessageUser = async () => {
    if (!user || !currentUser || isOwnProfile) return;

    try {
      // Create or get conversation with this user
      await messagesAPI.createConversation(user._id);

      // Navigate to messages page
      navigate("/messages");
    } catch (err) {
      console.error("Error creating conversation:", err);
      alert("Failed to start conversation");
    }
  };
  const calculateAverageRating = () => {
    if (!Array.isArray(userReviews) || userReviews.length === 0) return 0;
    const total = userReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / userReviews.length).toFixed(1);
  };

  const calculateCompletionRate = () => {
    if (!Array.isArray(userTasks) || userTasks.length === 0) return 0;
    const completed = userTasks.filter(
      (task) => task.status === "completed"
    ).length;
    return Math.round((completed / userTasks.length) * 100);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const formatBidStatus = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: t("profile.pending"),
          color: "bg-yellow-100 text-yellow-800",
        };
      case "accepted":
        return {
          text: t("profile.accepted"),
          color: "bg-green-100 text-green-800",
        };
      case "rejected":
        return {
          text: t("profile.rejected"),
          color: "bg-red-100 text-red-800",
        };
      default:
        return { text: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const formatTaskStatus = (status: string) => {
    switch (status) {
      case "open":
        return {
          text: t("tasks.status.open"),
          color: "bg-yellow-100 text-yellow-800",
        };
      case "assigned":
        return {
          text: t("tasks.status.assigned"),
          color: "bg-blue-100 text-blue-800",
        };
      case "in_progress":
        return {
          text: t("tasks.status.inProgress"),
          color: "bg-blue-100 text-blue-800",
        };
      case "completed":
        return {
          text: t("tasks.status.completed"),
          color: "bg-green-100 text-green-800",
        };
      case "cancelled":
        return {
          text: t("tasks.status.cancelled"),
          color: "bg-red-100 text-red-800",
        };
      default:
        return {
          text: status.replace("_", " "),
          color: "bg-gray-100 text-gray-800",
        };
    }
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleBidClick = (bid: PopulatedTaskBid) => {
    const taskId = typeof bid.taskId === "object" ? bid.taskId._id : bid.taskId;
    navigate(`/tasks/${taskId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!user) {
    // Check if user is not authenticated and no specific userId was provided
    const isNotAuthenticated = !currentUser && !userId;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isNotAuthenticated
              ? t("profile.pleaseLogIn")
              : t("profile.userNotFound")}
          </h2>
          <p className="text-gray-600 mb-4">
            {isNotAuthenticated
              ? t("profile.needToLogin")
              : t("profile.profileNotExist")}
          </p>
          {isNotAuthenticated && (
            <div className="space-x-4">
              <a
                href="/login"
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                {t("profile.logIn")}
              </a>
              <a
                href="/register"
                className="inline-block border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg hover:bg-indigo-50"
              >
                {t("profile.signUp")}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-24 w-24 bg-indigo-600 rounded-full flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-white" />
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>{" "}
                <p className="text-lg text-gray-600 capitalize">
                  {user.isTasker ? t("profile.tasker") : t("profile.client")}
                </p>{" "}
                {user.location && (
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location.address}</span>
                  </div>
                )}
              </div>
            </div>{" "}
            <div className="flex space-x-3">
              {isOwnProfile ? (
                <>
                  {" "}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t("profile.editProfile")}
                  </button>{" "}
                  <button
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {t("profile.changePassword")}
                  </button>
                </>
              ) : (
                <>
                  {" "}
                  <button
                    onClick={handleMessageUser}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("profile.message")}
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {t("profile.contact")}
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Stats */}{" "}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {" "}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {user.isTasker && isOwnProfile
                  ? userBids.length
                  : Array.isArray(userTasks)
                  ? userTasks.length
                  : 0}
              </div>{" "}
              <div className="text-sm text-gray-500">
                {user.isTasker
                  ? isOwnProfile
                    ? t("profile.bidsSubmitted")
                    : t("profile.tasksCompleted")
                  : t("profile.tasksPosted")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-400 mr-1" />
                {calculateAverageRating()}
              </div>{" "}
              <div className="text-sm text-gray-500">
                {t("profile.averageRating")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {calculateCompletionRate()}%
              </div>
              <div className="text-sm text-gray-500">
                {t("profile.completionRate")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Array.isArray(userReviews) ? userReviews.length : 0}
              </div>
              <div className="text-sm text-gray-500">
                {t("profile.reviews")}
              </div>
            </div>
          </div>
        </div>
        {/* Bio and Details */}{" "}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t("profile.about")}
          </h2>
          {user.bio ? (
            <p className="text-gray-700 mb-4">{user.bio}</p>
          ) : (
            <p className="text-gray-500 italic mb-4">
              {t("profile.noBioAvailable")}
            </p>
          )}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("profile.skills")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}{" "}
          {/* Note: Hourly rate functionality would need to be implemented */}{" "}
          {user.isTasker && (
            <div className="flex items-center text-gray-700">
              <DollarSign className="h-5 w-5 mr-2" />
              <span>
                {t("profile.rate")}: {t("profile.contactForPricing")}
              </span>
            </div>
          )}{" "}
          <div className="flex items-center text-gray-500 mt-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {t("profile.memberSince")} {formatDate(user.createdAt.toString())}
            </span>
          </div>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {" "}
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 text-sm font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("profile.overview")}
              </button>{" "}
              <button
                onClick={() => setActiveTab("tasks")}
                className={`py-4 text-sm font-medium ${
                  activeTab === "tasks"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {user.isTasker && isOwnProfile
                  ? t("profile.bids")
                  : t("profile.tasks")}{" "}
                (
                {user.isTasker && isOwnProfile
                  ? userBids.length
                  : userTasks.length}
                )
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-4 text-sm font-medium ${
                  activeTab === "reviews"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("profile.reviews")} (
                {Array.isArray(userReviews) ? userReviews.length : 0})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {" "}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {" "}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {t("profile.recentActivity")}
                  </h3>{" "}
                  <div className="space-y-3">
                    {user.isTasker && isOwnProfile
                      ? // Show recent bids for taskers
                        userBids.slice(0, 3).map((bid) => {
                          const task =
                            typeof bid.taskId === "object" ? bid.taskId : null;
                          const bidStatusInfo = formatBidStatus(bid.status);
                          return (
                            <div
                              key={bid._id}
                              onClick={() => handleBidClick(bid)}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              {" "}
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {t("profile.bid")}:{" "}
                                  {task?.title ||
                                    `${t("profile.taskId")}: ${bid.taskId}`}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {formatDate(bid.createdAt.toString())} • $
                                  {bid.amount}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${bidStatusInfo.color}`}
                              >
                                {bidStatusInfo.text}
                              </span>
                            </div>
                          );
                        })
                      : // Show recent tasks for clients or when viewing other profiles
                        userTasks.slice(0, 3).map((task) => (
                          <div
                            key={task._id}
                            onClick={() => handleTaskClick(task._id)}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {task.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {formatDate(task.createdAt.toString())}
                              </p>
                            </div>{" "}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                formatTaskStatus(task.status).color
                              }`}
                            >
                              {formatTaskStatus(task.status).text}
                            </span>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            )}{" "}
            {activeTab === "tasks" && (
              <div className="space-y-4">
                {user.isTasker && isOwnProfile ? (
                  // Show bids for taskers viewing their own profile
                  !Array.isArray(userBids) || userBids.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        {t("profile.noBidsFound")}
                      </p>
                    </div>
                  ) : (
                    userBids.map((bid) => {
                      const bidStatusInfo = formatBidStatus(bid.status);
                      // Check if taskId is populated with Task object
                      const task =
                        typeof bid.taskId === "object" ? bid.taskId : null;
                      return (
                        <div
                          key={bid._id}
                          onClick={() => handleBidClick(bid)}
                          className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                        >
                          {" "}
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">
                              {task?.title ||
                                `${t("profile.taskId")}: ${bid.taskId}`}
                            </h4>
                            <span className="text-lg font-bold text-indigo-600">
                              ${bid.amount}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {bid.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-gray-500 text-sm">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>
                                {formatDate(bid.createdAt.toString())}
                              </span>
                              <span className="mx-2">•</span>
                              <span>
                                {bid.estimatedDuration}h{" "}
                                {t("profile.estimatedDuration")}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${bidStatusInfo.color}`}
                            >
                              {bidStatusInfo.text}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : // Show tasks for clients or when viewing other profiles
                !Array.isArray(userTasks) || userTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t("profile.noTasksFound")}</p>
                  </div>
                ) : (
                  userTasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => handleTaskClick(task._id)}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {task.title}
                        </h4>
                        <span className="text-lg font-bold text-indigo-600">
                          ${task.suggestedPrice}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {task.description}
                      </p>
                      <div className="flex items-center justify-between">
                        {" "}
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(task.createdAt.toString())}</span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            formatTaskStatus(task.status).color
                          }`}
                        >
                          {formatTaskStatus(task.status).text}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === "reviews" && (
              <RatingDisplay reviews={userReviews} showAll={true} />
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            {" "}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("profile.editProfileModal")}
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("profile.firstName")}
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("profile.lastName")}
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.bio")}
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>{" "}
              <div>
                {" "}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("profile.location")}
                </label>
                <LocationInputWithGPS
                  value={editForm.location}
                  onChange={(location) =>
                    setEditForm((prev) => ({
                      ...prev,
                      location: location,
                    }))
                  }
                  placeholder={
                    t("profile.locationPlaceholder") || "Enter your location"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />{" "}
              </div>
              <div className="flex space-x-3 pt-4">
                {" "}
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  {t("profile.saveChanges")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  {t("profile.cancel")}
                </button>
              </div>
            </form>{" "}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default Profile;
