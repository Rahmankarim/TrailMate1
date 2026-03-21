import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { getAuthCookies } from "@/lib/auth/cookies"
import { verifyAccessToken } from "@/lib/auth/jwt"
import type { User, ProfileUpdateRequest } from "@/lib/auth/types"
import { validateProfileUpdate, sanitizeProfileUpdate } from "@/lib/validation/profile"
import { ObjectId } from "mongodb"

// GET - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const { accessToken } = await getAuthCookies()

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const usersCollection = await getCollection<User>("users")
    const user = await usersCollection.findOne({
      _id: new ObjectId(payload.userId),
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Return user without sensitive data
    const {
      password: _,
      refreshTokens: __,
      emailVerificationToken: ___,
      passwordResetToken: ____,
      ...userProfile
    } = user

    return NextResponse.json({
      success: true,
      message: "Profile retrieved successfully",
      profile: userProfile,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

// PUT - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const { accessToken } = await getAuthCookies()

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const body: ProfileUpdateRequest = await request.json()

    // Validate the update data
    const validation = validateProfileUpdate(body)
    if (!validation.isValid) {
      console.error("Profile validation failed:", validation.errors)
      console.error("Body received:", JSON.stringify(body, null, 2))
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: validation.errors },
        { status: 400 },
      )
    }

    // Sanitize the data
    const sanitizedData = sanitizeProfileUpdate(body)

    const usersCollection = await getCollection<User>("users")

    // Build update object dynamically to only update provided fields
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (sanitizedData.firstName) updateFields.firstName = sanitizedData.firstName
    if (sanitizedData.lastName) updateFields.lastName = sanitizedData.lastName
    if (sanitizedData.phone !== undefined) updateFields.phone = sanitizedData.phone
    if (sanitizedData.avatar !== undefined) updateFields.avatar = sanitizedData.avatar

    // Handle nested profile object updates
    if (sanitizedData.profile) {
      for (const [key, value] of Object.entries(sanitizedData.profile)) {
        if (value !== undefined) {
          updateFields[`profile.${key}`] = value
        }
      }
    }

    // Handle guide profile updates (only for guides)
    if (sanitizedData.guideProfile) {
      // Verify user is a guide
      const currentUser = await usersCollection.findOne({ _id: new ObjectId(payload.userId) })
      if (currentUser?.role !== "guide") {
        return NextResponse.json({ success: false, message: "Only guides can update guide profile" }, { status: 403 })
      }

      for (const [key, value] of Object.entries(sanitizedData.guideProfile)) {
        if (value !== undefined) {
          // Prevent users from self-approving
          if (key === "isApproved") continue
          updateFields[`guideProfile.${key}`] = value
        }
      }

      // Also sync to guides collection for public display
      try {
        const guidesCollection = await getCollection("guides")
        const guideDoc = {
          userId: new ObjectId(payload.userId),
          name: `${sanitizedData.firstName || currentUser.firstName} ${sanitizedData.lastName || currentUser.lastName}`,
          email: currentUser.email,
          avatar: sanitizedData.avatar || currentUser.avatar || "",
          bio: sanitizedData.guideProfile.bio || "",
          location: currentUser.profile?.address?.city || "Location not set",
          specialties: sanitizedData.guideProfile.specialties || [],
          languages: sanitizedData.guideProfile.languages || [],
          experience: sanitizedData.guideProfile.experience || 0,
          certifications: sanitizedData.guideProfile.certifications || [],
          pricePerDay: sanitizedData.guideProfile.pricePerDay || 0,
          availability: { available: sanitizedData.guideProfile.availability ?? true },
          isPublished: sanitizedData.guideProfile.isPublished ?? false,
          updatedAt: new Date(),
        }

        console.log("Syncing guide to guides collection:", guideDoc)

        // Upsert guide document
        const existingGuide = await guidesCollection.findOne({ userId: new ObjectId(payload.userId) })
        if (existingGuide) {
          console.log("Updating existing guide")
          await guidesCollection.updateOne(
            { userId: new ObjectId(payload.userId) },
            { $set: guideDoc }
          )
        } else {
          console.log("Creating new guide")
          await guidesCollection.insertOne({
            ...guideDoc,
            rating: 0,
            reviewCount: 0,
            totalTours: 0,
            isVerified: false,
            createdAt: new Date(),
          })
        }
      } catch (syncError) {
        console.error("Error syncing to guides collection:", syncError)
        // Don't fail the whole request if sync fails
      }
    }

    // Handle company profile updates (only for companies)
    if (sanitizedData.companyProfile) {
      const currentUser = await usersCollection.findOne({ _id: new ObjectId(payload.userId) })
      if (currentUser?.role !== "company") {
        return NextResponse.json(
          { success: false, message: "Only companies can update company profile" },
          { status: 403 },
        )
      }

      for (const [key, value] of Object.entries(sanitizedData.companyProfile)) {
        if (value !== undefined) {
          // Prevent users from self-approving
          if (key === "isApproved") continue
          updateFields[`companyProfile.${key}`] = value
        }
      }
    }

    // Update the user
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(payload.userId) },
      { $set: updateFields },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Return updated user without sensitive data
    const {
      password: _,
      refreshTokens: __,
      emailVerificationToken: ___,
      passwordResetToken: ____,
      ...updatedProfile
    } = result

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
