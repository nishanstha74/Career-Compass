import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";

// Protected Route: Instantly checks if user is signed in, no full-screen loading block
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null; // Returns nothing until Clerk resolves, preventing flashes
  return isSignedIn ? children : <Navigate to="/signin" replace />;
}

// Public Route: Instantly checks status to eliminate the loading delay
function PublicRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null; // Returns nothing until Clerk resolves, preventing flashes
  return !isSignedIn ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. DEFAULT ROOT ROUTE: Automatically opens the Home landing page when you run the program */}
        <Route path="/" element={<Home />} />

        {/* Public Authentication Routes */}
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />

        {/* Handles the Google OAuth handshake processing safely */}
        <Route
          path="/sso-callback"
          element={<AuthenticateWithRedirectCallback />}
        />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 2. CATCH-ALL FALLBACK: Redirects broken or unrecognized URLs back to the Home page safely */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
