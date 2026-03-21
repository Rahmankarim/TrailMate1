"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import SearchBar from "@/components/search-bar"
import {
  MapPin,
  Users,
  Shield,
  Leaf,
  Mountain,
  Star,
  ArrowRight,
  Globe,
  Volume2,
  VolumeX,
  CheckCircle,
  Quote,
  Calendar,
  Clock,
  Compass,
  Heart,
  Award,
  TrendingUp,
  Play,
  ChevronRight,
  Mail,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [destinations, setDestinations] = useState<any[]>([])
  const [featuredGuides, setFeaturedGuides] = useState<any[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Fetch dynamic data
    const fetchData = async () => {
      try {
        // Fetch destinations
        const destResponse = await fetch('/api/destinations?published=true')
        if (destResponse.ok) {
          const destData = await destResponse.json()
          if (destData.success && destData.destinations) {
            // Get top 4 destinations for homepage
            setDestinations(destData.destinations.slice(0, 4))
          }
        }

        // Fetch guides
        const guidesResponse = await fetch('/api/guides?published=true')
        if (guidesResponse.ok) {
          const guidesData = await guidesResponse.json()
          if (guidesData.guides) {
            // Get top 3 guides for homepage
            setFeaturedGuides(guidesData.guides.slice(0, 3))
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()

    const loadTimer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px 0px -100px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in-up")
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    setTimeout(() => {
      const sections = document.querySelectorAll(".animate-on-scroll")
      sections.forEach((section) => observer.observe(section))
    }, 100)

    return () => {
      observer.disconnect()
      clearTimeout(loadTimer)
    }
  }, [])

  const toggleMute = () => {
    const audio = audioRef.current
    if (audio) {
      if (isMuted) {
        audio.volume = 0.3
        audio.play().catch(() => console.log("[v0] Audio play prevented"))
        setIsMuted(false)
      } else {
        audio.pause()
        setIsMuted(true)
      }
    }
  }

  const playVideo = () => {
    setIsVideoPlaying(true)
    if (audioRef.current && !isMuted) {
      audioRef.current.pause()
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-8">
            <Mountain className="h-16 w-16 text-foreground animate-bounce" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4 animate-pulse">TrailMate</h1>
          <p className="text-muted-foreground mb-8 animate-fade-in-up">Preparing your adventure...</p>
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-foreground rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-foreground/60 rounded-full animate-bounce animation-delay-200"></div>
            <div className="w-3 h-3 bg-foreground/30 rounded-full animate-bounce animation-delay-400"></div>
          </div>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: Users,
      title: "Travel Companion Matching",
      description:
        "AI-powered matching with like-minded eco-adventurers based on interests, experience level, and travel style.",
    },
    {
      icon: MapPin,
      title: "Expert Guide Finder",
      description: "Connect with certified local guides who know the best sustainable trails and hidden eco-gems.",
    },
    {
      icon: Shield,
      title: "Secure Booking",
      description: "Safe and transparent booking system with verified eco-lodges and sustainable accommodations.",
    },
    {
      icon: Leaf,
      title: "Eco-Friendly Lodging",
      description: "Curated selection of environmentally conscious accommodations that support local communities.",
    },
  ]

  // Destinations are now fetched dynamically in useEffect

  const testimonials = [
    {
      name: "Sarah Mitchell",
      location: "United States",
      image: "/woman-traveler-portrait-smiling.jpg",
      rating: 5,
      text: "TrailMate completely transformed my travel experience. I found an amazing guide in Hunza who showed me hidden gems I never would have discovered on my own. The sustainable focus made me feel good about my adventure.",
      trip: "Hunza Valley Trek",
    },
    {
      name: "Marcus Chen",
      location: "Singapore",
      image: "/asian-man-traveler-portrait.png",
      rating: 5,
      text: "The companion matching feature is brilliant! I was paired with fellow photographers who shared my passion for landscape photography. We captured incredible shots together and made lifelong friends.",
      trip: "Skardu Photography Tour",
    },
    {
      name: "Emma Rodriguez",
      location: "Spain",
      image: "/european-woman-hiker-portrait.jpg",
      rating: 5,
      text: "As a solo female traveler, safety was my priority. TrailMate's verified guides and secure booking gave me confidence. My guide Fatima was exceptional - knowledgeable, friendly, and professional.",
      trip: "Fairy Meadows Adventure",
    },
  ]

  const howItWorks = [
    {
      step: 1,
      icon: Compass,
      title: "Choose Your Adventure",
      description:
        "Browse our curated selection of eco-friendly destinations and sustainable travel experiences across Pakistan's stunning landscapes.",
    },
    {
      step: 2,
      icon: Users,
      title: "Get Matched",
      description:
        "Our AI matches you with compatible travel companions and certified local guides based on your interests, experience, and travel style.",
    },
    {
      step: 3,
      icon: Calendar,
      title: "Plan & Book",
      description:
        "Customize your itinerary, select eco-lodging, and securely book your entire trip through our verified platform.",
    },
    {
      step: 4,
      icon: Mountain,
      title: "Explore Sustainably",
      description:
        "Embark on your adventure with confidence, knowing you're traveling responsibly and supporting local communities.",
    },
  ]

  // Featured guides are now fetched dynamically in useEffect

  const blogPosts = [
    {
      slug: "sustainable-trekking-tips",
      title: "10 Tips for Sustainable Trekking in Pakistan",
      excerpt:
        "Learn how to minimize your environmental impact while exploring the breathtaking trails of Northern Pakistan.",
      category: "Sustainability",
      image: "/sustainable-trekking-mountain-trail-pakistan.jpg",
      date: "Jan 10, 2026",
      readTime: "5 min read",
    },
    {
      slug: "hidden-gems-hunza",
      title: "Hidden Gems of Hunza Valley",
      excerpt: "Discover the lesser-known spots that make Hunza Valley one of the most magical destinations on Earth.",
      category: "Destinations",
      image: "/hunza-valley-hidden-village-pakistan.jpg",
      date: "Jan 8, 2026",
      readTime: "7 min read",
    },
    {
      slug: "local-cuisine-guide",
      title: "A Food Lover's Guide to Northern Pakistan",
      excerpt:
        "From traditional chapshuro to apricot dishes, explore the unique culinary heritage of the mountain regions.",
      category: "Culture",
      image: "/pakistani-traditional-food-mountain-cuisine.jpg",
      date: "Jan 5, 2026",
      readTime: "6 min read",
    },
  ]

  const partnerLogos = [
    { name: "Eco Tourism Pakistan", icon: Leaf },
    { name: "Mountain Safety Council", icon: Shield },
    { name: "Sustainable Travel Alliance", icon: Globe },
    { name: "Local Community Trust", icon: Heart },
    { name: "Adventure Certified", icon: Award },
  ]

  return (
    <div className="min-h-screen bg-background">
      <audio ref={audioRef} preload="auto" loop>
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/soft-calm-background-music-374964-Evti562G9CLXhGHos5SPieidnY9M0H.mp3" type="audio/mpeg" />
      </audio>

      <Button
        onClick={toggleMute}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-foreground hover:bg-foreground/90 text-background shadow-lg transition-all duration-300 hover:scale-110"
        size="sm"
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 animate-on-scroll">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in-up text-balance">
            TrailMate – Smarter Routes, Greener Journeys
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 text-pretty">
            Connect with expert local guides, find like-minded travel companions, and explore Pakistan's most
            breathtaking destinations sustainably.
          </p>
          <div className="mt-10 flex justify-center mb-12 md:mb-16">
            <SearchBar destinations={destinations} />
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden animate-fade-in-up animation-delay-600">
            <img
              src="/skardu-valley.jpg"
              alt="Mountain landscape"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-background/90 text-foreground px-4 py-2">
                  <MapPin className="h-4 w-4 mr-2" /> 50+ Destinations
                </Badge>
                <Badge className="bg-background/90 text-foreground px-4 py-2">
                  <Users className="h-4 w-4 mr-2" /> 200+ Expert Guides
                </Badge>
                <Badge className="bg-background/90 text-foreground px-4 py-2">
                  <Star className="h-4 w-4 mr-2" /> 4.9 Average Rating
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 px-6 border-y border-border animate-on-scroll">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground mb-8 text-sm uppercase tracking-wider">
            Trusted by leading organizations
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {partnerLogos.map((partner, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                <partner.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-secondary animate-on-scroll" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-foreground/10 text-foreground">Why TrailMate</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">Discover Your Perfect Adventure</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Our AI-powered platform connects you with the right people, places, and experiences for sustainable travel
              adventures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-card border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
                onClick={() => setActiveFeature(index)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 hover:bg-accent transition-colors duration-300">
                    <feature.icon className="h-8 w-8 text-foreground" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 animate-on-scroll">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-foreground/10 text-foreground">Simple Process</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">How TrailMate Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              From discovery to adventure in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div
                key={index}
                className="relative text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border">
                    <ChevronRight className="absolute -right-2 -top-2 h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="mx-auto w-24 h-24 rounded-full bg-foreground flex items-center justify-center mb-6 hover:scale-110 transition-transform duration-300">
                    <item.icon className="h-10 w-10 text-background" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary border-2 border-foreground flex items-center justify-center text-sm font-bold text-foreground">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Travel Companion Section */}
      <section className="py-20 px-6 bg-secondary animate-on-scroll">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-left">
              <Badge className="mb-4 bg-foreground/10 text-foreground">AI-Powered Matching</Badge>
              <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">
                Find Your Perfect Travel Companion
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed text-pretty">
                Our advanced AI analyzes your preferences, experience level, and travel style to match you with
                compatible adventure partners who share your passion for sustainable travel.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 animate-slide-in-right animation-delay-200">
                  <CheckCircle className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">Personality & Interest Matching</span>
                </div>
                <div className="flex items-center gap-3 animate-slide-in-right animation-delay-400">
                  <CheckCircle className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">Experience Level Compatibility</span>
                </div>
                <div className="flex items-center gap-3 animate-slide-in-right animation-delay-600">
                  <CheckCircle className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">Sustainable Travel Values</span>
                </div>
              </div>
              <Link href="/guides">
                <Button className="bg-foreground hover:bg-foreground/90 text-background px-6 py-3 hover:scale-105 transition-all duration-300">
                  <Users className="mr-2 h-5 w-5" />
                  Find Companions
                </Button>
              </Link>
            </div>

            <div className="relative animate-fade-in-right">
              <div className="bg-card border border-border p-8 rounded-2xl hover:shadow-lg transition-shadow duration-300">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div
                      key={i}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 ${
                        i === 5 ? "bg-foreground scale-110 animate-pulse" : "bg-secondary hover:bg-accent"
                      }`}
                    >
                      <Users className={`h-6 w-6 ${i === 5 ? "text-background" : "text-muted-foreground"}`} />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Connected with <span className="text-foreground font-semibold">1,247</span> eco-travelers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Guides Section */}
      <section className="py-20 px-6 animate-on-scroll">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <Badge className="mb-4 bg-foreground/10 text-foreground">Expert Guides</Badge>
              <h2 className="text-4xl font-bold text-foreground text-balance">Meet Our Top-Rated Guides</h2>
            </div>
            <Link href="/guides">
              <Button
                variant="outline"
                className="border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 bg-transparent"
              >
                View All Guides <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredGuides.length > 0 ? featuredGuides.map((guide, index) => (
              <Link href={`/guides/${guide._id}`} key={guide._id}>
                <Card
                  className="bg-card border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={guide.profileImage || guide.avatar || guide.image || "/placeholder.svg"}
                      alt={guide.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {guide.isVerified && (
                      <Badge className="absolute top-4 right-4 bg-foreground text-background">
                        <Award className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                          {guide.name}
                        </h3>
                        <p className="text-muted-foreground text-sm">{guide.specialties?.[0] || guide.specialty || 'Tour Guide'}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-foreground">{guide.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>{guide.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{guide.reviewCount || 0} reviews</span>
                      <span className="text-muted-foreground">{guide.totalTours || 0} tours completed</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">No guides available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Additional Image Section */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden animate-fade-in-up animation-delay-1000">
          {isVideoPlaying ? (
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/ybcZQxpTrCs?autoplay=1&rel=0"
              title="Explore Pakistan's Hidden Paradise"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src="/snow-capped-mountain-peaks-himalaya-pakistan.jpg"
                alt="Snow-capped peaks"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={playVideo}
                  className="bg-background/90 text-foreground hover:bg-background rounded-full w-20 h-20 hover:scale-110 transition-all duration-300 group"
                >
                  <Play className="h-8 w-8 ml-1 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
              <div className="absolute bottom-6 left-6">
                <p className="text-background font-medium">Watch: Explore Pakistan's Hidden Paradise</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-secondary animate-on-scroll">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-foreground/10 text-foreground">Testimonials</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">What Our Travelers Say</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Real stories from adventurers who discovered Pakistan through TrailMate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-card border-border hover:shadow-xl transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-8">
                  <Quote className="h-10 w-10 text-foreground/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="mt-4 text-xs">
                    {testimonial.trip}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Eco-Adventures Section */}
      <section className="py-20 px-6 animate-on-scroll">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <Badge className="mb-4 bg-foreground/10 text-foreground">Top Destinations</Badge>
              <h2 className="text-4xl font-bold text-foreground text-balance">Popular Eco-Adventures</h2>
            </div>
            <Link href="/destinations">
              <Button
                variant="outline"
                className="border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 bg-transparent"
              >
                View All Destinations <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {destinations.length > 0 ? destinations.map((destination, index) => {
              const slug = destination.slug || destination.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "")
              return (
                <Link href={`/destinations/${slug}`} key={destination._id || index} className="group">
                  <Card className="bg-card border border-border hover:shadow-lg hover:-translate-y-2 transition-all duration-500 overflow-hidden group animate-fade-in-up">
                    <div className="h-64 relative overflow-hidden">
                      <img
                        src={destination.images?.[0] || destination.image || "/placeholder.svg"}
                        alt={destination.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-background/90 text-foreground">
                          <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                          {destination.rating?.toFixed(1) || '5.0'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-background font-bold text-xl mb-1 group-hover:text-background/80 transition-colors">
                          {destination.name}
                        </h3>
                        <p className="text-background/80 text-sm mb-3">{destination.description?.substring(0, 50)}...</p>
                        <div className="flex items-center justify-between text-background/90 text-sm">
                          <span>PKR {destination.price}</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            }) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-muted-foreground">No destinations available at the moment.</p>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up animation-delay-600">
            <div className="text-center p-6 bg-secondary rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Globe className="h-8 w-8 mx-auto mb-3 text-foreground" />
              <h4 className="text-3xl font-bold text-foreground mb-1">50+</h4>
              <p className="text-muted-foreground text-sm">Eco Destinations</p>
            </div>
            <div className="text-center p-6 bg-secondary rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Users className="h-8 w-8 mx-auto mb-3 text-foreground" />
              <h4 className="text-3xl font-bold text-foreground mb-1">1,247</h4>
              <p className="text-muted-foreground text-sm">Active Travelers</p>
            </div>
            <div className="text-center p-6 bg-secondary rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Award className="h-8 w-8 mx-auto mb-3 text-foreground" />
              <h4 className="text-3xl font-bold text-foreground mb-1">200+</h4>
              <p className="text-muted-foreground text-sm">Certified Guides</p>
            </div>
            <div className="text-center p-6 bg-secondary rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <TrendingUp className="h-8 w-8 mx-auto mb-3 text-foreground" />
              <h4 className="text-3xl font-bold text-foreground mb-1">98%</h4>
              <p className="text-muted-foreground text-sm">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-20 px-6 bg-secondary animate-on-scroll">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <Badge className="mb-4 bg-foreground/10 text-foreground">Travel Stories</Badge>
              <h2 className="text-4xl font-bold text-foreground text-balance">Latest from Our Blog</h2>
            </div>
            <Link href="/blog">
              <Button
                variant="outline"
                className="border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 bg-transparent"
              >
                View All Posts <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Link href={`/blog/${post.slug}`} key={post.slug}>
                <Card
                  className="bg-card border-border hover:shadow-xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge className="absolute top-4 left-4 bg-foreground text-background">{post.category}</Badge>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-foreground/80 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA Section */}
      <section className="py-20 px-6 animate-on-scroll">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-foreground text-background p-8 md:p-12 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-background/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-background/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10 text-center">
              <Mail className="h-12 w-12 mx-auto mb-6 text-background/80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Stay Updated with TrailMate</h2>
              <p className="text-background/70 mb-8 max-w-xl mx-auto text-pretty">
                Get exclusive travel tips, destination guides, and special offers delivered to your inbox weekly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Input
                  placeholder="Enter your email"
                  className="bg-background/10 border-background/30 text-background placeholder:text-background/50 focus:bg-background/20"
                />
                <Button className="bg-background text-foreground hover:bg-background/90 px-8 hover:scale-105 transition-all duration-300">
                  Subscribe
                </Button>
              </div>
              <p className="text-background/50 text-sm mt-4">
                Join 5,000+ eco-travelers. No spam, unsubscribe anytime.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-secondary animate-on-scroll">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6 animate-fade-in-up text-balance">
            Ready to Start Your Sustainable Adventure?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-in-up animation-delay-200 text-pretty">
            Join thousands of eco-conscious travelers who are exploring the world responsibly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 px-8 hover:scale-105 transition-all duration-300"
              >
                Create Free Account
              </Button>
            </Link>
            <Link href="/destinations">
              <Button
                size="lg"
                variant="outline"
                className="border-foreground text-foreground hover:bg-foreground hover:text-background px-8 transition-all duration-300 bg-transparent"
              >
                Explore Destinations
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
