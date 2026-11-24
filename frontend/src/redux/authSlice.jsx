import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api.jsx";
import { getCurrentUser, getCurrentToken } from "../utils/authUtils";

// Helper function to get initial user decoded directly from token
const getInitialUser = () => {
  return getCurrentUser();
};

// Helper function to check if user has a valid token
const getInitialIsAuthenticated = () => {
  return Boolean(getCurrentToken());
};

// Async thunk to fetch fresh live user profile from TiDB database via backend
export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const token = getCurrentToken();
      if (!token) return rejectWithValue("No token found");

      const res = await API.get("/auth/me");
      if (res?.data?.success) {
        return res.data.data;
      }
      return rejectWithValue(res?.data?.message || "Failed to fetch user");
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to fetch user");
    }
  }
);

// Async thunk for user login (Stores ONLY token in localStorage)
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      // Clear any previous token and legacy user/admin keys
      localStorage.removeItem("authToken");
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");

      const cleanEmail = email.trim().toLowerCase();
      const loginEndpoint = cleanEmail === "superadmin@hostel.com"
        ? "/auth/super-admin/login"
        : "/auth/login";

      const res = await API.post(loginEndpoint, { email, password });

      if (res?.data?.success) {
        const user = res.data.user;
        const token = res.data.token;
        const userRole = user?.role;

        // Store ONLY the token in localStorage as per requirement
        localStorage.setItem("authToken", token);
        if (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "HOSTEL_ADMIN") {
          localStorage.setItem("adminToken", token);
        } else {
          localStorage.setItem("userToken", token);
        }

        window.dispatchEvent(new Event("authChanged"));

        return { user, role: userRole };
      }
      return rejectWithValue("Login failed");
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || "Login failed";
      return rejectWithValue(msg);
    }
  }
);

// Async thunk for user registration/signup
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password,
        role: "USER"
      });
      if (res?.data?.success) {
        return res.data;
      }
      return rejectWithValue("Registration failed");
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || "Registration failed";
      return rejectWithValue(msg);
    }
  }
);

// Async thunk for registering test user
export const registerTestUserThunk = createAsyncThunk(
  "auth/registerTestUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.post("/auth/register", {
        name: "Test User",
        email: "user@hostel.com",
        password: "user1234",
        phone: "0987654321",
        role: "USER"
      });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.msg || err.message;
      return rejectWithValue(msg);
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await API.post("/auth/logout").catch(() => {});
      
      // Clean up only tokens from localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      
      window.dispatchEvent(new Event("authChanged"));
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    currentUser: getInitialUser(),
    isAuthenticated: getInitialIsAuthenticated(),
    loading: false,
    profileLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    setUser: (state, action) => {
      state.currentUser = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch me (profile direct from TiDB DB)
      .addCase(fetchMe.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.profileLoading = false;
      })

      // Login flow
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Registration flow
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Logout flow
      .addCase(logoutUser.fulfilled, (state) => {
        state.currentUser = {};
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.currentUser = {};
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearError, setAuthenticated, setUser } = authSlice.actions;
export default authSlice.reducer;
