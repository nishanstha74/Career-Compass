import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateJwtToken from "../lib/utils.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/mail.js";

export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[@$!%*?&]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be 8+ characters with an uppercase letter, a number, and a special character.",
      });
    }

    // check if email is valid: regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Password will be hashed by pre-save hook; no manual hashing needed

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create newUser
    const newUser = new User({
      fullName,
      email,
      password, // stored as plain, will be hashed by pre-save hook
      isVerified: false,
      verificationOtp: otp,
      verificationOtpExpiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    if (newUser) {
      const savedUser = await newUser.save();
      await sendVerificationEmail(savedUser.email, otp);
      // generateJwtToken(savedUser._id, res);

      // console.log(`✅ New user registered successfully: ${savedUser.email}`);

      res.status(201).json({
        success: true,
        message:
          "Registration successful. Please check your email for the verification OTP.",
        // _id: savedUser._id,
        // fullName: savedUser.fullName,
        // email: savedUser.email,
      });
    }
  } catch (error) {
    console.log("Error in register controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Added email confirmation validator controller logic block
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    // Trim the OTP and make sure we compare strings
    const otpString = String(otp).trim();
    console.log(
      "🔍 Verify email request - email:",
      email,
      "otp received:",
      otpString,
    );
    // Ensure OTP is treated as a string for strict comparison
    // (already trimmed above)
    if (!email || !otpString) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const user = await User.findOne({ email });
    console.log(
      "🔍 User found:",
      user?.email,
      "stored OTP:",
      user?.verificationOtp,
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (String(user.verificationOtp).trim() !== otpString) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (user.verificationOtpExpiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    // Clear confirmation fields and unlock authentication capability
    user.isVerified = true;
    user.verificationOtp = "";
    user.verificationOtpExpiresAt = null;

    await user.save();

    // Generate JWT so the client can be authenticated immediately
    generateJwtToken(user._id, res);
    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      fullName: user.fullName,
      email: user.email,
    });
  } catch (error) {
    console.log("Error in verifyEmail controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    //  Prevent unverified profiles from continuing through password validation matches
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    generateJwtToken(user._id, res);

    console.log(`🔑 User logged in successfully: ${user.email}`);

    res.status(200).json({
      success: true,
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePhoto: user.profilePhoto,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Logout error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.log("checkAuth error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfilePhoto = async (req, res) => {
  try {
    const { profilePhoto } = req.body;
    const userId = req.user._id;

    if (!profilePhoto) {
      return res.status(400).json({ success: false, message: "Profile photo is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePhoto },
      { returnDocument: 'after' }
    ).select("-password");

    console.log(`✅ Profile image saved successfully for user: ${updatedUser.email}`);

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Error in updateProfilePhoto:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// FORGOT PASSWORD - Step 1: Send OTP to email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Security: Don't reveal whether email exists
      return res.status(200).json({ success: true, message: "If that email is registered, you will receive an OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendPasswordResetEmail(email, otp);
    console.log(`✅ Password reset OTP sent to: ${email}`);

    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// FORGOT PASSWORD - Step 2: Verify OTP
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    if (user.resetPasswordOtp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again." });
    }

    if (Date.now() > user.resetPasswordOtpExpiresAt) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error in verifyResetOtp:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// FORGOT PASSWORD - Step 3: Set new password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    if (user.resetPasswordOtp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Incorrect OTP." });
    }

    if (Date.now() > user.resetPasswordOtpExpiresAt) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Validate new password strength
    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[@$!%*?&]/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8+ characters with an uppercase letter, a number, and a special character.",
      });
    }

    user.password = newPassword; // pre-save hook will hash it
    user.resetPasswordOtp = "";
    user.resetPasswordOtpExpiresAt = undefined;
    await user.save();

    console.log(`✅ Password reset successfully for: ${email}`);
    res.status(200).json({ success: true, message: "Password updated successfully. You can now sign in." });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
