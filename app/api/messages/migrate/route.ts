import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"

export async function POST(request: NextRequest) {
  try {
    const messagesCollection = await getCollection("messages")
    const usersCollection = await getCollection("users")
    
    // Get all users to create email -> userId mapping
    const users: any[] = await usersCollection.find({}).toArray()
    const emailToUserId: Record<string, string> = {}
    
    for (const user of users) {
      if (user.email && user._id) {
        emailToUserId[user.email.toLowerCase()] = user._id.toString()
      }
    }
    
    console.log('Email to User ID mapping:', emailToUserId)
    
    // Find all messages
    const messages: any[] = await messagesCollection.find({}).toArray()
    let updatedCount = 0
    
    for (const message of messages) {
      const updates: any = {}
      
      // Check if guideId is an email and needs to be converted
      if (message.guideId && message.guideId.includes('@')) {
        const userId = emailToUserId[message.guideId.toLowerCase()]
        if (userId) {
          updates.guideId = userId
          console.log(`Updating guideId from ${message.guideId} to ${userId}`)
        }
      }
      
      // Check if senderId is an email
      if (message.senderId && message.senderId.includes('@')) {
        const userId = emailToUserId[message.senderId.toLowerCase()]
        if (userId) {
          // Store the userId in senderUserId field for proper conversation grouping
          updates.senderUserId = userId
          console.log(`Adding senderUserId ${userId} for sender ${message.senderId}`)
        }
      } else if (message.senderId && !message.senderId.includes('@')) {
        // If senderId is already a user ID, copy it to senderUserId
        updates.senderUserId = message.senderId
        console.log(`Copying senderId ${message.senderId} to senderUserId`)
      }
      
      // Update if there are any changes
      if (Object.keys(updates).length > 0) {
        await messagesCollection.updateOne(
          { _id: message._id },
          { $set: updates }
        )
        updatedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      totalMessages: messages.length,
      updatedMessages: updatedCount,
      emailToUserId,
    })
  } catch (error) {
    console.error("Error migrating messages:", error)
    return NextResponse.json(
      { error: "Failed to migrate messages" },
      { status: 500 }
    )
  }
}
