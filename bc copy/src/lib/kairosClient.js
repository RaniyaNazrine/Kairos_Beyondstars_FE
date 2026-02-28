// ── Kairos Agent API Client ────────────────────────────────────────────────
// All domain data comes from this client. No static/hardcoded data in the app.
// Auth tokens are stored in memory only (never localStorage) to prevent XSS.

const BASE_URL = import.meta.env.VITE_AGENT_URL ?? "https://kairos-t1.gokulp.online";

// ── In-memory token store ─────────────────────────────────────────────────
let _accessToken = null;
let _refreshToken = null;
let _uid = null;

/** Decode the uid (sub claim) from a JWT without signature verification */
function getUid(token) {
  return JSON.parse(atob(token.split(".")[1])).sub;
}

/**
 * Headers for user-facing endpoints (/chat, /recommendations).
 * Uses X-User-ID — NEVER Authorization: Bearer for these routes.
 */
function userHeaders() {
  if (!_uid) throw new Error("Not authenticated");
  return { "X-User-ID": _uid, "Content-Type": "application/json" };
}

/** Attempt to refresh the access token using the stored refresh token */
async function _refreshIfNeeded() {
  if (!_refreshToken) throw new Error("No refresh token");
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: _refreshToken }),
  });
  if (!res.ok) {
    _accessToken = null;
    _refreshToken = null;
    _uid = null;
    throw new Error("Session expired");
  }
  const tokens = await res.json();
  _accessToken = tokens.access_token;
  _refreshToken = tokens.refresh_token;
  _uid = getUid(_accessToken);
}

// ── Auth ──────────────────────────────────────────────────────────────────

export const auth = {
  /**
   * Register a new account.
   * @param {{ email: string, password: string, display_name: string }} body
   * @returns {Promise<{ uid: string, email: string, message: string }>}
   */
  async register(body) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  /**
   * Log in and store tokens in memory.
   * @param {{ email: string, password: string }} body
   * @returns {Promise<{ uid: string }>}
   */
  async login(body) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await res.json();
    const tokens = await res.json();
    _accessToken = tokens.access_token;
    _refreshToken = tokens.refresh_token;
    _uid = getUid(_accessToken);
    return { uid: _uid };
  },

  /** Log out and clear all tokens from memory */
  async logout() {
    if (_accessToken) {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${_accessToken}` },
      }).catch(() => {});
    }
    _accessToken = null;
    _refreshToken = null;
    _uid = null;
  },

  /**
   * Request a password reset OTP email.
   * Always returns 200 to avoid email enumeration.
   * @param {string} email
   */
  async forgotPassword(email) {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  /**
   * Reset password using OTP.
   * @param {{ email: string, otp: string, new_password: string }} body
   */
  async resetPassword(body) {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  /** @returns {string | null} Current user UID */
  getUid: () => _uid,

  /** @returns {boolean} Whether a user is currently authenticated */
  isAuthenticated: () => !!_uid,

  /** Attempt silent token refresh — returns true on success */
  async tryRefresh() {
    try {
      await _refreshIfNeeded();
      return true;
    } catch {
      return false;
    }
  },
};

// ── Chat (SSE stream) ────────────────────────────────────────────────────

export const chat = {
  /**
   * Yields ChatSSEEvent objects from the /chat SSE stream.
   * Stream format is \n\n-delimited raw JSON — NOT standard "data:" SSE.
   * The final event always has event === "result".
   *
   * @param {string} message
   * @param {Array<{ role: string, content: string }>} history
   * @returns {AsyncGenerator<Object>}
   */
  async *stream(message, history) {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: userHeaders(),
      body: JSON.stringify({ message, conversation_history: history }),
    });
    if (!res.ok) throw await res.json();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (trimmed) {
          try {
            yield JSON.parse(trimmed);
          } catch {
            /* skip malformed chunk */
          }
        }
      }
    }
  },
};

// ── Recommendations ───────────────────────────────────────────────────────

export const recommendations = {
  /**
   * Get personalised recommendations for a user.
   * Cached 24h server-side — only pass refresh=true on explicit user action.
   *
   * @param {string} uid
   * @param {number} [limit=10]
   * @param {boolean} [refresh=false]
   */
  async getAll(uid, limit = 10, refresh = false) {
    const params = new URLSearchParams({
      limit: String(limit),
      refresh: String(refresh),
    });
    const res = await fetch(`${BASE_URL}/recommendations/${uid}?${params}`, {
      headers: userHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  /**
   * Expand a recommendation card with detailed LLM-generated content.
   * Takes 2-4 seconds — show a skeleton while loading.
   * Cache result in local state to avoid re-fetching.
   *
   * @param {string} uid
   * @param {number} restaurantId
   */
  async expand(uid, restaurantId) {
    const res = await fetch(
      `${BASE_URL}/recommendations/${uid}/${restaurantId}/expand`,
      { headers: userHeaders() }
    );
    if (!res.ok) throw await res.json();
    return res.json();
  },
};

// ── Health ────────────────────────────────────────────────────────────────

export const health = {
  /** Check if the Kairos Agent backend is ready. Returns boolean. */
  async isReady() {
    try {
      return (await fetch(`${BASE_URL}/ready`)).status === 200;
    } catch {
      return false;
    }
  },
};
