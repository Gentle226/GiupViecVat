"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const taskSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000,
        minlength: 10,
    },
    category: {
        type: String,
        required: true,
        enum: [
            "household",
            "tech",
            "transportation",
            "repairs",
            "cleaning",
            "gardening",
            "moving",
            "handyman",
            "other",
        ],
    },
    location: {
        address: { type: String, required: true },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    locationType: {
        type: String,
        enum: ["in_person", "online"],
        required: true,
        default: "in_person",
    },
    suggestedPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ["open", "assigned", "in_progress", "completed", "cancelled"],
        default: "open",
    },
    postedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    dueDate: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    // New timing fields
    timingType: {
        type: String,
        enum: ["on_date", "before_date", "flexible"],
        required: true,
        default: "flexible",
    },
    specificDate: {
        type: Date,
        default: null,
    },
    timeOfDay: {
        type: [String],
        enum: ["morning", "midday", "afternoon", "evening"],
        default: [],
    },
    needsSpecificTime: {
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    timestamps: true,
});
// Index for location-based searches
taskSchema.index({ category: 1, status: 1 });
taskSchema.index({ postedBy: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ "location.coordinates": "2dsphere" }); // Geospatial index for location queries
exports.Task = mongoose_1.default.model("Task", taskSchema);
//# sourceMappingURL=Task.js.map