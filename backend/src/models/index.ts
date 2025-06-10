import mongoose, { Schema, Document } from "mongoose";

// Re-export all models from individual files
export { User, IUser } from "./User";
export { Task, ITask } from "./Task";
export { Bid, IBid } from "./Bid";
export { Message, Conversation, IMessage, IConversation } from "./Message";

export interface IReview extends Document {
  taskId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IPayment extends Document {
  taskId: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId;
  payeeId: mongoose.Types.ObjectId;
  amount: number;
  status: string;
  stripePaymentIntentId: string;
  createdAt: Date;
  completedAt?: Date;
}

const reviewSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

const paymentSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    payerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ taskId: 1 });
reviewSchema.index({ revieweeId: 1 });
paymentSchema.index({ taskId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
