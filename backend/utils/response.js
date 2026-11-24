/**
 * Industrial Standard Unified API Response Utility
 */

export const successResponse = (res, message = "Success", data = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    msg: message, // Backward compatibility for existing frontend consumers
    data
  };

  if (meta) {
    response.meta = meta;
    response.pagination = meta.pagination || undefined;
  }

  return res.status(statusCode).json(response);
};

export const errorResponse = (res, message = "An error occurred", statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    msg: message, // Backward compatibility
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
