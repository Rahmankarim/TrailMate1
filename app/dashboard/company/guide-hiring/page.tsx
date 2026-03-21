"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  Send,
  Search,
  Star,
  Globe,
  Briefcase,
  Filter,
  RefreshCw,
  ExternalLink,
  UserCheck,
  Award,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideProfile {
  _id: string
  userId: string
  name: string
  email: string
  phone?: string
  bio: string
  shortBio?: string
  profileImage?: string
  location: string
  languages: string[]
  specialties: string[]
  experience: number
  certifications: string[]
  pricePerDay: number
  availability: {
    available: boolean
    nextAvailable?: string
  }
  rating?: number
  reviewCount?: number
  totalTours?: number
  isVerified: boolean
}

interface GuideHiring {
  _id: string
  guideId: string
  guideName: string
  guideEmail: string
  tourName: string
  tourDescription?: string
  startDate: string
  endDate: string
  employees: number
  totalPrice: number
  status: string
  paymentStatus: string
  createdAt: string
  guide?: {
    name: string
    location: string
    image?: string
    avatar?: string
  }
}

// ─── Helper components ────────────────────────────────────────────────────────

function AvailabilityBadge({ availability }: { availability: GuideProfile["availability"] }) {
  if (availability?.available) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 gap-1">
        <CheckCircle className="h-3 w-3" />
        Available Now
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      {availability?.nextAvailable
        ? `Busy until ${new Date(availability.nextAvailable).toLocaleDateString()}`
        : "Currently Booked"}
    </Badge>
  )
}

function RatingStars({ rating }: { rating?: number }) {
  const r = rating ?? 0
  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium">{r > 0 ? r.toFixed(1) : "New"}</span>
    </div>
  )
}

// ─── HiringCard sub-component ─────────────────────────────────────────────────

interface HiringCardProps {
  hiring: GuideHiring
  processingId: string | null
  getStatusBadge: (s: string) => React.ReactNode
  getPaymentBadge: (s: string) => React.ReactNode
  onMessage: (h: GuideHiring) => void
  onPay: (h: GuideHiring) => void
  isConfirmed?: boolean
  isCompleted?: boolean
}

