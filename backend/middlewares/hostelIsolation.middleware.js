/**
 * Hostel Data Isolation Middleware
 * Ensures that users only access data belonging to their hostel
 */

export const validateHostelAccess = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required"
      });
    }

    // SuperAdmin can access all hostels
    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    // Get hostel_id from query parameters or request body
    let requestedHostelId = req.query.hostel_id ||
                           req.body?.hostel_id ||
                           req.params?.hostelId;

    // If no hostel_id in request, use user's hostel
    if (!requestedHostelId) {
      req.hostel_id = user.hostel_id;
      return next();
    }

    // Convert to number for comparison
    requestedHostelId = parseInt(requestedHostelId, 10);
    const userHostelId = parseInt(user.hostel_id, 10);

    // Non-SuperAdmin can only access their own hostel
    if (user.role !== "SUPER_ADMIN" && requestedHostelId !== userHostelId) {
      return res.status(403).json({
        success: false,
        msg: "Access denied: You can only access your assigned hostel"
      });
    }

    req.hostel_id = requestedHostelId || user.hostel_id;
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

/**
 * Automatically add hostel_id filter to queries
 * Used by controllers to ensure data isolation
 */
export const getHostelFilter = (user) => {
  // SuperAdmin sees all (no filter)
  if (user.role === "SUPER_ADMIN") {
    return {};
  }

  // HOSTEL_ADMIN and USER only see their hostel's data
  return { hostel_id: user.hostel_id };
};

/**
 * Validate that user can access a specific hostel
 */
export const canAccessHostel = (user, hostelId) => {
  if (!user) return false;

  // SuperAdmin can access any hostel
  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  // Others can only access their assigned hostel
  if (user.hostel_id && parseInt(user.hostel_id, 10) === parseInt(hostelId, 10)) {
    return true;
  }

  return false;
};

/**
 * Middleware to ensure request includes hostel_id
 */
export const requireHostelIdInQuery = (req, res, next) => {
  try {
    // SuperAdmin is exempt from this requirement
    if (req.user?.role === "SUPER_ADMIN") {
      return next();
    }

    // For non-SuperAdmin, either provide in query or use their hostel
    const hostelId = req.query.hostel_id || req.user?.hostel_id;

    if (!hostelId) {
      return res.status(400).json({
        success: false,
        msg: "hostel_id is required in query parameters or user must be assigned to a hostel"
      });
    }

    req.hostel_id = hostelId;
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};
