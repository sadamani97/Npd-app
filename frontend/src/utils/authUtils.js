// Utility function to get current user from localStorage (supports both admin and user)
export const getCurrentUser = () => {
  const admin = localStorage.getItem("admin");
  const user = localStorage.getItem("user");
  
  if (admin) {
    return JSON.parse(admin);
  }
  if (user) {
    return JSON.parse(user);
  }
  return {};
};

// Get current token (admin or user)
export const getCurrentToken = () => {
  const adminToken = localStorage.getItem("adminToken");
  const userToken = localStorage.getItem("userToken");
  
  return adminToken || userToken || null;
};

// Check if current user is admin or super admin
export const isAdminUser = () => {
  const user = getCurrentUser();
  return user.role === "ADMIN" || user.role === "SUPER_ADMIN";
};

// Logout function - clears all auth data
export const logout = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("user");
  localStorage.removeItem("admin");
  window.dispatchEvent(new Event("authChanged"));
};
