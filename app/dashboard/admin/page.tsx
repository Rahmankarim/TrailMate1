"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import {
  Users,
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Loader2,
} from "lucide-react"

type AdminAnalytics = {
  overview: {
    totalUsers: number
    totalBookings: number
    totalRevenue: number
    pendingRevenue: number
    totalDestinations: number
    totalGuides: number
    activeGuides: number
    totalCompanies: number
    paidBookings: number
    pendingBookings: number
  }
  monthlyData: Array<{ month: string; revenue: number; bookings: number; paidBookings: number }>
  topGuides: Array<{ name: string; email: string; bookings: number; revenue: number }>
  topCompanies: Array<{ name: string; email: string; bookings: number; revenue: number }>
  recentActivity: { newUsers: number; newBookings: number; newDestinations: number }
}

type AdminUser = {
  _id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  isActive: boolean
  isVerified?: boolean
  createdAt: string
  avatar?: string
  guideProfile?: {
    isApproved?: boolean
    specialties?: string[]
    rating?: number
  }
  companyProfile?: {
    isApproved?: boolean
    address?: string
    companyName?: string
  }
}

type ReviewRecord = {
  _id: string
  userName?: string
  comment?: string
  rating?: number
  createdAt?: string
}

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [recentReviews, setRecentReviews] = useState<ReviewRecord[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const formatRelativeTime = (dateValue?: string) => {
    if (!dateValue) return "Recently"
    const date = new Date(dateValue)
    const diffMs = Date.now() - date.getTime()
    const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)))
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  }

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [analyticsResponse, usersResponse, reviewsResponse] = await Promise.all([
          fetch("/api/admin/analytics", { credentials: "include" }),
          fetch("/api/admin/users", { credentials: "include" }),
          fetch("/api/reviews?paginate=false", { credentials: "include" }),
        ])

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          setAnalytics(analyticsData)
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setAdminUsers(usersData.users || [])
        }

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json()
          setRecentReviews((reviewsData.reviews || []).slice(0, 5))
        }
      } catch (error) {
        console.error("Error loading admin data:", error)
      } finally {
        setIsDataLoading(false)
      }
    }

    if (!authLoading && isAuthenticated && user?.role === "admin") {
      loadAdminData()
    }
  }, [authLoading, isAuthenticated, user?.role])

  const pendingApprovals = adminUsers
    .filter((item) => {
      if (item.role === "guide") {
        return item.isActive === false || item.guideProfile?.isApproved === false || item.isVerified === false
      }
      if (item.role === "company") {
        return item.isActive === false || item.companyProfile?.isApproved === false || item.isVerified === false
      }
      return false
    })
    .slice(0, 5)
    .map((item) => ({
      id: item._id,
      type: item.role,
      name: `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email,
      email: item.email,
      location:
        item.role === "guide"
          ? item.guideProfile?.specialties?.[0] || "Guide application"
          : item.companyProfile?.address || item.companyProfile?.companyName || "Company application",
      submitted: formatRelativeTime(item.createdAt),
      avatar: item.avatar || "/placeholder.svg",
    }))

  const reportedContent = recentReviews.length
    ? recentReviews.map((review) => ({
        id: review._id,
        type: "Review",
        content: review.comment || `Rating: ${review.rating ?? "N/A"}`,
        reporter: review.userName || "Customer",
        severity: (review.rating || 0) <= 2 ? "high" : (review.rating || 0) === 3 ? "medium" : "low",
        date: formatRelativeTime(review.createdAt),
      }))
    : []

  const recentActivity = analytics
    ? [
        { action: `${analytics.recentActivity.newUsers} new users joined`, user: "TrailMate", time: "Last 7 days" },
        { action: `${analytics.recentActivity.newBookings} bookings created`, user: "TrailMate", time: "Last 7 days" },
        { action: `${analytics.recentActivity.newDestinations} destinations added`, user: "TrailMate", time: "Last 7 days" },
      ]
    : []

  const monthlyActivity = analytics
    ? analytics.monthlyData.map((item) => ({ month: item.month, users: item.bookings }))
    : []

  const platformStats = analytics
    ? [
        { label: "Total Users", value: analytics.overview.totalUsers.toLocaleString(), icon: Users, change: `${analytics.recentActivity.newUsers >= 0 ? "+" : ""}${analytics.recentActivity.newUsers}`, trend: "up" },
        { label: "Active Companies", value: analytics.overview.totalCompanies.toString(), icon: Building2, change: `${analytics.recentActivity.newDestinations >= 0 ? "+" : ""}${analytics.recentActivity.newDestinations}`, trend: "up" },
        { label: "Destinations", value: analytics.overview.totalDestinations.toString(), icon: MapPin, change: `${analytics.overview.pendingBookings} pending`, trend: "up" },
        { label: "Total Revenue", value: `PKR ${analytics.overview.totalRevenue.toLocaleString()}`, icon: DollarSign, change: `${analytics.overview.paidBookings} paid`, trend: "up" },
      ]
    : [
        { label: "Total Users", value: "12,458", icon: Users, change: "+847", trend: "up" },
        { label: "Active Companies", value: "156", icon: Building2, change: "+23", trend: "up" },
        { label: "Destinations", value: "52", icon: MapPin, change: "+8", trend: "up" },
        { label: "Total Revenue", value: "PKR 284,500", icon: DollarSign, change: "+18%", trend: "up" },
      ]

  // Redirect if the session is missing or not an admin account
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.replace("/adminsignin?callbackUrl=/dashboard/admin")
    }
  }, [authLoading, isAuthenticated, router, user?.role])

  if (authLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.12),_transparent_24%),theme(colors.secondary)]">
      <DashboardSidebar
        role="admin"
        user={{
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          avatar: user.avatar,
        }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Admin Dashboard" />

        <main className="p-6 space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-50 shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_30%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 max-w-3xl">
                <Badge className="bg-white/10 text-slate-50 border-white/15 backdrop-blur-sm">Admin Control Center</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-balance">Platform command room for moderators, approvals, and system oversight.</h2>
                <p className="text-slate-200 max-w-2xl">
                  This portal is intentionally separate from traveler, guide, and company dashboards. Use it to supervise activity, manage approvals, and review platform health.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Access</div>
                  <div className="mt-2 text-2xl font-bold">Admin Only</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Status</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-300">Online</div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-1">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Platform Overview</h3>
              <p className="text-muted-foreground">
                Monitor and manage TrailMate platform {isDataLoading ? "..." : "with live data"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="py-1">
                <div className="w-2 h-2 rounded-full bg-chart-2 mr-2 animate-pulse" />
                System Healthy
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="h-3 w-3 text-chart-2" />
                        <span className="text-xs text-chart-2">{stat.change}</span>
                        <span className="text-xs text-muted-foreground">this month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="approvals" className="w-full">
            <TabsList>
              <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
              <TabsTrigger value="moderation">Recent Reviews</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="approvals" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Pending Approvals
                  </CardTitle>
                  <CardDescription>Guide and company applications awaiting verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingApprovals.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">No pending approvals right now.</div>
                    ) : (
                      pendingApprovals.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={item.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {item.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{item.name}</p>
                              <Badge variant="secondary">{item.type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.location} • Submitted {item.submitted}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          <Button size="sm" className="bg-chart-2 text-background hover:bg-chart-2/90">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recent Reviews
                  </CardTitle>
                  <CardDescription>Latest customer reviews pulled from the database</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportedContent.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">No reviews available yet.</div>
                    ) : (
                      reportedContent.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">{item.type}</Badge>
                            <Badge
                              variant={
                                item.severity === "high"
                                  ? "destructive"
                                  : item.severity === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {item.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground">{item.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Reported by {item.reporter} • {item.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                            Remove
                          </Button>
                          <Button size="sm" variant="outline" className="bg-transparent">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest platform actions from live analytics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(recentActivity.length ? recentActivity : [{ action: "No recent activity available", user: "System", time: "—" }]).map((item, index) => (
                        <div key={index} className="flex items-center gap-4 pb-4 border-b border-border last:border-0">
                          <div className="w-2 h-2 rounded-full bg-chart-2" />
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{item.action}</p>
                            <p className="text-xs text-muted-foreground">
                              by {item.user} • {item.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Monthly Activity
                    </CardTitle>
                    <CardDescription>Monthly booking volume from the live admin dataset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(monthlyActivity.length ? monthlyActivity : [{ month: "No data", users: 0 }]).map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{item.month}</span>
                            <span className="text-sm font-medium text-foreground">
                              {item.users.toLocaleString()} bookings
                            </span>
                          </div>
                          <Progress value={Math.min((item.users / 15000) * 100, 100)} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
