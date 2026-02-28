import api from "./axios";

/**
 * Fetch the authenticated user's profile from the backend.
 * Requires a valid JWT token in localStorage.
 *
 * @returns {Promise<{ email: string }>}
 */
export const fetchProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};
