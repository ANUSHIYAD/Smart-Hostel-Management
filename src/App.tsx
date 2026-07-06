import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* General Public Landing page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Authentication & Onboarding pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Main Secure Core Dashboard Panel */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Catch-all and fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
