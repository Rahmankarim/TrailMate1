"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { MessageCircle, Send, Loader2, RefreshCw, Search, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

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

export default function CompanyMessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user?._id) {
      fetchMessages()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchMessages, 30000)
      return () => clearInterval(interval)
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
      const response = await fetch(`/api/messages?userId=${user?._id}&type=company`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
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

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guideId: conversation.id,
          guideName: conversation.participantName,
          guideEmail: conversation.participantEmail,
          guideAvatar: conversation.participantAvatar,
          senderId: user._id,
          senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          senderEmail: user.email,
          senderAvatar: user.avatar,
          message: newMessage,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        await fetchMessages()
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participantEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedConversationData = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        role="company" 
        user={{ 
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Company", 
          email: user?.email || "",
          avatar: user?.avatar 
        }} 
      />
      
      <div className="flex-1 ml-64">
        <DashboardTopbar title="Messages" />
        
        <main className="p-6">
          <Card className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-12 h-full">
              {/* Conversations List */}
              <div className="col-span-4 border-r">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <CardTitle>Conversations</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchMessages}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-y-auto h-[calc(100%-8rem)]">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No conversations found' : 'No messages yet'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {searchTerm ? 'Try a different search term' : 'Messages from clients and team members will appear here'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                            selectedConversation === conversation.id ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.participantAvatar} />
                              <AvatarFallback>
                                {conversation.participantName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm truncate">
                                  {conversation.participantName}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conversation.lastMessageTime).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage}
                              </p>
                              {conversation.unread > 0 && (
                                <Badge variant="default" className="mt-1">
                                  {conversation.unread} new
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Chat Area */}
              <div className="col-span-8 flex flex-col">
                {selectedConversationData ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="border-b">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedConversationData.participantAvatar} />
                          <AvatarFallback>
                            {selectedConversationData.participantName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{selectedConversationData.participantName}</CardTitle>
                          <CardDescription>{selectedConversationData.participantEmail}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                      {selectedConversationData.messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        selectedConversationData.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${message.isOwn ? 'order-2' : 'order-1'}`}>
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  message.isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 px-1">
                                {new Date(message.time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </CardContent>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message... (Shift+Enter for new line)"
                          className="min-h-[60px] max-h-[120px] resize-none"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSending}
                          className="px-6"
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm mt-2">Choose a conversation to start messaging</p>
                    </div>
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
