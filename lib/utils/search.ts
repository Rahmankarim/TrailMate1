/**
 * Search and filter utility functions
 */

/**
 * Build a MongoDB text search query
 */
export function buildTextSearchQuery(searchTerm: string) {
  if (!searchTerm || searchTerm.trim() === "") {
    return {}
  }

  return {
    $text: { $search: searchTerm },
  }
}

/**
 * Build a regex search query for multiple fields
 */
export function buildRegexSearchQuery(searchTerm: string, fields: string[]) {
  if (!searchTerm || searchTerm.trim() === "" || fields.length === 0) {
    return {}
  }

  const regex = new RegExp(searchTerm, "i")
  
  if (fields.length === 1) {
    return { [fields[0]]: regex }
  }

  return {
    $or: fields.map(field => ({ [field]: regex })),
  }
}

/**
 * Parse sort parameters from URL search params
 */
export function getSortParams(searchParams: URLSearchParams): Record<string, 1 | -1> {
  const sortBy = searchParams.get("sortBy") || "createdAt"
  const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1

  return { [sortBy]: sortOrder }
}

/**
 * Build filter query from search params
 */
export function buildFilterQuery(
  searchParams: URLSearchParams,
  allowedFilters: string[]
): Record<string, any> {
  const filter: Record<string, any> = {}

  allowedFilters.forEach((param) => {
    const value = searchParams.get(param)
    if (value !== null) {
      // Handle boolean values
      if (value === "true" || value === "false") {
        filter[param] = value === "true"
      }
      // Handle numeric values
      else if (!isNaN(Number(value))) {
        filter[param] = Number(value)
      }
      // Handle string values
      else {
        filter[param] = value
      }
    }
  })

  return filter
}

/**
 * Build date range query
 */
export function buildDateRangeQuery(
  field: string,
  startDate?: string,
  endDate?: string
): Record<string, any> {
  const query: Record<string, any> = {}

  if (startDate || endDate) {
    query[field] = {}
    
    if (startDate) {
      query[field].$gte = new Date(startDate)
    }
    
    if (endDate) {
      query[field].$lte = new Date(endDate)
    }
  }

  return query
}
