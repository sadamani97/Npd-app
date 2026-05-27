/**
 * Role-Based Access Control Middleware
 * Defines functions to check user roles before allowing access to endpoints
 */

export const requireSuperAdmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required"
      });
    }

    if (user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        msg: "Super Admin access required"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

export const requireHostelAdmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required"
      });
    }

    if (user.role !== "HOSTEL_ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        msg: "Hostel Admin access required"
      });
    }

    if (!user.hostel_id) {
      return res.status(403).json({
        success: false,
        msg: "Hostel assignment required"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

export const requireUser = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required"
      });
    }

    if (user.role !== "USER") {
      return res.status(403).json({
        success: false,
        msg: "User access required"
      });
    }

    if (!user.hostel_id) {
      return res.status(403).json({
        success: false,
        msg: "Hostel assignment required"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

export const requireHostelAccess = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required"
      });
    }

    // SuperAdmin has access to all
    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    // HOSTEL_ADMIN and USER must have hostel_id
    if (user.role === "HOSTEL_ADMIN" || user.role === "ADMIN" || user.role === "USER") {
      if (!user.hostel_id) {
        return res.status(403).json({
          success: false,
          msg: "Hostel assignment required"
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      msg: "Access denied"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

export const requireHostelAdminOrSuperAdmin = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required"
      });
    }

    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    if (user.role === "HOSTEL_ADMIN" || user.role === "ADMIN") {
      if (!user.hostel_id) {
        return res.status(403).json({
          success: false,
          msg: "Hostel assignment required"
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      msg: "Admin or Super Admin access required"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};
