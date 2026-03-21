/**
 * OTP (One-Time Password) Utility Functions
 * 
 * Generates and validates 6-digit OTP codes for email verification.
 */

import crypto from "crypto"

/**
 * Generate a 6-digit OTP code
 * @returns A 6-digit numeric string
 */
export function generateOTP(): string {
  // Generate a random 6-digit number
  const otp = crypto.randomInt(100000, 999999).toString()
  return otp
}

/**
 * Get OTP expiration time (10 minutes from now)
 * @returns Date object representing expiration time
 */
export function getOTPExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
}

/**
 * Check if OTP has expired
 * @param expiresAt - The expiration date
 * @returns true if expired, false otherwise
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}
