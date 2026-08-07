import express from "express";
import {
  register,
  login,
  logout,
  checkAuth,
  verifyEmail,
  updateProfilePhoto,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
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

// 7. FORGOT PASSWORD - Send OTP
router.post("/forgot-password", forgotPassword);

// 8. FORGOT PASSWORD - Verify OTP
router.post("/verify-reset-otp", verifyResetOtp);

// 9. FORGOT PASSWORD - Reset password
router.post("/reset-password", resetPassword);

export default router;
