import bcrypt from "bcryptjs";
import {
  User,
  Task,
  Bid,
  Message,
  Conversation,
  Review,
  Payment,
  CreateUserData,
  UserType,
  TaskCategory,
  TaskStatus,
  BidStatus,
} from "../types";

// In-memory data store for development
class MemoryStore {
  private users: User[] = [];
  private tasks: Task[] = [];
  private bids: Bid[] = [];
  private messages: Message[] = [];
  private conversations: Conversation[] = [];
  private reviews: Review[] = [];
  private payments: Payment[] = [];

  // Generate simple IDs
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
  // Users
  async createUser(userData: CreateUserData): Promise<User> {
    // Hash password if provided
    let hashedPassword = userData.password;
    if (userData.password && !userData.password.startsWith("$2a$")) {
      hashedPassword = await bcrypt.hash(userData.password, 10);
    }
    const user: User = {
      _id: this.generateId(),
      email: userData.email,
      password: hashedPassword,
      name: `${userData.firstName} ${userData.lastName}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType as UserType,
      location: userData.location.address, // Convert object to string
      rating: 0,
      reviewCount: 0,
      completedTasks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: userData.avatar,
      bio: userData.bio,
      skills: userData.skills,
    };
    this.users.push(user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.find((user) => user._id === id) || null;
  }

  async updateUser(id: string, updates: any): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user._id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };
    return this.users[userIndex];
  }

  // Tasks
  async createTask(taskData: any): Promise<Task> {
    const task: Task = {
      ...taskData,
      _id: this.generateId(),
      status: TaskStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(task);
    return task;
  }

  async findTasks(
    filter: any = {},
    options: any = {}
  ): Promise<{ tasks: Task[]; total: number }> {
    let tasks = [...this.tasks];

    // Apply filters
    if (filter.postedBy) {
      tasks = tasks.filter((task) => task.postedBy === filter.postedBy);
    }
    if (filter.status) {
      tasks = tasks.filter((task) => task.status === filter.status);
    }
    if (filter.category) {
      tasks = tasks.filter((task) => task.category === filter.category);
    }
    if (filter.clientId) {
      tasks = tasks.filter((task) => task.postedBy === filter.clientId);
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (options.sort) {
      tasks.sort((a, b) => {
        switch (options.sort) {
          case "createdAt":
            return options.order === "desc"
              ? b.createdAt.getTime() - a.createdAt.getTime()
              : a.createdAt.getTime() - b.createdAt.getTime();
          case "budget":
            return options.order === "desc"
              ? b.suggestedPrice - a.suggestedPrice
              : a.suggestedPrice - b.suggestedPrice;
          default:
            return 0;
        }
      });
    }

    const total = tasks.length;

    // Apply pagination
    if (options.page && options.limit) {
      const startIndex = (options.page - 1) * options.limit;
      tasks = tasks.slice(startIndex, startIndex + options.limit);
    }

    return { tasks, total };
  }

  async findTaskById(id: string): Promise<Task | null> {
    return this.tasks.find((task) => task._id === id) || null;
  }

  async updateTask(id: string, updates: any): Promise<Task | null> {
    const taskIndex = this.tasks.findIndex((task) => task._id === id);
    if (taskIndex === -1) return null;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date(),
    };
    return this.tasks[taskIndex];
  }

  // Bids
  async createBid(bidData: any): Promise<Bid> {
    const bid: Bid = {
      ...bidData,
      _id: this.generateId(),
      status: BidStatus.PENDING,
      createdAt: new Date(),
    };
    this.bids.push(bid);

    return bid;
  }

  async findBidsByTaskId(taskId: string): Promise<Bid[]> {
    return this.bids.filter((bid) => bid.taskId === taskId);
  }

  async findBidById(id: string): Promise<Bid | null> {
    return this.bids.find((bid) => bid._id === id) || null;
  }

  async updateBid(id: string, updates: any): Promise<Bid | null> {
    const bidIndex = this.bids.findIndex((bid) => bid._id === id);
    if (bidIndex === -1) return null;

    this.bids[bidIndex] = {
      ...this.bids[bidIndex],
      ...updates,
    };
    return this.bids[bidIndex];
  }

  // Messages
  async createMessage(messageData: any): Promise<Message> {
    const message: Message = {
      ...messageData,
      _id: this.generateId(),
      timestamp: new Date(),
      readBy: [],
    };
    this.messages.push(message);
    return message;
  }

  async findMessagesByConversationId(
    conversationId: string
  ): Promise<Message[]> {
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Conversations
  async createConversation(conversationData: any): Promise<Conversation> {
    const conversation: Conversation = {
      ...conversationData,
      _id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.push(conversation);
    return conversation;
  }

  async findConversationsByUserId(userId: string): Promise<Conversation[]> {
    return this.conversations.filter((conv) =>
      conv.participants.includes(userId)
    );
  }

  // Reviews
  async createReview(reviewData: any): Promise<Review> {
    const review: Review = {
      ...reviewData,
      _id: this.generateId(),
      createdAt: new Date(),
    };
    this.reviews.push(review);
    return review;
  }

  async findReviewsByUserId(userId: string): Promise<Review[]> {
    return this.reviews.filter((review) => review.revieweeId === userId);
  }

  // Payments
  async createPayment(paymentData: any): Promise<Payment> {
    const payment: Payment = {
      ...paymentData,
      _id: this.generateId(),
      createdAt: new Date(),
    };
    this.payments.push(payment);
    return payment;
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    return this.payments.find((payment) => payment._id === id) || null;
  }

  async updatePayment(id: string, updates: any): Promise<Payment | null> {
    const paymentIndex = this.payments.findIndex(
      (payment) => payment._id === id
    );
    if (paymentIndex === -1) return null;

    this.payments[paymentIndex] = {
      ...this.payments[paymentIndex],
      ...updates,
    };
    return this.payments[paymentIndex];
  }

  // Seed demo data
  async seedDemoData(): Promise<void> {
    if (this.users.length === 0) {
      console.log("Seeding demo data...");

      // Create demo users
      const clientUser = await this.createUser({
        email: "client@demo.com",
        password: "password123",
        firstName: "John",
        lastName: "Client",
        userType: UserType.CLIENT,
        location: {
          address: "123 Main St, New York, NY",
          coordinates: [-74.0059, 40.7128],
        },
      });

      const taskerUser = await this.createUser({
        email: "tasker@demo.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Tasker",
        userType: UserType.TASKER,
        location: {
          address: "456 Oak Ave, New York, NY",
          coordinates: [-74.0159, 40.7228],
        },
        bio: "Experienced handyperson and cleaner",
        skills: ["Cleaning", "Furniture Assembly", "Moving"],
      });

      // Create demo tasks
      const cleaningTask = await this.createTask({
        title: "Deep cleaning for 3-bedroom apartment",
        description:
          "Need a thorough deep cleaning of my apartment including kitchen, bathrooms, and all bedrooms.",
        category: TaskCategory.CLEANING,
        suggestedPrice: 150,
        location: {
          address: "789 Park Ave, New York, NY",
          coordinates: [-73.9659, 40.7828],
        },
        postedBy: clientUser._id,
      });

      const assemblyTask = await this.createTask({
        title: "IKEA furniture assembly",
        description:
          "Need help assembling a wardrobe, bed frame, and desk from IKEA.",
        category: TaskCategory.HANDYMAN,
        suggestedPrice: 80,
        location: {
          address: "321 Broadway, New York, NY",
          coordinates: [-73.9959, 40.7528],
        },
        postedBy: clientUser._id,
      });

      // Create demo bids
      await this.createBid({
        taskId: cleaningTask._id,
        bidderId: taskerUser._id,
        amount: 140,
        message:
          "I have 5 years of professional cleaning experience and can bring all supplies.",
        estimatedDuration: 5,
      });

      await this.createBid({
        taskId: assemblyTask._id,
        bidderId: taskerUser._id,
        amount: 75,
        message:
          "I've assembled hundreds of IKEA pieces. Quick and efficient service!",
        estimatedDuration: 2.5,
      });

      console.log("Demo data seeded successfully");
    }
  }
}

const memoryStore = new MemoryStore();

export default memoryStore;
export { memoryStore };
