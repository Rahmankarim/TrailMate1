"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface ItineraryDay {
  day: number
  title: string
  description: string
}

export default function NewDestinationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    location: "",
    region: "gilgit-baltistan",
    difficulty: "moderate" as "easy" | "moderate" | "challenging" | "extreme",
    duration: "",
    price: "",
    maxGroupSize: "",
    altitude: "",
    bestSeason: [] as string[],
    highlights: [""],
    included: [""],
    notIncluded: [""],
    coverImage: "",
    images: [""],
  })

  const [itinerary, setItinerary] = useState<ItineraryDay[]>([{ day: 1, title: "", description: "" }])

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => (i === index ? value : item)),
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), ""],
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index),
    }))
  }

  const handleItineraryChange = (index: number, field: keyof ItineraryDay, value: string | number) => {
    setItinerary((prev) => prev.map((day, i) => (i === index ? { ...day, [field]: value } : day)))
  }

  const addItineraryDay = () => {
    setItinerary((prev) => [...prev, { day: prev.length + 1, title: "", description: "" }])
  }

  const removeItineraryDay = (index: number) => {
    setItinerary((prev) => prev.filter((_, i) => i !== index).map((day, i) => ({ ...day, day: i + 1 })))
  }

  const handleSeasonToggle = (season: string) => {
    setFormData((prev) => ({
      ...prev,
      bestSeason: prev.bestSeason.includes(season)
        ? prev.bestSeason.filter((s) => s !== season)
        : [...prev.bestSeason, season],
    }))
  }

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    if (!user) {
      setError("You must be logged in to create a destination")
      setIsSubmitting(false)
      return
    }

    try {
      const payload = {
        ...formData,
        price: Number.parseFloat(formData.price) || 0,
        maxGroupSize: Number.parseInt(formData.maxGroupSize) || 10,
        highlights: formData.highlights.filter((h) => h.trim()),
        included: formData.included.filter((i) => i.trim()),
        notIncluded: formData.notIncluded.filter((n) => n.trim()),
        images: formData.images.filter((i) => i.trim()),
        itinerary: itinerary.filter((day) => day.title.trim()),
        isPublished: publish,
        userId: user._id,
        createdByName: `${user.firstName} ${user.lastName}`,
        createdByEmail: user.email,
      }

      const res = await fetch("/api/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create destination")
      }

      router.push("/dashboard/guide/destinations")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const seasons = ["Spring", "Summer", "Autumn", "Winter"]

  return (
    <div className="flex min-h-screen bg-secondary">
      <DashboardSidebar role="guide" user={{ name: user ? `${user.firstName} ${user.lastName}` : "Guide", email: user?.email || "" }} />

      <div className="flex-1 ml-64">
        <DashboardTopbar title="Add New Destination" />

        <main className="p-6">
          <Link
            href="/dashboard/guide/destinations"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Destinations
          </Link>

          <form onSubmit={(e) => handleSubmit(e, false)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>General details about your tour</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Destination Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., Hunza Valley Trek"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="shortDescription">Short Description *</Label>
                      <Textarea
                        id="shortDescription"
                        value={formData.shortDescription}
                        onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                        placeholder="Brief overview (1-2 sentences)"
                        rows={2}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Full Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Detailed description of the tour..."
                        rows={6}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          placeholder="e.g., Hunza, Pakistan"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Region</Label>
                        <Select value={formData.region} onValueChange={(v) => handleInputChange("region", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gilgit-baltistan">Gilgit-Baltistan</SelectItem>
                            <SelectItem value="khyber-pakhtunkhwa">Khyber Pakhtunkhwa</SelectItem>
                            <SelectItem value="punjab">Punjab</SelectItem>
                            <SelectItem value="sindh">Sindh</SelectItem>
                            <SelectItem value="azad-kashmir">Azad Kashmir</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tour Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tour Details</CardTitle>
                    <CardDescription>Specifics about the tour</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration *</Label>
                        <Input
                          id="duration"
                          value={formData.duration}
                          onChange={(e) => handleInputChange("duration", e.target.value)}
                          placeholder="e.g., 5 days"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select value={formData.difficulty} onValueChange={(v) => handleInputChange("difficulty", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="challenging">Challenging</SelectItem>
                            <SelectItem value="extreme">Extreme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price per Person ($) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          placeholder="e.g., 500"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxGroupSize">Max Group Size</Label>
                        <Input
                          id="maxGroupSize"
                          type="number"
                          value={formData.maxGroupSize}
                          onChange={(e) => handleInputChange("maxGroupSize", e.target.value)}
                          placeholder="e.g., 12"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="altitude">Maximum Altitude</Label>
                      <Input
                        id="altitude"
                        value={formData.altitude}
                        onChange={(e) => handleInputChange("altitude", e.target.value)}
                        placeholder="e.g., 4,500m"
                      />
                    </div>
                    <div>
                      <Label>Best Seasons</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {seasons.map((season) => (
                          <Button
                            key={season}
                            type="button"
                            variant={formData.bestSeason.includes(season) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSeasonToggle(season)}
                          >
                            {season}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Itinerary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Itinerary</CardTitle>
                    <CardDescription>Day-by-day plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {itinerary.map((day, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Day {day.day}</Label>
                          {itinerary.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeItineraryDay(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={day.title}
                          onChange={(e) => handleItineraryChange(index, "title", e.target.value)}
                          placeholder="Day title, e.g., Arrival in Islamabad"
                        />
                        <Textarea
                          value={day.description}
                          onChange={(e) => handleItineraryChange(index, "description", e.target.value)}
                          placeholder="Day activities..."
                          rows={3}
                        />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addItineraryDay}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Day
                    </Button>
                  </CardContent>
                </Card>

                {/* Highlights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Highlights</CardTitle>
                    <CardDescription>Key attractions and experiences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {formData.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={highlight}
                          onChange={(e) => handleArrayChange("highlights", index, e.target.value)}
                          placeholder="e.g., Visit Eagle's Nest viewpoint"
                        />
                        {formData.highlights.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem("highlights", index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("highlights")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Highlight
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Images */}
                <Card>
                  <CardHeader>
                    <CardTitle>Images</CardTitle>
                    <CardDescription>Tour photos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="coverImage">Cover Image URL</Label>
                      <Input
                        id="coverImage"
                        value={formData.coverImage}
                        onChange={(e) => handleInputChange("coverImage", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Gallery Images</Label>
                      {formData.images.map((image, index) => (
                        <div key={index} className="flex items-center gap-2 mt-2">
                          <Input
                            value={image}
                            onChange={(e) => handleArrayChange("images", index, e.target.value)}
                            placeholder="Image URL"
                          />
                          {formData.images.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeArrayItem("images", index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-transparent"
                        onClick={() => addArrayItem("images")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Included/Not Included */}
                <Card>
                  <CardHeader>
                    <CardTitle>What's Included</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {formData.included.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => handleArrayChange("included", index, e.target.value)}
                          placeholder="e.g., All meals"
                        />
                        {formData.included.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem("included", index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("included")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Not Included</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {formData.notIncluded.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => handleArrayChange("notIncluded", index, e.target.value)}
                          placeholder="e.g., Travel insurance"
                        />
                        {formData.notIncluded.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem("notIncluded", index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("notIncluded")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      disabled={isSubmitting}
                      onClick={(e) => handleSubmit(e, false)}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      className="w-full bg-foreground text-background hover:bg-foreground/90"
                      disabled={isSubmitting}
                      onClick={(e) => handleSubmit(e, true)}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Publish Destination
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
