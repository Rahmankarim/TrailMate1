"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Star,
  MapPin,
  Languages,
  Award,
  Calendar,
  MessageCircle,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
} from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { useAuth } from "@/contexts/auth-context"

interface Guide {
  _id: string
  name: string
  email: string
  avatar?: string
  profileImage?: string
  image?: string
  updatedAt?: string
  bio: string
  location: string
  specialties: string[]
  languages: string[]
  experience: number
  certifications: string[]
  pricePerDay: number
  rating: number
  reviewCount: number
  totalTours: number
  isVerified: boolean
  availability?: {
    available: boolean
  }
  blockedDates?: Array<{
    startDate: Date
    endDate: Date
    bookingId: string
  }>
}

export default function GuideDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [guide, setGuide] = useState<Guide | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [contactOpen, setContactOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [messageData, setMessageData] = useState({ name: "", email: "", message: "" })
  const [bookingData, setBookingData] = useState({ date: "", guests: "1", duration: "1", notes: "" })
  const [stories, setStories] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [completedTours, setCompletedTours] = useState<any[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "", tourDate: "" })
  const [averageRating, setAverageRating] = useState(0)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)
  const [userExistingReview, setUserExistingReview] = useState<any>(null)
  const { user } = useAuth()
  const [hireOpen, setHireOpen] = useState(false)
  const [hireData, setHireData] = useState({
    tourName: "",
    tourDescription: "",
    startDate: "",
    endDate: "",
    employees: "1",
    notes: ""
  })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guide) return

    try {
      // Use userId if available, otherwise fallback to _id
      const guideUserId = (guide as any).userId || guide._id
      
      console.log('=== SENDING MESSAGE ====')
      console.log('Guide object:', guide)
      console.log('Guide _id:', guide._id)
      console.log('Guide userId:', (guide as any).userId)
      console.log('Using guideUserId:', guideUserId)
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          guideId: guideUserId,
          guideName: guide.name,
          guideEmail: guide.email,
          guideAvatar: guide.avatar,
          senderId: user?._id || messageData.email,  // Use user ID if logged in, else email
          senderName: messageData.name,
          senderEmail: messageData.email,
          message: messageData.message,
        }),
      })

      if (response.ok) {
        toast({
          title: "Message sent!",
          description: `Your message has been sent to ${guide.name}`,
        })
        setContactOpen(false)
        setMessageData({ name: "", email: "", message: "" })
        console.log('Message sent successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to send message:', errorData)
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book a guide",
        variant: "destructive",
      })
      router.push("/signin")
      return
    }

    if (!guide) return

    try {
      const startDate = new Date(bookingData.date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + parseInt(bookingData.duration) - 1)
      
      // Check if dates are blocked
      if (guide.blockedDates && guide.blockedDates.length > 0) {
        const isBlocked = guide.blockedDates.some(blocked => {
          const blockedStart = new Date(blocked.startDate)
          const blockedEnd = new Date(blocked.endDate)
          
          // Check if requested dates overlap with blocked dates
          return (startDate <= blockedEnd && endDate >= blockedStart)
        })
        
        if (isBlocked) {
          toast({
            title: "Dates unavailable",
            description: "The selected dates are already booked. Please choose different dates.",
            variant: "destructive",
          })
          return
        }
      }
      
      const totalPrice = guide.pricePerDay * parseInt(bookingData.duration)

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          guideId: guide._id,  // Use guide profile ID, not userId
          guideName: guide.name,
          guideEmail: guide.email,
          travelerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          travelerEmail: user.email,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          guests: parseInt(bookingData.guests),
          totalPrice: totalPrice,
          status: "pending",
          notes: bookingData.notes,
          type: "guide",
          bookingType: user.role === "company" ? "guide_hiring" : "guide_booking",
        }),
      })

      if (response.ok) {
        toast({
          title: "Booking request sent!",
          description: `Your booking request for ${bookingData.duration} day(s) has been sent to ${guide.name}`,
        })
        setBookingOpen(false)
        setBookingData({ date: "", guests: "1", duration: "1", notes: "" })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create booking request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        title: "Error",
        description: "Failed to create booking request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleHireGuide = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to hire this guide",
        variant: "destructive",
      })
      router.push("/signin")
      return
    }

    if (user.role !== "company") {
      toast({
        title: "Access denied",
        description: "Only companies can hire guides for corporate events",
        variant: "destructive",
      })
      return
    }

    if (!guide) return

    try {
      const startDate = new Date(hireData.startDate)
      const endDate = new Date(hireData.endDate)
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const totalPrice = guide.pricePerDay * days

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          guideId: guide._id,
          guideName: guide.name,
          guideEmail: guide.email,
          travelerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          travelerEmail: user.email,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          employees: parseInt(hireData.employees),
          totalPrice: totalPrice,
          status: "pending",
          notes: hireData.notes,
          tourName: hireData.tourName,
          tourDescription: hireData.tourDescription,
          type: "guide",
          bookingType: "guide_hiring",
        }),
      })

      if (response.ok) {
        toast({
          title: "Hiring request sent!",
          description: `Your hiring request has been sent to ${guide.name}. Check your Guide Hiring page for details.`,
        })
        setHireOpen(false)
        setHireData({
          tourName: "",
          tourDescription: "",
          startDate: "",
          endDate: "",
          employees: "1",
          notes: ""
        })
        // Redirect to guide hiring page
        setTimeout(() => {
          router.push("/dashboard/company/guide-hiring")
        }, 1500)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send hiring request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error hiring guide:", error)
      toast({
        title: "Error",
        description: "Failed to send hiring request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a review",
        variant: "destructive",
      })
      return
    }

    if (!guide) return

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guideId: guide._id,
          guideName: guide.name,
          guideAvatar: guide.avatar,
          userId: user._id,
          userName: (user as any).name || user.email,
          userAvatar: (user as any).avatar || "",
          rating: reviewData.rating,
          comment: reviewData.comment,
          tourDate: reviewData.tourDate || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Review submitted!",
          description: "Thank you for your feedback",
        })
        setReviewOpen(false)
        setReviewData({ rating: 5, comment: "", tourDate: "" })
        
        // Refresh reviews
        const reviewsResponse = await fetch(`/api/reviews?guideId=${guide._id}&paginate=false`)
        if (reviewsResponse.ok) {
          const data = await reviewsResponse.json()
          setReviews(data.reviews || [])
          setAverageRating(data.averageRating || 0)
          
          // Update guide rating
          setGuide({
            ...guide,
            rating: data.averageRating,
            reviewCount: data.totalReviews
          })
        }
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to submit review",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    }
  }


  useEffect(() => {
    async function fetchGuide() {
      try {
        const res = await fetch(`/api/guides/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setGuide(data.guide)
          
          // Fetch stories for this guide
          const storiesRes = await fetch(`/api/stories?guideId=${data.guide.userId || params.id}&published=true`)
          if (storiesRes.ok) {
            const storiesData = await storiesRes.json()
            setStories(storiesData.stories)
          }

          // Fetch completed tours for this guide
          const toursRes = await fetch(`/api/bookings/completed?guideId=${params.id}`)
          if (toursRes.ok) {
            const toursData = await toursRes.json()
            setCompletedTours(toursData.bookings || [])
          }
        } else {
          setGuide(null)
        }
      } catch (err) {
        console.error("Error fetching guide:", err)
        setGuide(null)
      } finally {
        setIsLoading(false)
      }
    }

    async function fetchReviews() {
      try {
        const response = await fetch(`/api/reviews?guideId=${params.id}&paginate=false`)
        if (response.ok) {
          const data = await response.json()
          setReviews(data.reviews || [])
          setAverageRating(data.averageRating || 0)
          
          // Check if current user has already reviewed
          if (user?._id) {
            const existingUserReview = data.reviews?.find((r: any) => r.userId === user._id)
            if (existingUserReview) {
              setHasUserReviewed(true)
              setUserExistingReview(existingUserReview)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
      }
    }

    if (params.id) {
      fetchGuide()
      fetchReviews()
    }
  }, [params.id])

  // Re-check user's review when user changes
  useEffect(() => {
    if (user?._id && reviews.length > 0) {
      const existingUserReview = reviews.find((r: any) => r.userId === user._id)
      if (existingUserReview) {
        setHasUserReviewed(true)
        setUserExistingReview(existingUserReview)
      } else {
        setHasUserReviewed(false)
        setUserExistingReview(null)
      }
    }
  }, [user, reviews])

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  if (!guide) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-3xl font-bold">Guide Not Found</h1>
          <p className="text-muted-foreground">The guide you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/guides")} className="cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guides
          </Button>
        </div>
        <Footer />
      </>
    )
  }

  const guideImageSource = guide.avatar || guide.profileImage || guide.image || "/placeholder.svg"
  const isInlineOrBlobGuideImage = guideImageSource.startsWith("data:") || guideImageSource.startsWith("blob:")
  const guideImageWithVersion = guideImageSource.includes("?") || isInlineOrBlobGuideImage
    ? guideImageSource
    : `${guideImageSource}?v=${encodeURIComponent(guide.updatedAt || guide._id)}`

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/guides")}
            className="mb-6 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guides
          </Button>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <Avatar className="h-40 w-40 border-4 border-background shadow-xl">
                <AvatarImage src={guideImageWithVersion} alt={guide.name} />
                <AvatarFallback className="text-4xl">
                  {guide.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-foreground">{guide.name}</h1>
                {guide.isVerified && (
                  <Badge className="bg-chart-2/20 text-chart-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">{guide.location}</span>
              </div>
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="text-xl font-bold text-foreground">{guide.rating}</span>
                  <span className="text-muted-foreground">({guide.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>{guide.experience} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span>{guide.totalTours} tours completed</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {guide.specialties?.map((specialty, index) => (
                  <Badge key={index} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-foreground text-background hover:bg-foreground/90 cursor-pointer">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Guide
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact {guide.name}</DialogTitle>
                      <DialogDescription>
                        Send a message to {guide.name} to inquire about tours or ask questions.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          value={messageData.name}
                          onChange={(e) => setMessageData({ ...messageData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Your Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={messageData.email}
                          onChange={(e) => setMessageData({ ...messageData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={messageData.message}
                          onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                          rows={4}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full cursor-pointer">Send Message</Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="cursor-pointer">
                      <Calendar className="h-4 w-4 mr-2" />
                      Check Availability
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Book {guide.name}</DialogTitle>
                      <DialogDescription>
                        Fill in the details below to request a booking with {guide.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBooking} className="space-y-4">
                      <div>
                        <Label htmlFor="date">Tour Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={bookingData.date}
                          onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                        {guide.blockedDates && guide.blockedDates.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Note: Some dates may be unavailable due to existing bookings
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="guests">Number of Guests</Label>
                        <Input
                          id="guests"
                          type="number"
                          min="1"
                          value={bookingData.guests}
                          onChange={(e) => setBookingData({ ...bookingData, guests: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration (days)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={bookingData.duration}
                          onChange={(e) => setBookingData({ ...bookingData, duration: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Special Requests (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special requirements or questions..."
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Cost:</span>
                          <span className="text-2xl font-bold">
                            ${guide.pricePerDay * parseInt(bookingData.duration || "1")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${guide.pricePerDay}/day × {bookingData.duration || "1"} day(s)
                        </p>
                      </div>
                      <Button type="submit" className="w-full cursor-pointer">Request Booking</Button>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Hire for Corporate Event button removed as per requirements - hire guides from guides page instead */}
                {false && user?.role === "company" && guide && (
                  <Dialog open={hireOpen} onOpenChange={setHireOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                        <Users className="h-4 w-4 mr-2" />
                        Hire for Corporate Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Hire {guide?.name} for Corporate Event</DialogTitle>
                        <DialogDescription>
                          Fill in the details for your corporate event. This will create a guide hiring request.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleHireGuide} className="space-y-4">
                        <div>
                          <Label htmlFor="tourName">Event/Tour Name *</Label>
                          <Input
                            id="tourName"
                            placeholder="e.g., Annual Team Building Retreat"
                            value={hireData.tourName}
                            onChange={(e) => setHireData({ ...hireData, tourName: e.target.value })}
                            required
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tourDescription">Event Description</Label>
                          <Textarea
                            id="tourDescription"
                            placeholder="Describe your corporate event, objectives, and any special requirements..."
                            value={hireData.tourDescription}
                            onChange={(e) => setHireData({ ...hireData, tourDescription: e.target.value })}
                            rows={3}
                            className="mt-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate">Start Date *</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={hireData.startDate}
                              onChange={(e) => setHireData({ ...hireData, startDate: e.target.value })}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="endDate">End Date *</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={hireData.endDate}
                              onChange={(e) => setHireData({ ...hireData, endDate: e.target.value })}
                              min={hireData.startDate || new Date().toISOString().split('T')[0]}
                              required
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="employees">Number of Employees *</Label>
                          <Input
                            id="employees"
                            type="number"
                            min="1"
                            value={hireData.employees}
                            onChange={(e) => setHireData({ ...hireData, employees: e.target.value })}
                            required
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hireNotes">Additional Notes</Label>
                          <Textarea
                            id="hireNotes"
                            placeholder="Any special requirements, dietary restrictions, accessibility needs, etc..."
                            value={hireData.notes}
                            onChange={(e) => setHireData({ ...hireData, notes: e.target.value })}
                            rows={3}
                            className="mt-2"
                          />
                        </div>
                        {hireData.startDate && hireData.endDate && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm">Duration:</span>
                              <span className="font-semibold">
                                {Math.ceil((new Date(hireData.endDate).getTime() - new Date(hireData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Estimated Cost:</span>
                              <span className="text-2xl font-bold">
                                PKR {((guide?.pricePerDay || 0) * (Math.ceil((new Date(hireData.endDate).getTime() - new Date(hireData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              PKR {(guide?.pricePerDay || 0).toLocaleString()}/day × {Math.ceil((new Date(hireData.endDate).getTime() - new Date(hireData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                            </p>
                          </div>
                        )}
                        <Button type="submit" className="w-full cursor-pointer">
                          Send Hiring Request
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="stories">Stories</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="tours">Tours</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About {guide.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{guide.bio}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Languages className="h-5 w-5" />
                          Languages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {guide.languages?.map((lang, index) => (
                            <Badge key={index} variant="secondary">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {guide.certifications?.map((cert, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Shield className="h-4 w-4 text-chart-2" />
                              <span className="text-muted-foreground">{cert}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="stories" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Travel Stories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No stories published yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {stories.map((story) => (
                            <div
                              key={story._id}
                              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => router.push(`/stories/${story._id}`)}
                            >
                              {story.coverImage && (
                                <div className="aspect-video bg-muted">
                                  <img
                                    src={story.coverImage}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="p-4">
                                <h3 className="font-semibold mb-2 line-clamp-2">{story.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                                  {story.excerpt}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(story.publishedDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Guest Reviews ({reviews.length})</span>
                        {user && !hasUserReviewed && (
                          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="cursor-pointer">
                                <Star className="h-4 w-4 mr-2" />
                                Write a Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Write a Review for {guide.name}</DialogTitle>
                                <DialogDescription>
                                  Share your experience with this guide
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSubmitReview} className="space-y-4">
                                <div>
                                  <Label htmlFor="rating">Rating</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-6 w-6 cursor-pointer transition-colors ${
                                          star <= reviewData.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground"
                                        }`}
                                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                                      />
                                    ))}
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {reviewData.rating} / 5
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="comment">Your Review</Label>
                                  <Textarea
                                    id="comment"
                                    placeholder="Share details of your experience..."
                                    value={reviewData.comment}
                                    onChange={(e) =>
                                      setReviewData({ ...reviewData, comment: e.target.value })
                                    }
                                    rows={4}
                                    className="mt-2"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="tourDate">Tour Date (optional)</Label>
                                  <Input
                                    id="tourDate"
                                    type="date"
                                    value={reviewData.tourDate}
                                    onChange={(e) =>
                                      setReviewData({ ...reviewData, tourDate: e.target.value })
                                    }
                                    className="mt-2"
                                  />
                                </div>
                                <Button type="submit" className="w-full cursor-pointer">
                                  Submit Review
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}
                        {user && hasUserReviewed && (
                          <Badge variant="secondary" className="text-xs">
                            You've reviewed this guide
                          </Badge>
                        )}
                      </CardTitle>
                      {averageRating > 0 && (
                        <CardDescription className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">average rating</span>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {hasUserReviewed && userExistingReview && (
                        <div className="bg-muted/50 border border-primary/20 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            Your Review
                          </p>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < userExistingReview.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          {userExistingReview.comment && (
                            <p className="text-sm text-muted-foreground">{userExistingReview.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Posted {new Date(userExistingReview.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {reviews.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No reviews yet. Be the first to review this guide!</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {reviews.map((review: any) => (
                            <div key={review._id} className="border-b pb-6 last:border-0">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={review.userAvatar} alt={review.userName} />
                                  <AvatarFallback>
                                    {review.userName
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="font-semibold">{review.userName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="flex">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-4 w-4 ${
                                                i < review.rating
                                                  ? "fill-yellow-400 text-yellow-400"
                                                  : "text-muted-foreground"
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                          {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {review.comment && (
                                    <p className="text-muted-foreground mt-2">{review.comment}</p>
                                  )}
                                  {review.tourDate && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      Tour date: {new Date(review.tourDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tours" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Tours</CardTitle>
                      <CardDescription>
                        {guide.name} has successfully completed {completedTours.length} tours
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {completedTours.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                          <p className="text-muted-foreground mb-4">No completed tours yet</p>
                          <Button
                            onClick={() => setContactOpen(true)}
                            className="bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Be the First to Book
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {completedTours.map((tour) => (
                            <div
                              key={tour._id}
                              className="p-4 rounded-lg border border-border bg-accent/30 hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">
                                      Tour with {tour.travelerName}
                                    </p>
                                    {tour.destination?.name && (
                                      <p className="text-sm text-muted-foreground">
                                        {tour.destination.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="secondary" className="bg-blue-600/20 text-blue-600">
                                  Completed
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(tour.startDate).toLocaleDateString()} -{" "}
                                    {new Date(tour.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{tour.guests} guest{tour.guests > 1 ? "s" : ""}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="pt-4 text-center">
                            <Button
                              onClick={() => setContactOpen(true)}
                              variant="outline"
                              className="cursor-pointer"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Request Custom Tour
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <span className="text-3xl font-bold text-foreground">${guide.pricePerDay}</span>
                    <span className="text-muted-foreground"> / day</span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="font-medium text-foreground">{guide.experience} years</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tours Completed</span>
                      <span className="font-medium text-foreground">{guide.totalTours}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Languages</span>
                      <span className="font-medium text-foreground">{guide.languages?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">{guide.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    {guide.availability && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Availability</span>
                        <Badge variant={guide.availability.available ? "default" : "secondary"}>
                          {guide.availability.available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => setBookingOpen(true)}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 h-12 text-lg mb-3 cursor-pointer"
                    disabled={guide.availability && !guide.availability.available}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Book This Guide
                  </Button>
                  <Button
                    onClick={() => setContactOpen(true)}
                    variant="outline"
                    className="w-full h-12 bg-transparent cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>

                  <div className="mt-6 pt-6 border-t space-y-3">
                    <h4 className="font-semibold text-sm">Contact Information</h4>
                    <a
                      href={`mailto:${guide.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Mail className="h-4 w-4" />
                      {guide.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
    <Footer />
    </>
  )
}
