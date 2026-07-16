import express from "express";
import {
  register,
  login,
  logout,
  checkAuth,
  verifyEmail,
  updateProfilePhoto,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// 1. REGISTER ENDPOINT
router.post("/register", register);

// 2. LOGIN ENDPOINT
router.post("/login", login);

// 3. LOGOUT ENDPOINT
router.post("/logout", logout);

// 4. EMAIL VERIFICATION ENDPOINT
router.post("/verify-email", verifyEmail);

// 5. CHECK AUTH ENDPOINT
router.get("/check", protectRoute, checkAuth);

// 6. UPDATE PROFILE PHOTO
router.post("/profile-photo", protectRoute, updateProfilePhoto);

export default router;
