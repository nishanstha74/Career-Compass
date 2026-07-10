import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import Dashboard from "./components/pages/Dashboard";
import Home from "./components/pages/Home";
import FeedbackModal from "./components/modals/FeedbackModal";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. DEFAULT ROOT ROUTE: Automatically opens the Home landing page when you run the program */}
        <Route path="/" element={<Home />} />

        {/* Authentication Routes (To be updated with JWT logic) */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Dashboard Route (Currently unprotected until JWT is added) */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 2. CATCH-ALL FALLBACK: Redirects broken or unrecognized URLs back to the Home page safely */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
