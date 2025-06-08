import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useTask } from "../contexts/TaskContext";
import {
  Calendar,
  DollarSign,
  MapPin,
  MessageCircle,
  Plus,
  Star,
  TrendingUp,
  User,
  Clock,
  CheckCircle,
  Search,
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { myTasks, loadMyTasks, isLoading } = useTask();

  useEffect(() => {
    loadMyTasks();
  }, [loadMyTasks]);
  const stats = [
    {
      title: t("dashboard.activeTasks"),
      value: myTasks.filter(
        (task) => task.status === "open" || task.status === "in_progress"
      ).length,
      icon: Clock,
      color: "bg-blue-500",
    },
    {
      title: t("dashboard.completedTasks"),
      value: myTasks.filter((task) => task.status === "completed").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: t("dashboard.totalEarnings"),
      value: "$0.00", // TODO: Calculate from completed tasks
      icon: DollarSign,
      color: "bg-yellow-500",
    },
    {
      title: t("dashboard.rating"),
      value: user?.rating ? user.rating.toFixed(1) : "N/A",
      icon: Star,
      color: "bg-purple-500",
    },
  ];

  const recentTasks = myTasks.slice(0, 5); // Show last 5 tasks

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("dashboard.welcomeBack")}, {user?.firstName} {user?.lastName}!
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          {t("dashboard.hereIsWhatHappening")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {" "}
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.isTasker
                    ? t("dashboard.availableTasks")
                    : t("dashboard.recentTasks")}
                </h2>
                {/* Show "New Task" button only for clients */}
                {!user?.isTasker && (
                  <Link
                    to="/post-task"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t("dashboard.newTask")}
                  </Link>
                )}
                {/* Show "Browse Tasks" button for taskers */}
                {user?.isTasker && (
                  <Link
                    to="/tasks"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {t("dashboard.browseTasks")}
                  </Link>
                )}
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {user?.isTasker
                      ? t("dashboard.noTasksAvailable")
                      : t("dashboard.noTasksYet")}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {user?.isTasker
                      ? t("dashboard.browseTasksToStart")
                      : t("dashboard.startByPostingTask")}
                  </p>
                  {user?.isTasker ? (
                    <Link
                      to="/tasks"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {t("dashboard.browseTasks")}
                    </Link>
                  ) : (
                    <Link
                      to="/post-task"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {t("dashboard.postYourFirstTask")}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {task.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {task.status.replace(/_/g, " ")}
                            </span>
                          </div>{" "}
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />$
                              {task.suggestedPrice}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(task.createdAt.toString())}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {task.location.address}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/tasks/${task._id}`}
                          className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {t("dashboard.view")}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Quick Actions & Profile */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center">
              {" "}
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{user?.email}</p>
              <p className="text-sm text-gray-600 mb-4">
                {user?.isTasker ? t("dashboard.tasker") : t("dashboard.client")}{" "}
                • {t("dashboard.memberSince")}{" "}
                {formatDate(user?.createdAt?.toString() || "")}
              </p>
              <Link
                to={`/profile/${user?._id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t("dashboard.editProfile")}
              </Link>
            </div>
          </div>{" "}
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("dashboard.quickActions")}
            </h3>
            <div className="space-y-3">
              {!user?.isTasker && (
                <Link
                  to="/post-task"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t("dashboard.postATask")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("dashboard.getHelpWithDailyNeeds")}
                    </p>
                  </div>
                </Link>
              )}

              <Link
                to="/tasks"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user?.isTasker
                      ? t("dashboard.findTasks")
                      : t("dashboard.browseTasks")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user?.isTasker
                      ? t("dashboard.findTasksToWorkOn")
                      : t("dashboard.seeAllAvailableTasks")}
                  </p>
                </div>
              </Link>

              <Link
                to="/messages"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t("dashboard.messages")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user?.isTasker
                      ? t("dashboard.chatWithClients")
                      : t("dashboard.chatWithTaskers")}
                  </p>
                </div>
              </Link>
            </div>
          </div>{" "}
          {/* Performance Insights */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("dashboard.thisMonth")}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {user?.isTasker
                    ? t("dashboard.tasksCompleted")
                    : t("dashboard.tasksPosted")}
                </span>
                <span className="font-medium">
                  {user?.isTasker
                    ? myTasks.filter((task) => task.status === "completed")
                        .length
                    : myTasks.filter((task) => {
                        const taskDate = new Date(task.createdAt);
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        return (
                          taskDate.getMonth() === currentMonth &&
                          taskDate.getFullYear() === currentYear
                        );
                      }).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {user?.isTasker
                    ? t("dashboard.earnings")
                    : t("dashboard.activeTasks")}
                </span>
                <span className="font-medium">
                  {user?.isTasker
                    ? "$0.00" // TODO: Calculate earnings
                    : myTasks.filter(
                        (task) =>
                          task.status === "open" ||
                          task.status === "in_progress"
                      ).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {user?.isTasker
                    ? t("dashboard.successRate")
                    : t("dashboard.responseRate")}
                </span>
                <span className="font-medium">95%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
