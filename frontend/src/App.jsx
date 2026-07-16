import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import Dashboard from "./components/pages/Dashboard/Dashboard";
import Home from "./components/pages/Home";
import FeedbackModal from "./components/modals/FeedbackModal";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. DEFAULT ROOT ROUTE: Automatically opens the Home landing page when you run the program */}
        <Route path="/" element={<Home />} />

        {/* Authentication Routes */}
        <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

        {/* Dashboard Route */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* 2. CATCH-ALL FALLBACK: Redirects broken or unrecognized URLs back to the Home page safely */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
