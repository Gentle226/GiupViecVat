import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";

// Load environment variables first
dotenv.config();

import passport from "./config/passport";
import { createServer } from "http";
import { Server } from "socket.io";
import middleware from "i18next-http-middleware";
import i18n from "./config/i18n"; // Initialize i18n
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import taskRoutes from "./routes/tasks";
import bidRoutes from "./routes/bids";
import messageRoutes from "./routes/messages";
import paymentRoutes from "./routes/payments";
import reviewRoutes from "./routes/reviews";
import { authenticateSocket } from "./middleware/auth";
import { setupSocketHandlers } from "./socket/handlers";
import { setSocketInstance } from "./services/socketService";
import { db } from "./data/adapter";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? false
        : [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
          ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? false
        : [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// i18n middleware for language detection and translation
app.use(middleware.handle(i18n));

// Initialize Passport
app.use(passport.initialize());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.path.includes("/complete")) {
    console.log("=== COMPLETE REQUEST DEBUG ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Socket.io middleware
io.use(authenticateSocket);

// Set socket instance for use in other parts of the app
setSocketInstance(io);

// Socket.io handlers
setupSocketHandlers(io);

// Database initialization
db.initialize()
  .then(() => {
    console.log("Database initialized successfully");
  })
  .catch((error: any) => {
    console.error("Database initialization error:", error);
    // Continue with memory store if MongoDB fails
  });

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    const t = req.t || ((key: string) => key); // Fallback translation function
    res.status(500).json({
      success: false,
      message: t("general.serverError"),
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  const t = req.t || ((key: string) => key); // Fallback translation function
  res.status(404).json({
    success: false,
    message: t("general.notFound"),
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
