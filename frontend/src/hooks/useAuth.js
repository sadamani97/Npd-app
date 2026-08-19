import { useSelector, useDispatch } from "react-redux";
import { 
  loginUser, 
  logoutUser, 
  registerUser, 
  registerTestUserThunk, 
  requestOtpThunk,
  verifyOtpThunk,
  setAuthenticated 
} from "../redux/authSlice.jsx";

export function useAuth() {
  const dispatch = useDispatch();
  
  // Select state from redux store
  const { currentUser, isAuthenticated, loading } = useSelector((state) => state.auth);

  const login = async (email, password) => {
    try {
      const resultAction = await dispatch(loginUser({ email, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        return { success: true, role: resultAction.payload.user.role };
      } else {
        return { success: false, message: resultAction.payload || "Login failed" };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const requestOtp = async (phone_number, channel = "SMS") => {
    try {
      const resultAction = await dispatch(requestOtpThunk({ phone_number, channel }));
      if (requestOtpThunk.fulfilled.match(resultAction)) {
        return { 
          success: true, 
          message: resultAction.payload.msg, 
          demoOtp: resultAction.payload.data?.demo_otp,
          channel: resultAction.payload.channel
        };
      } else {
        return { success: false, message: resultAction.payload || "Failed to send OTP" };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const verifyOtp = async (phone_number, otp) => {
    try {
      const resultAction = await dispatch(verifyOtpThunk({ phone_number, otp }));
      if (verifyOtpThunk.fulfilled.match(resultAction)) {
        return { success: true, role: resultAction.payload.user.role };
      } else {
        return { success: false, message: resultAction.payload || "OTP verification failed" };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const resultAction = await dispatch(registerUser({ name, email, password }));
      if (registerUser.fulfilled.match(resultAction)) {
        return { success: true, message: resultAction.payload?.msg || "Registered successfully!" };
      } else {
        return { success: false, message: resultAction.payload || "Registration failed" };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const registerTestUser = async () => {
    try {
      const resultAction = await dispatch(registerTestUserThunk());
      if (registerTestUserThunk.fulfilled.match(resultAction)) {
        return { success: true, message: "Test user created successfully!" };
      } else {
        return { success: false, message: resultAction.payload || "Test user already exists" };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    dispatch(logoutUser());
  };

  const getRedirectPath = (role = currentUser?.role) => {
    const userRole = role || currentUser?.role || "USER";
    if (userRole === "SUPER_ADMIN") return "/superadmin/dashboard";
    if (userRole === "ADMIN" || userRole === "HOSTEL_ADMIN") return "/dashboard";
    return "/user-dashboard";
  };

  const setIsAuthenticated = (val) => {
    dispatch(setAuthenticated(val));
  };

  return {
    currentUser,
    isAuthenticated,
    loading,
    logout,
    login,
    requestOtp,
    verifyOtp,
    signup,
    registerTestUser,
    getRedirectPath,
    setIsAuthenticated
  };
}
