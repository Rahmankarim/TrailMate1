"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import {
  Bell,
  CheckCircle,
  Calendar,
  DollarSign,
  MessageCircle,
  Star,
  Trash2,
  Loader2,
  Check,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  _id: string
  userId: string
  type: "booking" | "payment" | "message" | "review" | "system"
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ read: true }),
      })

      if (response.ok) {
        setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true } : n)))
      }
    } catch (error) {
      console.error("Error marking as read:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })))
        toast({
          title: "Success",
          description: "All notifications marked as read",
        })
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleDelete = async (id: string) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setNotifications(notifications.filter((n) => n._id !== id))
        toast({
          title: "Deleted",
          description: "Notification deleted",
        })
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return Calendar
      case "payment":
        return DollarSign
      case "message":
        return MessageCircle
      case "review":
        return Star
      default:
        return Bell
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role="user"
        user={{
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User",
          email: user?.email || "",
          avatar: user?.avatar,
        }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Notifications" />

        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Notifications</h2>
                <p className="text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button onClick={handleMarkAllAsRead} variant="outline">
                  <Check className="h-4 w-4 mr-2" />
                  Mark All as Read
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">You're all caught up! No new notifications.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon = getIcon(notification.type)
                  return (
                    <Card
                      key={notification._id}
                      className={`transition-all ${!notification.read ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${!notification.read ? "bg-blue-100 dark:bg-blue-900" : "bg-secondary"}`}>
                            <Icon className={`h-5 w-5 ${!notification.read ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold">{notification.title}</h4>
                              {!notification.read && (
                                <Badge variant="default" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsRead(notification._id)}
                                disabled={processingId === notification._id}
                              >
                                {processingId === notification._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(notification._id)}
                              disabled={processingId === notification._id}
                            >
                              {processingId === notification._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
