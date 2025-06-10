"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSocket = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const adapter_1 = require("../data/adapter");
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
        const user = await adapter_1.db.findUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        req.user = { ...user, password: undefined };
        req.userId = user._id;
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
        const user = await adapter_1.db.findUserById(decoded.userId);
        if (!user) {
            return next(new Error("User not found"));
        }
        socket.user = { ...user, password: undefined };
        next();
    }
    catch (error) {
        next(new Error("Authentication error"));
    }
};
exports.authenticateSocket = authenticateSocket;
//# sourceMappingURL=auth_new.js.map