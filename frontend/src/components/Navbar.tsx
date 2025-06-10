import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";
import { Search, Plus, MessageCircle, User, LogOut } from "lucide-react";

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {" "}
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Logo size="medium" />
            </Link>
          </div>
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {" "}
            <Link
              to="/tasks"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/tasks")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t("nav.findTasks")}</span>
            </Link>{" "}
            {isAuthenticated && (
              <>
                {/* Show "Post Task" only for clients (non-taskers) */}
                {!user?.isTasker && (
                  <Link
                    to="/post-task"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/post-task")
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("nav.postTask")}</span>
                  </Link>
                )}{" "}
                <Link
                  to="/messages"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    isActive("/messages")
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t("nav.messages")}</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
                <NotificationDropdown />
              </>
            )}
          </div>{" "}
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Link>{" "}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("nav.logout")}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  {t("nav.register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>{" "}
      {/* Mobile menu */}
      {isAuthenticated && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {" "}
            <Link
              to="/tasks"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                isActive("/tasks")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <Search className="w-5 h-5" />
              <span>{t("nav.findTasks")}</span>
            </Link>
            {/* Show "Post Task" only for clients (non-taskers) */}
            {!user?.isTasker && (
              <Link
                to="/post-task"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/post-task")
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>{t("nav.postTask")}</span>
              </Link>
            )}{" "}
            <Link
              to="/messages"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium relative ${
                isActive("/messages")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t("nav.messages")}</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 left-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>{" "}
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                isActive("/dashboard")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <User className="w-5 h-5" />
              <span>{t("nav.dashboard")}</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
