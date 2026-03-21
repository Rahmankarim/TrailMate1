import type { ObjectId } from "mongodb"

export interface Destination {
  _id?: ObjectId
  userId: ObjectId
  name: string
  slug: string
  description: string
  shortDescription: string
  location: string
  region: string
  difficulty: "easy" | "moderate" | "challenging" | "extreme"
  duration: string
  price: number
  maxGroupSize: number
  altitude?: string
  bestSeason: string[]
  highlights: string[]
  itinerary: {
    day: number
    title: string
    description: string
  }[]
  images: string[]
  coverImage: string
  included: string[]
  notIncluded: string[]
  isPublished: boolean
  rating?: number
  reviewCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateDestinationInput {
  name: string
  description: string
  shortDescription: string
  location: string
  region: string
  difficulty: "easy" | "moderate" | "challenging" | "extreme"
  duration: string
  price: number
  maxGroupSize: number
  altitude?: string
  bestSeason: string[]
  highlights: string[]
  itinerary: {
    day: number
    title: string
    description: string
  }[]
  images: string[]
  coverImage: string
  included: string[]
  notIncluded: string[]
  isPublished?: boolean
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
