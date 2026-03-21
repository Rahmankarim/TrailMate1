"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  DollarSign,
  Star,
  Users,
  CheckCircle,
  XCircle,
  MessageCircle,
  Plus,
  MapPin,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface Booking {
  _id: string
  userId?: string
  status: string
  startDate: string
  endDate: string
  guests: number
  totalPrice: number
  travelerName: string
  travelerEmail: string
  destination?: {
    name: string
  }
}

interface Destination {
  _id: string
  name: string
  coverImage: string
  price: number
  isPublished: boolean
}

export default function GuideDashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [availability, setAvailability] = useState({
    available: true,
    notes: ""
  })
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageData, setMessageData] = useState({ message: "", recipientId: "", recipientName: "", recipientEmail: "" })
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    avgRating: 0,
    activeTours: 0,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/guide")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch guide's bookings
        const bookingsRes = await fetch("/api/bookings?type=guide")
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings(data.bookings || [])

          // Only count PAID bookings for earnings
          const paidBookings = data.bookings.filter((b: Booking) => b.paymentStatus === "paid")
          const earnings = paidBookings.reduce((sum: number, b: Booking) => sum + (b.totalPrice || 0), 0)

          setStats((prev) => ({
            ...prev,
            totalBookings: data.bookings.length,
            totalEarnings: earnings,
          }))
        }

        // Fetch guide's destinations/tours
        const destRes = await fetch("/api/destinations?userOnly=true")
        if (destRes.ok) {
          const data = await destRes.json()
          setDestinations(data.destinations || [])
          setStats((prev) => ({
            ...prev,
            activeTours: data.destinations?.filter((d: Destination) => d.isPublished).length || 0,
          }))
        }

        // Fetch guide's profile for availability
        if (user?._id) {
          const guideRes = await fetch(`/api/guides?userId=${user._id}`)
          if (guideRes.ok) {
            const guideData = await guideRes.json()
            if (guideData.guides && guideData.guides.length > 0) {
              const guide = guideData.guides[0]
              setAvailability({
                available: guide.availability?.available ?? true,
                notes: guide.availability?.notes || ""
              })
            }
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const handleBookingAction = async (bookingId: string, action: "accept" | "decline" | "complete") => {
    try {
      const booking = bookings.find(b => b._id === bookingId)
      if (!booking) return

      let status: string
      if (action === "accept") {
        status = "confirmed"
      } else if (action === "decline") {
        status = "cancelled"
      } else {
        status = "completed"
      }
      
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status,
          blockDates: action === "accept" // Block dates when accepting
        }),
      })

      if (res.ok) {
        toast({
          title: action === "accept" ? "Booking Accepted" : action === "decline" ? "Booking Declined" : "Tour Completed",
          description: action === "accept" 
            ? "The dates have been blocked on your calendar." 
            : action === "decline"
            ? "The booking request has been declined."
            : "The tour has been marked as completed and will appear on your profile.",
        })
        
        // Refresh bookings and guide stats
        const bookingsRes = await fetch("/api/bookings?type=guide")
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings(data.bookings || [])
        }

        // If completing a tour, update guide's totalTours count
        if (action === "complete" && user?._id) {
          const guideRes = await fetch(`/api/guides?userId=${user._id}`)
          if (guideRes.ok) {
            const guideData = await guideRes.json()
            if (guideData.guides && guideData.guides.length > 0) {
              const guideId = guideData.guides[0]._id
              await fetch(`/api/guides/${guideId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  totalTours: (guideData.guides[0].totalTours || 0) + 1
                }),
              })
            }
          }
        }
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating booking:", error)
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveAvailability = async () => {
    if (!user?._id) return

    setIsSavingAvailability(true)
    try {
      // First get the guide profile ID
      const guideRes = await fetch(`/api/guides?userId=${user._id}`)
      if (!guideRes.ok) {
        throw new Error("Failed to fetch guide profile")
      }

      const guideData = await guideRes.json()
      if (!guideData.guides || guideData.guides.length === 0) {
        toast({
          title: "Error",
          description: "Guide profile not found. Please complete your profile first.",
          variant: "destructive",
        })
        return
      }

      const guideId = guideData.guides[0]._id

      // Update the guide's availability
      const response = await fetch(`/api/guides/${guideId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availability: {
            available: availability.available,
            notes: availability.notes
          }
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Availability updated successfully",
        })
        setAvailabilityOpen(false)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update availability",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating availability:", error)
      toast({
        title: "Error",
        description: "Failed to update availability. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingAvailability(false)
    }
  }

  const handleOpenMessage = (booking: Booking) => {
    setMessageData({
      message: "",
      recipientId: booking.userId || "",
      recipientName: booking.travelerName,
      recipientEmail: booking.travelerEmail
    })
    setMessageOpen(true)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !messageData.message.trim()) return

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guideId: messageData.recipientId,
          guideName: messageData.recipientName,
          guideEmail: messageData.recipientEmail,
          guideAvatar: "",
          senderId: user._id,
          senderName: user.name || user.email,
          senderEmail: user.email,
          senderAvatar: (user as any).avatar || "",
          senderUserId: user._id,
          message: messageData.message,
        }),
      })

      if (response.ok) {
        toast({
          title: "Message sent",
          description: `Your message has been sent to ${messageData.recipientName}`,
        })
        setMessageOpen(false)
        setMessageData({ message: "", recipientId: "", recipientName: "", recipientEmail: "" })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send message",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending")
  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" && new Date(b.endDate) >= new Date())
  const completedBookings = bookings.filter((b) => b.status === "completed")

  const formatDate = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const endDate = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    return `${startDate} - ${endDate}`
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="guide" user={{ name: user?.name || "Guide", email: user?.email || "" }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Guide Dashboard" />

        <main className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}!</h2>
              <p className="text-muted-foreground">
                {pendingBookings.length > 0
                  ? `You have ${pendingBookings.length} pending booking request${pendingBookings.length > 1 ? "s" : ""}`
                  : "No pending requests"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAvailabilityOpen(true)} className="cursor-pointer">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Availability
              </Button>
              <Link href="/dashboard/guide/destinations/new">
                <Button className="bg-foreground text-background hover:bg-foreground/90 cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tour
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.totalBookings}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold text-foreground mt-1">${stats.totalEarnings.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">From completed tours</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.avgRating || "N/A"}</p>
                    <p className="text-xs text-muted-foreground mt-1">From reviews</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Star className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Tours</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.activeTours}</p>
                    <p className="text-xs text-muted-foreground mt-1">Published</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Pending & Upcoming */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pending Bookings */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>Booking requests awaiting your response</CardDescription>
                  </div>
                  <Badge variant="secondary">{pendingBookings.length} pending</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No pending requests</p>
                    </div>
                  ) : (
                    pendingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="p-4 rounded-xl border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {booking.travelerName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{booking.travelerName}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.destination?.name || "Custom Tour"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <p className="font-bold text-foreground">${booking.totalPrice}</p>
                            {booking.paymentStatus && (
                              <Badge className={booking.paymentStatus === "paid" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                                {booking.paymentStatus === "unpaid" ? "Not Paid" : booking.paymentStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(booking.startDate, booking.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {booking.guests} guest{booking.guests > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={() => handleBookingAction(booking._id, "accept")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive bg-transparent"
                            onClick={() => handleBookingAction(booking._id, "decline")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-transparent"
                            onClick={() => handleOpenMessage(booking)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Tours Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tours</CardTitle>
                  <CardDescription>Your confirmed bookings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No upcoming tours</p>
                    </div>
                  ) : (
                    upcomingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="p-4 rounded-xl border border-border bg-accent/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {booking.travelerName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-foreground">{booking.travelerName}</p>
                              <p className="text-xs text-muted-foreground">
                                {booking.destination?.name || "Custom Tour"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge variant="default" className="bg-green-600">Confirmed</Badge>
                            {booking.paymentStatus && (
                              <Badge className={booking.paymentStatus === "paid" ? "bg-green-500/10 text-green-600 text-xs" : "bg-orange-500/10 text-orange-600 text-xs"}>
                                {booking.paymentStatus === "unpaid" ? "Payment Pending" : booking.paymentStatus === "pending" ? "Processing" : "Paid"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(booking.startDate, booking.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleOpenMessage(booking)}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleBookingAction(booking._id, "complete")}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => handleBookingAction(booking._id, "decline")}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel Booking
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Completed Tours Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Completed Tours</CardTitle>
                  <CardDescription>Successfully completed bookings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completedBookings.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No completed tours yet</p>
                    </div>
                  ) : (
                    completedBookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking._id}
                        className="p-4 rounded-xl border border-border bg-muted/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {booking.travelerName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-foreground">{booking.travelerName}</p>
                              <p className="text-xs text-muted-foreground">
                                {booking.destination?.name || "Custom Tour"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-600/20 text-blue-600">Completed</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(booking.startDate, booking.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${booking.totalPrice}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* My Tours */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>My Tours</CardTitle>
                  <Link href="/dashboard/guide/destinations">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {destinations.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">No tours created yet</p>
                      <Link href="/dashboard/guide/destinations/new">
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Create Tour
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    destinations.slice(0, 3).map((dest) => (
                      <div key={dest._id} className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={dest.coverImage || "/placeholder.svg?height=56&width=56&query=mountain"}
                            alt={dest.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{dest.name}</p>
                          <p className="text-sm text-muted-foreground">${dest.price}/person</p>
                        </div>
                        <Badge variant={dest.isPublished ? "default" : "secondary"}>
                          {dest.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Earnings Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Completed Tours</span>
                      <span className="font-medium text-foreground">${stats.totalEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pending Payments</span>
                      <span className="font-medium text-foreground">
                        ${pendingBookings.reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <span className="font-semibold text-foreground">Total Potential</span>
                      <span className="text-xl font-bold text-foreground">
                        $
                        {(
                          stats.totalEarnings + pendingBookings.reduce((sum, b) => sum + b.totalPrice, 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Availability Management Dialog */}
      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Availability</DialogTitle>
            <DialogDescription>
              Set your availability status for new booking requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="available">Available for Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Allow travelers to send you booking requests
                </p>
              </div>
              <Switch
                id="available"
                checked={availability.available}
                onCheckedChange={(checked) =>
                  setAvailability({ ...availability, available: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Availability Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Available on weekends only, Fully booked until March..."
                value={availability.notes}
                onChange={(e) =>
                  setAvailability({ ...availability, notes: e.target.value })
                }
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These notes will be visible to travelers on your profile
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Current Status</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {availability.available
                    ? "You are currently accepting bookings"
                    : "You are not accepting new bookings"}
                </p>
              </div>
              <Badge variant={availability.available ? "default" : "secondary"}>
                {availability.available ? "Available" : "Unavailable"}
              </Badge>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setAvailabilityOpen(false)}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAvailability}
                disabled={isSavingAvailability}
                className="flex-1 cursor-pointer"
              >
                {isSavingAvailability ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {messageData.recipientName}</DialogTitle>
            <DialogDescription>
              Send a message about the booking or tour details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={messageData.message}
                onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                rows={6}
                required
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMessageOpen(false)}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 cursor-pointer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
