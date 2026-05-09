"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AdminAccessGuard from "@/components/dashboard/admin-access-guard"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { Users, DollarSign, MapPin, TrendingUp, Loader2, Calendar, BarChart3 } from "lucide-react"

interface AnalyticsData {
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
  monthlyData: Array<{
    month: string
    revenue: number
    bookings: number
    paidBookings: number
  }>
  topDestinations: Array<{
    name: string
    bookings: number
    revenue: number
  }>
  topGuides: Array<{
    name: string
    email: string
    bookings: number
    revenue: number
  }>
  topCompanies: Array<{
    name: string
    email: string
    bookings: number
    revenue: number
  }>
  recentActivity: {
    newUsers: number
    newBookings: number
    newDestinations: number
  }
  averages: {
    avgBookingValue: number
    avgDestinationsPerCompany: number
  }
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics", { 
        credentials: "include" 
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminAccessGuard>
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        role="admin"
        user={{
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Admin",
          email: user?.email || "",
          avatar: user?.avatar,
        }}
      />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Analytics" />

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Total Users
                      </CardDescription>
                      <CardTitle className="text-4xl">{analytics.overview.totalUsers}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Total Bookings
                      </CardDescription>
                      <CardTitle className="text-4xl">{analytics.overview.totalBookings}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Revenue
                      </CardDescription>
                      <CardTitle className="text-4xl">PKR {analytics.overview.totalRevenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Total Destinations
                      </CardDescription>
                      <CardTitle className="text-4xl">{analytics.overview.totalDestinations}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Active Guides
                      </CardDescription>
                      <CardTitle className="text-4xl">{analytics.overview.activeGuides}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardDescription className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Companies
                      </CardDescription>
                      <CardTitle className="text-4xl">{analytics.overview.totalCompanies}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Overview</CardTitle>
                      <CardDescription>Key metrics and performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <span className="font-medium">Paid Bookings</span>
                          <span className="text-2xl font-bold text-green-600">
                            {analytics.overview.paidBookings}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <span className="font-medium">Pending Bookings</span>
                          <span className="text-2xl font-bold text-yellow-600">
                            {analytics.overview.pendingBookings}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <span className="font-medium">Pending Revenue</span>
                          <span className="text-2xl font-bold text-yellow-600">
                            PKR {analytics.overview.pendingRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <span className="font-medium">Average Booking Value</span>
                          <span className="text-2xl font-bold">
                            PKR {analytics.averages.avgBookingValue.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
                      <CardDescription>New signups and activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <span className="font-medium">New Users</span>
                          <span className="text-2xl font-bold">
                            {analytics.recentActivity.newUsers}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <span className="font-medium">New Bookings</span>
                          <span className="text-2xl font-bold">
                            {analytics.recentActivity.newBookings}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                          <span className="font-medium">New Destinations</span>
                          <span className="text-2xl font-bold">
                            {analytics.recentActivity.newDestinations}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Revenue Trend</CardTitle>
                    <CardDescription>Last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.monthlyData.map((month, index) => {
                        const maxRevenue = Math.max(...analytics.monthlyData.map(m => m.revenue), 1)
                        const percentage = (month.revenue / maxRevenue) * 100

                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium w-24">{month.month}</span>
                              <div className="flex gap-4 text-muted-foreground">
                                <span>PKR {month.revenue.toLocaleString()}</span>
                                <span>{month.paidBookings} paid</span>
                              </div>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-chart-1 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Destinations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Destinations</CardTitle>
                    <CardDescription>By number of bookings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.topDestinations.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No destination data available yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {analytics.topDestinations.slice(0, 5).map((dest, index) => {
                          const maxBookings = Math.max(...analytics.topDestinations.map(d => d.bookings))
                          const percentage = (dest.bookings / maxBookings) * 100

                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                                    <span className="font-medium">{dest.name}</span>
                                  </div>
                                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                    <span>{dest.bookings} bookings</span>
                                    <span>PKR {dest.revenue.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-chart-2 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No analytics data available</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </AdminAccessGuard>
  )
}
