"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Loader2,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Upload,
  Building2
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { PAKISTAN_BANKS } from "@/lib/constants/banks"

interface Booking {
  _id: string
  guideId: string
  guideName: string
  guideEmail: string
  startDate: string
  endDate: string
  guests: number
  totalPrice: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  paymentStatus?: "unpaid" | "pending" | "paid" | "refunded"
  notes?: string
  destination?: {
    name: string
    location?: string
    coverImage?: string
  }
  createdAt: string
}

export default function TravelerBookingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [destinationBookings, setDestinationBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [providerBankAccounts, setProviderBankAccounts] = useState<any[]>([])
  const [providerName, setProviderName] = useState("")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?callbackUrl=/dashboard/user/bookings")
    }
    // Redirect guides to their own dashboard
    if (!authLoading && user && user.role === "guide") {
      router.push("/dashboard/guide/bookings")
    }
    // Redirect companies to their own dashboard
    if (!authLoading && user && user.role === "company") {
      router.push("/dashboard/company/bookings")
    }
    // Redirect admins to their own dashboard
    if (!authLoading && user && user.role === "admin") {
      router.push("/dashboard/admin")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      fetchBookings()
      fetchDestinationBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings?type=user", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDestinationBookings = async () => {
    try {
      const res = await fetch("/api/bookings?bookingType=destination_booking", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setDestinationBookings(data.bookings || [])
      }
    } catch (error) {
      console.error("Error fetching destination bookings:", error)
    }
  }

  const handleProceedToPayment = async (booking: Booking) => {
    setSelectedBooking(booking)
    setScreenshot(null)
    setScreenshotFile(null)
    
    // Fetch provider's bank accounts
    try {
      const res = await fetch(`/api/provider-bank-accounts?bookingId=${booking._id}`, {
        credentials: "include"
      })
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
        variant: "destructive"
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
    if (!selectedBooking) return

    if (!screenshot) {
      toast({
        title: "Screenshot Required",
        description: "Please upload payment screenshot",
        variant: "destructive"
      })
      return
    }

    if (providerBankAccounts.length === 0) {
      toast({
        title: "No Bank Account",
        description: "Service provider hasn't added bank details yet",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          screenshot,
          accountDetails: providerBankAccounts[0]
        })
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
      fetchBookings()
      fetchDestinationBookings()
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit payment proof",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" })
      })

      if (response.ok) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully."
        })
        fetchBookings()
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive"
      })
    }
  }

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "completed" })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to complete booking")
      }

      toast({
        title: "Booking Completed",
        description: "Your booking has been moved to completed bookings."
      })
      fetchBookings()
      fetchDestinationBookings()
    } catch (error) {
      console.error("Error completing booking:", error)
      toast({
        title: "Completion Failed",
        description: error instanceof Error ? error.message : "Failed to complete booking",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-600",
      confirmed: "bg-blue-500/10 text-blue-600",
      completed: "bg-green-500/10 text-green-600",
      cancelled: "bg-red-500/10 text-red-600"
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  const getPaymentBadge = (status?: string) => {
    if (!status) return ""
    const styles = {
      unpaid: "bg-red-500/10 text-red-600",
      pending: "bg-orange-500/10 text-orange-600",
      paid: "bg-green-500/10 text-green-600",
      refunded: "bg-gray-500/10 text-gray-600"
    }
    return styles[status as keyof typeof styles] || styles.unpaid
  }

  const formatDate = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const endDate = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    return `${startDate} - ${endDate}`
  }

  const canMarkComplete = (booking: Booking) => {
    return booking.paymentStatus === "paid" && new Date(booking.endDate) <= new Date()
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  const pendingBookings = bookings.filter(b => b.status === "pending")
  const confirmedBookings = bookings.filter(b => b.status === "confirmed")
  const completedBookings = bookings.filter(b => b.status === "completed")

  // Don't render if not a user/traveler
  if (user && user.role !== "traveler") {
    return null
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="user" user={{ name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User", email: user?.email || "", avatar: user?.avatar }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="My Bookings" />

        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{bookings.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingBookings.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{confirmedBookings.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{completedBookings.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Awaiting guide confirmation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending requests</p>
                </div>
              ) : (
                pendingBookings.map((booking) => (
                  <div key={booking._id} className="p-4 rounded-xl border border-border hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {booking.guideName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.guideName}</p>
                          <p className="text-sm text-muted-foreground">{booking.destination?.name || "Custom Tour"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusBadge(booking.status)}>{booking.status}</Badge>
                        {booking.paymentStatus && (
                          <Badge className={getPaymentBadge(booking.paymentStatus)}>
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
                        <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold text-foreground">${booking.totalPrice}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => handleCancelBooking(booking._id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel Request
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Confirmed Tours - Awaiting Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Confirmed Tours</CardTitle>
              <CardDescription>Complete payment to finalize your booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {confirmedBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No confirmed tours</p>
                </div>
              ) : (
                confirmedBookings.map((booking) => (
                  <div key={booking._id} className="p-4 rounded-xl border border-border bg-blue-500/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {booking.guideName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.guideName}</p>
                          <p className="text-sm text-muted-foreground">{booking.destination?.name || "Custom Tour"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusBadge(booking.status)}>{booking.status}</Badge>
                        {booking.paymentStatus && (
                          <Badge className={getPaymentBadge(booking.paymentStatus)}>
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
                        <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-bold text-lg text-foreground">${booking.totalPrice}</span>
                      </div>
                    </div>
                    {booking.paymentStatus === "unpaid" && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleProceedToPayment(booking)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Proceed to Payment - ${booking.totalPrice}
                      </Button>
                    )}
                    {booking.paymentStatus === "pending" && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Payment proof submitted. Waiting for guide verification.
                        </p>
                      </div>
                    )}
                    {booking.paymentStatus === "paid" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Payment verified and confirmed
                          </p>
                        </div>
                        {canMarkComplete(booking) ? (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleCompleteBooking(booking._id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Complete
                          </Button>
                        ) : (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              This booking will be completed after the trip end date.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Completed Tours */}
          <Card>
            <CardHeader>
              <CardTitle>Completed Tours</CardTitle>
              <CardDescription>Your tour history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed tours yet</p>
                </div>
              ) : (
                completedBookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="p-4 rounded-xl border border-border bg-green-500/5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {booking.guideName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.guideName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(booking.startDate, booking.endDate)}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(booking.status)}>Completed</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Destination Bookings - Pending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Pending Destination Bookings
              </CardTitle>
              <CardDescription>Destination bookings awaiting confirmation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {destinationBookings.filter(b => b.status === "pending").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending destination bookings</p>
                </div>
              ) : (
                destinationBookings.filter(b => b.status === "pending").map((booking) => (
                  <div key={booking._id} className="p-4 rounded-xl border border-border hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.destination?.coverImage} alt={booking.destination?.name} />
                          <AvatarFallback>{booking.destination?.name?.charAt(0) || "D"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.destination?.name || "Destination"}</p>
                          <p className="text-sm text-muted-foreground">{booking.destination?.location || "Location"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>
                        {booking.paymentStatus && (
                          <Badge className={getPaymentBadge(booking.paymentStatus)}>
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
                        <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold text-foreground">${booking.totalPrice}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Destination Bookings - Confirmed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Confirmed Destination Bookings
              </CardTitle>
              <CardDescription>Complete payment to finalize your bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {destinationBookings.filter(b => b.status === "confirmed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No confirmed destination bookings</p>
                </div>
              ) : (
                destinationBookings.filter(b => b.status === "confirmed").map((booking) => (
                  <div key={booking._id} className="p-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-blue-500">
                          <AvatarImage src={booking.destination?.coverImage} alt={booking.destination?.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {booking.destination?.name?.charAt(0) || "D"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.destination?.name || "Destination"}</p>
                          <p className="text-sm text-muted-foreground">{booking.destination?.location || "Location"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-blue-500/10 text-blue-600">Confirmed</Badge>
                        {booking.paymentStatus && (
                          <Badge className={getPaymentBadge(booking.paymentStatus)}>
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
                        <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-bold text-lg text-foreground">${booking.totalPrice}</span>
                      </div>
                    </div>
                    {booking.paymentStatus === "unpaid" && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleProceedToPayment(booking)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Proceed to Payment - ${booking.totalPrice}
                      </Button>
                    )}
                    {booking.paymentStatus === "pending" && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Payment proof submitted. Waiting for company verification.
                        </p>
                      </div>
                    )}
                    {booking.paymentStatus === "paid" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Payment verified and confirmed
                          </p>
                        </div>
                        {canMarkComplete(booking) ? (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleCompleteBooking(booking._id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Complete
                          </Button>
                        ) : (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              This booking will be completed after the trip end date.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Destination Bookings - Completed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Completed Destination Bookings
              </CardTitle>
              <CardDescription>Your destination booking history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {destinationBookings.filter(b => b.status === "completed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed destination bookings yet</p>
                </div>
              ) : (
                destinationBookings.filter(b => b.status === "completed").slice(0, 5).map((booking) => (
                  <div key={booking._id} className="p-4 rounded-xl border border-border bg-green-500/5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.destination?.coverImage} alt={booking.destination?.name} />
                          <AvatarFallback>{booking.destination?.name?.charAt(0) || "D"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.destination?.name || "Destination"}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(booking.startDate, booking.endDate)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600">Completed</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Transfer payment to provider's account and upload screenshot
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Details */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {selectedBooking.destination?.name ? "Destination:" : "Guide:"}
                  </span>
                  <span className="font-medium">
                    {selectedBooking.destination?.name || selectedBooking.guideName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{formatDate(selectedBooking.startDate, selectedBooking.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guests:</span>
                  <span className="font-medium">{selectedBooking.guests}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">${selectedBooking.totalPrice}</span>
                </div>
              </div>

              {/* Provider Bank Accounts */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Transfer to {providerName}'s Account:</Label>
                {providerBankAccounts.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Service provider hasn't added bank details yet. Please contact them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {providerBankAccounts.map((account: any, idx: number) => {
                      const bankInfo = PAKISTAN_BANKS.find(b => b.value === account.bankName)
                      return (
                        <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
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

              {/* Screenshot Upload */}
              <div className="space-y-3">
                <Label htmlFor="screenshot" className="text-base font-semibold">Upload Payment Screenshot</Label>
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
                        <label htmlFor="screenshot" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">Click to upload</span>
                          <span className="text-muted-foreground"> or drag and drop</span>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshotUpload}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleProcessPayment}
                disabled={isProcessing || !screenshot || providerBankAccounts.length === 0}
              >
                {isProcessing ? (
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
