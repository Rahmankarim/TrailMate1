"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { DollarSign, TrendingUp, Calendar, Download, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export default function CompanyRevenuePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [revenueData, setRevenueData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/company/revenue")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/company/revenue", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setRevenueData(data)
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

  // Extract revenue metrics from API
  const totalRevenue = revenueData?.summary.totalRevenue || 0
  const completedRevenue = revenueData?.revenueByStatus.completed || 0
  const pendingRevenue = revenueData?.summary.pendingRevenue || 0
  const paidBookings = revenueData?.summary.paidBookings || 0
  const pendingBookings = revenueData?.summary.pendingBookings || 0
  const growth = revenueData?.growth.monthOverMonth || 0
  const monthlyData = revenueData?.monthlyRevenue || []

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
        <DashboardTopbar title="Revenue" />
        <main className="p-6 space-y-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Revenue</h1>
              <p className="text-muted-foreground mt-1">Track your earnings and financial performance</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <DollarSign className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-2">PKR {completedRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{paidBookings} paid bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">PKR {pendingRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{pendingBookings} awaiting payment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${growth >= 0 ? "text-chart-2" : "text-destructive"}`}>
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(1)}%
                  </div>
                  {growth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-chart-2" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No revenue data available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlyData.map((data: any, index: number) => {
                    const maxRevenue = Math.max(...monthlyData.map((d: any) => d.totalRevenue))
                    const percentage = maxRevenue > 0 ? (data.totalRevenue / maxRevenue) * 100 : 0

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-foreground">{data.month}</span>
                          <span className="text-muted-foreground">
                            PKR {data.totalRevenue.toLocaleString()} ({data.bookings} bookings)
                          </span>
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
              )}
            </CardContent>
          </Card>

          {/* Revenue by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: "completed", label: "Completed", color: "chart-2", value: revenueData?.revenueByStatus.completed || 0 },
                  { key: "confirmed", label: "Confirmed", color: "blue-600", value: revenueData?.revenueByStatus.confirmed || 0 },
                  { key: "cancelled", label: "Cancelled", color: "destructive", value: revenueData?.revenueByStatus.cancelled || 0 },
                ].map(({ key, label, color, value }) => {
                  const percentage = totalRevenue > 0 ? (value / totalRevenue) * 100 : 0

                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-${color}`}>
                          {label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-foreground">PKR {value.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
