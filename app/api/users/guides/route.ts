import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    const usersCollection = await getCollection("users")
    
    // Get all guide users
    const guides = await usersCollection
      .find({ role: "guide" })
      .toArray()

    return NextResponse.json({
      total: guides.length,
      guides: guides.map(guide => ({
        _id: guide._id?.toString(),
        firstName: guide.firstName,
        lastName: guide.lastName,
        email: guide.email,
        role: guide.role
      }))
    })
  } catch (error) {
    console.error("Error fetching guides:", error)
    return NextResponse.json(
      { error: "Failed to fetch guides" },
      { status: 500 }
    )
  }
}
