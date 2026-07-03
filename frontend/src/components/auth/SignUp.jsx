import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import Router navigation helper
import { useSignUp } from "@clerk/clerk-react"; // Import Clerk logic engine hook
import {
  User,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp(); // Initialize Clerk handler

  // Custom workflow toggle states: "signup" | "verify"
  const [mode, setMode] = useState("signup");
  const [verifyingCode, setVerifyingCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Validation States
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Shared Google Integration handler
  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    try {
      // Launches the native Google login window layout
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        // Redirects to the critical verification handler route first
        redirectUrl: `${window.location.origin}/sso-callback`,
        // Forwards fully verified profiles automatically to your private dashboard
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err) {
      console.error("Google authentication configuration error:", err);
    }
  };

  // Silent validation checker
  const validateField = (fieldName, value, forceTouched = false) => {
    let nextErrors = { ...errors };
    const isFieldTouched = forceTouched || touched[fieldName];

    if (fieldName === "name") {
      if (isFieldTouched && value.trim() === "") {
        nextErrors.name = "Please enter your name.";
      } else {
        delete nextErrors.name;
      }
    }

    if (fieldName === "email") {
      if (isFieldTouched) {
        if (!emailRegex.test(value)) {
          nextErrors.email = "Please enter a valid email address.";
        } else {
          delete nextErrors.email;
        }
      }
    }

    if (fieldName === "password") {
      if (isFieldTouched) {
        if (
          value.length < 8 ||
          !/[A-Z]/.test(value) ||
          !/[0-9]/.test(value) ||
          !/[@$!%*?&]/.test(value)
        ) {
          nextErrors.password =
            "Password must be 8+ characters with an uppercase letter, a number, and a special character.";
        } else {
          delete nextErrors.password;
        }
      }
      if (touched.confirmPassword && confirmPassword !== value) {
        nextErrors.confirmPassword = "Passwords do not match.";
      } else if (touched.confirmPassword && confirmPassword === value) {
        delete nextErrors.confirmPassword;
      }
    }

    if (fieldName === "confirmPassword") {
      if (isFieldTouched && value !== password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      } else {
        delete nextErrors.confirmPassword;
      }
    }

    setErrors(nextErrors);
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    if (fieldName === "name") validateField("name", name, true);
    if (fieldName === "email") validateField("email", email, true);
    if (fieldName === "password") validateField("password", password, true);
    if (fieldName === "confirmPassword")
      validateField("confirmPassword", confirmPassword, true);
  };

  // Stage 1: Form submission & OTP trigger code block
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    const allTouched = {
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    let localErrors = {};
    if (name.trim() === "") localErrors.name = "Please enter your name.";
    if (!emailRegex.test(email))
      localErrors.email = "Please enter a valid email address.";
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[@$!%*?&]/.test(password)
    ) {
      localErrors.password =
        "Password must be 8+ characters with an uppercase letter, a number, and a special character.";
    }
    if (confirmPassword !== password)
      localErrors.confirmPassword = "Passwords do not match.";

    setErrors(localErrors);

    if (Object.keys(localErrors).length === 0) {
      setLoading(true);
      try {
        // Creates user profile instance securely within Clerk database engine
        await signUp.create({
          emailAddress: email,
          password: password,
          firstName: name.split(" ")[0] || "",
          lastName: name.split(" ").slice(1).join(" ") || "",
        });

        // Configures verification step context wrapper -> Sends the OTP email
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        // Transition UI display view to input state code block without breaking wrapper styles
        setMode("verify");
      } catch (err) {
        console.error("Clerk Email Signup Error:", err);
        setErrors({
          form:
            err.errors?.[0]?.message || "An identity system error occurred.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Stage 2: Verification processing code block
  const handleVerifyOTPSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    setErrors({});

    if (verifyingCode.trim().length !== 6) {
      setErrors({ verify: "Please enter the complete 6-digit code." });
      return;
    }

    setLoading(true);
    try {
      // Complete confirmation check submission matching backend tokens
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verifyingCode,
      });

      if (completeSignUp.status === "complete") {
        // Secure token browser storage injection layout logic
        await setActive({ session: completeSignUp.createdSessionId });
        navigate("/dashboard");
      } else {
        setErrors({ verify: "Registration status incomplete. Try again." });
      }
    } catch (err) {
      console.error("Clerk Email OTP Check Error:", err);
      setErrors({
        verify:
          err.errors?.[0]?.message || "Invalid or expired confirmation code.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-700 flex items-center justify-center min-h-screen p-4 font-sans selection:bg-blue-200">
      <div
        className="w-full max-w-5xl bg-[#f4f7fa] rounded-3xl shadow-2xl border border-gray-200 flex flex-col justify-center items-center overflow-hidden relative px-6"
        style={{ minHeight: "800px" }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
          {/* ==================== VIEW DISPLAY MODE: SIGNUP FIELDS ==================== */}
          {mode === "signup" && (
            <>
              {/* Header with Logo Badge */}
              <div className="text-center space-y-3 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100/70 rounded-2xl flex items-center justify-center text-[#1e40af] mb-1 shadow-sm">
                  <UserPlus className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-[#0f172a]">
                    Create Account
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    Create an account to get started.
                  </p>
                </div>
              </div>

              {/* Form System error logging */}
              {errors.form && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-bold uppercase tracking-wider text-[#475569]"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      id="name"
                      placeholder="Full Name"
                      value={name}
                      disabled={loading}
                      onChange={(e) => {
                        setName(e.target.value);
                        validateField("name", e.target.value);
                      }}
                      onBlur={() => handleBlur("name")}
                      className={`w-full bg-[#f8fafc] border ${
                        errors.name
                          ? "border-red-500 ring-2 ring-red-100"
                          : "border-gray-200"
                      } text-slate-800 placeholder-gray-400 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-wider text-[#475569]"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      id="email"
                      placeholder="Email"
                      value={email}
                      disabled={loading}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        validateField("email", e.target.value);
                      }}
                      onBlur={() => handleBlur("email")}
                      className={`w-full bg-[#f8fafc] border ${
                        errors.email
                          ? "border-red-500 ring-2 ring-red-100"
                          : "border-gray-200"
                      } text-slate-800 placeholder-gray-400 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-wider text-[#475569]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      placeholder="Password"
                      value={password}
                      disabled={loading}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        validateField("password", e.target.value);
                      }}
                      onBlur={() => handleBlur("password")}
                      className={`w-full bg-[#f8fafc] border ${
                        errors.password
                          ? "border-red-500 ring-2 ring-red-100"
                          : "border-gray-200"
                      } text-slate-800 placeholder-gray-400 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      {passwordVisible ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-bold uppercase tracking-wider text-[#475569]"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type="password"
                      id="confirmPassword"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      disabled={loading}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        validateField("confirmPassword", e.target.value);
                      }}
                      onBlur={() => handleBlur("confirmPassword")}
                      className={`w-full bg-[#f8fafc] border ${
                        errors.confirmPassword
                          ? "border-red-500 ring-2 ring-red-100"
                          : "border-gray-200"
                      } text-slate-800 placeholder-gray-400 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />{" "}
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-md shadow-blue-200 group mt-4"
                >
                  <span>{loading ? "Processing..." : "Create Account"}</span>
                  {!loading && (
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </form>

              {/* Divider Line */}
              <div className="relative flex py-2 items-center text-gray-300">
                <div className="grow border-t border-gray-200"></div>
                <span className="shrink mx-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  or
                </span>
                <div className="grow border-t border-gray-200"></div>
              </div>

              {/* Google Sign Up Button Wrapper */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full bg-white hover:bg-gray-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-gray-200 flex items-center justify-center space-x-2.5 transition-all shadow-sm focus:outline-none"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm">Continue with Google</span>
              </button>
            </>
          )}

          {/* ==================== VIEW DISPLAY MODE: VERIFY EMAIL OTP ==================== */}
          {mode === "verify" && (
            <>
              {/* Return to adjustment inputs back arrow layout */}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] hover:text-[#1e40af] transition-colors focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4" /> Change registration info
              </button>

              <div className="text-center space-y-3 flex flex-col items-center pt-2">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-1 shadow-sm">
                  <Mail className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-[#0f172a]">
                    Verify Email
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    We sent a 6-digit verification code to <br />
                    <span className="font-semibold text-slate-700">
                      {email}
                    </span>
                  </p>
                </div>
              </div>

              {errors.verify && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.verify}</span>
                </div>
              )}

              <form
                className="space-y-5"
                onSubmit={handleVerifyOTPSubmit}
                noValidate
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569] text-center block">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={verifyingCode}
                    disabled={loading}
                    onChange={(e) =>
                      setVerifyingCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl py-3.5 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 placeholder-gray-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center transition-colors shadow-md shadow-green-100"
                >
                  <span>{loading ? "Verifying..." : "Verify & Log In"}</span>
                </button>
              </form>
            </>
          )}

          {/* Alternative Link */}
          <p className="text-center text-sm text-[#64748b] pt-2">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signin")}
              className="font-bold text-[#1e40af] hover:underline focus:outline-none"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
