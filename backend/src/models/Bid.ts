import mongoose, { Schema, Document } from "mongoose";

export interface IBid extends Document {
  taskId: mongoose.Types.ObjectId;
  bidderId: mongoose.Types.ObjectId;
  amount: number;
  message: string;
  estimatedDuration: number;
  status: string;
  createdAt: Date;
}

const bidSchema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    bidderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 0.5, // Minimum 30 minutes
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate bids
bidSchema.index({ taskId: 1, bidderId: 1 }, { unique: true });
bidSchema.index({ bidderId: 1 });
bidSchema.index({ taskId: 1, status: 1 });

export const Bid = mongoose.model<IBid>("Bid", bidSchema);
