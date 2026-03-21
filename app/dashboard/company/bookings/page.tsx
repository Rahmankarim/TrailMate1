"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  TrendingUp,
  Upload
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PAKISTAN_BANKS } from "@/lib/constants/banks"

interface Booking {
  _id: string
  destinationId: string
  startDate: string
  endDate: string
  guests: number
  totalPrice: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  paymentStatus?: "pending" | "paid" | "refunded"
  notes?: string
  userName?: string
  userEmail?: string
  travelerName?: string
  travelerEmail?: string
  destination?: {
    _id: string
    name: string
    location?: string
    coverImage?: string
  }
  createdAt: string
}

export default function CompanyBookingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([])
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?callbackUrl=/dashboard/company/bookings")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      fetchBookings()
      fetchPendingVerifications()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings?type=company&bookingType=destination_booking", {
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

  const fetchPendingVerifications = async () => {
    try {
      const res = await fetch("/api/payment-proof", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setPendingVerifications(data.proofs || [])
      }
    } catch (error) {
      console.error("Error fetching verifications:", error)
    }
  }

  const fetchPaymentProofForBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/payment-proof?bookingId=${bookingId}`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        if (data.paymentProof) {
          // Create verification object with booking details
          const booking = bookings.find(b => b._id === bookingId)
          const verification = {
            _id: data.paymentProof._id,
            bookingId: data.paymentProof.bookingId,
            screenshot: data.paymentProof.screenshot,
            accountDetails: data.paymentProof.accountDetails,
            status: data.paymentProof.status,
            createdAt: data.paymentProof.createdAt,
            booking: {
              _id: booking?._id,
              totalPrice: booking?.totalPrice,
              guests: booking?.guests,
              startDate: booking?.startDate,
              endDate: booking?.endDate,
              customerName: booking?.userName || booking?.travelerName || "Customer",
              destination: booking?.destination
            }
          }
          handleViewVerification(verification)
        } else {
          toast({
            title: "No Payment Proof",
            description: "Customer hasn't submitted payment proof yet.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error("Error fetching payment proof:", error)
      toast({
        title: "Error",
        description: "Failed to fetch payment proof",
        variant: "destructive"
      })
    }
  }

  const openScreenshotInNewTab = (screenshot: string) => {
    const viewerHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Payment Screenshot</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #0f172a;
              padding: 24px;
              box-sizing: border-box;
            }
            img {
              max-width: 100%;
              max-height: calc(100vh - 48px);
              object-fit: contain;
              border-radius: 12px;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
              background: white;
            }
          </style>
        </head>
        <body>
          <img src="${screenshot}" alt="Payment proof" />
        </body>
      </html>
    `

    const viewerBlob = new Blob([viewerHtml], { type: "text/html" })
    const viewerUrl = URL.createObjectURL(viewerBlob)
    const newWindow = window.open(viewerUrl, "_blank")

    if (!newWindow) {
      URL.revokeObjectURL(viewerUrl)
      toast({
        title: "Popup blocked",
        description: "Please allow popups to view the screenshot in full size.",
        variant: "destructive"
      })
      return
    }

    setTimeout(() => URL.revokeObjectURL(viewerUrl), 60_000)
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
          description: "Corporate booking has been cancelled successfully."
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

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "confirmed" })
      })

      if (response.ok) {
        toast({
          title: "Booking Confirmed",
          description: "The booking request has been confirmed. Customer can now proceed with payment."
        })
        fetchBookings()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to confirm booking",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error confirming booking:", error)
      toast({
        title: "Error",
        description: "Failed to confirm booking",
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
        description: "The booking has been moved to completed bookings."
      })
      fetchBookings()
    } catch (error) {
      console.error("Error completing booking:", error)
      toast({
        title: "Completion Failed",
        description: error instanceof Error ? error.message : "Failed to complete booking",
        variant: "destructive"
      })
    }
  }

  const handleViewVerification = (verification: any) => {
    setSelectedVerification(verification)
    setVerificationDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedVerification) return

    setIsVerifying(true)
    try {
      const response = await fetch("/api/payment-proof", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          proofId: selectedVerification._id,
          action: "confirm"
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to confirm payment")
      }

      toast({
        title: "Payment Confirmed!",
        description: "The booking payment has been marked as paid.",
      })
      setVerificationDialogOpen(false)
      fetchPendingVerifications()
      fetchBookings()
    } catch (error) {
      console.error("Verification error:", error)
      toast({
        title: "Confirmation Failed",
        description: error instanceof Error ? error.message : "Failed to confirm payment",
        variant: "destructive"
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!selectedVerification) return

    setIsVerifying(true)
    try {
      const response = await fetch("/api/payment-proof", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          proofId: selectedVerification._id,
          action: "reject"
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reject payment")
      }

      toast({
        title: "Payment Rejected",
        description: "The customer will be notified to resubmit payment proof.",
      })
      setVerificationDialogOpen(false)
      fetchPendingVerifications()
    } catch (error) {
      console.error("Rejection error:", error)
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "Failed to reject payment",
        variant: "destructive"
      })
    } finally {
      setIsVerifying(false)
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
      pending: "bg-orange-500/10 text-orange-600",
      paid: "bg-green-500/10 text-green-600",
      refunded: "bg-gray-500/10 text-gray-600"
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  const formatDate = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const endDate = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    return `${startDate} - ${endDate}`
  }

  const getTotalSpent = () => {
    return bookings
      .filter(b => b.status === "completed" || b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalPrice, 0)
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

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="company" user={{ name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Company", email: user?.email || "" }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Bookings" />

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
                  <Building2 className="h-8 w-8 text-muted-foreground" />
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
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">${getTotalSpent()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Payment Verifications */}
          {pendingVerifications.length > 0 && (
            <Card className="border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/20 shadow-lg">
              <CardHeader className="bg-yellow-100 dark:bg-yellow-900/30">
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                  <Clock className="h-5 w-5 animate-pulse" />
                  🔔 Pending Payment Verifications ({pendingVerifications.length})
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-400">
                  Review and verify payment proofs from customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {pendingVerifications.map((verification) => (
                  <div key={verification._id} className="p-4 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-950 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-yellow-400">
                          <AvatarImage src={verification.booking?.destination?.coverImage} />
                          <AvatarFallback className="bg-yellow-100 text-yellow-800">
                            {verification.booking?.customerName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground text-base">{verification.booking?.customerName || "Customer"}</p>
                          <p className="text-sm text-muted-foreground">
                            {verification.booking?.destination?.name || "Booking"} - <span className="font-bold text-green-600">${verification.booking?.totalPrice || 0}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Submitted {new Date(verification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewVerification(verification)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Review Payment
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Pending Booking Requests
              </CardTitle>
              <CardDescription>Awaiting confirmation for your destination bookings</CardDescription>
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
                          <AvatarImage src={booking.destination?.coverImage} alt={booking.destination?.name} />
                          <AvatarFallback>
                            {booking.destination?.name?.charAt(0) || "D"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.destination?.name || "Destination Booking"}</p>
                          <p className="text-sm text-muted-foreground">{booking.destination?.location || "Location"}</p>
                          <p className="text-xs text-muted-foreground">Customer: {booking.userName || booking.travelerName || booking.userEmail || "Customer"}</p>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(booking.status)}>{booking.status}</Badge>
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
                    {booking.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Notes: {booking.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleConfirmBooking(booking._id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm Booking
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline Request
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Confirmed Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Confirmed Bookings
                {confirmedBookings.filter(b => b.paymentStatus === "pending").length > 0 && (
                  <Badge className="bg-yellow-500 text-white ml-2">
                    {confirmedBookings.filter(b => b.paymentStatus === "pending").length} awaiting verification
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Bookings confirmed and awaiting customer payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {confirmedBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No confirmed bookings</p>
                </div>
              ) : (
                confirmedBookings.map((booking) => (
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
                          <p className="font-medium text-foreground">{booking.destination?.name || "Destination Booking"}</p>
                          <p className="text-sm text-muted-foreground">{booking.destination?.location || "Location"}</p>
                          <p className="text-xs text-muted-foreground">Customer: {booking.userName || booking.travelerName || booking.userEmail || "Customer"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusBadge(booking.status)}>{booking.status}</Badge>
                        {booking.paymentStatus && getPaymentBadge(booking.paymentStatus) && (
                          <Badge className={getPaymentBadge(booking.paymentStatus)}>
                            {booking.paymentStatus}
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
                    {booking.notes && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-sm text-muted-foreground">Notes: {booking.notes}</p>
                      </div>
                    )}
                    {booking.paymentStatus === "pending" ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Payment proof submitted - awaiting verification
                          </p>
                        </div>
                        <Button
                          onClick={() => fetchPaymentProofForBooking(booking._id)}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          View & Verify Payment Screenshot
                        </Button>
                      </div>
                    ) : booking.paymentStatus === "paid" ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Payment verified and confirmed
                          </p>
                        </div>
                        <Button
                          onClick={() => handleCompleteBooking(booking._id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Completed Tours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Bookings
              </CardTitle>
              <CardDescription>Your booking history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed bookings yet</p>
                </div>
              ) : (
                completedBookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="p-4 rounded-xl border border-border bg-green-500/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.destination?.coverImage} alt={booking.destination?.name} />
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {booking.destination?.name?.charAt(0) || "D"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{booking.destination?.name || "Destination Booking"}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{booking.destination?.location || "Location"}</span>
                            <span>•</span>
                            <span>{booking.userName || booking.travelerName || "Customer"}</span>
                            <span>•</span>
                            <span>{formatDate(booking.startDate, booking.endDate)}</span>
                            <span>•</span>
                            <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                            <span>•</span>
                            <span className="font-semibold text-green-600">${booking.totalPrice}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(booking.status)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Verification Dialog */}
          <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
            <DialogContent className="max-w-4xl h-[90vh] overflow-hidden p-0 gap-0">
              <DialogHeader>
                <div className="px-6 pt-6 pb-4 border-b bg-background">
                  <DialogTitle>Verify Payment</DialogTitle>
                  <DialogDescription>
                    Review the payment screenshot and confirm or reject
                  </DialogDescription>
                </div>
              </DialogHeader>
              {selectedVerification && (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Booking Details */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{selectedVerification.booking?.customerName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking:</span>
                      <span className="font-medium">
                        {selectedVerification.booking?.destination?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${selectedVerification.booking?.totalPrice || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Submitted:</span>
                      <span>{new Date(selectedVerification.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payment Screenshot */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      📸 Payment Screenshot
                      <Badge className="bg-blue-100 text-blue-700">Click image to view full size</Badge>
                    </Label>
                    <div className="border-2 border-blue-300 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 shadow-lg">
                      <button
                        type="button"
                        onClick={() => openScreenshotInNewTab(selectedVerification.screenshot)}
                        className="block w-full hover:opacity-90 transition-opacity cursor-zoom-in"
                      >
                        <img
                          src={selectedVerification.screenshot}
                          alt="Payment proof"
                          className="w-full max-h-[420px] object-contain"
                        />
                      </button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      💡 Click the screenshot to open it in full size
                    </p>
                  </div>

                  {/* Bank Account Details */}
                  {selectedVerification.accountDetails && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Account Details Used</Label>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-blue-600 mt-1" />
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                {PAKISTAN_BANKS.find(b => b.value === selectedVerification.accountDetails.bankName)?.label || selectedVerification.accountDetails.bankName}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {selectedVerification.accountDetails.accountHolderName}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <Label className="text-xs text-muted-foreground">Account Number</Label>
                                <p className="font-mono font-medium">{selectedVerification.accountDetails.accountNumber}</p>
                              </div>
                              {selectedVerification.accountDetails.ibanNumber && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">IBAN</Label>
                                  <p className="font-mono font-medium text-xs">{selectedVerification.accountDetails.ibanNumber}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t bg-background px-6 py-4">
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleRejectPayment}
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject Payment
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleConfirmPayment}
                        disabled={isVerifying}
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirm Payment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
