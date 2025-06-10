"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Task_1 = require("../models/Task");
const adapter_1 = require("../data/adapter");
const ResponseHelper_1 = __importDefault(require("../utils/ResponseHelper"));
const router = express_1.default.Router();
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
// Get user profile
router.get("/:id", async (req, res) => {
    try {
        const user = await adapter_1.db.findUserById(req.params.id);
        if (!user) {
            return ResponseHelper_1.default.notFound(res, req, "users.userNotFound");
        }
        // Transform user to match frontend expected structure
        const transformedUser = transformUser(user);
        // For now, skip reviews since they might not work with memory store
        // TODO: Implement reviews in memory store if needed
        const reviews = [];
        return ResponseHelper_1.default.success(res, req, "users.profileRetrieved", {
            user: transformedUser,
            reviews,
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
// Get user's tasks
router.get("/:id/tasks", async (req, res) => {
    try {
        const { type = "posted", page = 1, limit = 20 } = req.query;
        let query = {};
        if (type === "posted") {
            query.postedBy = req.params.id;
        }
        else if (type === "assigned") {
            query.assignedTo = req.params.id;
        }
        const tasks = await Task_1.Task.find(query)
            .populate("postedBy", "firstName lastName rating reviewCount avatar")
            .populate("assignedTo", "firstName lastName rating reviewCount avatar")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));
        const total = await Task_1.Task.countDocuments(query);
        return ResponseHelper_1.default.success(res, req, "", {
            tasks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        return ResponseHelper_1.default.serverError(res, req, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map