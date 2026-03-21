"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { DollarSign, TrendingUp, Calendar, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GuideEarningsPage() {
  const { user } = useAuth()
  const [earningsData, setEarningsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("month")

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      const res = await fetch("/api/guide/earnings", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setEarningsData(data)
      }
    } catch (error) {
      console.error("Error fetching earnings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Extract stats from earningsData
  const stats = {
    totalEarnings: earningsData?.summary.totalEarnings || 0,
    pendingPayments: earningsData?.summary.pendingEarnings || 0,
    paidThisMonth: earningsData?.summary.thisMonthEarnings || 0,
    upcomingPayments: earningsData?.summary.upcomingEarnings || 0,
  }

  const recentTransactions = earningsData?.recentTransactions || []

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role="guide" user={user ? { name: user.firstName + ' ' + user.lastName, email: user.email, avatar: user.avatar } : undefined} />
      
      <div className="flex-1 ml-64">
        <DashboardTopbar title="Earnings" />
        
        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Earnings</CardDescription>
                <CardTitle className="text-3xl">
                  PKR {stats.totalEarnings.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Month</CardDescription>
                <CardTitle className="text-3xl text-green-500">
                  PKR {stats.paidThisMonth.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Payments</CardDescription>
                <CardTitle className="text-3xl text-yellow-500">
                  PKR {stats.pendingPayments.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Upcoming</CardDescription>
                <CardTitle className="text-3xl text-blue-500">
                  PKR {stats.upcomingPayments.toFixed(2)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Chart Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Earnings Overview</CardTitle>
                  <CardDescription>Track your income over time</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mr-4 opacity-50" />
                <p>Earnings chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent earnings and payments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No earnings yet</p>
                  <p className="text-sm mt-2">Complete tours to start earning</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((earning: any) => (
                    <div
                      key={earning._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold">{earning.destination}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(earning.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">PKR {earning.amount.toFixed(2)}</p>
                        <Badge
                          variant={earning.status === "paid" ? "default" : "secondary"}
                          className={earning.status === "paid" ? "bg-green-500" : "bg-yellow-500"}
                        >
                          {earning.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
