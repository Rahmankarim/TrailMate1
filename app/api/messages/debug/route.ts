import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"

export async function GET(request: NextRequest) {
  try {
    const messagesCollection = await getCollection("messages")
    
    // Get ALL messages in the database
    const allMessages = await messagesCollection
      .find({})
      .toArray() as any[]

    return NextResponse.json({
      total: allMessages.length,
      messages: allMessages.map((msg: any) => ({
        _id: msg._id?.toString(),
        guideId: msg.guideId,
        guideName: msg.guideName,
        senderId: msg.senderId,
        senderUserId: msg.senderUserId,
        senderName: msg.senderName,
        senderEmail: msg.senderEmail,
        message: msg.message,
        createdAt: msg.createdAt
      }))
    })
  } catch (error) {
    console.error("Error fetching all messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}
