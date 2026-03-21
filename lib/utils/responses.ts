/**
 * Standardized API response formats
 */

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errors?: string[]
}

export interface ApiErrorResponse {
  success: false
  message: string
  error: string
  code?: string
  statusCode: number
}

export interface ApiSuccessResponse<T = any> {
  success: true
  message?: string
  data?: T
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    ...(message && { message }),
    ...(data && { data }),
  }
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number,
  code?: string,
  errors?: string[]
): ApiErrorResponse {
  return {
    success: false,
    message,
    error: message,
    statusCode,
    ...(code && { code }),
    ...(errors && { errors }),
  }
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  UNAUTHORIZED: createErrorResponse("Unauthorized", 401, "UNAUTHORIZED"),
  FORBIDDEN: createErrorResponse("Forbidden", 403, "FORBIDDEN"),
  NOT_FOUND: createErrorResponse("Resource not found", 404, "NOT_FOUND"),
  BAD_REQUEST: createErrorResponse("Bad request", 400, "BAD_REQUEST"),
  INTERNAL_SERVER_ERROR: createErrorResponse("Internal server error", 500, "INTERNAL_SERVER_ERROR"),
  INVALID_TOKEN: createErrorResponse("Invalid or expired token", 401, "INVALID_TOKEN"),
  MISSING_FIELDS: createErrorResponse("Missing required fields", 400, "MISSING_FIELDS"),
  VALIDATION_ERROR: createErrorResponse("Validation error", 400, "VALIDATION_ERROR"),
  ALREADY_EXISTS: createErrorResponse("Resource already exists", 409, "ALREADY_EXISTS"),
  TOO_MANY_REQUESTS: createErrorResponse("Too many requests", 429, "TOO_MANY_REQUESTS"),
}

/**
 * Wrap async route handlers with error handling
 */
export function withErrorHandling<T>(
  handler: (...args: any[]) => Promise<T>
) {
  return async (...args: any[]): Promise<T> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error("Route handler error:", error)
      throw error
    }
  }
}
