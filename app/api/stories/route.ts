import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"

interface Story {
  _id?: ObjectId
  guideId: string
  guideName: string
  guideAvatar?: string
  title: string
  content: string
  excerpt: string
  coverImage: string
  publishedDate: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const guideId = searchParams.get("guideId")
    const published = searchParams.get("published")

    const storiesCollection = await getCollection("stories")

    let query: any = {}
    
    if (guideId) {
      query.guideId = guideId
    }
    
    if (published === "true") {
      query.isPublished = true
    }

    const stories: any[] = await storiesCollection
      .find(query)
      .sort({ publishedDate: -1 })
      .toArray()

    return NextResponse.json({ stories })
  } catch (error) {
    console.error("Error fetching stories:", error)
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guideId, guideName, guideAvatar, title, content, coverImage, isPublished } = body

    if (!guideId || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const storiesCollection = await getCollection("stories")

    // Create excerpt from content (first 150 characters)
    const excerpt = content.substring(0, 150) + (content.length > 150 ? "..." : "")

    const newStory: Story = {
      guideId,
      guideName: guideName || "",
      guideAvatar: guideAvatar || "",
      title,
      content,
      excerpt,
      coverImage: coverImage || "",
      isPublished: isPublished !== undefined ? isPublished : true,
      publishedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await storiesCollection.insertOne(newStory as any)

    return NextResponse.json({
      success: true,
      storyId: result.insertedId.toString(),
      story: { ...newStory, id: result.insertedId.toString() }
    })
  } catch (error) {
    console.error("Error creating story:", error)
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    )
  }
}
