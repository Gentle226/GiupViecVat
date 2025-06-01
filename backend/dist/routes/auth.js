"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const adapter_1 = require("../data/adapter");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Generate JWT token
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }
    return jsonwebtoken_1.default.sign({ userId: userId }, secret, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    });
};
// Register
router.post("/register", async (req, res) => {
    try {
        const { email, password, firstName, lastName, isTasker, location } = req.body;
        // Check if user already exists
        const existingUser = await adapter_1.db.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }
        // Create new user
        const user = await adapter_1.db.createUser({
            email,
            password,
            firstName,
            lastName,
            userType: isTasker ? "tasker" : "client",
            location: location || {
                address: "Not specified",
                coordinates: [0, 0],
            },
        });
        // Generate token
        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            data: {
                user: { ...user, password: undefined }, // Don't send password
                token,
            },
            message: "User registered successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message,
        });
    }
});
// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = await adapter_1.db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        // Generate token
        const token = generateToken(user._id);
        res.json({
            success: true,
            data: {
                user: { ...user, password: undefined }, // Don't send password
                token,
            },
            message: "Login successful",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message,
        });
    }
});
// Get current user profile
router.get("/me", auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await adapter_1.db.findUserById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        res.json({
            success: true,
            data: { ...user, password: undefined },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile",
            error: error.message,
        });
    }
});
// Update user profile
router.put("/profile", auth_1.authenticateToken, async (req, res) => {
    try {
        const updates = req.body;
        // Remove sensitive fields that shouldn't be updated via this endpoint
        delete updates.password;
        delete updates._id;
        delete updates.email;
        const user = await adapter_1.db.updateUser(req.userId, updates);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        res.json({
            success: true,
            data: { ...user, password: undefined },
            message: "Profile updated successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map