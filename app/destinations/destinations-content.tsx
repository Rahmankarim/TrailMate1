"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, MapPin, Clock, Search, Filter, Mountain, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Destination {
  _id: string
  name: string
  slug: string
  ownerName?: string
  shortDescription?: string
  description: string
  location: string
  region: string
  difficulty: string
  duration: string
  price: number
  coverImage?: string
  images: string[]
  rating?: number
  reviewsCount?: number
  highlights?: string[]
}

const categories = ["All", "Gilgit-Baltistan", "Kashmir", "Northern Areas", "Swat Valley"]
const difficulties = ["All", "Easy", "Moderate", "Challenging", "Extreme"]
const sortOptions = ["Popular", "Price: Low to High", "Price: High to Low", "Rating", "Duration"]

export function DestinationsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")
  const [sortBy, setSortBy] = useState("Popular")
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const heroBackground = "/attabad-lake-blue-water-boat-mountains.jpg"

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await fetch('/api/destinations')
        const data = await res.json()
        console.log('API Response:', data)
        if (data.success && data.destinations) {
          setDestinations(data.destinations)
        }
      } catch (error) {
        console.error('Error fetching destinations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDestinations()
  }, [])

  const filteredDestinations = useMemo(() => {
    return destinations
      .filter((dest) => {
        const matchesSearch =
          dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "All" || dest.region?.toLowerCase().includes(selectedCategory.toLowerCase())
        const matchesDifficulty = selectedDifficulty === "All" || dest.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
        return matchesSearch && matchesCategory && matchesDifficulty
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "Price: Low to High":
            return a.price - b.price
          case "Price: High to Low":
            return b.price - a.price
          case "Rating":
            return (b.rating || 0) - (a.rating || 0)
          case "Duration":
            return Number.parseInt(a.duration) - Number.parseInt(b.duration)
          default:
            return (b.reviewsCount || 0) - (a.reviewsCount || 0)
        }
      })
  }, [destinations, searchQuery, selectedCategory, selectedDifficulty, sortBy])

  // Build groups by destination name (case-insensitive)
  const groupedByName = useMemo(() => {
    const map = new Map<string, Destination[]>()
    for (const dest of filteredDestinations) {
      const key = dest.name.trim().toLowerCase()
      const arr = map.get(key) || []
      arr.push(dest)
      map.set(key, arr)
    }
    return map
  }, [filteredDestinations])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-12 px-6">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/25" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-background mb-4 text-balance">Explore Destinations</h1>
            <p className="text-xl text-background/85 max-w-2xl mx-auto text-pretty">
              Discover breathtaking locations for your next sustainable adventure
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-background/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-background/20">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search destinations by name, location, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-background"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px] h-12">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-[140px] h-12">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((diff) => (
                      <SelectItem key={diff} value={diff}>
                        {diff}
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

      {/* Results Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <p className="text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{filteredDestinations.length}</span> destinations
            </p>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedCategory !== "All" && selectedCategory}
                {selectedCategory !== "All" && selectedDifficulty !== "All" && " · "}
                {selectedDifficulty !== "All" && selectedDifficulty}
              </span>
            </div>
          </div>

          {/* Destinations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              // Render grouped items: if multiple destinations share same name, render a GroupCard
              Array.from(groupedByName.values()).map((group) =>
                group.length > 1 ? (
                  <GroupCard key={group[0]._id} name={group[0].name} items={group} />
                ) : (
                  <DestinationCard key={group[0]._id} destination={group[0]} />
                ),
              )
            )}
          </div>

          {!loading && filteredDestinations.length === 0 && (
            <div className="text-center py-20">
              <Mountain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No destinations found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function DestinationCard({ destination }: { destination: Destination }) {
  const imageUrl = destination.coverImage || destination.images?.[0] || "/placeholder.svg"
  
  return (
    <Link href={`/destinations/${destination.slug}`} className="group">
      <Card className="overflow-hidden border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
        <div className="relative h-64 overflow-hidden">
          <img
            src={imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
          <Badge
            variant="secondary"
            className="absolute top-4 right-4 bg-background/90 text-foreground backdrop-blur-sm capitalize"
          >
            {destination.difficulty}
          </Badge>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-bold text-background mb-1">{destination.name}</h3>
            <div className="flex items-center gap-2 text-background/90 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{destination.location}</span>
              </div>
              {destination.ownerName && (
                <div className="ml-3 text-sm text-background/80">• {destination.ownerName}</div>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-5">
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {destination.shortDescription || destination.description}
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="font-semibold text-foreground">{destination.rating || 4.5}</span>
              <span className="text-muted-foreground text-sm">({destination.reviewsCount || 0})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>{destination.duration}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">${destination.price?.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm"> / person</span>
            </div>
            <Button
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90 group-hover:scale-105 transition-transform"
            >
              View Details
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function GroupCard({ name, items }: { name: string; items: Destination[] }) {
  const [open, setOpen] = useState(false)
  const groupImages = [
    items[0]?.coverImage || items[0]?.images?.[0] || "/placeholder.svg",
    items[1]?.coverImage || items[1]?.images?.[0] || items[0]?.coverImage || items[0]?.images?.[0] || "/placeholder.svg",
  ]

  return (
    <>
      <div className="group">
        <Card
          onClick={() => setOpen(true)}
          className="overflow-hidden border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer"
        >
          <div className="relative h-64 overflow-hidden bg-muted p-4">
            <div className="grid grid-cols-2 gap-3 h-full">
              {groupImages.map((image, index) => (
                <div key={`${name}-${index}`} className="relative overflow-hidden rounded-xl bg-background shadow-sm">
                  <img
                    src={image}
                    alt={`${name} ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
                </div>
              ))}
            </div>
            <Badge
              variant="secondary"
              className="absolute top-4 right-4 bg-background/90 text-foreground backdrop-blur-sm"
            >
              {items.length} listings
            </Badge>
            <div className="absolute bottom-2 left-4 right-4 pb-1">
              <h3 className="text-2xl font-bold text-background mb-1">{name}</h3>
              <p className="text-sm text-background/85 line-clamp-1">
                {items[0]?.location} {items[0]?.ownerName ? `• ${items[0].ownerName}` : ""}
              </p>
            </div>
          </div>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              Multiple destinations share this name. Click to view all listings.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-foreground">&nbsp;</span>
              </div>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                View Group
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative max-w-3xl w-full mx-4">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{name} — {items.length} listings</h3>
                  <Button size="sm" onClick={() => setOpen(false)}>Close</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((d) => (
                    <Link key={d._id} href={`/destinations/${d.slug}`} className="block">
                      <Card className="overflow-hidden">
                        <div className="relative h-36 overflow-hidden">
                          <img src={d.coverImage || d.images?.[0] || "/placeholder.svg"} alt={d.name} className="w-full h-full object-cover" />
                        </div>
                        <CardContent>
                          <h4 className="font-semibold text-foreground">{d.name}</h4>
                          <div className="text-sm text-muted-foreground">{d.location} • {d.ownerName}</div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{d.shortDescription || d.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
