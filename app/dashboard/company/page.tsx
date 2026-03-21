"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
} from "lucide-react"

export default function CompanyDashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([
    { label: "Destination Revenue", value: "$0", icon: DollarSign, change: "+0%", trend: "up" },
    { label: "Total Bookings", value: "0", icon: Calendar, change: "+0%", trend: "up" },
    { label: "Guide Hirings", value: "0", icon: Users, change: "+0", trend: "up" },
    { label: "Active Tours", value: "0", icon: BarChart3, change: "+0", trend: "up" },
  ])
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [topTours, setTopTours] = useState<any[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/company")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!user) return
    
    const fetchDashboardData = async () => {
      try {
        // Fetch destination bookings and guide hirings separately
        const [destinationBookingsRes, guideHiringsRes, destinationsRes] = await Promise.all([
          fetch('/api/bookings?bookingType=destination_booking', { credentials: 'include' }),
          fetch('/api/bookings?bookingType=guide_hiring', { credentials: 'include' }),
          fetch('/api/destinations?userOnly=true', { credentials: 'include' })
        ])
        
        const destinationBookingsData = await destinationBookingsRes.json()
        const guideHiringsData = await guideHiringsRes.json()
        const destinationsData = await destinationsRes.json()

        const destinationBookings = destinationBookingsData.bookings || []
        const guideHirings = guideHiringsData.bookings || []

        // Calculate stats from real data - separate destination bookings from guide hiring
        const destinationRevenue = destinationBookings
          .filter((b: any) => b.paymentStatus === 'paid')
          .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
        const totalDestinationBookings = destinationBookings.length
        const totalGuideHirings = guideHirings.length
        const activeTours = destinationsData.destinations?.filter((d: any) => d.isPublished).length || 0

        setStats([
          { label: "Destination Revenue", value: `PKR ${destinationRevenue.toLocaleString()}`, icon: DollarSign, change: "+0%", trend: "up" },
          { label: "Total Bookings", value: totalDestinationBookings.toString(), icon: Calendar, change: "+0%", trend: "up" },
          { label: "Guide Hirings", value: totalGuideHirings.toString(), icon: Users, change: "+0", trend: "up" },
          { label: "Active Tours", value: activeTours.toString(), icon: BarChart3, change: "+0", trend: "up" },
        ])

        // Set recent bookings (only destination bookings, last 4)
        const recent = destinationBookings.slice(0, 4).map((b: any) => ({
          id: b._id,
          customer: b.userName || b.travelerName || b.userEmail || 'Customer',
          tour: b.destination?.name || 'Tour',
          date: new Date(b.createdAt).toLocaleDateString(),
          amount: `PKR ${b.totalPrice?.toLocaleString() || 0}`,
          status: b.status || 'pending',
          avatar: b.destination?.coverImage || "/placeholder.svg"
        }))
        setRecentBookings(recent)

        // Calculate top tours by bookings (only from destination bookings)
        const tourBookings = new Map()
        destinationBookings.forEach((b: any) => {
          const key = b.destinationId
          if (!tourBookings.has(key)) {
            tourBookings.set(key, {
              name: b.destination?.name || 'Unknown Tour',
              bookings: 0,
              revenue: 0
            })
          }
          const tour = tourBookings.get(key)
          tour.bookings++
          tour.revenue += b.totalPrice || 0
        })

        const topToursArray = Array.from(tourBookings.values())
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 4)
          .map(t => ({
            name: t.name,
            bookings: t.bookings,
            revenue: `PKR ${t.revenue.toLocaleString()}`,
            progress: totalDestinationBookings > 0 ? Math.min((t.bookings / totalDestinationBookings) * 100, 100) : 0
          }))
        
        setTopTours(topToursArray)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  console.log("📊 DASHBOARD: Render state:", {
    authLoading,
    isAuthenticated,
    hasUser: !!user,
    userEmail: user?.email,
    userRole: user?.role
  })

  // Show loading while checking auth
  if (authLoading) {
    console.log("📊 DASHBOARD: Showing loading screen")
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect via useEffect)
  if (!isAuthenticated || !user) {
    console.log("📊 DASHBOARD: User not authenticated, returning null")
    return null
  }

  console.log("📊 DASHBOARD: Rendering dashboard content")

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="company" user={{ name: user.companyProfile?.companyName || `${user.firstName} ${user.lastName}`, email: user.email }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Company Dashboard" />

        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{user?.companyProfile?.companyName || 'Company Dashboard'}</h2>
              <p className="text-muted-foreground">Overview of your company performance</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button className="bg-foreground text-background hover:bg-foreground/90" asChild>
                <a href="/dashboard/company/destinations/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tour
                </a>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              stats.map((stat, index) => (
                <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3 text-chart-2" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-destructive" />
                        )}
                        <span className={`text-xs ${stat.trend === "up" ? "text-chart-2" : "text-destructive"}`}>
                          {stat.change}
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Bookings */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>Latest customer reservations</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tour</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array.from({ length: 3 }).map((_, index) => (
                            <tr key={index} className="border-b border-border">
                              <td className="py-3 px-4" colSpan={5}>
                                <Skeleton className="h-12 w-full" />
                              </td>
                            </tr>
                          ))
                        ) : recentBookings.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              No bookings yet
                            </td>
                          </tr>
                        ) : (
                          recentBookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-accent">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={booking.avatar} alt={booking.customer} />
                                    <AvatarFallback>
                                      {booking.customer
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">{booking.customer}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">{booking.tour}</td>
                              <td className="py-3 px-4 text-muted-foreground">{booking.date}</td>
                              <td className="py-3 px-4 font-medium text-foreground">{booking.amount}</td>
                              <td className="py-3 px-4">
                                <Badge
                                  variant={booking.status === "confirmed" ? "default" : "secondary"}
                                  className={booking.status === "confirmed" ? "bg-chart-2 text-background" : ""}
                                >
                                  {booking.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your tours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link href="/dashboard/company/destinations/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Tour
                    </Link>
                  </Button>
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Published Tours</span>
                      <span className="font-semibold text-foreground">{loading ? "..." : stats[2].value}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Bookings</span>
                      <span className="font-semibold text-foreground">{loading ? "..." : stats[1].value}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Tours */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Tours</CardTitle>
              <CardDescription>Tours with highest bookings this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))
                ) : topTours.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tours data available</p>
                ) : (
                  topTours.map((tour, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{tour.name}</span>
                        <span className="text-sm text-muted-foreground">{tour.bookings} bookings</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={tour.progress} className="flex-1" />
                      <span className="text-sm font-medium text-foreground w-20 text-right">{tour.revenue}</span>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
