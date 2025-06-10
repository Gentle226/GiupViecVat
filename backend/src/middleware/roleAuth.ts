import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { db } from "../data/adapter";
import { ResponseHelper } from "../utils/ResponseHelper";

// Middleware to check if user is a client (not a tasker)
export const requireClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return ResponseHelper.unauthorized(
        res,
        req,
        "auth.authenticationRequired"
      );
    }

    const user = await db.findUserById(req.userId);
    if (!user) {
      return ResponseHelper.unauthorized(res, req, "auth.userNotFound");
    }

    // Check if user is a client (not a tasker)
    // Handle both memory store (userType) and MongoDB (isTasker) formats
    const isTasker =
      "userType" in user ? user.userType === "tasker" : user.isTasker;

    if (isTasker) {
      return ResponseHelper.forbidden(res, req, "auth.clientOnly");
    }

    // Store user info for the route handler
    req.user = { ...user, password: undefined };
    next();
  } catch (error: any) {
    return ResponseHelper.error(
      res,
      req,
      "auth.authorizationFailed",
      500,
      error
    );
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
      return ResponseHelper.unauthorized(
        res,
        req,
        "auth.authenticationRequired"
      );
    }

    const user = await db.findUserById(req.userId);
    if (!user) {
      return ResponseHelper.unauthorized(res, req, "auth.userNotFound");
    }

    // Check if user is a tasker
    // Handle both memory store (userType) and MongoDB (isTasker) formats
    const isTasker =
      "userType" in user ? user.userType === "tasker" : user.isTasker;

    if (!isTasker) {
      return ResponseHelper.forbidden(res, req, "auth.taskerOnly");
    }

    // Store user info for the route handler
    req.user = { ...user, password: undefined };
    next();
  } catch (error: any) {
    return ResponseHelper.error(
      res,
      req,
      "auth.authorizationFailed",
      500,
      error
    );
  }
};
