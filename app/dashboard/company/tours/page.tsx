"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import DashboardSidebar from "@/components/dashboard/sidebar"
import DashboardTopbar from "@/components/dashboard/topbar"
import { Plus, Search, Edit, Trash2, Eye, EyeOff, MapPin, DollarSign, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface Destination {
  _id: string
  name: string
  slug: string
  location: string
  coverImage: string
  price: number
  duration: string
  difficulty: string
  isPublished: boolean
  createdAt: string
}

export default function CompanyToursPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin?callbackUrl=/dashboard/company/tours")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    async function fetchDestinations() {
      try {
        const response = await fetch("/api/destinations?userOnly=true")
        if (response.ok) {
          const data = await response.json()
          setDestinations(data.destinations || [])
        }
      } catch (error) {
        console.error("Error fetching destinations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDestinations()
    }
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tour?")) return

    try {
      const response = await fetch(`/api/destinations/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setDestinations(destinations.filter((d) => d._id !== id))
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete tour")
      }
    } catch (error) {
      console.error("Error deleting destination:", error)
      alert("Failed to delete tour")
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/destinations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublished: !currentStatus }),
      })

      if (response.ok) {
        setDestinations(
          destinations.map((d) => (d._id === id ? { ...d, isPublished: !currentStatus } : d))
        )
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update tour")
      }
    } catch (error) {
      console.error("Error updating destination:", error)
      alert("Failed to update tour")
    }
  }

  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (authLoading || isLoading) {
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
          <DashboardTopbar title="My Tours" />
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
        <DashboardTopbar title="My Tours" />
        <main className="p-6 space-y-6">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Tours</h1>
              <p className="text-muted-foreground mt-1">Manage your tour destinations</p>
            </div>
            <Link href="/dashboard/company/destinations/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Tour
              </Button>
            </Link>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredDestinations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No tours found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? "Try adjusting your search" : "Start by creating your first tour"}
                </p>
                {!searchQuery && (
                  <Link href="/dashboard/company/destinations/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Tour
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredDestinations.map((destination) => (
                <Card key={destination._id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 h-48 md:h-auto">
                      <img
                        src={destination.coverImage || "/placeholder.svg"}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">{destination.name}</h3>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {destination.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${destination.price}
                            </div>
                            <span>{destination.duration}</span>
                          </div>
                        </div>
                        <Badge variant={destination.isPublished ? "default" : "secondary"}>
                          {destination.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={`/destinations/${destination.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/company/destinations/${destination._id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePublish(destination._id, destination.isPublished)}
                        >
                          {destination.isPublished ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(destination._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
