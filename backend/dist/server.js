"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables first
dotenv_1.default.config();
const passport_1 = __importDefault(require("./config/passport"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const i18next_http_middleware_1 = __importDefault(require("i18next-http-middleware"));
const i18n_1 = __importDefault(require("./config/i18n")); // Initialize i18n
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const bids_1 = __importDefault(require("./routes/bids"));
const messages_1 = __importDefault(require("./routes/messages"));
const payments_1 = __importDefault(require("./routes/payments"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const auth_2 = require("./middleware/auth");
const handlers_1 = require("./socket/handlers");
const socketService_1 = require("./services/socketService");
const adapter_1 = require("./data/adapter");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === "production"
            ? false
            : [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
            ],
        methods: ["GET", "POST"],
        credentials: true,
    },
});
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? false
        : [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
        ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files for uploaded images
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// i18n middleware for language detection and translation
app.use(i18next_http_middleware_1.default.handle(i18n_1.default));
// Initialize Passport
app.use(passport_1.default.initialize());
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
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/tasks", tasks_1.default);
app.use("/api/bids", bids_1.default);
app.use("/api/messages", messages_1.default);
app.use("/api/payments", payments_1.default);
app.use("/api/reviews", reviews_1.default);
// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
// Socket.io middleware
io.use(auth_2.authenticateSocket);
// Set socket instance for use in other parts of the app
(0, socketService_1.setSocketInstance)(io);
// Socket.io handlers
(0, handlers_1.setupSocketHandlers)(io);
// Database initialization
adapter_1.db.initialize()
    .then(() => {
    console.log("Database initialized successfully");
})
    .catch((error) => {
    console.error("Database initialization error:", error);
    // Continue with memory store if MongoDB fails
});
// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    const t = req.t || ((key) => key); // Fallback translation function
    res.status(500).json({
        success: false,
        message: t("general.serverError"),
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
// 404 handler
app.use("*", (req, res) => {
    const t = req.t || ((key) => key); // Fallback translation function
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
//# sourceMappingURL=server.js.map