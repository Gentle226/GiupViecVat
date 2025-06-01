import mongoose from "mongoose";
import { memoryStore } from "./memoryStore";
import * as Models from "../models";

export class DatabaseAdapter {
  private useMemoryStore: boolean = false;
  async initialize(): Promise<void> {
    try {
      // Force memory store for testing
      throw new Error("Using memory store for testing");
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
  }

  // User operations
  async createUser(userData: any) {
    if (this.useMemoryStore) {
      return await memoryStore.createUser(userData);
    }
    const user = new Models.User(userData);
    return await user.save();
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
      } // Apply sorting
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

    let query = Models.Task.find(filter);

    // Apply search
    if (options.search) {
      query = query.find({
        $or: [
          { title: { $regex: options.search, $options: "i" } },
          { description: { $regex: options.search, $options: "i" } },
        ],
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

    const [tasks, total] = await Promise.all([
      query.skip(skip).limit(limit),
      Models.Task.countDocuments(filter),
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
    return await Models.Task.findById(id);
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
    return await bid.save();
  }

  async findBidsByTask(taskId: string) {
    if (this.useMemoryStore) {
      return await memoryStore.getBidsByTask(taskId);
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
