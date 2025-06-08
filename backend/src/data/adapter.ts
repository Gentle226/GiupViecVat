import mongoose from "mongoose";
import { memoryStore } from "./memoryStore";
import * as Models from "../models";

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class DatabaseAdapter {
  private useMemoryStore: boolean = false;
  async initialize(): Promise<void> {
    try {
      // Try to connect to MongoDB
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/homeeasy"
      );
      console.log("Connected to MongoDB");
      this.useMemoryStore = false;
    } catch (error) {
      console.warn("MongoDB connection failed, falling back to memory store");
      console.warn("Error:", error);
      this.useMemoryStore = true;
      // Seed demo data for memory store
      await memoryStore.seedDemoData();
    }
  } // User operations
  async createUser(userData: any) {
    if (this.useMemoryStore) {
      return await memoryStore.createUser(userData);
    } // For MongoDB, ensure we have the correct field format
    const mongoUserData = {
      ...userData,
      isTasker:
        userData.isTasker !== undefined
          ? userData.isTasker
          : userData.userType === "tasker",
    };
    delete mongoUserData.userType; // Remove userType as MongoDB uses isTasker

    const user = new Models.User(mongoUserData);
    const savedUser = await user.save();

    return savedUser;
  }

  async findUserByEmail(email: string) {
    if (this.useMemoryStore) {
      return await memoryStore.findUserByEmail(email);
    }
    return await Models.User.findOne({ email });
  }

  async findUserById(id: string) {
    if (this.useMemoryStore) {
      return await memoryStore.findUserById(id);
    }
    return await Models.User.findById(id);
  }

  async updateUser(id: string, updates: any) {
    if (this.useMemoryStore) {
      return await memoryStore.updateUser(id, updates);
    }
    return await Models.User.findByIdAndUpdate(id, updates, { new: true });
  }

  // Task operations
  async createTask(taskData: any) {
    if (this.useMemoryStore) {
      return await memoryStore.createTask(taskData);
    }
    const task = new Models.Task(taskData);
    return await task.save();
  }
  async findTasks(filter: any = {}, options: any = {}) {
    if (this.useMemoryStore) {
      let tasks = await memoryStore.getAllTasks(filter);

      // Apply search
      if (options.search) {
        tasks = tasks.filter(
          (task: any) =>
            task.title.toLowerCase().includes(options.search.toLowerCase()) ||
            task.description
              .toLowerCase()
              .includes(options.search.toLowerCase())
        );
      }

      // Apply location filtering
      if (filter.location) {
        const { lat, lng, radius } = filter.location;
        tasks = tasks.filter((task: any) => {
          if (!task.location?.coordinates) return false;
          const [taskLng, taskLat] = task.location.coordinates;
          const distance = calculateDistance(lat, lng, taskLat, taskLng);
          return distance <= radius;
        });
      }

      // Apply sorting
      if (options.sort) {
        tasks.sort((a: any, b: any) => {
          if (options.sort === "createdAt") {
            return (
              new Date(b.createdAt!).getTime() -
              new Date(a.createdAt!).getTime()
            );
          }
          if (options.sort === "budget") {
            return options.sortOrder === "asc"
              ? a.suggestedPrice - b.suggestedPrice
              : b.suggestedPrice - a.suggestedPrice;
          }
          return 0;
        });
      }

      // Apply pagination
      const startIndex = ((options.page || 1) - 1) * (options.limit || 10);
      const endIndex = startIndex + (options.limit || 10);

      return {
        tasks: tasks.slice(startIndex, endIndex),
        total: tasks.length,
        page: options.page || 1,
        totalPages: Math.ceil(tasks.length / (options.limit || 10)),
      };
    }

    // MongoDB queries - create base filter excluding location for now
    const mongoFilter = { ...filter };
    const locationFilter = mongoFilter.location;
    delete mongoFilter.location;

    let query = Models.Task.find(mongoFilter);

    // Apply search
    if (options.search) {
      query = query.find({
        $or: [
          { title: { $regex: options.search, $options: "i" } },
          { description: { $regex: options.search, $options: "i" } },
        ],
      });
    }

    // Apply location filtering using MongoDB's geospatial queries
    if (locationFilter) {
      const { lat, lng, radius } = locationFilter;
      query = query.find({
        "location.coordinates": {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6371], // radius in radians (Earth radius = 6371 km)
          },
        },
      });
    }

    // Apply sorting
    if (options.sort) {
      const sortOrder = options.sortOrder === "asc" ? 1 : -1;
      query = query.sort({ [options.sort]: sortOrder });
    }

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    let countQuery = Models.Task.find(mongoFilter);
    if (options.search) {
      countQuery = countQuery.find({
        $or: [
          { title: { $regex: options.search, $options: "i" } },
          { description: { $regex: options.search, $options: "i" } },
        ],
      });
    }
    if (locationFilter) {
      const { lat, lng, radius } = locationFilter;
      countQuery = countQuery.find({
        "location.coordinates": {
          $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6371],
          },
        },
      });
    }

    const [tasks, total] = await Promise.all([
      query
        .populate("postedBy", "firstName lastName rating reviewCount avatar")
        .skip(skip)
        .limit(limit),
      countQuery.countDocuments(),
    ]);

    return {
      tasks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
  async findTaskById(id: string) {
    if (this.useMemoryStore) {
      return await memoryStore.findTaskById(id);
    }
    return await Models.Task.findById(id).populate(
      "postedBy",
      "firstName lastName rating reviewCount avatar"
    );
  }
  async updateTask(id: string, updates: any) {
    if (this.useMemoryStore) {
      return await memoryStore.updateTask(id, updates);
    }
    return await Models.Task.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteTask(id: string) {
    if (this.useMemoryStore) {
      return await memoryStore.deleteTask(id);
    }
    return await Models.Task.findByIdAndDelete(id);
  }
  // Bid operations
  async createBid(bidData: any) {
    if (this.useMemoryStore) {
      return await memoryStore.createBid(bidData);
    }
    const bid = new Models.Bid(bidData);
    await bid.save();
    // Populate the bid with user information
    await bid.populate(
      "bidderId",
      "firstName lastName rating reviewCount avatar bio skills"
    );
    return bid;
  }
  async findBidsByTask(taskId: string) {
    if (this.useMemoryStore) {
      return await memoryStore.getBidsByTask(taskId);
    }
    return await Models.Bid.find({ taskId }).populate(
      "bidderId",
      "firstName lastName rating reviewCount avatar bio skills"
    );
  }

  async findBidsByTaskRaw(taskId: string) {
    if (this.useMemoryStore) {
      return await memoryStore.getBidsByTaskRaw(taskId);
    }
    return await Models.Bid.find({ taskId });
  }

  async findBidById(id: string) {
    if (this.useMemoryStore) {
      return await memoryStore.findBidById(id);
    }
    return await Models.Bid.findById(id);
  }

  async updateBid(id: string, updates: any) {
    if (this.useMemoryStore) {
      return await memoryStore.updateBid(id, updates);
    }
    return await Models.Bid.findByIdAndUpdate(id, updates, { new: true });
  }

  // Message operations
  async createMessage(messageData: any) {
    if (this.useMemoryStore) {
      return await memoryStore.createMessage(messageData);
    }
    const message = new Models.Message(messageData);
    return await message.save();
  }

  async findMessagesByConversation(conversationId: string) {
    if (this.useMemoryStore) {
      return await memoryStore.getMessagesByConversation(conversationId);
    }
    return await Models.Message.find({ conversationId }).sort({ createdAt: 1 });
  }

  // Conversation operations
  async createConversation(conversationData: any) {
    if (this.useMemoryStore) {
      return await memoryStore.createConversation(conversationData);
    }
    const conversation = new Models.Conversation(conversationData);
    return await conversation.save();
  }

  async findConversationsByUser(userId: string) {
    if (this.useMemoryStore) {
      return await memoryStore.getConversationsByUser(userId);
    }
    return await Models.Conversation.find({ participants: userId });
  }

  async findConversationById(id: string) {
    if (this.useMemoryStore) {
      return await memoryStore.findConversationById(id);
    }
    return await Models.Conversation.findById(id);
  }

  async findConversationByParticipantsAndTask(
    participant1: string,
    participant2: string,
    taskId?: string
  ) {
    if (this.useMemoryStore) {
      return await memoryStore.findConversationByParticipantsAndTask(
        participant1,
        participant2,
        taskId
      );
    }

    if (taskId) {
      return await Models.Conversation.findOne({
        participants: { $all: [participant1, participant2] },
        taskId: taskId,
      });
    } else {
      return await Models.Conversation.findOne({
        participants: { $all: [participant1, participant2] },
        taskId: null,
      });
    }
  }

  async updateConversation(id: string, updates: any) {
    if (this.useMemoryStore) {
      return await memoryStore.updateConversation(id, updates);
    }
    return await Models.Conversation.findByIdAndUpdate(id, updates, {
      new: true,
    });
  }

  // Review operations
  async createReview(reviewData: any) {
    if (this.useMemoryStore) {
      return await memoryStore.createReview(reviewData);
    }
    const review = new Models.Review(reviewData);
    return await review.save();
  }

  async findReviewsByUser(userId: string) {
    if (this.useMemoryStore) {
      return await memoryStore.getReviewsByTasker(userId);
    }
    return await Models.Review.find({ revieweeId: userId });
  }

  // Payment operations
  async createPayment(paymentData: any) {
    if (this.useMemoryStore) {
      return await memoryStore.createPayment(paymentData);
    }
    const payment = new Models.Payment(paymentData);
    return await payment.save();
  }

  async findPaymentsByTask(taskId: string) {
    if (this.useMemoryStore) {
      return await memoryStore.getPaymentsByUser(taskId);
    }
    return await Models.Payment.find({ taskId });
  }
}

export const db = new DatabaseAdapter();
