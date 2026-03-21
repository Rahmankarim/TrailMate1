"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface Destination {
  _id: string
  name: string
  shortDescription: string
  description: string
  location: string
  region: string
  difficulty: string
  duration: string
  price: number
  maxGroupSize: number
  altitude: string
  bestSeason: string[]
  highlights: string[]
  included: string[]
  notIncluded: string[]
  coverImage: string
  images: string[]
  itinerary: { day: number; title: string; description: string }[]
  isPublished: boolean
}

export default function EditDestinationPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<Partial<Destination>>({
    name: "",
    shortDescription: "",
    description: "",
    location: "",
    region: "",
    difficulty: "moderate",
    duration: "",
    price: 0,
    maxGroupSize: 10,
    altitude: "",
    bestSeason: [],
    highlights: [],
    included: [],
    notIncluded: [],
    coverImage: "",
    images: [],
    itinerary: [],
    isPublished: false,
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/company/tours")
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch destination data
  useEffect(() => {
    async function fetchDestination() {
      try {
        const response = await fetch(`/api/destinations/${id}`, {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setFormData(data.destination)
        } else {
          setError("Failed to load destination")
        }
      } catch (err) {
        console.error("Error fetching destination:", err)
        setError("Failed to load destination")
      } finally {
        setLoading(false)
      }
    }

    if (id && user) {
      fetchDestination()
    }
  }, [id, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/destinations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/dashboard/company/tours")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update destination")
      }
    } catch (err) {
      console.error("Error updating destination:", err)
      setError("Failed to update destination")
    } finally {
      setSaving(false)
    }
  }

  const handleArrayInput = (field: keyof Destination, value: string) => {
    setFormData({
      ...formData,
      [field]: value.split(",").map((item) => item.trim()).filter(Boolean),
    })
  }

  if (authLoading || loading) {
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
          <DashboardTopbar title="Edit Tour" />
          <main className="p-6 space-y-6">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            </div>
          </main>
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
        <DashboardTopbar title="Edit Tour" />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/company/tours">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Edit Tour</h1>
                <p className="text-muted-foreground mt-1">Update your tour destination details</p>
              </div>
            </div>
            <Badge variant={formData.isPublished ? "default" : "secondary"}>
              {formData.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tour Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief overview of the tour"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="challenging">Challenging</SelectItem>
                        <SelectItem value="difficult">Difficult</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 5 days"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxGroupSize">Max Group Size</Label>
                    <Input
                      id="maxGroupSize"
                      type="number"
                      value={formData.maxGroupSize}
                      onChange={(e) => setFormData({ ...formData, maxGroupSize: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altitude">Altitude</Label>
                    <Input
                      id="altitude"
                      value={formData.altitude}
                      onChange={(e) => setFormData({ ...formData, altitude: e.target.value })}
                      placeholder="e.g., 3000m"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bestSeason">Best Seasons (comma-separated)</Label>
                  <Input
                    id="bestSeason"
                    value={formData.bestSeason?.join(", ")}
                    onChange={(e) => handleArrayInput("bestSeason", e.target.value)}
                    placeholder="e.g., Spring, Summer, Autumn"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="images">Gallery Images (comma-separated URLs)</Label>
                  <Textarea
                    id="images"
                    value={formData.images?.join(", ")}
                    onChange={(e) => handleArrayInput("images", e.target.value)}
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tour Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="highlights">Highlights (comma-separated)</Label>
                  <Textarea
                    id="highlights"
                    value={formData.highlights?.join(", ")}
                    onChange={(e) => handleArrayInput("highlights", e.target.value)}
                    placeholder="e.g., Mountain views, Cultural experience"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="included">What's Included (comma-separated)</Label>
                  <Textarea
                    id="included"
                    value={formData.included?.join(", ")}
                    onChange={(e) => handleArrayInput("included", e.target.value)}
                    placeholder="e.g., Meals, Accommodation, Guide"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notIncluded">What's Not Included (comma-separated)</Label>
                  <Textarea
                    id="notIncluded"
                    value={formData.notIncluded?.join(", ")}
                    onChange={(e) => handleArrayInput("notIncluded", e.target.value)}
                    placeholder="e.g., Flight tickets, Personal expenses"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isPublished" className="cursor-pointer">
                    Publish this tour (make it visible to users)
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Link href="/dashboard/company/tours">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
