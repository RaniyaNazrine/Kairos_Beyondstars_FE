import { Navigate } from "react-router-dom";
import { auth } from "../lib/kairosClient";

/**
 * Wrapper that redirects unauthenticated users to /auth.
 * Uses in-memory auth state from kairosClient (no localStorage).
 */
const ProtectedRoute = ({ children }) => {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
