"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { PAKISTAN_BANKS } from "@/lib/constants/banks"
import { Calendar, DollarSign, Users, Search, Filter, Loader2, MapPin, User, CreditCard, Upload, Building2, CheckCircle, XCircle, Clock } from "lucide-react"
import { Label } from "@/components/ui/label"

interface Booking {
  _id: string
  destination: {
    name: string
    location: string
    coverImage?: string
  }
  travelerName: string
  travelerEmail: string
  startDate: string
  endDate: string
  guests: number
  totalPrice: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  paymentStatus?: "unpaid" | "pending" | "paid" | "refunded"
  createdAt: string
}

export default function GuideBookingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [personalBookings, setPersonalBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [providerBankAccounts, setProviderBankAccounts] = useState<any[]>([])
  const [providerName, setProviderName] = useState("")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([])
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    fetchBookings()
    fetchPersonalBookings()
    fetchPendingVerifications()
  }, [])

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

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings?type=guide", {
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

  const fetchPersonalBookings = async () => {
    try {
      const res = await fetch("/api/bookings?bookingType=destination_booking", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setPersonalBookings(data.bookings || [])
      }
    } catch (error) {
      console.error("Error fetching personal bookings:", error)
    }
  }

  const handleUpdateStatus = async (bookingId: string, action: "confirm" | "decline" | "complete") => {
    try {
      const booking = bookings.find(b => b._id === bookingId)
      if (!booking) return

      let status: string
      if (action === "confirm") {
        status = "confirmed"
      } else if (action === "decline") {
        status = "cancelled"
      } else {
        status = "completed"
      }

      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          status,
          blockDates: action === "confirm" // Block dates when confirming
        }),
      })

      if (res.ok) {
        toast({
          title: action === "confirm" ? "Booking Confirmed" : action === "decline" ? "Booking Declined" : "Tour Completed",
          description: action === "confirm" 
            ? "The dates have been blocked on your calendar." 
            : action === "decline"
            ? "The booking request has been declined."
            : "The tour has been marked as completed and will appear on your profile.",
        })

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

        fetchBookings()
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
      fetchPersonalBookings()
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

  const handleViewVerification = (verification: any) => {
    setSelectedVerification(verification)
    setVerificationDialogOpen(true)
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

  const formatDate = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const endDate = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    return `${startDate} - ${endDate}`
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.travelerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500"
      case "completed":
        return "bg-blue-500/10 text-blue-500"
      case "cancelled":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-yellow-500/10 text-yellow-500"
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="guide" user={user ? { name: user.firstName + ' ' + user.lastName, email: user.email, avatar: user.avatar } : undefined} />
      
      <div className="flex-1 ml-64">
        <DashboardTopbar title="Bookings" />
        
        <main className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Client Bookings</CardDescription>
                <CardTitle className="text-3xl">{bookings.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>My Bookings</CardDescription>
                <CardTitle className="text-3xl text-blue-500">
                  {personalBookings.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Requests</CardDescription>
                <CardTitle className="text-3xl text-yellow-500">
                  {bookings.filter((b) => b.status === "pending").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed Tours</CardDescription>
                <CardTitle className="text-3xl text-green-500">
                  {bookings.filter((b) => b.status === "completed").length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Pending Payment Verifications */}
          {pendingVerifications.length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Clock className="h-5 w-5" />
                  Pending Payment Verifications ({pendingVerifications.length})
                </CardTitle>
                <CardDescription>Review and confirm payment proofs from customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingVerifications.map((verification) => (
                  <div key={verification._id} className="p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-white dark:bg-gray-950">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={verification.booking?.destination?.coverImage} />
                          <AvatarFallback>{verification.booking?.customerName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{verification.booking?.customerName || "Customer"}</p>
                          <p className="text-sm text-muted-foreground">
                            {verification.booking?.destination?.name || "Booking"} - ${verification.booking?.totalPrice || 0}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {new Date(verification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleViewVerification(verification)}
                        variant="outline"
                        className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-950"
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

          {/* Bookings List */}
          <Card>
            <CardHeader>
              <CardTitle>Client Bookings</CardTitle>
              <CardDescription>Manage bookings from your clients</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookings found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 rounded-lg">
                          <AvatarImage src={booking.destination?.coverImage} alt={booking.destination?.name} className="object-cover" />
                          <AvatarFallback className="rounded-lg">
                            {booking.destination?.name?.charAt(0) || "D"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{booking.destination?.name || "Unknown Tour"}</h3>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                                {booking.paymentStatus && (
                                  <Badge className={booking.paymentStatus === "paid" ? "bg-green-500/10 text-green-600" : booking.paymentStatus === "pending" ? "bg-orange-500/10 text-orange-600" : "bg-red-500/10 text-red-600"}>
                                    {booking.paymentStatus === "unpaid" ? "Not Paid" : booking.paymentStatus === "pending" ? "Processing" : "Paid"}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {booking.travelerName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-foreground">
                                  <DollarSign className="h-4 w-4" />
                                  PKR {booking.totalPrice.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {booking.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(booking._id, "confirm")}
                                    className="cursor-pointer"
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleUpdateStatus(booking._id, "decline")}
                                    className="cursor-pointer"
                                  >
                                    Decline
                                  </Button>
                                </>
                              )}
                              {booking.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(booking._id, "complete")}
                                  className="cursor-pointer"
                                >
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Personal Bookings - Pending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Pending Bookings
              </CardTitle>
              <CardDescription>Destination bookings awaiting confirmation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalBookings.filter(b => b.status === "pending").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending bookings</p>
                </div>
              ) : (
                personalBookings.filter(b => b.status === "pending").map((booking) => (
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
                          <Badge className={booking.paymentStatus === "paid" ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"}>
                            {booking.paymentStatus === "unpaid" ? "Not Paid" : booking.paymentStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

          {/* My Personal Bookings - Confirmed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                My Confirmed Bookings
              </CardTitle>
              <CardDescription>Complete payment to finalize your bookings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalBookings.filter(b => b.status === "confirmed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No confirmed bookings</p>
                </div>
              ) : (
                personalBookings.filter(b => b.status === "confirmed").map((booking) => (
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
                          <Badge className={booking.paymentStatus === "paid" ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"}>
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
                    {booking.paymentStatus !== "paid" && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleProceedToPayment(booking)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Proceed to Payment - ${booking.totalPrice}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* My Personal Bookings - Completed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                My Completed Bookings
              </CardTitle>
              <CardDescription>Your booking history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalBookings.filter(b => b.status === "completed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed bookings yet</p>
                </div>
              ) : (
                personalBookings.filter(b => b.status === "completed").slice(0, 5).map((booking) => (
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
                      <span className="text-muted-foreground">Destination:</span>
                      <span className="font-medium">{selectedBooking.destination?.name || "N/A"}</span>
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
                    <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
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
