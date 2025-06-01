"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSocket = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Store the decoded user info instead of looking up from database
        // The routes can handle database lookup if needed
        req.user = decoded;
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid token",
        });
    }
};
exports.authenticateToken = authenticateToken;
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Store the decoded user info
        socket.user = decoded;
        next();
    }
    catch (error) {
        next(new Error("Authentication error"));
    }
};
exports.authenticateSocket = authenticateSocket;
//# sourceMappingURL=auth_fixed.js.map