function HiringCard({
  hiring,
  processingId,
  getStatusBadge,
  getPaymentBadge,
  onMessage,
  onPay,
  isConfirmed,
  isCompleted,
}: HiringCardProps) {
  return (
    <Card className={isConfirmed ? "border-green-200 dark:border-green-800" : undefined}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 flex-1 min-w-0">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={hiring.guide?.avatar || hiring.guide?.image} />
              <AvatarFallback className="font-semibold">{hiring.guideName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-lg font-semibold">{hiring.tourName}</h3>
                {getStatusBadge(hiring.status)}
                {getPaymentBadge(hiring.paymentStatus)}
              </div>
              {hiring.tourDescription && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{hiring.tourDescription}</p>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Guide: <span className="text-foreground font-medium">{hiring.guideName}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{hiring.employees} employees</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {new Date(hiring.startDate).toLocaleDateString()} –{" "}
                    {new Date(hiring.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold text-foreground">PKR {hiring.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => onMessage(hiring)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              {isCompleted ? "Review" : "Message"}
            </Button>
            {!isCompleted && !isConfirmed && hiring.paymentStatus !== "paid" && (
              <Button size="sm" onClick={() => onPay(hiring)} disabled={processingId === hiring._id}>
                {processingId === hiring._id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                Pay PKR {hiring.totalPrice.toLocaleString()}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GuideHiringPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  // ── Guide browse state ──
  const [guides, setGuides] = useState<GuideProfile[]>([])
  const [isLoadingGuides, setIsLoadingGuides] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "busy">("all")
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })

  // ── Hirings state ──
  const [hirings, setHirings] = useState<GuideHiring[]>([])
  const [isLoadingHirings, setIsLoadingHirings] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // ── Message dialog (Browse tab) ──
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageTarget, setMessageTarget] = useState<{
    guideId: string
    guideName: string
    guideEmail: string
    guideAvatar?: string
  } | null>(null)
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)

  // ── Message dialog (Hirings tab) ──
  const [selectedHiring, setSelectedHiring] = useState<GuideHiring | null>(null)
  const [messageHiringOpen, setMessageHiringOpen] = useState(false)
  const [hiringMessageText, setHiringMessageText] = useState("")
  const [isHiringSending, setIsHiringSending] = useState(false)

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchGuides = useCallback(
    async (page = 1) => {
      setIsLoadingGuides(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: "12", paginate: "true" })
        if (searchQuery.trim()) params.set("search", searchQuery.trim())
        if (locationFilter.trim()) params.set("location", locationFilter.trim())

        const res = await fetch(`/api/guides?${params.toString()}`, { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          let fetched: GuideProfile[] = data.guides || []
          if (availabilityFilter === "available") fetched = fetched.filter((g) => g.availability?.available)
          if (availabilityFilter === "busy") fetched = fetched.filter((g) => !g.availability?.available)
          setGuides(fetched)
          if (data.pagination) {
            setPagination({
              page: data.pagination.page,
              total: data.pagination.total,
              totalPages: data.pagination.totalPages,
            })
          }
        } else {
          toast({ title: "Error", description: "Failed to fetch guides", variant: "destructive" })
        }
      } catch {
        toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
      } finally {
        setIsLoadingGuides(false)
      }
    },
    [searchQuery, locationFilter, availabilityFilter, toast]
  )

  const fetchHirings = useCallback(async () => {
    setIsLoadingHirings(true)
    try {
      const res = await fetch("/api/bookings?type=company&bookingType=guide_hiring", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setHirings(data.bookings || [])
      } else {
        toast({ title: "Error", description: "Failed to fetch guide hirings", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setIsLoadingHirings(false)
    }
  }, [toast])

  useEffect(() => {
    if (user) {
      fetchGuides(1)
      fetchHirings()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = () => fetchGuides(1)

  const handleOpenMessageGuide = (guide: GuideProfile) => {
    setMessageTarget({
      guideId: guide.userId,
      guideName: guide.name,
      guideEmail: guide.email,
      guideAvatar: guide.profileImage,
    })
    setMessageText("")
    setMessageOpen(true)
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !messageTarget || !user) return
    setIsSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guideId: messageTarget.guideId,
          guideName: messageTarget.guideName,
          guideEmail: messageTarget.guideEmail,
          guideAvatar: messageTarget.guideAvatar || "",
          senderId: user._id,
          senderName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          senderEmail: user.email,
          senderAvatar: user.avatar || "",
          message: messageText.trim(),
        }),
      })
      if (res.ok) {
        toast({ title: "Message sent", description: `Your message was sent to ${messageTarget.guideName}` })
        setMessageText("")
        setMessageOpen(false)
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  const handleOpenHiringMessage = (hiring: GuideHiring) => {
    setSelectedHiring(hiring)
    setHiringMessageText("")
    setMessageHiringOpen(true)
  }

  const handleSendHiringMessage = async () => {
    if (!hiringMessageText.trim() || !selectedHiring || !user) return
    setIsHiringSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guideId: selectedHiring.guideId,
          guideName: selectedHiring.guideName,
          guideEmail: selectedHiring.guideEmail,
          guideAvatar: selectedHiring.guide?.avatar || selectedHiring.guide?.image || "",
          senderId: user._id,
          senderName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          senderEmail: user.email,
          senderAvatar: user.avatar || "",
          message: `Re: ${selectedHiring.tourName} (${new Date(selectedHiring.startDate).toLocaleDateString()} – ${new Date(selectedHiring.endDate).toLocaleDateString()})\n\n${hiringMessageText.trim()}`,
        }),
      })
      if (res.ok) {
        toast({ title: "Message sent", description: "Your message was sent to the guide" })
        setHiringMessageText("")
        setMessageHiringOpen(false)
      } else {
        throw new Error("Failed")
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
    } finally {
      setIsHiringSending(false)
    }
  }

  const handleProcessPayment = async (hiring: GuideHiring) => {
    if (hiring.paymentStatus === "paid") {
      toast({ title: "Already Paid", description: "This hiring has already been paid" })
      return
    }
    setProcessingId(hiring._id)
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookingId: hiring._id, amount: hiring.totalPrice, type: "guide_hiring" }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.paymentUrl) window.location.href = data.paymentUrl
      } else {
        toast({ title: "Error", description: "Failed to process payment", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  // ─── Badge helpers ────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const map: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
    > = {
      pending: { variant: "secondary", icon: Clock },
      confirmed: { variant: "default", icon: CheckCircle },
      completed: { variant: "outline", icon: CheckCircle },
      cancelled: { variant: "destructive", icon: XCircle },
    }
    const cfg = map[status] || map.pending
    const Icon = cfg.icon
    return (
      <Badge variant={cfg.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentBadge = (paymentStatus: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      unpaid: "destructive",
      pending: "secondary",
      paid: "default",
      refunded: "outline",
    }
    return (
      <Badge variant={map[paymentStatus] || "secondary"}>
        {paymentStatus === "paid" && <CheckCircle className="h-3 w-3 mr-1" />}
        {paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1)}
      </Badge>
    )
  }

  const availableCount = guides.filter((g) => g.availability?.available).length
  const pendingHirings = hirings.filter((h) => h.status === "pending")
  const confirmedHirings = hirings.filter((h) => h.status === "confirmed")
  const completedHirings = hirings.filter((h) => h.status === "completed")

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role="company"
        user={{
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Company",
          email: user?.email || "",
          avatar: user?.avatar,
        }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Guide Hiring" />

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-3xl font-bold">Guide Hiring</h1>
              <p className="text-muted-foreground mt-1">Browse available guides and manage your hired guides</p>
            </div>

            <Tabs defaultValue="browse" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="browse">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Guides
                </TabsTrigger>
                <TabsTrigger value="hirings">
                  <Briefcase className="h-4 w-4 mr-2" />
                  My Hirings
                  {hirings.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {hirings.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ── Browse Guides Tab ── */}
              <TabsContent value="browse" className="space-y-6">
                {/* Search & Filter */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search guides by name, bio, specialty…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="pl-9"
                        />
                      </div>
                      <div className="relative flex-1 max-w-[220px]">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter by location…"
                          value={locationFilter}
                          onChange={(e) => setLocationFilter(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="pl-9"
                        />
                      </div>
                      <Select
                        value={availabilityFilter}
                        onValueChange={(v) => setAvailabilityFilter(v as typeof availabilityFilter)}
                      >
                        <SelectTrigger className="w-[170px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Guides</SelectItem>
                          <SelectItem value="available">Available Now</SelectItem>
                          <SelectItem value="busy">Currently Busy</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleSearch} disabled={isLoadingGuides}>
                        {isLoadingGuides ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        Search
                      </Button>
                      <Button
                        variant="outline"
                        title="Clear filters"
                        onClick={() => {
                          setSearchQuery("")
                          setLocationFilter("")
                          setAvailabilityFilter("all")
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {isLoadingGuides
                      ? "Loading…"
                      : `${guides.length} guide${guides.length !== 1 ? "s" : ""} found • ${availableCount} available now`}
                  </span>
                  {pagination.totalPages > 1 && (
                    <span>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                  )}
                </div>

                {/* Guide grid */}
                {isLoadingGuides ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : guides.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No guides found</h3>
                      <p className="text-muted-foreground">Try adjusting your search filters.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {guides.map((guide) => (
                      <Card key={guide._id} className="flex flex-col hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 shrink-0">
                              <AvatarImage src={guide.profileImage} />
                              <AvatarFallback className="text-lg font-semibold">
                                {guide.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-base truncate">{guide.name}</h3>
                                {guide.isVerified && (
                                  <Award
                                    className="h-4 w-4 text-blue-500 shrink-0"
                                    title="Verified guide"
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{guide.location}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <RatingStars rating={guide.rating} />
                                {(guide.reviewCount ?? 0) > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({guide.reviewCount} reviews)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <AvailabilityBadge availability={guide.availability ?? { available: false }} />
                        </CardHeader>

                        <CardContent className="flex flex-col gap-3 flex-1">
                          {guide.shortBio && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{guide.shortBio}</p>
                          )}

                          <Separator />

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div>
                              <p className="font-semibold">{guide.experience ?? 0}y</p>
                              <p className="text-xs text-muted-foreground">Experience</p>
                            </div>
                            <div>
                              <p className="font-semibold">{guide.totalTours ?? 0}</p>
                              <p className="text-xs text-muted-foreground">Tours</p>
                            </div>
                            <div>
                              <p className="font-semibold">PKR {(guide.pricePerDay ?? 0).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">per day</p>
                            </div>
                          </div>

                          {/* Languages */}
                          {guide.languages?.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div className="flex gap-1 flex-wrap">
                                {guide.languages.slice(0, 3).map((lang) => (
                                  <Badge key={lang} variant="outline" className="text-xs px-1.5 py-0">
                                    {lang}
                                  </Badge>
                                ))}
                                {guide.languages.length > 3 && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    +{guide.languages.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Specialties */}
                          {guide.specialties?.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {guide.specialties.slice(0, 3).map((s) => (
                                <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">
                                  {s}
                                </Badge>
                              ))}
                              {guide.specialties.length > 3 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  +{guide.specialties.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 mt-auto pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleOpenMessageGuide(guide)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1.5" />
                              Message
                            </Button>
                            <Button size="sm" className="flex-1" asChild>
                              <Link href={`/guides/${guide._id}`} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-1.5" />
                                View Profile
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && !isLoadingGuides && (
                  <div className="flex justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchGuides(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center text-sm text-muted-foreground px-2">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchGuides(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ── My Hirings Tab ── */}
              <TabsContent value="hirings" className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(
                    [
                      { label: "Total Hirings", value: hirings.length, icon: Briefcase },
                      { label: "Pending", value: pendingHirings.length, icon: Clock },
                      { label: "Confirmed", value: confirmedHirings.length, icon: CheckCircle },
                      { label: "Completed", value: completedHirings.length, icon: UserCheck },
                    ] as const
                  ).map(({ label, value, icon: Icon }) => (
                    <Card key={label}>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardDescription className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </CardDescription>
                        <CardTitle className="text-2xl">{value}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {isLoadingHirings ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : hirings.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Guide Hirings Yet</h3>
                      <p className="text-muted-foreground">
                        Browse the Available Guides tab to find and hire guides for your tours.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {pendingHirings.length > 0 && (
                      <section>
                        <h2 className="text-xl font-bold mb-4">Pending Hirings</h2>
                        <div className="space-y-4">
                          {pendingHirings.map((hiring) => (
                            <HiringCard
                              key={hiring._id}
                              hiring={hiring}
                              processingId={processingId}
                              getStatusBadge={getStatusBadge}
                              getPaymentBadge={getPaymentBadge}
                              onMessage={handleOpenHiringMessage}
                              onPay={handleProcessPayment}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {confirmedHirings.length > 0 && (
                      <section>
                        <h2 className="text-xl font-bold mb-4">Confirmed Hirings</h2>
                        <div className="space-y-4">
                          {confirmedHirings.map((hiring) => (
                            <HiringCard
                              key={hiring._id}
                              hiring={hiring}
                              processingId={processingId}
                              getStatusBadge={getStatusBadge}
                              getPaymentBadge={getPaymentBadge}
                              onMessage={handleOpenHiringMessage}
                              onPay={handleProcessPayment}
                              isConfirmed
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {completedHirings.length > 0 && (
                      <section>
                        <h2 className="text-xl font-bold mb-4">Completed Hirings</h2>
                        <div className="space-y-4">
                          {completedHirings.map((hiring) => (
                            <HiringCard
                              key={hiring._id}
                              hiring={hiring}
                              processingId={processingId}
                              getStatusBadge={getStatusBadge}
                              getPaymentBadge={getPaymentBadge}
                              onMessage={handleOpenHiringMessage}
                              onPay={handleProcessPayment}
                              isCompleted
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* ── Message Guide Dialog (Browse tab) ── */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Message Guide
            </DialogTitle>
            <DialogDescription>Send a direct message to this guide</DialogDescription>
          </DialogHeader>
          {messageTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <Avatar>
                  <AvatarImage src={messageTarget.guideAvatar} />
                  <AvatarFallback>{messageTarget.guideName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{messageTarget.guideName}</p>
                  <p className="text-sm text-muted-foreground">{messageTarget.guideEmail}</p>
                </div>
              </div>
              <Textarea
                placeholder="Write your message here…"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setMessageOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSendMessage}
                  disabled={isSending || !messageText.trim()}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Message Guide Dialog (Hirings tab) ── */}
      <Dialog open={messageHiringOpen} onOpenChange={setMessageHiringOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Message Guide
            </DialogTitle>
            <DialogDescription>Send a message about your hiring</DialogDescription>
          </DialogHeader>
          {selectedHiring && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedHiring.guide?.avatar || selectedHiring.guide?.image} />
                  <AvatarFallback>{selectedHiring.guideName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedHiring.guideName}</p>
                  <p className="text-sm text-muted-foreground">{selectedHiring.guideEmail}</p>
                </div>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                <p className="font-semibold">{selectedHiring.tourName}</p>
                <p className="text-muted-foreground">
                  {new Date(selectedHiring.startDate).toLocaleDateString()} –{" "}
                  {new Date(selectedHiring.endDate).toLocaleDateString()}
                </p>
                <p className="text-muted-foreground">{selectedHiring.employees} employees</p>
              </div>
              <Textarea
                placeholder="Type your message…"
                value={hiringMessageText}
                onChange={(e) => setHiringMessageText(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setMessageHiringOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSendHiringMessage}
                  disabled={isHiringSending || !hiringMessageText.trim()}
                >
                  {isHiringSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
