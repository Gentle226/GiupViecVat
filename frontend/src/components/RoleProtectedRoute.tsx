import React from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ("client" | "tasker")[];
  redirectTo?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = "/dashboard",
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check user role
  const userRole = user.isTasker ? "tasker" : "client";

  // If user role is not in allowed roles, redirect
  if (!allowedRoles.includes(userRole)) {
    // Show a role-specific error message based on what they tried to access
    const isAccessingTaskCreation = allowedRoles.includes("client");
    const isAccessingTaskerFeature = allowedRoles.includes("tasker");

    // Store the unauthorized access attempt to show a message
    if (isAccessingTaskCreation) {
      // Redirect taskers away from task creation
      return <Navigate to="/tasks" replace />;
    } else if (isAccessingTaskerFeature) {
      // Redirect clients away from tasker-only features
      return <Navigate to="/dashboard" replace />;
    }

    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
