/**
 * Pagination utility functions for API endpoints
 */

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Parse pagination parameters from URL search params
 */
export function getPaginationParams(searchParams: URLSearchParams, defaultLimit: number = 20): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10)))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Create a paginated response with optional additional data
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  additionalData?: Record<string, any>
): PaginatedResponse<T> {
  const pagination = createPaginationMeta(total, page, limit)
  
  return {
    data,
    pagination,
    ...(additionalData && additionalData)
  }
}
