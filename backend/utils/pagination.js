/**
 * Industrial Standard Pagination Utility
 * Protects database against unconstrained heavy data loads.
 */

export const getPagination = (req, defaultLimit = 20, maxLimit = 100) => {
  const pageParam = parseInt(req?.query?.page, 10);
  const limitParam = parseInt(req?.query?.limit, 10);

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, maxLimit) : defaultLimit;
  const offset = (page - 1) * limit;

  return { page, limit, offset, isPaginated: Boolean(req?.query?.page || req?.query?.limit) };
};

export const formatPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    totalItems,
    totalPages,
    currentPage: page,
    pageSize: limit,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};
