import type { ObjectId } from "mongodb"

export interface GuideMatchingPreferences {
  _id?: ObjectId
  userId: ObjectId
  location?: string[]
  interests: string[]
  languages: string[]
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert"
  maxPricePerDay?: number
  minPricePerDay?: number
  experience: "all" | "experienced" | "highly-experienced"
  certifications?: string[]
  preferredActivities?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface GuideMatchResult {
  guide: any
  matchScore: number
  matchDetails: {
    locationMatch: number
    interestMatch: number
    languageMatch: number
    priceMatch: number
    experienceMatch: number
    certificationMatch: number
  }
}

export interface MatchingAlgorithmInput {
  preferences: {
    location?: string[]
    interests: string[]
    languages: string[]
    skillLevel: "beginner" | "intermediate" | "advanced" | "expert"
    maxPricePerDay?: number
    minPricePerDay?: number
    experience: "all" | "experienced" | "highly-experienced"
    certifications?: string[]
  }
  guides: any[]
}

export const SKILL_LEVEL_EXPERIENCE_MAP: Record<string, number> = {
  beginner: 0,
  intermediate: 5,
  advanced: 10,
  expert: 20,
}

export const EXPERIENCE_LEVEL_MAP: Record<string, number> = {
  all: 0,
  experienced: 5,
  "highly-experienced": 10,
}
