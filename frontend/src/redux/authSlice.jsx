import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/api.jsx";

// Check for browser session initialization (forces login page on fresh launch)
if (typeof window !== "undefined" && !sessionStorage.getItem("sessionStarted")) {
  localStorage.removeItem("userToken");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("user");
  localStorage.removeItem("admin");
  sessionStorage.setItem("sessionStarted", "true");
}

// Helper function to get current user from localStorage
const getInitialUser = () => {
  try {
    const admin = localStorage.getItem("admin");
    const user = localStorage.getItem("user");
    if (admin) return JSON.parse(admin);
    if (user) return JSON.parse(user);
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
  }
  return {};
};

// Helper function to check if user is authenticated initially
const getInitialIsAuthenticated = () => {
  const userToken = localStorage.getItem("userToken");
  const adminToken = localStorage.getItem("adminToken");
  const userInfo = localStorage.getItem("user");
  const adminInfo = localStorage.getItem("admin");
  return !!((userToken && userInfo) || (adminToken && adminInfo));
};

// Async thunk for user login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Clear any existing tokens to prevent concurrent login conflicts
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");

      const loginEndpoint = email.trim().toLowerCase() === "superadmin@hostel.com"
        ? "/auth/super-admin/login"
        : "/auth/login";

      const res = await API.post(loginEndpoint, { email, password });

      if (res.data.success) {
        const user = res.data.user;
        const token = res.data.token;
        const userRole = user.role;

        // Store tokens and user in localStorage based on role
        if (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "HOSTEL_ADMIN") {
          localStorage.setItem("adminToken", token);
          localStorage.setItem("admin", JSON.stringify(user));
        } else {
          localStorage.setItem("userToken", token);
          localStorage.setItem("user", JSON.stringify(user));
        }

        // Notify other parts of the app that may listen to this event
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
        role: "USER" // By default, registration registers user role
      });
      if (res.data.success) {
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
      // API call to logout if backend supports session termination
      await API.post("/auth/logout").catch(() => {});
      
      // Clean up localStorage
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

// Async thunk to request OTP
export const requestOtpThunk = createAsyncThunk(
  "auth/requestOtp",
  async ({ phone_number, channel = "SMS" }, { rejectWithValue }) => {
    try {
      const res = await API.post("/auth/request-otp", { phone_number, channel });
      if (res.data.success) {
        return res.data;
      }
      return rejectWithValue("Failed to send OTP");
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || "Failed to send OTP";
      return rejectWithValue(msg);
    }
  }
);

// Async thunk to verify OTP and login
export const verifyOtpThunk = createAsyncThunk(
  "auth/verifyOtp",
  async ({ phone_number, otp }, { rejectWithValue }) => {
    try {
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");

      const res = await API.post("/auth/verify-otp", { phone_number, otp });

      if (res.data.success) {
        const user = res.data.user || {};
        if (!user.role) {
          user.role = "USER";
        }
        const token = res.data.token;
        const userRole = user.role;

        if (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "HOSTEL_ADMIN") {
          localStorage.setItem("adminToken", token);
          localStorage.setItem("admin", JSON.stringify(user));
        } else {
          localStorage.setItem("userToken", token);
          localStorage.setItem("user", JSON.stringify(user));
        }

        window.dispatchEvent(new Event("authChanged"));
        return { user, role: userRole };
      }
      return rejectWithValue("OTP verification failed");
    } catch (err) {
      const msg = err.response?.data?.msg || err.response?.data?.message || "OTP verification failed";
      return rejectWithValue(msg);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    currentUser: getInitialUser(),
    isAuthenticated: getInitialIsAuthenticated(),
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
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
      // OTP Request flow
      .addCase(requestOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestOtpThunk.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(requestOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // OTP Verify flow
      .addCase(verifyOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
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
      // Test user registration flow
      .addCase(registerTestUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerTestUserThunk.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerTestUserThunk.rejected, (state, action) => {
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

export const { clearError, setAuthenticated } = authSlice.actions;
export default authSlice.reducer;
