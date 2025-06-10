import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Socket } from "socket.io";
import { ResponseHelper } from "../utils/ResponseHelper";

export interface AuthRequest extends Request {
  user?: any;
  userId?: string;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return ResponseHelper.unauthorized(res, req, "auth.tokenMissing");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Store the decoded user info instead of looking up from database
    // The routes can handle database lookup if needed
    req.user = { _id: decoded.userId };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return ResponseHelper.forbidden(res, req, "auth.tokenInvalid");
  }
};

export const authenticateSocket = async (socket: Socket, next: Function) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Store the decoded user info
    (socket as any).user = decoded;
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
};
