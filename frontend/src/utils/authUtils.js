// Utility functions for auth token management (Pure Token Storage - No user data in localStorage)

export const getCurrentToken = () => {
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("userToken") ||
    null
  );
};

export const getCurrentUser = () => {
  const token = getCurrentToken();
  if (!token) return {};
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) || {};
  } catch (e) {
    return {};
  }
};

export const isAdminUser = () => {
  const user = getCurrentUser();
  return user?.role === "ADMIN" || user?.role === "HOSTEL_ADMIN" || user?.role === "SUPER_ADMIN";
};

export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userToken");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("user");
  localStorage.removeItem("admin");
  window.dispatchEvent(new Event("authChanged"));
};
