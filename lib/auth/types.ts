import type { ObjectId } from "mongodb"

export type UserRole = "traveler" | "guide" | "company" | "admin"

export interface User {
  _id?: ObjectId
  email: string
  password?: string // Optional for OAuth users
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  avatar?: string
  isVerified: boolean
  isActive: boolean
  refreshTokens: string[]
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  // Email verification fields
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  // Password reset fields
  passwordResetToken?: string
  passwordResetExpires?: Date
  // OAuth fields
  googleId?: string
  authProvider: "local" | "google"
  profile?: {
    bio?: string
    dateOfBirth?: Date
    gender?: "male" | "female" | "other" | "prefer_not_to_say"
    nationality?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
    }
    emergencyContact?: {
      name?: string
      phone?: string
      relationship?: string
    }
    preferences?: {
      newsletter?: boolean
      notifications?: boolean
      language?: string
      currency?: string
    }
    socialLinks?: {
      facebook?: string
      instagram?: string
      twitter?: string
      linkedin?: string
    }
    travelPreferences?: {
      adventureLevel?: "easy" | "moderate" | "challenging" | "extreme"
      interests?: string[]
      dietaryRestrictions?: string[]
      accessibility?: string[]
    }
  }
  // Guide-specific fields
  guideProfile?: {
    bio?: string
    specialties?: string[]
    languages?: string[]
    experience?: number
    certifications?: string[]
    rating?: number
    totalReviews?: number
    totalTours?: number
    pricePerDay?: number
    availability?: boolean
    isPublished?: boolean
    isApproved?: boolean
    verificationDocuments?: string[]
  }
  // Company-specific fields
  companyProfile?: {
    companyName?: string
    description?: string
    license?: string
    address?: string
    website?: string
    foundedYear?: number
    teamSize?: number
    isApproved?: boolean
  }
}

export interface ProfileUpdateRequest {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  profile?: User["profile"]
  guideProfile?: User["guideProfile"]
  companyProfile?: User["companyProfile"]
}

export interface ProfileValidation {
  isValid: boolean
  errors: Record<string, string>
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: Omit<User, "password" | "refreshTokens">
  accessToken?: string
  refreshToken?: string
}

export interface SignUpRequest {
  email: string
  password?: string // Optional for OAuth users
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  authProvider: "local" | "google"
  googleId?: string
}

export interface SignInRequest {
  email: string
  password?: string // Optional for OAuth users
  authProvider: "local" | "google"
  googleId?: string
}
