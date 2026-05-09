"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import {
  Calendar,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  Heart,
  TrendingUp,
  Loader2,
  Users,
  DollarSign,
  CreditCard,
  ExternalLink,
  CheckCircle,
  XCircle,
  Upload,
  Building2,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { PAKISTAN_BANKS } from "@/lib/constants/banks"

interface Booking {
  _id: string
  status: string
  bookingType?: string
  startDate: string
  endDate: string
  guests: number
  employees?: number
  totalPrice?: number
  paymentStatus?: string
  notes?: string
  tourName?: string
  tourDescription?: string
  guideAvatar?: string
  guideEmail?: string
  destination?: {
    name: string
    coverImage: string
    location?: string
  }
  guide?: {
    name: string
    avatar?: string
    image?: string
    location?: string
  }
  guideName?: string
  tourName?: string
  userName?: string
}

interface Destination {
  _id: string
  name: string
  coverImage: string
  rating: number
}

export default function UserDashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState<Booking | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [providerBankAccounts, setProviderBankAccounts] = useState<any[]>([])
  const [providerName, setProviderName] = useState("")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [stats, setStats] = useState({
    tripsCompleted: 0,
    upcomingTrips: 0,
    totalSpent: 0,
    reviewsGiven: 0,
  })

  const fetchDashboardData = async () => {
    try {
      const bookingsRes = await fetch("/api/bookings")
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(data.bookings || [])

        const completed = data.bookings.filter((b: Booking) => b.status === "completed").length
        const upcoming = data.bookings.filter(
          (b: Booking) => b.status === "confirmed" && new Date(b.startDate) > new Date(),
        ).length

        setStats((prev) => ({
          ...prev,
          tripsCompleted: completed,
          upcomingTrips: upcoming,
        }))
      }

      const destRes = await fetch("/api/destinations?published=true")
      if (destRes.ok) {
        const data = await destRes.json()
        setSavedDestinations(data.destinations?.slice(0, 3) || [])
      }

      if (user?._id) {
        const reviewsRes = await fetch(`/api/reviews?userId=${user._id}`)
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json()
          setStats((prev) => ({
            ...prev,
            reviewsGiven: reviewsData.reviews?.length || 0,
          }))
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/user")
    }
    // Redirect guides to their own dashboard
    if (!authLoading && user && user.role === "guide") {
      router.push("/dashboard/guide")
    }
    // Redirect companies to their own dashboard
    if (!authLoading && user && user.role === "company") {
      router.push("/dashboard/company")
    }
    // Redirect admins to their own dashboard
    if (!authLoading && user && user.role === "admin") {
      router.push("/dashboard/admin")
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  const upcomingBookings = bookings
    .filter((b) => ["pending", "confirmed"].includes(b.status) && new Date(b.startDate) > new Date())
    .slice(0, 3)
  const recentBookings = bookings.slice(0, 3)
  const guideHiringBookings = bookings.filter(
    (b) => b.bookingType === "guide_booking" || b.bookingType === "guide_hiring",
  )
  const pendingGuideHirings = guideHiringBookings.filter((b) => b.status === "pending")
  const confirmedGuideHirings = guideHiringBookings.filter((b) => b.status === "confirmed")
  const completedGuideHirings = guideHiringBookings.filter((b) => b.status === "completed")

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return `${days} day${days > 1 ? "s" : ""}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setBookingDetailsOpen(true)
  }

  const getBookingTitle = (booking: Booking) => {
    if (booking.destination?.name) return booking.destination.name
    if (booking.bookingType === "guide_booking" || booking.bookingType === "guide_hiring") {
      return booking.guideName || booking.tourName || "Custom Trip"
    }
    return booking.guideName || booking.userName || "Custom Trip"
  }

  const getBookingSubtitle = (booking: Booking) => {
    if (booking.destination?.location) return booking.destination.location
    if (booking.bookingType === "guide_booking" || booking.bookingType === "guide_hiring") {
      return booking.guide?.name || booking.guideName || booking.tourDescription || "Guide booking"
    }
    return booking.notes || "Trip details"
  }

  const isGuideHiring = (booking: Booking) => booking.bookingType === "guide_booking" || booking.bookingType === "guide_hiring"

  const getGuideHiringTitle = (booking: Booking) => booking.guideName || booking.tourName || booking.destination?.name || "Guide Hiring"

  const getGuideHiringSubtitle = (booking: Booking) =>
    booking.tourDescription || booking.guide?.name || booking.guideName || "Custom guide request"

  const getGuideHiringImage = (booking: Booking) =>
    booking.guideAvatar || booking.guide?.avatar || booking.guide?.image || booking.destination?.coverImage || "/placeholder.svg?height=80&width=80&query=guide"

  const renderGuideHiringCard = (booking: Booking) => (
    <div key={booking._id} className="rounded-xl border border-border p-4 hover:bg-accent transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img src={getGuideHiringImage(booking)} alt={getGuideHiringTitle(booking)} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground line-clamp-1">{getGuideHiringTitle(booking)}</h4>
            <Badge className={getStatusBadgeClass(booking.status)}>{booking.status}</Badge>
            {booking.paymentStatus && <Badge variant="outline">{booking.paymentStatus}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{getGuideHiringSubtitle(booking)}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(booking.startDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{getDuration(booking.startDate, booking.endDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{booking.employees || booking.guests || 1} employee{(booking.employees || booking.guests || 1) > 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="font-semibold text-foreground">
                {typeof booking.totalPrice === "number" ? `$${booking.totalPrice}` : "N/A"}
              </span>
            </div>
          </div>
          {booking.guideName && <p className="text-sm text-muted-foreground mb-3">Guide: {booking.guideName}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => openBookingDetails(booking)}>
              Details
            </Button>
            {booking.status === "confirmed" && booking.paymentStatus === "unpaid" && (
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openPayment(booking)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
            {booking.status === "confirmed" && booking.paymentStatus === "paid" && canMarkComplete(booking) && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleCompleteBooking(booking._id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {booking.status !== "completed" && booking.status !== "cancelled" && (
              <Button variant="outline" size="sm" onClick={() => handleCancelBooking(booking._id)}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const getStatusBadgeClass = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      confirmed: "bg-blue-500/10 text-blue-600",
      completed: "bg-green-500/10 text-green-600",
      cancelled: "bg-red-500/10 text-red-600",
    }
    return styles[status] || styles.pending
  }

  const canMarkComplete = (booking: Booking) => {
    return booking.paymentStatus === "paid" && new Date(booking.endDate) <= new Date()
  }

  const openPayment = async (booking: Booking) => {
    setSelectedPaymentBooking(booking)
    setScreenshot(null)
    setScreenshotFile(null)

    try {
      const res = await fetch(`/api/provider-bank-accounts?bookingId=${booking._id}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setProviderBankAccounts(data.bankAccounts || [])
        setProviderName(data.providerName || "Service Provider")
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error)
    }

    setPaymentOpen(true)
  }

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setScreenshot(reader.result as string)
      setScreenshotFile(file)
    }
    reader.readAsDataURL(file)
  }

  const handleProcessPayment = async () => {
    if (!selectedPaymentBooking) return

    if (!screenshot) {
      toast({
        title: "Screenshot Required",
        description: "Please upload payment screenshot",
        variant: "destructive",
      })
      return
    }

    if (providerBankAccounts.length === 0) {
      toast({
        title: "No Bank Account",
        description: "Service provider hasn't added bank details yet",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      const response = await fetch("/api/payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId: selectedPaymentBooking._id,
          screenshot,
          accountDetails: providerBankAccounts[0],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Payment submission failed")
      }

      toast({
        title: "Payment Proof Submitted!",
        description: "Your payment is being verified. You'll be notified once confirmed.",
      })
      setPaymentOpen(false)
      setScreenshot(null)
      setScreenshotFile(null)
      setSelectedPaymentBooking(null)
      fetchDashboardData()
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit payment proof",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (response.ok) {
        toast({ title: "Booking Cancelled", description: "Your booking has been cancelled successfully." })
        fetchDashboardData()
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({ title: "Error", description: "Failed to cancel booking", variant: "destructive" })
    }
  }

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "completed" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to complete booking")
      }

      toast({ title: "Booking Completed", description: "Your booking has been moved to completed bookings." })
      fetchDashboardData()
    } catch (error) {
      console.error("Error completing booking:", error)
      toast({ title: "Completion Failed", description: error instanceof Error ? error.message : "Failed to complete booking", variant: "destructive" })
    }
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="user" user={{ name: user?.name || "User", email: user?.email || "" }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Dashboard" />

        <main className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}!</h2>
              <p className="text-muted-foreground">Ready for your next adventure?</p>
            </div>
            <Link href="/destinations">
              <Button className="bg-foreground text-background hover:bg-foreground/90">
                Explore Destinations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trips Completed</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.tripsCompleted}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming Trips</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.upcomingTrips}</p>
                    <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
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
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{bookings.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reviews Given</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.reviewsGiven}</p>
                    <p className="text-xs text-muted-foreground mt-1">Feedback shared</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Star className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Bookings */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Adventures</CardTitle>
                    <CardDescription>Your scheduled trips</CardDescription>
                  </div>
                  <Link href="/dashboard/user/bookings">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-muted-foreground">No upcoming trips yet</p>
                      {bookings.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          You have past booking activity. Open the details page to review them.
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Browse destinations or guides to start planning.</p>
                      )}
                      <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Link href="/destinations">
                          <Button variant="outline">Browse Destinations</Button>
                        </Link>
                        <Link href="/guides">
                          <Button variant="outline">Find a Guide</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    upcomingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent transition-colors"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={
                              isGuideHiring(booking)
                                ? getGuideHiringImage(booking)
                                : booking.destination?.coverImage || "/placeholder.svg?height=80&width=80&query=mountain"
                            }
                            alt={getBookingTitle(booking)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{getBookingTitle(booking)}</h4>
                            <Badge
                              variant={booking.status === "confirmed" ? "default" : "secondary"}
                              className={booking.status === "confirmed" ? "bg-green-600 text-white" : ""}
                            >
                              {booking.status}
                            </Badge>
                            {isGuideHiring(booking) && <Badge variant="outline">Guide Hiring</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{getBookingSubtitle(booking)}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(booking.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{getDuration(booking.startDate, booking.endDate)}</span>
                            </div>
                          </div>
                        </div>
                        {isGuideHiring(booking) ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/user/guide-hiring">
                              Details
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => openBookingDetails(booking)}>
                            Details
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Saved Destinations */}
            <div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Popular
                    </CardTitle>
                    <CardDescription>Top destinations</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedDestinations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No destinations available</p>
                  ) : (
                    savedDestinations.map((dest) => (
                      <Link key={dest._id} href={`/destinations/${dest._id}`}>
                        <div className="flex items-center gap-3 hover:bg-accent p-2 rounded-lg transition-colors">
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={dest.coverImage || "/placeholder.svg?height=56&width=56&query=mountain"}
                              alt={dest.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{dest.name}</p>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-muted-foreground">{dest.rating?.toFixed(1) || "New"}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-8">
                  <Link href="/guides">
                    <Button variant="outline" className="w-full justify-start bg-transparent gap-2">
                      <Star className="h-4 w-4 mr-2" />
                      Find a Guide
                    </Button>
                  </Link>
                  <Link href="/destinations">
                    <Button variant="outline" className="w-full justify-start bg-transparent gap-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      Browse Destinations
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button variant="outline" className="w-full justify-start bg-transparent gap-2">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Read Travel Stories
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guide Hirings</CardTitle>
                <CardDescription>Your hired-guide requests and payments</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/guides">Hire a Guide</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {guideHiringBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-3">
                  <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
                  <p>No guide hirings yet</p>
                  <Link href="/guides">
                    <Button variant="outline">Browse Guides</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold text-foreground">Pending Guide Hirings</h3>
                    </div>
                    <div className="space-y-3">
                      {pendingGuideHirings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No pending guide hirings</p>
                      ) : (
                        pendingGuideHirings.map(renderGuideHiringCard)
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-foreground">Confirmed Guide Hirings</h3>
                    </div>
                    <div className="space-y-3">
                      {confirmedGuideHirings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No confirmed guide hirings</p>
                      ) : (
                        confirmedGuideHirings.map(renderGuideHiringCard)
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-foreground">Completed Guide Hirings</h3>
                    </div>
                    <div className="space-y-3">
                      {completedGuideHirings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No completed guide hirings yet</p>
                      ) : (
                        completedGuideHirings.map(renderGuideHiringCard)
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Booking Activity</CardTitle>
                <CardDescription>Recent trips and booking details</CardDescription>
              </div>
              <Link href="/dashboard/user/bookings">
                <Button variant="outline" size="sm">
                  View Bookings
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookings found yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentBookings.map((booking) => (
                    <div key={booking._id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={booking.destination?.coverImage || "/placeholder.svg?height=56&width=56&query=travel"}
                            alt={getBookingTitle(booking)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground line-clamp-1">{getBookingTitle(booking)}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{getBookingSubtitle(booking)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-3">
                        <span>{formatDate(booking.startDate)}</span>
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                          {booking.status}
                        </Badge>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => openBookingDetails(booking)}>
                        Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={bookingDetailsOpen} onOpenChange={setBookingDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Review the trip information, status, and next steps.</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={selectedBooking.destination?.coverImage || "/placeholder.svg?height=96&width=96&query=travel"}
                    alt={getBookingTitle(selectedBooking)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground">{getBookingTitle(selectedBooking)}</h3>
                  <p className="text-sm text-muted-foreground">{getBookingSubtitle(selectedBooking)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={selectedBooking.status === "confirmed" ? "default" : "secondary"}>
                      {selectedBooking.status}
                    </Badge>
                    {selectedBooking.paymentStatus && <Badge variant="outline">{selectedBooking.paymentStatus}</Badge>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">{formatDate(selectedBooking.startDate)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium text-foreground">{formatDate(selectedBooking.endDate)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Guests</p>
                  <p className="font-medium text-foreground">{selectedBooking.guests || 1}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Total Price</p>
                  <p className="font-medium text-foreground">
                    {typeof selectedBooking.totalPrice === "number" ? `$${selectedBooking.totalPrice}` : "N/A"}
                  </p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-sm mb-1">Notes</p>
                  <p className="text-sm text-foreground">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/dashboard/user/bookings">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Bookings
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/destinations">
                    <MapPin className="h-4 w-4 mr-2" />
                    Explore More
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Guide Hiring Payment</DialogTitle>
            <DialogDescription>
              Transfer payment to the guide or provider account and upload a screenshot for verification.
            </DialogDescription>
          </DialogHeader>
          {selectedPaymentBooking && (
            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tour:</span>
                  <span className="font-medium text-right">{selectedPaymentBooking.tourName || "Guide Hiring"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Guide:</span>
                  <span className="font-medium text-right">{selectedPaymentBooking.guideName || "N/A"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium text-right">{formatDate(selectedPaymentBooking.startDate)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {typeof selectedPaymentBooking.totalPrice === "number" ? `$${selectedPaymentBooking.totalPrice}` : "N/A"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Transfer to {providerName || "Provider"}'s Account:</Label>
                {providerBankAccounts.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Service provider hasn't added bank details yet. Please contact them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {providerBankAccounts.map((account: any, idx: number) => {
                      const bankInfo = PAKISTAN_BANKS.find((b) => b.value === account.bankName)
                      return (
                        <div
                          key={idx}
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-start gap-3">
                            <Building2 className="h-5 w-5 text-blue-600 mt-1" />
                            <div className="flex-1 space-y-2">
                              <div>
                                <p className="font-semibold text-foreground">{bankInfo?.label || account.bankName}</p>
                                <p className="text-sm text-muted-foreground mt-1">Account Holder: {account.accountHolderName}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Account Number</Label>
                                  <p className="font-mono font-medium">{account.accountNumber}</p>
                                </div>
                                {account.ibanNumber && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">IBAN</Label>
                                    <p className="font-mono font-medium text-xs">{account.ibanNumber}</p>
                                  </div>
                                )}
                                {account.branchCode && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Branch Code</Label>
                                    <p className="font-mono font-medium">{account.branchCode}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="guide-payment-screenshot" className="text-base font-semibold">
                  Upload Payment Screenshot
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {screenshot ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img src={screenshot} alt="Payment screenshot" className="max-h-48 rounded-lg mx-auto" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => {
                            setScreenshot(null)
                            setScreenshotFile(null)
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{screenshotFile?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                      <div>
                        <label htmlFor="guide-payment-screenshot" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">Click to upload</span>
                          <span className="text-muted-foreground"> or drag and drop</span>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        id="guide-payment-screenshot"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshotUpload}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleProcessPayment}
                disabled={isProcessingPayment || !screenshot || providerBankAccounts.length === 0}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting Payment Proof...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Payment Proof
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
