<<<<<<< Updated upstream
=======
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import multer from "multer";

import authRoutes from "./src/routes/auth.js";
import feedbackRoutes from "./src/routes/feedback.js";
import mlRoutes from "./src/routes/ml.js";

const app = express();

// ── 1. CORS Configuration ───────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// ── 2. Request Parsing Middlewares ──────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── 3. Database Connection ─────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn("⚠️ MONGO_URI environment variable is missing. Database features will fail.");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("💾 Connected successfully to MongoDB Atlas!"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));
}

// ── 4. API Endpoint Routes ──────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ml", mlRoutes);

// Root health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "active",
    service: "Career-Compass Backend API",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ── 5. Unhandled Route (404) Fallback ──────────────────────
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ── 6. Global & Multer Error Handling ──────────────────────
app.use((err, req, res, next) => {
  console.error("⚠️ Server Error:", err.stack || err.message);

  // Catch Multer upload errors specifically (file size limits, mime type errors)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum allowed file size is 5 MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Generic internal server error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ── 7. Process Lifecycle & Server Listener ──────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Closing HTTP server and MongoDB connection...`);
  server.close(async () => {
    await mongoose.connection.close();
    console.log("👋 Server and Database connections closed cleanly.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
>>>>>>> Stashed changes
