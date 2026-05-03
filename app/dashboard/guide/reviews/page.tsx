"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { Star, Loader2, User, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Review {
  _id: string
  rating: number
  comment: string
  userName: string
  userAvatar?: string
  userId: string
  tourDate?: string
  createdAt: string
  updatedAt: string
}

export default function GuideReviewsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [guideProfileId, setGuideProfileId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    avgRating: 0,
    totalReviews: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/guide/reviews")
    }
  }, [authLoading, isAuthenticated, router])

  // First, fetch the guide profile to get the guide profile ID
  useEffect(() => {
    async function fetchGuideProfile() {
      if (!user?._id) return

      try {
        const response = await fetch(`/api/guides?userId=${user._id}&paginate=false`)
        if (response.ok) {
          const data = await response.json()
          if (data.guides && data.guides.length > 0) {
            setGuideProfileId(data.guides[0]._id)
          }
        }
      } catch (error) {
        console.error("Error fetching guide profile:", error)
      }
    }

    if (user) {
      fetchGuideProfile()
    }
  }, [user])

  useEffect(() => {
    async function fetchReviews() {
      if (!guideProfileId) return

      try {
        const response = await fetch(`/api/reviews?guideId=${guideProfileId}&paginate=false`)
        if (response.ok) {
          const data = await response.json()
          const fetchedReviews = data.reviews || []
          setReviews(fetchedReviews)

          // Calculate stats
          const totalReviews = fetchedReviews.length
          const avgRating = data.averageRating || 0
          
          const ratingCounts = {
            fiveStar: fetchedReviews.filter((r: Review) => r.rating === 5).length,
            fourStar: fetchedReviews.filter((r: Review) => r.rating === 4).length,
            threeStar: fetchedReviews.filter((r: Review) => r.rating === 3).length,
            twoStar: fetchedReviews.filter((r: Review) => r.rating === 2).length,
            oneStar: fetchedReviews.filter((r: Review) => r.rating === 1).length,
          }

          setStats({
            avgRating,
            totalReviews,
            ...ratingCounts,
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch reviews",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
        toast({
          title: "Error",
          description: "Failed to fetch reviews",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (guideProfileId) {
      fetchReviews()
    }
  }, [guideProfileId, toast])

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="guide" user={{ name: `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || "Guide", email: user?.email || "" }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Reviews" />

        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Rating</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  {stats.avgRating.toFixed(1)}
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Reviews</CardDescription>
                <CardTitle className="text-3xl">{stats.totalReviews}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>5 Star Reviews</CardDescription>
                <CardTitle className="text-3xl text-green-500">{stats.fiveStar}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>4+ Star Rate</CardDescription>
                <CardTitle className="text-3xl text-blue-500">
                  {stats.totalReviews > 0
                    ? Math.round(((stats.fiveStar + stats.fourStar) / stats.totalReviews) * 100)
                    : 0}
                  %
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  rating === 5
                    ? stats.fiveStar
                    : rating === 4
                      ? stats.fourStar
                      : rating === 3
                        ? stats.threeStar
                        : rating === 2
                          ? stats.twoStar
                          : stats.oneStar
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-12">{rating} star</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>What travelers are saying about your tours</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No reviews yet</p>
                  <p className="text-sm">Reviews from travelers will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="p-6 border rounded-lg space-y-3 bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.userAvatar} />
                            <AvatarFallback>
                              {review.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{review.userName}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground mt-2">{review.comment}</p>
                      )}
                      {review.tourDate && (
                        <div className="pt-2">
                          <Badge variant="secondary">
                            Tour date: {new Date(review.tourDate).toLocaleDateString()}
                          </Badge>
                        </div>
                      )}
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
