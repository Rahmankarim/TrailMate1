"use client"

import { useEffect } from "react"
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
} from "lucide-react"

const platformStats = [
  { label: "Total Users", value: "12,458", icon: Users, change: "+847", trend: "up" },
  { label: "Active Companies", value: "156", icon: Building2, change: "+23", trend: "up" },
  { label: "Destinations", value: "52", icon: MapPin, change: "+8", trend: "up" },
  { label: "Total Revenue", value: "$284,500", icon: DollarSign, change: "+18%", trend: "up" },
]

const pendingApprovals = [
  {
    id: 1,
    type: "guide",
    name: "Rashid Akhtar",
    email: "rashid@email.com",
    location: "Neelum Valley",
    submitted: "2 hours ago",
    avatar: "/placeholder.svg",
  },
  {
    id: 2,
    type: "company",
    name: "Alpine Adventures",
    email: "info@alpineadv.com",
    location: "Islamabad",
    submitted: "5 hours ago",
    avatar: "/placeholder.svg",
  },
  {
    id: 3,
    type: "guide",
    name: "Zainab Malik",
    email: "zainab@email.com",
    location: "Chitral",
    submitted: "1 day ago",
    avatar: "/placeholder.svg",
  },
]

const reportedContent = [
  {
    id: 1,
    type: "Review",
    content: "Inappropriate language in review for Hunza Valley tour",
    reporter: "System",
    severity: "medium",
    date: "3 hours ago",
  },
  {
    id: 2,
    type: "Guide Profile",
    content: "Unverified certifications claimed by guide",
    reporter: "User Report",
    severity: "high",
    date: "1 day ago",
  },
  {
    id: 3,
    type: "Blog Post",
    content: "Spam content detected in blog submission",
    reporter: "System",
    severity: "low",
    date: "2 days ago",
  },
]

const recentActivity = [
  { action: "New guide registered", user: "Ahmed Khan", time: "10 min ago" },
  { action: "Company verified", user: "Mountain Adventures", time: "25 min ago" },
  { action: "New destination added", user: "Admin", time: "1 hour ago" },
  { action: "User complaint resolved", user: "Support Team", time: "2 hours ago" },
  { action: "Payment processed", user: "System", time: "3 hours ago" },
]

const userGrowth = [
  { month: "Jan", users: 8500 },
  { month: "Feb", users: 9200 },
  { month: "Mar", users: 10100 },
  { month: "Apr", users: 10800 },
  { month: "May", users: 11500 },
  { month: "Jun", users: 12458 },
]

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/admin")
    }
  }, [authLoading, isAuthenticated, router])

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="admin" user={{ name: "Admin User", email: "admin@trailmate.com" }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Admin Dashboard" />

        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Platform Overview</h2>
              <p className="text-muted-foreground">Monitor and manage TrailMate platform</p>
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
              <TabsTrigger value="moderation">Content Moderation</TabsTrigger>
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
                    {pendingApprovals.map((item) => (
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Reported Content
                  </CardTitle>
                  <CardDescription>Content flagged for review</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportedContent.map((item) => (
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest platform actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((item, index) => (
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
                      User Growth
                    </CardTitle>
                    <CardDescription>Monthly user registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userGrowth.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{item.month}</span>
                            <span className="text-sm font-medium text-foreground">
                              {item.users.toLocaleString()} users
                            </span>
                          </div>
                          <Progress value={(item.users / 15000) * 100} />
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
