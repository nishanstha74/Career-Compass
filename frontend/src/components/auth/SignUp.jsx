import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function SignUp() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  // 🔑 OTP FLOW STATE HANDLERS
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateField = (fieldName, value, forceTouched = false) => {
    const nextErrors = { ...errors };
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
    if (fieldName === "confirmPassword") {
      validateField("confirmPassword", confirmPassword, true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    const localErrors = {};

    if (name.trim() === "") localErrors.name = "Please enter your name.";
    if (!emailRegex.test(email)) {
      localErrors.email = "Please enter a valid email address.";
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[@$!%*?&]/.test(password)
    ) {
      localErrors.password =
        "Password must be 8+ characters with an uppercase letter, a number, and a special character.";
    }
    if (confirmPassword !== password) {
      localErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(localErrors);

    if (Object.keys(localErrors).length === 0) {
      setLoading(true);
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ fullName: name, email, password }),
          },
        );

        const data = await response.json();

        if (data.success) {
          setSuccessMessage(
            data.message || "Verification code sent to your email!",
          );
          setIsOtpStep(true);
        } else {
          setErrors({ form: data.message || "Registration failed." });
        }
      } catch (err) {
        console.error("Signup network error:", err);
        setErrors({
          form: "Cannot connect to authentication server. Is it running?",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setErrors({ otp: "Please enter the 6-digit code." });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/verify-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, otp }),
        },
      );

      const data = await response.json();

      if (data.success) {
        alert("Email verified successfully! 🎉 Redirecting to dashboard...");

        // Save session items right away so dashboard components work smoothly
        localStorage.setItem("userName", data.fullName || name);
        localStorage.setItem("userEmail", data.email || email);

        await checkAuth(); // Update global session state

        navigate("/dashboard");
      } else {
        setErrors({ form: data.message || "Invalid or expired OTP." });
      }
    } catch (err) {
      console.error("Verification error:", err);
      setErrors({ form: "Server connection failed during verification." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-700 flex min-h-screen items-center justify-center p-4 font-sans selection:bg-blue-200">
      <div
        className="relative flex w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-[#f4f7fa] px-6 shadow-2xl"
        style={{ minHeight: "800px" }}
      >
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {/* 👇 TOGGLE INTERFACES CONDITIONALLY HERE */}
          {!isOtpStep ? (
            <>
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100/70 text-[#1e40af] shadow-sm">
                  <UserPlus className="h-7 w-7" />
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

              {errors.form && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-bold uppercase tracking-wider text-[#475569]"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <User className="h-5 w-5" />
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
                      className={`w-full rounded-xl border bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-gray-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.name
                          ? "border-red-500 ring-2 ring-red-100"
                          : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-wider text-[#475569]"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Mail className="h-5 w-5" />
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
                      className={`w-full rounded-xl border bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-gray-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.email
                          ? "border-red-500 ring-2 ring-red-100"
                          : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.email}
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
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Lock className="h-5 w-5" />
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
                      className={`w-full rounded-xl border bg-[#f8fafc] py-3 pl-11 pr-12 text-sm text-slate-800 placeholder-gray-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.password
                          ? "border-red-500 ring-2 ring-red-100"
                          : "border-gray-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-slate-600 focus:outline-none"
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-bold uppercase tracking-wider text-[#475569]"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                      <Lock className="h-5 w-5" />
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
                      className={`w-full rounded-xl border bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-gray-400 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                        errors.confirmPassword
                          ? "border-red-500 ring-2 ring-red-100"
                          : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" />{" "}
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center space-x-2 rounded-xl bg-[#1e40af] px-4 py-3 font-semibold text-white shadow-md shadow-blue-200 transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  <span>{loading ? "Processing..." : "Create Account"}</span>
                  {!loading && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </form>

              <p className="pt-2 text-center text-sm text-[#64748b]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signin")}
                  className="font-bold text-[#1e40af] hover:underline focus:outline-none"
                >
                  Sign in
                </button>
              </p>
            </>
          ) : (
            <>
              {/* 📬 NEW VIEW: DISPLAYED ON SUCCESSFUL SUBMISSION */}
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100/70 text-green-600 shadow-sm">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-[#0f172a]">
                    Verify Your Email
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    We sent a 6-digit verification OTP to{" "}
                    <span className="font-semibold text-slate-700">
                      {email}
                    </span>
                    .
                  </p>
                </div>
              </div>

              {successMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errors.form && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleVerifyOtp} noValidate>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    disabled={loading}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#f8fafc] border border-gray-200 text-slate-800 placeholder-gray-400 rounded-xl px-4 py-3 text-center text-xl tracking-[0.4em] font-bold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  {errors.otp && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.otp}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center space-x-2 rounded-xl bg-[#1e40af] px-4 py-3 font-semibold text-white shadow-md shadow-blue-200 transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  <span>{loading ? "Verifying..." : "Verify Email"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOtpStep(false)}
                  className="w-full text-center text-xs text-[#64748b] hover:underline pt-2"
                >
                  ← Change Registration Details
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
