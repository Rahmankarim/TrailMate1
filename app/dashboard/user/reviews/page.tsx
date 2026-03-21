"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { Star, Trash2, Edit, Loader2, Calendar } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Review {
  _id: string
  guideId: string
  guideName: string
  guideAvatar: string
  userId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  tourDate?: string
  createdAt: string
  updatedAt: string
}

export default function UserReviewsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/user/reviews")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    async function fetchReviews() {
      if (!user?._id) return

      try {
        const response = await fetch(`/api/reviews?userId=${user._id}`)
        if (response.ok) {
          const data = await response.json()
          setReviews(data.reviews || [])
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
        toast({
          title: "Error",
          description: "Failed to fetch your reviews",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchReviews()
    }
  }, [user, toast])

  const handleDeleteReview = async () => {
    if (!deleteReviewId || !user) return

    try {
      const response = await fetch(`/api/reviews/${deleteReviewId}?userId=${user._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setReviews(reviews.filter((review) => review._id !== deleteReviewId))
        toast({
          title: "Review deleted",
          description: "Your review has been deleted successfully",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete review",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteReviewId(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-secondary">
        <DashboardSidebar role="user" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="user" />
      <div className="flex-1">
        <DashboardTopbar />
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Reviews</h1>
            <p className="text-muted-foreground">
              Manage your guide reviews
            </p>
          </div>

          <div className="grid gap-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reviews.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reviews.length > 0
                      ? (
                          reviews.reduce((sum, review) => sum + review.rating, 0) /
                          reviews.length
                        ).toFixed(1)
                      : "0.0"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Guides Reviewed</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(reviews.map((r) => r.guideId)).size}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Reviews</CardTitle>
                <CardDescription>
                  All reviews you've written for guides
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't reviewed any guides yet
                    </p>
                    <Button onClick={() => router.push("/guides")} className="cursor-pointer">
                      Browse Guides
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={review.guideAvatar} alt={review.guideName} />
                              <AvatarFallback>
                                {review.guideName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{review.guideName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-muted-foreground"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <Badge variant="secondary">{review.rating} / 5</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/guides/${review.guideId}`)}
                              className="cursor-pointer"
                            >
                              View Guide
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteReviewId(review._id)}
                              className="cursor-pointer text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {review.comment && (
                          <div className="mb-4">
                            <p className="text-muted-foreground">{review.comment}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          {review.tourDate && (
                            <span>
                              Tour date: {new Date(review.tourDate).toLocaleDateString()}
                            </span>
                          )}
                          {review.updatedAt !== review.createdAt && (
                            <span>
                              (Edited {new Date(review.updatedAt).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
