import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FIREBASE_READY } from "../services/firebase.js";

/**
 * Route guard — redirects to /login if the user is not authenticated.
 * When Firebase is not configured, access is granted unconditionally.
 */
export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  // Firebase not configured → allow direct access without login
  if (!FIREBASE_READY) return children;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
