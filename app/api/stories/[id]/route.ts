import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storiesCollection = await getCollection("stories")
    
    const story = await storiesCollection.findOne({
      _id: new ObjectId(id)
    })

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      story: {
        ...story,
        id: story._id.toString(),
        _id: story._id.toString()
      }
    })
  } catch (error) {
    console.error("Error fetching story:", error)
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, content, coverImage, isPublished } = body

    const storiesCollection = await getCollection("stories")

    const excerpt = content ? content.substring(0, 150) + (content.length > 150 ? "..." : "") : undefined

    const updates: any = {
      updatedAt: new Date().toISOString()
    }

    if (title) updates.title = title
    if (content) {
      updates.content = content
      updates.excerpt = excerpt
    }
    if (coverImage !== undefined) updates.coverImage = coverImage
    if (isPublished !== undefined) updates.isPublished = isPublished

    const result = await storiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating story:", error)
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storiesCollection = await getCollection("stories")

    const result = await storiesCollection.deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting story:", error)
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    )
  }
}
