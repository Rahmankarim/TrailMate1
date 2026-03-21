/**
 * Pending Verification Model
 * 
 * Stores temporary user data and OTP during the email verification process.
 * Records are deleted after successful verification or when they expire.
 */

export interface PendingVerification {
  _id?: string
  email: string
  password: string // Hashed password
  firstName: string
  lastName: string
  role: "traveler" | "guide" | "company" | "admin"
  phone?: string
  otp: string // 6-digit OTP code
  expiresAt: Date // OTP expires after 10 minutes
  createdAt: Date
  attempts?: number // Track failed verification attempts
}

/**
 * Collection name for pending verifications in MongoDB
 */
export const PENDING_VERIFICATION_COLLECTION = "pending_verifications"
