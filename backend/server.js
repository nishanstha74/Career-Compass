// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/auth.js"; // 👈 Import your routes

// Load Environment Variables (.env)
dotenv.config();
console.log(process.env.MONGO_URI);

const app = express();

// Middleware Configs
app.use(
  cors({
    origin: "http://localhost:5173", // Assuming Vite frontend runs here
    credentials: true,
  }),
);
app.use(express.json()); // Essential to read data sent from frontend signup/login
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

// Root verification endpoint
app.get("/", (req, res) => {
  res.send("🚀 Career-Compass Backend is active and running!");
});

// App listener to keep process alive
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});
