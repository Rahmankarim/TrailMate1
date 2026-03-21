import type { ProfileUpdateRequest, ProfileValidation } from "@/lib/auth/types"

// Phone number validation (accepts international formats with optional +, and local formats starting with 0)
const PHONE_REGEX = /^\+?\d{7,15}$/

// URL validation
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/

// Validate profile update data
export function validateProfileUpdate(data: ProfileUpdateRequest): ProfileValidation {
  const errors: Record<string, string> = {}

  // Name validation
  if (data.firstName !== undefined) {
    if (!data.firstName.trim()) {
      errors.firstName = "First name is required"
    } else if (data.firstName.length < 2) {
      errors.firstName = "First name must be at least 2 characters"
    } else if (data.firstName.length > 50) {
      errors.firstName = "First name must be less than 50 characters"
    }
  }

  if (data.lastName !== undefined) {
    if (!data.lastName.trim()) {
      errors.lastName = "Last name is required"
    } else if (data.lastName.length < 2) {
      errors.lastName = "Last name must be at least 2 characters"
    } else if (data.lastName.length > 50) {
      errors.lastName = "Last name must be less than 50 characters"
    }
  }

  // Phone validation
  if (data.phone !== undefined && data.phone.trim()) {
    if (!PHONE_REGEX.test(data.phone.replace(/\s/g, ""))) {
      errors.phone = "Please enter a valid phone number"
    }
  }

  // Profile fields validation
  if (data.profile) {
    // Bio validation
    if (data.profile.bio !== undefined && data.profile.bio && data.profile.bio.length > 500) {
      errors["profile.bio"] = "Bio must be less than 500 characters"
    }

    // Date of birth validation
    if (data.profile.dateOfBirth !== undefined && data.profile.dateOfBirth) {
      const dob = new Date(data.profile.dateOfBirth)
      if (!isNaN(dob.getTime())) {
        const now = new Date()
        const age = now.getFullYear() - dob.getFullYear()
        if (age < 13) {
          errors["profile.dateOfBirth"] = "You must be at least 13 years old"
        } else if (age > 120) {
          errors["profile.dateOfBirth"] = "Please enter a valid date of birth"
        }
      }
    }

    // Gender validation
    if (data.profile.gender !== undefined && data.profile.gender) {
      const validGenders = ["male", "female", "other", "prefer_not_to_say"]
      if (!validGenders.includes(data.profile.gender)) {
        errors["profile.gender"] = "Please select a valid gender option"
      }
    }

    // Address validation
    if (data.profile.address) {
      if (data.profile.address.zipCode && !/^[a-zA-Z0-9\s-]{3,10}$/.test(data.profile.address.zipCode)) {
        errors["profile.address.zipCode"] = "Please enter a valid zip code"
      }
    }

    // Emergency contact validation
    if (data.profile.emergencyContact) {
      if (
        data.profile.emergencyContact.phone &&
        !PHONE_REGEX.test(data.profile.emergencyContact.phone.replace(/\s/g, ""))
      ) {
        errors["profile.emergencyContact.phone"] = "Please enter a valid emergency contact phone"
      }
    }

    // Social links validation
    if (data.profile.socialLinks) {
      const socialFields = ["facebook", "instagram", "twitter", "linkedin"] as const
      for (const field of socialFields) {
        const value = data.profile.socialLinks[field]
        if (value && !URL_REGEX.test(value)) {
          errors[`profile.socialLinks.${field}`] = `Please enter a valid ${field} URL`
        }
      }
    }
  }

  // Guide profile validation
  if (data.guideProfile) {
    if (data.guideProfile.bio !== undefined && data.guideProfile.bio && data.guideProfile.bio.length > 1000) {
      errors["guideProfile.bio"] = "Bio must be less than 1000 characters"
    }

    if (data.guideProfile.experience !== undefined && data.guideProfile.experience !== null) {
      const exp = Number(data.guideProfile.experience)
      if (isNaN(exp) || exp < 0 || exp > 50) {
        errors["guideProfile.experience"] = "Experience must be between 0 and 50 years"
      }
    }

    if (data.guideProfile.pricePerDay !== undefined && data.guideProfile.pricePerDay !== null) {
      const price = Number(data.guideProfile.pricePerDay)
      if (isNaN(price) || price < 0) {
        errors["guideProfile.pricePerDay"] = "Price must be a positive number"
      }
    }
  }

  // Company profile validation
  if (data.companyProfile) {
    if (data.companyProfile.companyName !== undefined && data.companyProfile.companyName.length > 100) {
      errors["companyProfile.companyName"] = "Company name must be less than 100 characters"
    }

    if (data.companyProfile.description !== undefined && data.companyProfile.description.length > 2000) {
      errors["companyProfile.description"] = "Description must be less than 2000 characters"
    }

    if (data.companyProfile.website && !URL_REGEX.test(data.companyProfile.website)) {
      errors["companyProfile.website"] = "Please enter a valid website URL"
    }

    if (data.companyProfile.foundedYear !== undefined) {
      const currentYear = new Date().getFullYear()
      if (data.companyProfile.foundedYear < 1800 || data.companyProfile.foundedYear > currentYear) {
        errors["companyProfile.foundedYear"] = `Founded year must be between 1800 and ${currentYear}`
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Sanitize profile data (remove sensitive/invalid fields)
export function sanitizeProfileUpdate(data: ProfileUpdateRequest): ProfileUpdateRequest {
  const sanitized: ProfileUpdateRequest = {}

  if (data.firstName) sanitized.firstName = data.firstName.trim()
  if (data.lastName) sanitized.lastName = data.lastName.trim()
  if (data.phone) sanitized.phone = data.phone.trim()
  if (data.avatar) sanitized.avatar = data.avatar.trim()

  if (data.profile) {
    sanitized.profile = {
      ...data.profile,
      bio: data.profile.bio?.trim(),
    }
  }

  if (data.guideProfile) {
    sanitized.guideProfile = {
      ...data.guideProfile,
      bio: data.guideProfile.bio?.trim(),
    }
  }

  if (data.companyProfile) {
    sanitized.companyProfile = {
      ...data.companyProfile,
      companyName: data.companyProfile.companyName?.trim(),
      description: data.companyProfile.description?.trim(),
    }
  }

  return sanitized
}
