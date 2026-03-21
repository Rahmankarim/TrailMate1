/**
 * Input validation utility functions
 */

import { z } from "zod"

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate MongoDB ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
  return phoneRegex.test(phone)
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

/**
 * Validate and parse JSON safely
 */
export function parseJSON<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  email: z.string().email("Invalid email format"),
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
  url: z.string().url("Invalid URL format"),
  phone: z.string().regex(
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    "Invalid phone number format"
  ),
  positiveNumber: z.number().positive("Must be a positive number"),
  nonEmptyString: z.string().min(1, "Cannot be empty"),
  pagination: z.object({
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
  }),
}

/**
 * Validate request body against a Zod schema
 */
export async function validateRequestBody<T>(
  body: unknown,
  schema: z.Schema<T>
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const data = await schema.parseAsync(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ["Validation failed"] }
  }
}
