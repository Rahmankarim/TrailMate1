"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { Calendar, MapPin, Clock, Star, ArrowRight, Heart, TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface Booking {
  _id: string
  status: string
  startDate: string
  endDate: string
  guests: number
  destination?: {
    name: string
    coverImage: string
  }
  guide?: {
    name: string
  }
}

interface Destination {
  _id: string
  name: string
  coverImage: string
  rating: number
}

export default function UserDashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    tripsCompleted: 0,
    upcomingTrips: 0,
    totalSpent: 0,
    reviewsGiven: 0,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/user")
    }
    // Redirect guides to their own dashboard
    if (!authLoading && user && user.role === "guide") {
      router.push("/dashboard/guide")
    }
    // Redirect companies to their own dashboard
    if (!authLoading && user && user.role === "company") {
      router.push("/dashboard/company")
    }
    // Redirect admins to their own dashboard
    if (!authLoading && user && user.role === "admin") {
      router.push("/dashboard/admin")
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch user's bookings
        const bookingsRes = await fetch("/api/bookings")
        if (bookingsRes.ok) {
          const data = await bookingsRes.json()
          setBookings(data.bookings || [])

          // Calculate stats
          const completed = data.bookings.filter((b: Booking) => b.status === "completed").length
          const upcoming = data.bookings.filter(
            (b: Booking) => b.status === "confirmed" && new Date(b.startDate) > new Date(),
          ).length

          setStats((prev) => ({
            ...prev,
            tripsCompleted: completed,
            upcomingTrips: upcoming,
          }))
        }

        // Fetch some destinations to show as "saved" (in real app, this would be a separate saved collection)
        const destRes = await fetch("/api/destinations?published=true")
        if (destRes.ok) {
          const data = await destRes.json()
          setSavedDestinations(data.destinations?.slice(0, 3) || [])
        }

        // Fetch user's reviews
        if (user?._id) {
          const reviewsRes = await fetch(`/api/reviews?userId=${user._id}`)
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json()
            setStats((prev) => ({
              ...prev,
              reviewsGiven: reviewsData.reviews?.length || 0,
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  const upcomingBookings = bookings
    .filter((b) => ["pending", "confirmed"].includes(b.status) && new Date(b.startDate) > new Date())
    .slice(0, 3)

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return `${days} day${days > 1 ? "s" : ""}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="user" user={{ name: user?.name || "User", email: user?.email || "" }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Dashboard" />

        <main className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}!</h2>
              <p className="text-muted-foreground">Ready for your next adventure?</p>
            </div>
            <Link href="/destinations">
              <Button className="bg-foreground text-background hover:bg-foreground/90">
                Explore Destinations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trips Completed</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.tripsCompleted}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming Trips</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.upcomingTrips}</p>
                    <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{bookings.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reviews Given</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.reviewsGiven}</p>
                    <p className="text-xs text-muted-foreground mt-1">Feedback shared</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Star className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Bookings */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Adventures</CardTitle>
                    <CardDescription>Your scheduled trips</CardDescription>
                  </div>
                  <Link href="/dashboard/user/bookings">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No upcoming trips yet</p>
                      <Link href="/destinations">
                        <Button variant="outline">Browse Destinations</Button>
                      </Link>
                    </div>
                  ) : (
                    upcomingBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent transition-colors"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={
                              booking.destination?.coverImage || "/placeholder.svg?height=80&width=80&query=mountain"
                            }
                            alt={booking.destination?.name || "Trip"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">
                              {booking.destination?.name || "Custom Trip"}
                            </h4>
                            <Badge
                              variant={booking.status === "confirmed" ? "default" : "secondary"}
                              className={booking.status === "confirmed" ? "bg-green-600 text-white" : ""}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          {booking.guide && (
                            <p className="text-sm text-muted-foreground mb-2">Guide: {booking.guide.name}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(booking.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{getDuration(booking.startDate, booking.endDate)}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Saved Destinations */}
            <div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Popular
                    </CardTitle>
                    <CardDescription>Top destinations</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedDestinations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No destinations available</p>
                  ) : (
                    savedDestinations.map((dest) => (
                      <Link key={dest._id} href={`/destinations/${dest._id}`}>
                        <div className="flex items-center gap-3 hover:bg-accent p-2 rounded-lg transition-colors">
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={dest.coverImage || "/placeholder.svg?height=56&width=56&query=mountain"}
                              alt={dest.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{dest.name}</p>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-muted-foreground">{dest.rating?.toFixed(1) || "New"}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/guides">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Star className="h-4 w-4 mr-2" />
                      Find a Guide
                    </Button>
                  </Link>
                  <Link href="/destinations">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <MapPin className="h-4 w-4 mr-2" />
                      Browse Destinations
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Read Travel Stories
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
