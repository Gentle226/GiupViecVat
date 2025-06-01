import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  suggestedPrice: number;
  status: string;
  postedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

const taskSchema = new Schema(
  {
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
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Index for location-based searches
taskSchema.index({ category: 1, status: 1 });
taskSchema.index({ postedBy: 1 });
taskSchema.index({ assignedTo: 1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);
