"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, MapPin, Award, Search, Mountain, MessageCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface Guide {
  _id: string
  name: string
  bio: string
  location: string
  specialties: string[]
  languages: string[]
  experience: number
  pricePerDay: number
  rating: number
  reviewCount: number
  totalTours: number
  avatar?: string
  profileImage?: string
  image?: string
  updatedAt?: string
  isVerified: boolean
  isPublished: boolean
}

export function GuidesContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("All Locations")
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties")
  const [sortBy, setSortBy] = useState("Recommended")
  const [guides, setGuides] = useState<Guide[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch guides from API
  useEffect(() => {
    async function fetchGuides() {
      try {
        const response = await fetch("/api/guides", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.guides) {
            setGuides(data.guides)
          }
        }
      } catch (error) {
        console.error("Error fetching guides:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchGuides()
  }, [])

  // Get unique locations and specialties from guides
  const locations = useMemo(() => {
    const locs = new Set(guides.map((g) => g.location))
    return ["All Locations", ...Array.from(locs)]
  }, [guides])

  const specialties = useMemo(() => {
    const specs = new Set(guides.flatMap((g) => g.specialties || []))
    return ["All Specialties", ...Array.from(specs)]
  }, [guides])

  const filteredGuides = useMemo(() => {
    return guides
      .filter((guide) => {
        const matchesSearch =
          guide.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.specialties?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesLocation = selectedLocation === "All Locations" || guide.location === selectedLocation
        const matchesSpecialty =
          selectedSpecialty === "All Specialties" ||
          guide.specialties?.some((s) => s.includes(selectedSpecialty.replace("All Specialties", "")))
        return matchesSearch && matchesLocation && matchesSpecialty
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "Highest Rated":
            return b.rating - a.rating
          case "Most Experienced":
            return b.experience - a.experience
          case "Price: Low to High":
            return a.pricePerDay - b.pricePerDay
          case "Price: High to Low":
            return b.pricePerDay - a.pricePerDay
          default:
            return b.totalTours - a.totalTours
        }
      })
  }, [guides, searchQuery, selectedLocation, selectedSpecialty, sortBy])

  const sortOptions = ["Recommended", "Highest Rated", "Most Experienced", "Price: Low to High", "Price: High to Low"]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <section className="pt-24 pb-12 px-6 bg-secondary">
          <div className="max-w-7xl mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin text-foreground mx-auto" />
            <p className="text-muted-foreground mt-4">Loading guides...</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Expert Local Guides</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Connect with certified guides who know every trail, peak, and hidden gem
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search guides by name or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-background"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-[160px] h-12">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="w-[160px] h-12">
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-12">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <p className="text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{filteredGuides.length}</span> guides
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGuides.map((guide) => (
              <GuideCard key={guide._id} guide={guide} />
            ))}
          </div>

          {filteredGuides.length === 0 && (
            <div className="text-center py-20">
              <Mountain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No guides found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4 text-balance">Become a TrailMate Guide</h2>
          <p className="text-muted-foreground mb-8 text-pretty">
            Share your knowledge, earn income, and help travelers discover the beauty of Pakistan
          </p>
          <Link href="/signup?role=guide">
            <Button className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3">
              <Award className="h-5 w-5 mr-2" />
              Apply as Guide
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function GuideCard({ guide }: { guide: Guide }) {
  const imageSource = guide.avatar || guide.profileImage || guide.image || "/placeholder.svg"
  const isInlineOrBlobImage = imageSource.startsWith("data:") || imageSource.startsWith("blob:")
  const imageWithVersion = imageSource.includes("?") || isInlineOrBlobImage
    ? imageSource
    : `${imageSource}?v=${encodeURIComponent(guide.updatedAt || guide._id)}`

  return (
    <Card className="overflow-hidden border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={imageWithVersion} alt={guide.name} />
            <AvatarFallback>
              {guide.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{guide.name}</h3>
              {guide.isVerified && <Badge className="bg-chart-2/20 text-chart-2 text-xs">Verified</Badge>}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="h-4 w-4" />
              <span>{guide.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-semibold text-foreground">{guide.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground text-sm">({guide.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{guide.bio}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {guide.specialties?.slice(0, 2).map((specialty, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {guide.specialties && guide.specialties.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{guide.specialties.length - 2} more
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{guide.experience}</p>
            <p className="text-xs text-muted-foreground">Years Exp.</p>
          </div>
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{guide.totalTours}</p>
            <p className="text-xs text-muted-foreground">Tours</p>
          </div>
          <div className="bg-secondary rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{guide.languages?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Languages</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <span className="text-2xl font-bold text-foreground">${guide.pricePerDay}</span>
            <span className="text-muted-foreground text-sm"> / day</span>
          </div>
          <div className="flex gap-2">
            <Link href={`/guides/${guide._id}`}>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </Link>
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
