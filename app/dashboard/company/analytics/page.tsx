"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import {
  Users,
  MapPin,
  TrendingUp,
  Calendar,
  Star,
  Eye,
  DollarSign,
  Loader2,
  BarChart3,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function CompanyAnalyticsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/company/analytics")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/company/analytics", { credentials: "include" })

        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  // Extract metrics from analytics
  const totalBookings = analytics?.overview.totalBookings || 0
  const totalRevenue = analytics?.overview.totalRevenue || 0
  const avgBookingValue = analytics?.averages.avgBookingValue || 0
  const conversionRate = analytics?.overview.conversionRate || 0
  const topDestinations = analytics?.destinationPerformance || []
  const dailyData = analytics?.dailyData || []
  const maxBookings = Math.max(...dailyData.map((d: any) => d.bookings), 1)


  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary">
        <DashboardSidebar
          role="company"
          user={
            user
              ? {
                  name: `${user.firstName} ${user.lastName}`,
                  email: user.email,
                  avatar: user.avatar,
                }
              : undefined
          }
        />
        <div className="flex-1">
          <DashboardTopbar />
          <div className="p-6">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar
        role="company"
        user={
          user
            ? {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                avatar: user.avatar,
              }
            : undefined
        }
      />
      <div className="flex-1 ml-64">
        <DashboardTopbar title="Analytics" />
        <main className="p-6 space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalBookings}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">PKR {totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Booking Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">PKR {avgBookingValue.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Per booking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Views to bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Booking Trends */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Booking Trends (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyData.slice(-7).map((day: any, index: number) => {
                  const percentage = (day.bookings / maxBookings) * 100

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-foreground w-20">{day.date}</span>
                        <span className="text-muted-foreground">{day.bookings} bookings</span>
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
              <CardTitle>Top Performing Tours</CardTitle>
            </CardHeader>
            <CardContent>
              {topDestinations.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No booking data available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topDestinations.slice(0, 5).map((dest: any, index: number) => {
                    const maxDestBookings = Math.max(...topDestinations.map((d: any) => d.bookings))
                    const percentage = (dest.bookings / maxDestBookings) * 100

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                              <span className="font-medium text-foreground">{dest.name}</span>
                            </div>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{dest.bookings} bookings</span>
                              <span>PKR {dest.revenue.toLocaleString()} revenue</span>
                              <span>{dest.conversionRate.toFixed(1)}% conversion</span>
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
        </main>
      </div>
    </div>
  )
}
