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
const ResponseHelper_1 = __importDefault(require("../utils/ResponseHelper"));
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
// Transform user data to match frontend expected structure
const transformUser = (user) => {
    // Handle both memory store (backend User) and MongoDB (IUser) formats
    const isMemoryStoreUser = "userType" in user;
    const isMongoUser = "isTasker" in user;
    return {
        _id: user._id,
        email: user.email,
        firstName: isMemoryStoreUser
            ? user.firstName || (user.name ? user.name.split(" ")[0] : "User")
            : user.firstName,
        lastName: isMemoryStoreUser
            ? user.lastName ||
                (user.name ? user.name.split(" ").slice(1).join(" ") : "")
            : user.lastName,
        avatar: user.avatar,
        isTasker: isMemoryStoreUser ? user.userType === "tasker" : user.isTasker,
        rating: user.rating || 0,
        reviewCount: user.reviewCount || 0,
        bio: user.bio,
        skills: user.skills || [],
        hourlyRate: user.hourlyRate,
        availability: user.availability,
        location: typeof user.location === "string"
            ? { address: user.location, coordinates: [0, 0] }
            : user.location || { address: "Not specified", coordinates: [0, 0] },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt || user.createdAt,
    };
};
// Register
router.post("/register", async (req, res) => {
    try {
        const { email, password, firstName, lastName, isTasker, location } = req.body; // Check if user already exists
        const existingUser = await adapter_1.db.findUserByEmail(email);
        if (existingUser) {
            return ResponseHelper_1.default.error(res, req, 'auth.userExists', 400);
        } // Create new user
        const userCreateData = {
            email,
            password,
            firstName,
            lastName,
            isTasker,
            userType: isTasker ? "tasker" : "client",
            location: location || {
                address: "Not specified",
                coordinates: [0, 0],
            },
        };
        const user = await adapter_1.db.createUser(userCreateData); // Generate token
        const token = generateToken(user._id); // Transform user to match frontend expected structure
        const transformedUser = transformUser(user);
        return ResponseHelper_1.default.success(res, req, 'auth.registrationSuccess', {
            user: transformedUser,
            token,
        }, 201);
    }
    catch (error) {
        return ResponseHelper_1.default.error(res, req, 'auth.registrationFailed', 500, error.message);
    }
});
// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body; // Find user by email
        const user = await adapter_1.db.findUserByEmail(email);
        if (!user) {
            return ResponseHelper_1.default.error(res, req, 'auth.invalidCredentials', 401);
        }
        // Check password
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return ResponseHelper_1.default.error(res, req, 'auth.invalidCredentials', 401);
        }
        // Generate token
        const token = generateToken(user._id);
        // Transform user to match frontend expected structure
        const transformedUser = transformUser(user);
        return ResponseHelper_1.default.success(res, req, 'auth.loginSuccess', {
            user: transformedUser,
            token,
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Get current user profile
router.get("/me", auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await adapter_1.db.findUserById(req.userId);
        if (!user) {
            return ResponseHelper_1.default.notFound(res, req, 'auth.userNotFound');
        }
        // Transform user to match frontend expected structure
        const transformedUser = transformUser(user);
        return ResponseHelper_1.default.success(res, req, 'users.profileRetrieved', transformedUser);
    }
    catch (error) {
        return ResponseHelper_1.default.error(res, req, 'users.profileRetrievalFailed', 500, error.message);
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
            return ResponseHelper_1.default.notFound(res, req, 'auth.userNotFound');
        }
        // Transform user to match frontend expected structure
        const transformedUser = transformUser(user);
        return ResponseHelper_1.default.success(res, req, 'auth.profileUpdateSuccess', transformedUser);
    }
    catch (error) {
        return ResponseHelper_1.default.error(res, req, 'auth.profileUpdateFailed', 500, error.message);
    }
});
// Change password
router.put("/change-password", auth_1.authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return ResponseHelper_1.default.error(res, req, 'auth.passwordRequired', 400);
        }
        if (newPassword.length < 6) {
            return ResponseHelper_1.default.error(res, req, 'validation.passwordTooShort', 400);
        }
        // Find the user
        const user = await adapter_1.db.findUserById(req.userId);
        if (!user) {
            return ResponseHelper_1.default.notFound(res, req, 'auth.userNotFound');
        }
        // Verify current password
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return ResponseHelper_1.default.error(res, req, 'auth.invalidCredentials', 400);
        }
        // Hash new password
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password
        await adapter_1.db.updateUser(req.userId, { password: hashedNewPassword });
        return ResponseHelper_1.default.success(res, req, 'auth.profileUpdateSuccess');
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map