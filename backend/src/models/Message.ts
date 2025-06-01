import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  readBy: mongoose.Types.ObjectId[];
}

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  taskId?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  readBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ conversationId: 1, timestamp: -1 });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ taskId: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
