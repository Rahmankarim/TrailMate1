import type { ObjectId } from "mongodb"

export interface Guide {
  _id?: ObjectId
  userId: ObjectId
  name: string
  email: string
  phone?: string
  bio: string
  shortBio: string
  profileImage: string
  coverImage?: string
  location: string
  languages: string[]
  specialties: string[]
  experience: number
  certifications: string[]
  pricePerDay: number
  availability: {
    available: boolean
    nextAvailable?: Date
  }
  rating?: number
  reviewCount?: number
  totalTours?: number
  isVerified: boolean
  isPublished: boolean
  socialLinks?: {
    instagram?: string
    facebook?: string
    twitter?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CreateGuideInput {
  name: string
  email: string
  phone?: string
  bio: string
  shortBio: string
  profileImage: string
  coverImage?: string
  location: string
  languages: string[]
  specialties: string[]
  experience: number
  certifications: string[]
  pricePerDay: number
  isPublished?: boolean
  socialLinks?: {
    instagram?: string
    facebook?: string
    twitter?: string
  }
}
