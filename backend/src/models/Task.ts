import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  locationType: string;
  suggestedPrice: number;
  status: string;
  postedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  // New timing fields
  timingType: string;
  specificDate?: Date;
  timeOfDay?: string[];
  needsSpecificTime: boolean;
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
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images: string[]) {
          return images.length <= 5; // Maximum 5 images per task
        },
        message: "Maximum 5 images allowed per task",
      },
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
  },
  {
    timestamps: true,
  }
);

// Index for location-based searches
taskSchema.index({ category: 1, status: 1 });
taskSchema.index({ postedBy: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ "location.coordinates": "2dsphere" }); // Geospatial index for location queries

export const Task = mongoose.model<ITask>("Task", taskSchema);
