import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { db } from "../data/adapter";

// Middleware to check if user is a client (not a tasker)
export const requireClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await db.findUserById(req.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is a client (not a tasker)
    // Handle both memory store (userType) and MongoDB (isTasker) formats
    const isTasker =
      "userType" in user ? user.userType === "tasker" : user.isTasker;

    if (isTasker) {
      return res.status(403).json({
        success: false,
        message:
          "Only clients can perform this action. Taskers are not allowed to post tasks.",
      });
    }

    // Store user info for the route handler
    req.user = { ...user, password: undefined };
    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Authorization check failed",
      error: error.message,
    });
  }
};

// Middleware to check if user is a tasker
export const requireTasker = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await db.findUserById(req.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is a tasker
    // Handle both memory store (userType) and MongoDB (isTasker) formats
    const isTasker =
      "userType" in user ? user.userType === "tasker" : user.isTasker;

    if (!isTasker) {
      return res.status(403).json({
        success: false,
        message:
          "Only taskers can perform this action. Clients are not allowed to bid on tasks.",
      });
    }

    // Store user info for the route handler
    req.user = { ...user, password: undefined };
    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Authorization check failed",
      error: error.message,
    });
  }
};
