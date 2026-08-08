import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config"; // loads .env first
import cookieParser from "cookie-parser";

import authRoutes from "./src/routes/auth.js"; // 👈 Import your routes
import feedbackRoutes from "./src/routes/feedback.js"; // feedback endpoint
import mlRoutes from "./src/routes/ml.js"; // ML service route

const app = express();

// Middleware Configs
app.use(
  cors({
    origin: "http://localhost:5173", // Assuming Vite frontend runs here
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "5mb" })); // Parse URL‑encoded bodies (e.g., form submissions)
app.use(cookieParser()); // Enable parsing cookies

// Connect to MongoDB Atlas
const MONGO_URI =
  process.env.MONGO_URI || "your_mongodb_connection_string_here";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("💾 Connected successfully to MongoDB Atlas!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Wire up your Endpoints
app.use("/api/auth", authRoutes); // All endpoints will now be at http://localhost:5000/api/auth/register etc.
app.use("/api/feedback", feedbackRoutes); // feedback endpoint
app.use("/api/ml", mlRoutes); // ML service endpoint

// Root verification endpoint
app.get("/", (req, res) => {
  res.send("🚀 Career-Compass Backend is active and running!");
});

// App listener to keep process alive
const PORT = process.env.PORT || 5000;
// Generic error‑handling middleware (must be after all route definitions)
app.use((err, req, res, next) => {
  console.error("⚠️ Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () =>
  console.log(`🚀 Server is listening on http://localhost:${PORT}`),
);

