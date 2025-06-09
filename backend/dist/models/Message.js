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
exports.Conversation = exports.Message = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const messageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: function () {
            return (this.messageType === "text" || (this.images && this.images.length === 0));
        },
        maxlength: 1000,
    },
    messageType: {
        type: String,
        enum: ["text", "image"],
        default: "text",
        required: true,
    },
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function (images) {
                return images.length <= 3; // Maximum 3 images per message
            },
            message: "Maximum 3 images allowed per message",
        },
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    readBy: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
});
const conversationSchema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    taskId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
    },
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
}, {
    timestamps: true,
});
// Indexes
messageSchema.index({ conversationId: 1, timestamp: -1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ taskId: 1 });
exports.Message = mongoose_1.default.model("Message", messageSchema);
exports.Conversation = mongoose_1.default.model("Conversation", conversationSchema);
//# sourceMappingURL=Message.js.map