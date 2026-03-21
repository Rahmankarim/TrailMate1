import type { ObjectId } from "mongodb"

export interface Message {
  _id?: ObjectId
  guideId: string                    // The recipient's ID (can be guide, user, or company)
  guideName: string                  // The recipient's name
  guideEmail: string                 // The recipient's email
  guideAvatar?: string               // The recipient's avatar
  senderId: string                   // The sender's ID or email
  senderName: string                 // The sender's name
  senderEmail: string                // The sender's email
  senderAvatar?: string              // The sender's avatar
  senderUserId?: string              // The actual user ID if sender is logged in
  message: string                    // The message content
  createdAt: Date                    // When the message was sent
  read: boolean                      // Whether the message has been read
  conversationId?: string            // Optional conversation grouping
}

export interface Conversation {
  id: string
  participantName: string
  participantEmail: string
  participantAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  messages: {
    id: string
    sender: string
    text: string
    time: string
    isOwn: boolean
  }[]
}
