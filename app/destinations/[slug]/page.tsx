"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Star,
  MapPin,
  Clock,
  Users,
  Calendar,
  Mountain,
  Shield,
  Leaf,
  Camera,
  Compass,
  ChevronRight,
  Heart,
  Share2,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface Destination {
  _id: string
  name: string
  slug: string
  location: string
  region: string
  rating?: number
  totalReviews?: number
  price: number
  duration: string
  difficulty: string
  description: string
  shortDescription?: string
  coverImage: string
  images?: string[]
  highlights?: string[]
  included?: string[]
  notIncluded?: string[]
  itinerary?: { day: number; title: string; description: string }[]
  maxGroupSize?: number
  altitude?: string
  bestSeason?: string[]
  isPublished: boolean
}

export default function DestinationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [destination, setDestination] = useState<Destination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Booking state
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    guests: "1",
    notes: "",
    name: "",
    email: "",
    phone: ""
  })
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    async function fetchDestination() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/destinations?slug=${slug}`)
        const data = await response.json()

        if (data.success && data.destinations && data.destinations.length > 0) {
          setDestination(data.destinations[0])
        } else {
          setError("Destination not found")
        }
      } catch (err) {
        console.error("Error fetching destination:", err)
        setError("Failed to load destination")
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchDestination()
    }
  }, [slug])

  // Prefill user data if logged in
  useEffect(() => {
    if (user) {
      setBookingData(prev => ({
        ...prev,
        name: `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || user.email,
        email: user.email || ""
      }))
    }
  }, [user])

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book this destination",
        variant: "destructive",
      })
      router.push(`/signin?callbackUrl=/destinations/${slug}`)
      return
    }

    if (!destination) return

    setIsBooking(true)
    try {
      // Use placeholder dates - company will set actual dates later
      const defaultStartDate = new Date()
      defaultStartDate.setDate(defaultStartDate.getDate() + 7) // 7 days from now
      const defaultEndDate = new Date(defaultStartDate)
      defaultEndDate.setDate(defaultEndDate.getDate() + 3) // 3 day trip as default
      
      // Calculate base price (will be updated by company when they set dates)
      const totalPrice = destination.price * parseInt(bookingData.guests)

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          destinationId: destination._id,
          bookingType: "destination_booking",
          type: user.role === "company" ? "company" : "destination",
          startDate: defaultStartDate.toISOString(),
          endDate: defaultEndDate.toISOString(),
          guests: parseInt(bookingData.guests),
          totalPrice,
          notes: bookingData.notes,
          travelerName: bookingData.name,
          travelerEmail: bookingData.email,
          travelerPhone: bookingData.phone
        }),
      })

      if (response.ok) {
        toast({
          title: "Booking request sent!",
          description: `Your booking request for ${destination.name} has been submitted successfully.`,
        })
        setBookingOpen(false)
        setBookingData({
          startDate: "",
          endDate: "",
          guests: "1",
          notes: "",
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone
        })
        
        // Redirect based on user role
        setTimeout(() => {
          if (user.role === "company") {
            router.push("/dashboard/company/bookings")
          } else if (user.role === "guide") {
            router.push("/dashboard/guide/bookings")
          } else if (user.role === "admin") {
            router.push("/dashboard/admin")
          } else {
            router.push("/dashboard/user/bookings")
          }
        }, 1500)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create booking request",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        title: "Error",
        description: "Failed to create booking request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative h-[60vh] min-h-[500px]">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Destination Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The destination you're looking for doesn't exist."}</p>
          <Link href="/destinations">
            <Button>Back to Destinations</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px]">
        <Image
          src={destination.coverImage || "/placeholder.svg"}
          alt={destination.name}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-background text-foreground">{destination.region}</Badge>
              <Badge variant="secondary" className="bg-background/80 text-foreground">
                {destination.difficulty}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-background mb-4">{destination.name}</h1>
            <div className="flex flex-wrap items-center gap-6 text-background/90">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{destination.location}</span>
              </div>
              {destination.rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">{destination.rating}</span>
                  <span>({destination.totalReviews || 0} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{destination.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center p-4">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Best Time</p>
                  <p className="font-semibold text-foreground">
                    {destination.bestSeason?.join(", ") || "Year Round"}
                  </p>
                </Card>
                <Card className="text-center p-4">
                  <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Group Size</p>
                  <p className="font-semibold text-foreground">{destination.maxGroupSize || 12} people</p>
                </Card>
                <Card className="text-center p-4">
                  <Mountain className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Difficulty</p>
                  <p className="font-semibold text-foreground">{destination.difficulty}</p>
                </Card>
                <Card className="text-center p-4">
                  <Compass className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Altitude</p>
                  <p className="font-semibold text-foreground">{destination.altitude || "N/A"}</p>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">About This Trip</h2>
                    <p className="text-muted-foreground leading-relaxed">{destination.description}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">Highlights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {destination.highlights && destination.highlights.length > 0 ? (
                        destination.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-foreground" />
                            <span className="text-muted-foreground">{highlight}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No highlights available</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Shield className="h-5 w-5 text-chart-2" />
                          {"What's Included"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {destination.included && destination.included.length > 0 ? (
                          destination.included.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ChevronRight className="h-4 w-4 text-chart-2" />
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No inclusions listed</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Leaf className="h-5 w-5 text-destructive" />
                          Not Included
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {destination.notIncluded && destination.notIncluded.length > 0 ? (
                          destination.notIncluded.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ChevronRight className="h-4 w-4 text-destructive" />
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          ["International flights", "Travel insurance", "Personal expenses", "Tips"].map(
                            (item, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ChevronRight className="h-4 w-4 text-destructive" />
                                <span>{item}</span>
                              </div>
                            ),
                          )
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="itinerary" className="mt-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Day-by-Day Itinerary</h2>
                  <div className="space-y-4">
                    {destination.itinerary && destination.itinerary.length > 0 ? (
                      destination.itinerary.map((day, index) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="flex">
                            <div className="w-24 bg-foreground text-background flex flex-col items-center justify-center p-4">
                              <span className="text-sm font-medium">Day {day.day}</span>
                            </div>
                            <div className="flex-1 p-4">
                              <h4 className="font-semibold text-foreground mb-1">{day.title}</h4>
                              <p className="text-sm text-muted-foreground">{day.description}</p>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No itinerary available</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="gallery" className="mt-6">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Photo Gallery</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {destination.images && destination.images.length > 0 ? (
                      destination.images.map((image, index) => (
                        <div key={index} className="relative aspect-video rounded-xl overflow-hidden group">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`${destination.name} ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                            <Camera className="h-8 w-8 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12">
                        <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No photos available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-3xl font-bold text-foreground">${destination.price}</span>
                      <span className="text-muted-foreground"> / person</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium text-foreground">{destination.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Group Size</span>
                      <span className="font-medium text-foreground">
                        {destination.maxGroupSize || 12} people
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Difficulty</span>
                      <span className="font-medium text-foreground">{destination.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Best Season</span>
                      <span className="font-medium text-foreground">
                        {destination.bestSeason?.join(", ") || "Year Round"}
                      </span>
                    </div>
                  </div>

                  <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-foreground text-background hover:bg-foreground/90 h-12 text-lg mb-3">
                        <Calendar className="h-5 w-5 mr-2" />
                        Book Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Book {destination.name}</DialogTitle>
                        <DialogDescription>
                          Fill in the details below to request this trip. The company will set the trip dates and confirm pricing.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleBooking} className="space-y-4">
                        <div>
                          <Label htmlFor="guests">Number of Guests *</Label>
                          <Input
                            id="guests"
                            type="number"
                            min="1"
                            max={destination.maxGroupSize || 12}
                            value={bookingData.guests}
                            onChange={(e) => setBookingData({ ...bookingData, guests: e.target.value })}
                            required
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Maximum group size: {destination.maxGroupSize || 12} people
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={bookingData.name}
                            onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                            required
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={bookingData.email}
                            onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                            required
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={bookingData.phone}
                            onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                            placeholder="+92 300 1234567"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes">Special Requirements</Label>
                          <Textarea
                            id="notes"
                            placeholder="Dietary restrictions, accessibility needs, special requests..."
                            value={bookingData.notes}
                            onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                            rows={3}
                            className="mt-2"
                          />
                        </div>

                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Number of Guests:</span>
                            <span className="font-semibold">{bookingData.guests}</span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-sm font-semibold">Price per Person:</span>
                            <span className="text-2xl font-bold">${destination.price.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Note: Final dates and pricing will be confirmed by the company
                          </p>
                        </div>

                        <Button type="submit" className="w-full" disabled={isBooking}>
                          {isBooking ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Confirm Booking"
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Free cancellation up to 14 days before the trip
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
