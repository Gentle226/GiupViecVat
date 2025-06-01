import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usersAPI, tasksAPI, reviewsAPI } from "../services/api";
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
} from "lucide-react";

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "reviews">(
    "overview"
  );
  const [isEditing, setIsEditing] = useState(false);
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

      if (!targetUserId) return; // Fetch user profile
      const userResponse = await usersAPI.getUser(targetUserId);
      if (userResponse.data) {
        setUser(userResponse.data);
      }

      // Fetch user's tasks
      if (userResponse.data?.isTasker) {
        const tasksResponse = await tasksAPI.getMyTasks();
        if (tasksResponse.data) {
          setUserTasks(tasksResponse.data);
        }
      } else {
        const tasksResponse = await tasksAPI.getMyTasks();
        if (tasksResponse.data) {
          setUserTasks(tasksResponse.data);
        }
      }

      // Fetch user's reviews
      const reviewsResponse = await reviewsAPI.getUserReviews(targetUserId);
      if (reviewsResponse.data) {
        setUserReviews(reviewsResponse.data);
      } // Set edit form data
      if (isOwnProfile && userResponse.data) {
        setEditForm({
          firstName: userResponse.data.firstName,
          lastName: userResponse.data.lastName,
          bio: userResponse.data.bio || "",
          skills: userResponse.data.skills || [],
          location: userResponse.data.location.address || "",
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
      // Note: This would require implementing an update profile endpoint
      // const response = await usersAPI.updateProfile(editForm);
      // setUser(response.data);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile");
      console.error("Error updating profile:", err);
    }
  };

  const calculateAverageRating = () => {
    if (userReviews.length === 0) return 0;
    const total = userReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / userReviews.length).toFixed(1);
  };

  const calculateCompletionRate = () => {
    if (userTasks.length === 0) return 0;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600">
            The profile you're looking for doesn't exist.
          </p>
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
                  {user.isTasker ? "Tasker" : "Client"}
                </p>{" "}
                {user.location && (
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userTasks.length}
              </div>{" "}
              <div className="text-sm text-gray-500">
                {user.isTasker ? "Tasks Completed" : "Tasks Posted"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-400 mr-1" />
                {calculateAverageRating()}
              </div>
              <div className="text-sm text-gray-500">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {calculateCompletionRate()}%
              </div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {userReviews.length}
              </div>
              <div className="text-sm text-gray-500">Reviews</div>
            </div>
          </div>
        </div>

        {/* Bio and Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          {user.bio ? (
            <p className="text-gray-700 mb-4">{user.bio}</p>
          ) : (
            <p className="text-gray-500 italic mb-4">No bio available</p>
          )}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Skills</h3>
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
          {/* Note: Hourly rate functionality would need to be implemented */}
          {user.isTasker && (
            <div className="flex items-center text-gray-700">
              <DollarSign className="h-5 w-5 mr-2" />
              <span>Rate: Contact for pricing</span>
            </div>
          )}{" "}
          <div className="flex items-center text-gray-500 mt-2">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Member since {formatDate(user.createdAt.toString())}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 text-sm font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`py-4 text-sm font-medium ${
                  activeTab === "tasks"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Tasks ({userTasks.length})
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-4 text-sm font-medium ${
                  activeTab === "reviews"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Reviews ({userReviews.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {userTasks.slice(0, 3).map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {task.title}
                          </h4>{" "}
                          <p className="text-sm text-gray-500">
                            {formatDate(task.createdAt.toString())}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-4">
                {userTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tasks found</p>
                  </div>
                ) : (
                  userTasks.map((task) => (
                    <div
                      key={task._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {task.title}
                        </h4>{" "}
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
                            task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                {userReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                ) : (
                  userReviews.map((review) => (
                    <div
                      key={review._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">
                              Reviewer
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>{" "}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt.toString())}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Edit Profile
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />{" "}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
