// middlewares/error.middleware.js
export const errorHandler = (err, req, res, next) => {
  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";

  console.error(`[Error] ${req?.method} ${req?.originalUrl}:`, err?.stack || err);

  res.status(status).json({
    success: false,
    message,
    msg: message, // Backward compatibility
    error: process.env.NODE_ENV === "production" ? undefined : err?.stack
  });
};
