"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSocket = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ResponseHelper_1 = require("../utils/ResponseHelper");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
        if (!token) {
            return ResponseHelper_1.ResponseHelper.unauthorized(res, req, 'auth.tokenMissing');
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Store the decoded user info instead of looking up from database
        // The routes can handle database lookup if needed
        req.user = { _id: decoded.userId };
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        return ResponseHelper_1.ResponseHelper.forbidden(res, req, 'auth.tokenInvalid');
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
//# sourceMappingURL=auth.js.map