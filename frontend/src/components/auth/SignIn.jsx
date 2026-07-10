import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

export default function SignIn() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  useEffect(() => {
    const remembered = localStorage.getItem("cc_remembered_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const validateField = (fieldName, value, forceTouched = false) => {
    let nextErrors = { ...errors };
    const isFieldTouched = forceTouched || touched[fieldName];

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
      if (isFieldTouched && value.trim() === "") {
        nextErrors.password = "Please enter your password.";
      } else {
        delete nextErrors.password;
      }
    }

    setErrors(nextErrors);
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    if (fieldName === "email") validateField("email", email, true);
    if (fieldName === "password") validateField("password", password, true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({ email: true, password: true });

    const localErrors = {};
    if (!emailRegex.test(email)) {
      localErrors.email = "Please enter a valid email address.";
    }
    if (password.trim() === "") {
      localErrors.password = "Please enter your password.";
    }

    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    try {
      if (rememberMe) {
        localStorage.setItem("cc_remembered_email", email);
      } else {
        localStorage.removeItem("cc_remembered_email");
      }

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // 🔐 Store session variables in local storage
        localStorage.setItem("userName", data.fullName);
        localStorage.setItem("userEmail", data.email);
        console.log("Login successful!");
        navigate("/dashboard");
      } else {
        setErrors({ form: data.message || "Invalid credentials." });
      }
    } catch (err) {
      console.error("Signin network error:", err);
      setErrors({
        form: "Cannot connect to authentication server. Is it running?",
      });
    }
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setResetError("");

    if (!emailRegex.test(resetEmail)) {
      setResetError("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResetSuccess(
        "Password reset link would be sent in a real backend setup.",
      );
      setMode("forgot-verify");
    } catch (err) {
      console.error("Reset code error:", err);
      setResetError("Couldn't send reset code. Try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setResetError("");

    if (code.trim().length === 0) {
      setResetError("Please enter the code sent to your email.");
      return;
    }

    setResetLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMode("forgot-reset");
    } catch (err) {
      console.error("Verify code error:", err);
      setResetError("Invalid or expired code.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResetSuccess("Password updated! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      console.error("Reset password error:", err);
      setResetError("Couldn't reset password. Try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const backToSignIn = () => {
    setMode("signin");
    setResetError("");
    setResetSuccess("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleGoogleSignIn = () => {
    setErrors({
      form: "Google sign-in is not configured in this prototype. Please use email sign-in.",
    });
  };

  return (
    <div className="bg-slate-700 flex items-center justify-center min-h-screen p-4 font-sans selection:bg-blue-200">
      <div
        className="w-full max-w-5xl bg-[#f4f7fa] rounded-3xl shadow-2xl border border-gray-200 flex flex-col justify-center items-center overflow-hidden relative px-6"
        style={{ minHeight: "800px" }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
          {mode === "signin" && (
            <>
              <div className="text-center space-y-3 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100/70 rounded-2xl flex items-center justify-center text-[#1e40af] mb-1 shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-[#0f172a]">Welcome</h2>
                  <p className="text-sm text-[#64748b]">
                    Sign in to your account
                  </p>
                </div>
              </div>

              {errors.form && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#1e40af] focus:ring-blue-400 cursor-pointer"
                    />
                    <span className="text-sm text-[#475569]">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setMode("forgot-request");
                    }}
                    className="text-sm font-semibold text-[#1e40af] hover:underline focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-md shadow-blue-200 group mt-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>

              <div className="relative flex py-2 items-center text-gray-300">
                <div className="grow border-t border-gray-200"></div>
                <span className="shrink mx-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  or
                </span>
                <div className="grow border-t border-gray-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
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

              <p className="text-center text-sm text-[#64748b] pt-2">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="font-bold text-[#1e40af] hover:underline focus:outline-none"
                >
                  Sign up
                </button>
              </p>
            </>
          )}

          {mode === "forgot-request" && (
            <>
              <BackButton onClick={backToSignIn} />
              <div className="text-center space-y-2 pt-2">
                <h2 className="text-2xl font-bold text-[#0f172a]">
                  Reset your password
                </h2>
                <p className="text-sm text-[#64748b]">
                  Enter your email and we'll send you a code to reset your
                  password.
                </p>
              </div>

              {resetError && <ErrorBanner message={resetError} />}

              <form
                className="space-y-4"
                onSubmit={handleSendResetCode}
                noValidate
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      placeholder="Email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-gray-200 text-slate-800 placeholder-gray-400 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
                >
                  {resetLoading ? "Sending code..." : "Send reset code"}
                </button>
              </form>
            </>
          )}

          {mode === "forgot-verify" && (
            <>
              <BackButton onClick={backToSignIn} />
              <div className="text-center space-y-2 pt-2">
                <h2 className="text-2xl font-bold text-[#0f172a]">
                  Check your email
                </h2>
                <p className="text-sm text-[#64748b]">
                  Enter the 6-digit code we sent to{" "}
                  <span className="font-semibold text-slate-700">
                    {resetEmail}
                  </span>
                </p>
              </div>

              {resetError && <ErrorBanner message={resetError} />}

              <form
                className="space-y-4"
                onSubmit={handleVerifyResetCode}
                noValidate
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#f8fafc] border border-gray-200 text-slate-800 placeholder-gray-400 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
                >
                  {resetLoading ? "Verifying..." : "Verify code"}
                </button>

                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={resetLoading}
                  className="w-full text-sm font-semibold text-[#1e40af] hover:underline focus:outline-none"
                >
                  Resend code
                </button>
              </form>
            </>
          )}

          {mode === "forgot-reset" && (
            <>
              <div className="text-center space-y-2 pt-2">
                <h2 className="text-2xl font-bold text-[#0f172a]">
                  Set new password
                </h2>
                <p className="text-sm text-[#64748b]">
                  Choose a new password for your account.
                </p>
              </div>

              {resetError && <ErrorBanner message={resetError} />}
              {resetSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <form
                className="space-y-4"
                onSubmit={handleResetPassword}
                noValidate
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                      <Lock className="w-5 h-5" />
                    </span>
                    <input
                      type={newPasswordVisible ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-gray-200 text-slate-800 placeholder-gray-400 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      {newPasswordVisible ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    Confirm Password
                  </label>
                  <input
                    type={newPasswordVisible ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-gray-200 text-slate-800 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
                >
                  {resetLoading ? "Updating..." : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] hover:text-[#1e40af] transition-colors focus:outline-none"
    >
      <ArrowLeft className="w-4 h-4" /> Back to sign in
    </button>
  );
}

// Small helper for cleaner modularity
function ErrorBanner({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
