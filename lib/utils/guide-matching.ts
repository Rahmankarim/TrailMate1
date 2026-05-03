import type { GuideMatchResult, MatchingAlgorithmInput } from "@/lib/db/models/guide-matching"

/**
 * Calculate Cosine Similarity between two arrays
 * Used for matching interests, specialties, etc.
 */
export function cosineSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0

  const set1 = new Set(arr1.map(s => s.toLowerCase().trim()))
  const set2 = new Set(arr2.map(s => s.toLowerCase().trim()))

  const intersection = Array.from(set1).filter(x => set2.has(x)).length
  const union = set1.size + set2.size - intersection

  if (union === 0) return 0
  return intersection / union
}

/**
 * Normalize a value between 0 and 1 for scoring
 */
export function normalizeScore(value: number, min: number, max: number): number {
  if (max - min === 0) return value === min ? 1 : 0
  const normalized = (value - min) / (max - min)
  return Math.max(0, Math.min(1, normalized))
}

/**
 * Calculate match score for location
 * Exact match = 1.0, Partial match = 0.5, No match = 0
 */
export function calculateLocationMatch(
  preferredLocations: string[] | undefined,
  guideLocation: string
): number {
  if (!preferredLocations || preferredLocations.length === 0) return 0.5 // Neutral if no preference
  
  const guideLoc = guideLocation.toLowerCase().trim()
  const perfectMatch = preferredLocations.some(loc => loc.toLowerCase().trim() === guideLoc)
  
  if (perfectMatch) return 1.0
  
  // Partial match (e.g., "Hunza" matches "Hunza Valley")
  const partialMatch = preferredLocations.some(loc => {
    const prefLoc = loc.toLowerCase().trim()
    return guideLoc.includes(prefLoc) || prefLoc.includes(guideLoc)
  })
  
  return partialMatch ? 0.7 : 0.1
}

/**
 * Calculate match score for interests
 * Uses Cosine Similarity
 */
export function calculateInterestMatch(
  preferredInterests: string[],
  guideSpecialties: string[]
): number {
  if (preferredInterests.length === 0 || guideSpecialties.length === 0) return 0.5
  return cosineSimilarity(preferredInterests, guideSpecialties)
}

/**
 * Calculate match score for languages
 */
export function calculateLanguageMatch(
  preferredLanguages: string[],
  guideLanguages: string[]
): number {
  if (preferredLanguages.length === 0 || guideLanguages.length === 0) return 0.5
  return cosineSimilarity(preferredLanguages, guideLanguages)
}

/**
 * Calculate match score for price
 * Within range = 1.0, Slightly over/under = 0.7, Way off = 0.1
 */
export function calculatePriceMatch(
  minPrice: number | undefined,
  maxPrice: number | undefined,
  guidePrice: number
): number {
  if (minPrice === undefined && maxPrice === undefined) return 0.5

  const min = minPrice ?? 0
  const max = maxPrice ?? Number.MAX_SAFE_INTEGER

  if (guidePrice >= min && guidePrice <= max) return 1.0
  if (guidePrice < min) {
    const diff = ((min - guidePrice) / min) * 100
    return diff <= 20 ? 0.7 : 0.2
  }
  const diff = ((guidePrice - max) / max) * 100
  return diff <= 20 ? 0.7 : 0.2
}

/**
 * Calculate match score for experience level
 * More experienced guides get higher scores for advanced travelers
 */
export function calculateExperienceMatch(
  travelerSkillLevel: "beginner" | "intermediate" | "advanced" | "expert",
  guideExperience: number
): number {
  const experienceThresholds: Record<string, number> = {
    beginner: 0,
    intermediate: 3,
    advanced: 7,
    expert: 15,
  }

  const requiredExp = experienceThresholds[travelerSkillLevel] ?? 0
  const matchScore = Math.min(1.0, guideExperience / (requiredExp + 10))
  return matchScore
}

/**
 * Calculate match score for certifications
 */
export function calculateCertificationMatch(
  preferredCertifications: string[] | undefined,
  guideCertifications: string[]
): number {
  if (!preferredCertifications || preferredCertifications.length === 0) return 0.5
  if (guideCertifications.length === 0) return 0
  
  return cosineSimilarity(preferredCertifications, guideCertifications)
}

/**
 * Main matching algorithm: Compare traveler preferences with guide profiles
 * Returns a weighted match score
 */
export function calculateGuideMatchScore(
  preferences: {
    location?: string[]
    interests: string[]
    languages: string[]
    skillLevel: "beginner" | "intermediate" | "advanced" | "expert"
    maxPricePerDay?: number
    minPricePerDay?: number
    experience: "all" | "experienced" | "highly-experienced"
    certifications?: string[]
  },
  guide: any
): {
  matchScore: number
  matchDetails: {
    locationMatch: number
    interestMatch: number
    languageMatch: number
    priceMatch: number
    experienceMatch: number
    certificationMatch: number
  }
} {
  // Calculate individual component scores
  const locationMatch = calculateLocationMatch(preferences.location, guide.location)
  const interestMatch = calculateInterestMatch(preferences.interests, guide.specialties || [])
  const languageMatch = calculateLanguageMatch(preferences.languages, guide.languages || [])
  const priceMatch = calculatePriceMatch(
    preferences.minPricePerDay,
    preferences.maxPricePerDay,
    guide.pricePerDay
  )
  const experienceMatch = calculateExperienceMatch(preferences.skillLevel, guide.experience || 0)
  const certificationMatch = calculateCertificationMatch(
    preferences.certifications,
    guide.certifications || []
  )

  // Weighted average - adjust weights based on importance
  const weights = {
    location: 0.2,
    interest: 0.25,
    language: 0.15,
    price: 0.15,
    experience: 0.15,
    certification: 0.1,
  }

  const totalScore =
    locationMatch * weights.location +
    interestMatch * weights.interest +
    languageMatch * weights.language +
    priceMatch * weights.price +
    experienceMatch * weights.experience +
    certificationMatch * weights.certification

  return {
    matchScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
    matchDetails: {
      locationMatch: Math.round(locationMatch * 100),
      interestMatch: Math.round(interestMatch * 100),
      languageMatch: Math.round(languageMatch * 100),
      priceMatch: Math.round(priceMatch * 100),
      experienceMatch: Math.round(experienceMatch * 100),
      certificationMatch: Math.round(certificationMatch * 100),
    },
  }
}

/**
 * Match a traveler with guides using cosine similarity and preferences
 */
export function matchGuidesForTraveler(input: MatchingAlgorithmInput): GuideMatchResult[] {
  const { preferences, guides } = input

  const results: GuideMatchResult[] = guides
    .filter(guide => guide.isPublished && guide.isVerified) // Only show published, verified guides
    .map(guide => ({
      guide,
      ...calculateGuideMatchScore(preferences, guide),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .filter(result => result.matchScore > 0.3) // Filter out very poor matches

  return results
}

/**
 * Get top N matching guides
 */
export function getTopMatchingGuides(results: GuideMatchResult[], limit: number = 5): GuideMatchResult[] {
  return results.slice(0, limit)
}
