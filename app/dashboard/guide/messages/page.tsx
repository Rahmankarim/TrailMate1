"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { MessageCircle, Send, Plus, Loader2, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  sender: string
  text: string
  time: string
  isOwn: boolean
}

interface Conversation {
  id: string
  participantName: string
  participantEmail: string
  participantAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unread: number
  messages: Message[]
}

export default function GuideMessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (user?._id) {
      console.log('Current logged-in user ID:', user._id)
      console.log('User name:', user.firstName, user.lastName)
      console.log('User email:', user.email)
      fetchMessages()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [conversations, selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    try {
      console.log('=== FETCHING MESSAGES ===')
      console.log('Looking for messages where guideId =', user?._id)
      const response = await fetch(`/api/messages?userId=${user?._id}&type=guide`, {
        credentials: 'include',
      })
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Found conversations:', data.conversations?.length || 0)
        if (data.conversations?.length > 0) {
          console.log('First conversation:', data.conversations[0])
        }
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    setIsSending(true)
    try {
      const conversation = conversations.find(c => c.id === selectedConversation)
      if (!conversation) return

      console.log('=== SENDING REPLY ===')
      console.log('From (sender):', user._id, `${user.firstName} ${user.lastName}`)
      console.log('To (guide):', conversation.id, conversation.participantName)

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guideId: conversation.id,  // The person RECEIVING the message
          guideName: conversation.participantName,
          guideEmail: conversation.participantEmail,
          guideAvatar: conversation.participantAvatar,
          senderId: user._id,  // The person SENDING the message (user ID)
          senderName: `${user.firstName} ${user.lastName}`,
          senderEmail: user.email,
          senderAvatar: user.avatar,
          message: newMessage,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        await fetchMessages() // Refresh messages
        scrollToBottom()
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully.",
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const selectedConversationData = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="guide" user={user ? { name: user.firstName + ' ' + user.lastName, email: user.email, avatar: user.avatar } : undefined} />
      
      <div className="flex-1 ml-64">
        <DashboardTopbar title="Messages" />
        
        <main className="p-6">
          <Card className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-12 h-full">
              {/* Conversations List */}
              <div className="col-span-4 border-r">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Messages</CardTitle>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setIsLoading(true)
                        fetchMessages()
                      }}
                      className="cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <div className="overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                      <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-center">No messages yet</p>
                      <p className="text-sm text-center mt-2">
                        Messages from travelers will appear here
                      </p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                          selectedConversation === conversation.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={conversation.participantAvatar} />
                            <AvatarFallback>{conversation.participantName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm truncate">{conversation.participantName}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(conversation.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                            {conversation.unread > 0 && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                {conversation.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="col-span-8 flex flex-col h-full">
                {selectedConversation && selectedConversationData ? (
                  <>
                    <CardHeader className="border-b flex-shrink-0">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={selectedConversationData.participantAvatar} />
                          <AvatarFallback>{selectedConversationData.participantName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{selectedConversationData.participantName}</CardTitle>
                          <CardDescription>{selectedConversationData.participantEmail}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 28rem)' }}>
                      {selectedConversationData.messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No messages yet</p>
                        </div>
                      ) : (
                        [...selectedConversationData.messages].reverse().map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="text-sm mb-1">{message.text}</div>
                              <div className={`text-xs ${message.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {new Date(message.time).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t flex-shrink-0 bg-background">
                      <div className="flex gap-2">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="min-h-[60px] max-h-[120px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendMessage}
                          size="icon"
                          className="cursor-pointer h-[60px] w-[60px]"
                          disabled={isSending || !newMessage.trim()}
                        >
                          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg">Select a conversation to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
