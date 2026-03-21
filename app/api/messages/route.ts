import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"
import { getPaginationParams, createPaginatedResponse } from "@/lib/utils/pagination"
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/responses"

interface MessageDocument {
  _id?: ObjectId
  guideId: string
  guideName: string
  guideEmail: string
  guideAvatar: string
  senderId: string
  senderName: string
  senderEmail: string
  senderAvatar: string
  senderUserId?: string  // Store actual user ID if sender is logged in
  message: string
  createdAt: string
  read: boolean
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const type = searchParams.get("type") // 'guide' or 'user'
    const conversationId = searchParams.get("conversationId") // Get specific conversation
    const paginate = searchParams.get("paginate") === "true"

    console.log('Fetching messages for userId:', userId, 'type:', type)

    if (!userId) {
      return NextResponse.json(createErrorResponse("User ID is required", 400), { status: 400 })
    }

    const messagesCollection = await getCollection("messages")

    // If conversationId is provided, fetch messages for that specific conversation
    if (conversationId && paginate) {
      const { page, limit, skip } = getPaginationParams(searchParams, 50)
      
      const query = {
        $or: [
          { guideId: userId, senderId: conversationId },
          { guideId: userId, senderUserId: conversationId },
          { senderId: userId, guideId: conversationId },
          { senderUserId: userId, guideId: conversationId }
        ]
      }
      
      const totalCount = await messagesCollection.countDocuments(query)
      
      const messages = await messagesCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()
      
      return NextResponse.json(createPaginatedResponse(messages, totalCount, page, limit))
    }

    // Get all conversations for this user - both sent AND received
    const messages = await messagesCollection
      .find({
        $or: [
          { guideId: userId },       // Messages TO this guide
          { senderId: userId },      // Messages FROM this guide (with user ID as senderId)
          { senderUserId: userId }   // Messages FROM this guide (with email as senderId but user ID in senderUserId)
        ]
      })
      .sort({ createdAt: -1 })
      .toArray() as unknown as MessageDocument[]

    console.log('Found messages:', messages.length)
    console.log('Messages:', JSON.stringify(messages, null, 2))

    // Group messages by conversation
    const conversationsMap = new Map()

    for (const message of messages) {
      // Determine who the other person in the conversation is
      const isUserTheGuide = message.guideId === userId
      const isUserTheSender = message.senderId === userId || message.senderUserId === userId
      
      // The conversation partner is the person who is NOT the current user
      // Use senderUserId if available (for logged-in users), otherwise fallback to senderId (email)
      const conversationIdVal = isUserTheGuide 
        ? (message.senderUserId || message.senderId)  // Use user ID if available, else email
        : message.guideId

      if (!conversationsMap.has(conversationIdVal)) {
        conversationsMap.set(conversationIdVal, {
          id: conversationIdVal,
          messages: [],
          lastMessage: message.message,
          lastMessageTime: message.createdAt,
          unread: 0,
          // Participant is the OTHER person in the conversation
          participantName: isUserTheGuide ? message.senderName : message.guideName,
          participantEmail: isUserTheGuide ? message.senderEmail : message.guideEmail,
          participantAvatar: isUserTheGuide ? message.senderAvatar : message.guideAvatar
        })
      }

      const conversation = conversationsMap.get(conversationIdVal)
      conversation.messages.push({
        id: message._id?.toString() || "",
        text: message.message,
        time: message.createdAt,
        // Message is "own" if current user is the sender (check both senderId and senderUserId)
        isOwn: message.senderId === userId || message.senderUserId === userId,
        sender: (message.senderId === userId || message.senderUserId === userId) ? message.senderName : message.guideName
      })
    }

    const conversations = Array.from(conversationsMap.values())

    console.log('Returning conversations:', conversations.length)
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      createErrorResponse("Failed to fetch messages", 500),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guideId, guideName, guideEmail, guideAvatar, senderName, senderEmail, senderAvatar, message, senderId } = body

    console.log('Received message request:', { guideId, guideName, senderName, senderEmail, message })

    if (!guideId || !message || !senderName || !senderEmail) {
      console.log('Missing required fields:', { guideId, message, senderName, senderEmail })
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const messagesCollection = await getCollection("messages")

    const newMessage: MessageDocument = {
      guideId,
      guideName: guideName || "",
      guideEmail: guideEmail || "",
      guideAvatar: guideAvatar || "",
      senderId: senderId || senderEmail, // Use email as fallback ID for non-logged users
      senderName,
      senderEmail,
      senderAvatar: senderAvatar || "",
      // Only store user ID in senderUserId if senderId is provided AND it's not an email
      senderUserId: (senderId && !senderId.includes('@')) ? senderId : undefined,
      message,
      createdAt: new Date().toISOString(),
      read: false
    }

    console.log('Inserting message into database:', newMessage)
    console.log('Guide ID type:', typeof guideId, 'Value:', guideId)
    const result = await messagesCollection.insertOne(newMessage as any)
    console.log('Message inserted with ID:', result.insertedId.toString())

    return NextResponse.json({
      success: true,
      messageId: result.insertedId.toString()
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
