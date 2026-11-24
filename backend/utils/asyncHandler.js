/**
 * Industrial Standard Async Error Wrapper for Express Controllers
 * Eliminates repetitive try-catch blocks and reliably forwards to error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
