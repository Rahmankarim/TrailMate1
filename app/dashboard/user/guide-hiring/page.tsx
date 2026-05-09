"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { PAKISTAN_BANKS } from "@/lib/constants/banks"
import {
  Loader2,
  Calendar,
  Clock,
  Users,
  DollarSign,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  MessageSquare,
  Upload,
  Building2,
  ExternalLink,
  Briefcase,
  MessageCircle,
} from "lucide-react"

interface GuideHiring {
  _id: string
  guideId?: string
  status: string
  paymentStatus?: string
  startDate: string
  endDate: string
  guests?: number
  employees?: number
  totalPrice?: number
  notes?: string
  tourName?: string
  tourDescription?: string
  guideName?: string
  guideEmail?: string
  guideAvatar?: string
  guide?: {
    name?: string
    location?: string
    avatar?: string
    image?: string
  }
  destination?: {
    name?: string
    coverImage?: string
    location?: string
  }
  createdAt: string
}

export default function UserGuideHiringPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [hirings, setHirings] = useState<GuideHiring[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHiring, setSelectedHiring] = useState<GuideHiring | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedPaymentHiring, setSelectedPaymentHiring] = useState<GuideHiring | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [providerBankAccounts, setProviderBankAccounts] = useState<any[]>([])
  const [providerName, setProviderName] = useState("")
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [messageTarget, setMessageTarget] = useState<GuideHiring | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/user/guide-hiring")
    }
    if (!authLoading && user && user.role === "guide") {
      router.push("/dashboard/guide/bookings")
    }
    if (!authLoading && user && user.role === "company") {
      router.push("/dashboard/company/guide-hiring")
    }
    if (!authLoading && user && user.role === "admin") {
      router.push("/dashboard/admin")
    }
  }, [authLoading, isAuthenticated, user, router])

  const fetchHirings = async () => {
    try {
      const res = await fetch("/api/bookings?bookingType=guide_booking", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setHirings(data.bookings || [])
      }
    } catch (error) {
      console.error("Error fetching guide hirings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchHirings()
    }
  }, [user])

  const grouped = useMemo(() => {
    return {
      pending: hirings.filter((h) => h.status === "pending"),
      confirmed: hirings.filter((h) => h.status === "confirmed"),
      completed: hirings.filter((h) => h.status === "completed"),
      cancelled: hirings.filter((h) => h.status === "cancelled"),
    }
  }, [hirings])

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const getDuration = (start: string, end: string) => {
    const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
    return `${Math.max(days, 1)} day${days > 1 ? "s" : ""}`
  }

  const getImage = (hiring: GuideHiring) =>
    hiring.guideAvatar || hiring.guide?.avatar || hiring.guide?.image || hiring.destination?.coverImage || "/placeholder.svg?height=80&width=80&query=guide"

  const getTitle = (hiring: GuideHiring) => hiring.guideName || hiring.tourName || hiring.destination?.name || "Guide Hiring"
  const getSubtitle = (hiring: GuideHiring) => hiring.tourDescription || hiring.guide?.name || hiring.guideName || "Custom guide request"

  const getStatusClass = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      confirmed: "bg-blue-500/10 text-blue-600",
      completed: "bg-green-500/10 text-green-600",
      cancelled: "bg-red-500/10 text-red-600",
    }
    return styles[status] || styles.pending
  }

  const openDetails = (hiring: GuideHiring) => {
    setSelectedHiring(hiring)
    setDetailsOpen(true)
  }

  const openMessage = (hiring: GuideHiring) => {
    setMessageTarget(hiring)
    setMessageText("")
    setMessageOpen(true)
  }

  const handleSendMessage = async () => {
    if (!messageTarget || !messageText.trim() || !user) return
    setIsSendingMessage(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guideId: messageTarget.guideId || messageTarget.guideEmail || "",
          guideName: messageTarget.guideName || messageTarget.guide?.name || "Guide",
          guideEmail: messageTarget.guideEmail,
          guideAvatar: messageTarget.guideAvatar || messageTarget.guide?.avatar || messageTarget.guide?.image || "",
          senderId: user._id,
          senderName: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          senderEmail: user.email,
          senderAvatar: user.avatar || "",
          message: `Re: ${getTitle(messageTarget)}\n\n${messageText.trim()}`,
        }),
      })
      if (!res.ok) throw new Error("Failed to send message")
      toast({ title: "Message sent", description: "Your message was sent to the guide." })
      setMessageOpen(false)
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to send message", variant: "destructive" })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const openPayment = async (hiring: GuideHiring) => {
    setSelectedPaymentHiring(hiring)
    setScreenshot(null)
    setScreenshotFile(null)
    try {
      const res = await fetch(`/api/provider-bank-accounts?bookingId=${hiring._id}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setProviderBankAccounts(data.bankAccounts || [])
        setProviderName(data.providerName || hiring.guideName || "Service Provider")
      }
    } catch (error) {
      console.error(error)
    }
    setPaymentOpen(true)
  }

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setScreenshot(reader.result as string)
      setScreenshotFile(file)
    }
    reader.readAsDataURL(file)
  }

  const submitPaymentProof = async () => {
    if (!selectedPaymentHiring) return
    if (!screenshot) {
      toast({ title: "Screenshot Required", description: "Please upload payment screenshot", variant: "destructive" })
      return
    }
    if (providerBankAccounts.length === 0) {
      toast({ title: "No Bank Account", description: "Service provider hasn't added bank details yet", variant: "destructive" })
      return
    }

    setIsProcessingPayment(true)
    try {
      const response = await fetch("/api/payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookingId: selectedPaymentHiring._id,
          screenshot,
          accountDetails: providerBankAccounts[0],
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Payment submission failed")
      }
      toast({ title: "Payment Proof Submitted!", description: "Your payment is being verified." })
      setPaymentOpen(false)
      fetchHirings()
    } catch (error) {
      toast({ title: "Submission Failed", description: error instanceof Error ? error.message : "Failed to submit payment proof", variant: "destructive" })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleCancel = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!res.ok) throw new Error("Failed to cancel booking")
      toast({ title: "Booking Cancelled", description: "Your guide hiring has been cancelled." })
      fetchHirings()
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to cancel booking", variant: "destructive" })
    }
  }

  const handleComplete = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "completed" }),
      })
      if (!res.ok) throw new Error("Failed to complete booking")
      toast({ title: "Booking Completed", description: "Your guide hiring has been marked complete." })
      fetchHirings()
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to complete booking", variant: "destructive" })
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  if (!user || user.role !== "traveler") {
    return null
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar
        role="user"
        user={{
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "User",
          email: user.email || "",
          avatar: user.avatar,
        }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Guide Hiring" />

        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Guide Hiring</h2>
              <p className="text-muted-foreground">Manage your guide requests, payment proofs, and booking progress.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
                <Link href="/guides">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Hire a Guide
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/user/bookings">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  My Bookings
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{hirings.length}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-yellow-600">{grouped.pending.length}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Confirmed</p><p className="text-2xl font-bold text-blue-600">{grouped.confirmed.length}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-green-600">{grouped.completed.length}</p></CardContent></Card>
          </div>

          {(["pending", "confirmed", "completed", "cancelled"] as const).map((status) => {
            const items = grouped[status]
            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="capitalize">{status} Guide Hirings</CardTitle>
                  <CardDescription>
                    {status === "pending"
                      ? "Requests waiting for guide response"
                      : status === "confirmed"
                        ? "Approved guide hirings that may need payment"
                        : status === "completed"
                          ? "Finished guide hirings"
                          : "Cancelled guide hirings"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No {status} guide hirings</p>
                    </div>
                  ) : (
                    items.map((hiring) => (
                      <div key={hiring._id} className="rounded-xl border border-border p-4 hover:bg-accent transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img src={getImage(hiring)} alt={getTitle(hiring)} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground line-clamp-1">{getTitle(hiring)}</h3>
                              <Badge className={getStatusClass(hiring.status)}>{hiring.status}</Badge>
                              {hiring.paymentStatus && <Badge variant="outline">{hiring.paymentStatus}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{getSubtitle(hiring)}</p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{formatDate(hiring.startDate)}</span></div>
                              <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{getDuration(hiring.startDate, hiring.endDate)}</span></div>
                              <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{hiring.employees || hiring.guests || 1} employees</span></div>
                              <div className="flex items-center gap-1"><DollarSign className="h-4 w-4" /><span className="font-semibold text-foreground">{typeof hiring.totalPrice === "number" ? `PKR ${hiring.totalPrice.toLocaleString()}` : "N/A"}</span></div>
                            </div>
                            {hiring.guideName && <p className="text-sm text-muted-foreground mb-4">Guide: {hiring.guideName}</p>}
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => openDetails(hiring)}><Briefcase className="h-4 w-4 mr-2" />Details</Button>
                              <Button variant="outline" size="sm" onClick={() => openMessage(hiring)}><MessageCircle className="h-4 w-4 mr-2" />Message</Button>
                              {hiring.status === "confirmed" && hiring.paymentStatus !== "paid" && (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openPayment(hiring)}>
                                  <CreditCard className="h-4 w-4 mr-2" />Pay Now
                                </Button>
                              )}
                              {hiring.status === "confirmed" && hiring.paymentStatus === "paid" && new Date(hiring.endDate) <= new Date() && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleComplete(hiring._id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />Mark Complete
                                </Button>
                              )}
                              {hiring.status !== "completed" && hiring.status !== "cancelled" && (
                                <Button variant="outline" size="sm" onClick={() => handleCancel(hiring._id)}>
                                  <XCircle className="h-4 w-4 mr-2" />Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </main>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guide Hiring Details</DialogTitle>
            <DialogDescription>Review the booking details and current status.</DialogDescription>
          </DialogHeader>
          {selectedHiring && (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img src={getImage(selectedHiring)} alt={getTitle(selectedHiring)} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground">{getTitle(selectedHiring)}</h3>
                  <p className="text-sm text-muted-foreground">{getSubtitle(selectedHiring)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={getStatusClass(selectedHiring.status)}>{selectedHiring.status}</Badge>
                    {selectedHiring.paymentStatus && <Badge variant="outline">{selectedHiring.paymentStatus}</Badge>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Start Date</p><p className="font-medium text-foreground">{formatDate(selectedHiring.startDate)}</p></div>
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">End Date</p><p className="font-medium text-foreground">{formatDate(selectedHiring.endDate)}</p></div>
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Employees</p><p className="font-medium text-foreground">{selectedHiring.employees || selectedHiring.guests || 1}</p></div>
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Total Price</p><p className="font-medium text-foreground">{typeof selectedHiring.totalPrice === "number" ? `PKR ${selectedHiring.totalPrice.toLocaleString()}` : "N/A"}</p></div>
              </div>

              {selectedHiring.notes && (
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground text-sm mb-1">Notes</p>
                  <p className="text-sm text-foreground">{selectedHiring.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/guides"><ExternalLink className="h-4 w-4 mr-2" />Browse Guides</Link>
                </Button>
                <Button variant="outline" onClick={() => openMessage(selectedHiring)}>
                  <MessageCircle className="h-4 w-4 mr-2" />Message Guide
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Guide</DialogTitle>
            <DialogDescription>Send a message about this hiring request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write your message..." rows={5} />
            <div className="flex gap-3">
              <Button onClick={handleSendMessage} disabled={isSendingMessage || !messageText.trim()}>
                {isSendingMessage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
              <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Guide Hiring Payment</DialogTitle>
            <DialogDescription>Transfer payment and upload a screenshot for verification.</DialogDescription>
          </DialogHeader>
          {selectedPaymentHiring && (
            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Tour:</span><span className="font-medium text-right">{selectedPaymentHiring.tourName || "Guide Hiring"}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Guide:</span><span className="font-medium text-right">{selectedPaymentHiring.guideName || "N/A"}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Duration:</span><span className="font-medium text-right">{getDuration(selectedPaymentHiring.startDate, selectedPaymentHiring.endDate)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-lg font-semibold">Total Amount:</span><span className="text-2xl font-bold text-blue-600">{typeof selectedPaymentHiring.totalPrice === "number" ? `PKR ${selectedPaymentHiring.totalPrice.toLocaleString()}` : "N/A"}</span></div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Transfer to {providerName || "Provider"}'s Account:</Label>
                {providerBankAccounts.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">Service provider hasn't added bank details yet. Please contact them.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {providerBankAccounts.map((account: any, idx: number) => {
                      const bankInfo = PAKISTAN_BANKS.find((b) => b.value === account.bankName)
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
                                <div><Label className="text-xs text-muted-foreground">Account Number</Label><p className="font-mono font-medium">{account.accountNumber}</p></div>
                                {account.ibanNumber && <div><Label className="text-xs text-muted-foreground">IBAN</Label><p className="font-mono font-medium text-xs">{account.ibanNumber}</p></div>}
                                {account.branchCode && <div><Label className="text-xs text-muted-foreground">Branch Code</Label><p className="font-mono font-medium">{account.branchCode}</p></div>}
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
                <Label htmlFor="guide-payment-screenshot" className="text-base font-semibold">Upload Payment Screenshot</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {screenshot ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img src={screenshot} alt="Payment screenshot" className="max-h-48 rounded-lg mx-auto" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => { setScreenshot(null); setScreenshotFile(null) }}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600"><CheckCircle className="h-4 w-4" /><span>{screenshotFile?.name}</span></div>
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
                      <input id="guide-payment-screenshot" type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                    </div>
                  )}
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={submitPaymentProof} disabled={isProcessingPayment || !screenshot || providerBankAccounts.length === 0}>
                {isProcessingPayment ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting Payment Proof...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" />Submit Payment Proof</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
